// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./DecentralizedKYC.sol";

contract MockZKVerifier is IZKVerifier {
    bool public nextResult = true;

    function setNextResult(bool _result) external {
        nextResult = _result;
    }

    function verifyProof(
        uint256[2] memory,
        uint256[2][2] memory,
        uint256[2] memory,
        uint256[2] memory _pubSignals
    ) external view override returns (bool) {
        // Return nextResult OR check if pubSignals[1] is 1 to simulate normal behavior
        if (_pubSignals[1] == 0) return false;
        return nextResult;
    }
}
