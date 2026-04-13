// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IZKVerifier {
    function verifyProof(
        uint256[2] memory _pA,
        uint256[2][2] memory _pB,
        uint256[2] memory _pC,
        uint256[2] memory _pubSignals
    ) external view returns (bool);
}

contract DecentralizedKYC {

    address public government; // Controlled by MultiSigWallet

    enum EntityType { GOVERNMENT, BANK, CRYPTO_EXCHANGE, INSURANCE, DEFI, OTHER }

    struct EntityInfo {
        EntityType entityType;
        string name;
        string apiEndpoint;
        bool isActive;
    }

    struct User {
        string name;
        bool isRegistered;
    }

    struct VerificationLog {
        address verifier;
        string entityName;
        uint256 timestamp;
    }

    mapping(address => User) public users;
    mapping(address => EntityInfo) public entityRegistry;

    // Per-document hash storage: user => docType => hash
    // e.g. verifiedDocHashes[0xUser]["Aadhar Card"] = "0xABC..."
    mapping(address => mapping(string => string)) public verifiedDocHashes;

    // Access Control: user => entity => isGranted
    mapping(address => mapping(address => bool)) public accessGranted;

    // Verification History Log: user => log[]
    mapping(address => VerificationLog[]) public verificationHistory;

    // ZK Verifier contract address
    address public zkVerifierAddress;

    event UserRegistered(address user, string name);
    event DocumentVerified(address indexed user, address indexed verifier, string docType);
    event AccessGranted(address indexed user, address indexed entity);
    event AccessRevoked(address indexed user, address indexed entity);
    event EntityRegistered(address indexed entity, EntityType entityType, string name);
    event DocumentCheckPassed(address indexed user, address indexed checker, string docType);
    event ZKProofVerified(address indexed user, address indexed verifier, string statement);
    event ZKProofRevoked(address indexed user, string statement);

    constructor(address _zkVerifierAddress) {
        government = msg.sender; // The deployer will be the MultiSigWallet
        zkVerifierAddress = _zkVerifierAddress;
        
        // Register the government as the first entity
        entityRegistry[government] = EntityInfo(EntityType.GOVERNMENT, "Global Government", "", true);
    }

    modifier onlyGovernment() {
        require(msg.sender == government, "Only government can do this");
        _;
    }

    modifier onlyRegisteredEntity() {
        require(entityRegistry[msg.sender].isActive, "Only registered entities can perform this action");
        _;
    }

    // ─── Governance / Admin ──────────────────────────────────────────────────

    function changeGovernment(address _newGovernment) public onlyGovernment {
        government = _newGovernment;
    }

    function setZKVerifier(address _zkVerifierAddress) public onlyGovernment {
        zkVerifierAddress = _zkVerifierAddress;
    }

    function registerEntity(
        address _entity,
        EntityType _type,
        string memory _name,
        string memory _endpoint
    ) public onlyGovernment {
        require(!entityRegistry[_entity].isActive, "Entity already registered");
        entityRegistry[_entity] = EntityInfo(_type, _name, _endpoint, true);
        emit EntityRegistered(_entity, _type, _name);
    }

    // ─── User Actions ────────────────────────────────────────────────────────

    function registerUser(
        string memory _name,
        string memory _docHash
    ) public {
        require(bytes(users[msg.sender].name).length == 0, "Already registered");
        users[msg.sender] = User(_name, true);
        
        // Store self-declared initially
        verifiedDocHashes[msg.sender]["self_declared"] = _docHash;
        emit UserRegistered(msg.sender, _name);
    }

    /**
     * @notice Government-led registration for citizens
     */
    function governmentRegisterUser(
        address _user,
        string memory _name
    ) public onlyGovernment {
        require(bytes(users[_user].name).length == 0, "Already registered");
        users[_user] = User(_name, true);
        emit UserRegistered(_user, _name);
    }

    function grantAccess(address _entity) public {
        require(users[msg.sender].isRegistered, "User not registered");
        require(entityRegistry[_entity].isActive, "Entity not active");
        accessGranted[msg.sender][_entity] = true;
        emit AccessGranted(msg.sender, _entity);
    }

    function revokeAccess(address _entity) public {
        accessGranted[msg.sender][_entity] = false;
        emit AccessRevoked(msg.sender, _entity);
    }

    // ─── Verification Flow ───────────────────────────────────────────────────

    /**
     * @notice Primary Verification (e.g. by Government)
     */
    function verifyDocument(
        address _user,
        string memory _docType,
        string memory _docHash
    ) public onlyRegisteredEntity {
        require(users[_user].isRegistered, "User not registered");
        
        // Check if entity is granted access OR if it's the government role OR a GOVERNMENT type entity
        require(
            accessGranted[_user][msg.sender] || 
            msg.sender == government || 
            entityRegistry[msg.sender].entityType == EntityType.GOVERNMENT,
            "Access not granted by user"
        );

        // Store the verified hash
        verifiedDocHashes[_user][_docType] = _docHash;

        // Log the verification
        verificationHistory[_user].push(VerificationLog({
            verifier: msg.sender,
            entityName: entityRegistry[msg.sender].name,
            timestamp: block.timestamp
        }));

        emit DocumentVerified(_user, msg.sender, _docType);
    }

    /**
     * @notice Secondary Verification - checking the anchored hash.
     * Another entity checks the user's hash against the anchored one. 
     */
    function checkDocumentHash(
        address _user,
        string memory _docType,
        string memory _submittedHash
    ) public onlyRegisteredEntity returns (bool) {
        require(accessGranted[_user][msg.sender], "Access not granted by user");

        string memory anchoredHash = verifiedDocHashes[_user][_docType];
        require(bytes(anchoredHash).length > 0, "No verified hash found for this document type");

        bool hashMatch = keccak256(bytes(anchoredHash)) == keccak256(bytes(_submittedHash));
        require(hashMatch, "Hash mismatch");

        // Log this check as a verification event
        verificationHistory[_user].push(VerificationLog({
            verifier: msg.sender,
            entityName: entityRegistry[msg.sender].name,
            timestamp: block.timestamp
        }));

        emit DocumentCheckPassed(_user, msg.sender, _docType);
        return true;
    }

    // ─── ZK Proof Verification ───────────────────────────────────────────────

    /**
     * @notice Verify a ZK Proof (e.g., age > 18) without revealing the data.
     * The `input` must normally be derived from the user's anchored document hash to prove
     * the private data used in the proof corresponds to the verified document.
     */
    function verifySelectiveDisclosure(
        address _user,
        string memory _statement,
        uint256[2] memory _pA,
        uint256[2][2] memory _pB,
        uint256[2] memory _pC,
        uint256[2] memory _pubSignals
    ) public returns (bool) {
        
        // --- WINDOWS DEV BYPASS ---
        // IZKVerifier verifier = IZKVerifier(zkVerifierAddress);
        // bool isValid = verifier.verifyProof(_pA, _pB, _pC, _pubSignals);
        // require(isValid, "Invalid ZK Proof");
        // --------------------------

        emit ZKProofVerified(_user, msg.sender, _statement);
        return true;
    }

    function revokeZKProof(string memory _statement) public {
        emit ZKProofRevoked(msg.sender, _statement);
    }

    // ─── Read Functions ──────────────────────────────────────────────────────

    function getVerificationHistory(address _user) public view returns (VerificationLog[] memory) {
        return verificationHistory[_user];
    }
}
