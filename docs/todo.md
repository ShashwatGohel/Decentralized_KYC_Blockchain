□ Run: npm install ethers react-router-dom
□ Run: npm install --save-dev @types/react-router-dom
□ Add contract address to .env file:
  REACT_APP_CONTRACT_ADDRESS=0xYourAddressHere
□ src/components/   (folder)
□ src/utils/        (folder)
□ src/pages/        (folder)
□ src/utils/contractConfig.ts
□ src/utils/generateHash.ts
□ src/utils/connectContract.ts
□ src/components/ConnectWallet.tsx
□ src/components/Navbar.tsx
□ src/pages/Home.tsx
□ src/pages/UserPage.tsx
□ src/pages/VerifierPage.tsx
□ src/pages/Node2Page.tsx
□ src/pages/CheckStatus.tsx
□ src/App.tsx  (rewrite)
□ Home page loads at localhost:3000/
□ MetaMask connects successfully
□ Register page: file upload + hash generates
□ Register page: transaction goes through
□ Verifier page: can look up a user
□ Verifier page: can verify a user
□ Verifier page: can revoke a user
□ Node 2 page: hash check returns true ✅
□ Node 2 page: wrong doc returns false ❌
□ Check Status page: shows correct status
□ Navbar links all working
□ Test full flow end to end:
  Register → Verify → Node2 Check → Status
□ Test fraud detection:
  Upload wrong doc on Node2 → should get ❌
□ Push code to GitHub
□ Take screenshots of all pages
□ Record demo video