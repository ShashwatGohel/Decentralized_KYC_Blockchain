$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$BaseDir = Split-Path -Parent $ScriptDir

$CircuitsDir = "$BaseDir\circuits"
$BuildDir = "$BaseDir\build"
$NodeModules = "$BaseDir\node_modules"
$PtauFile = "$BuildDir\pot12_final.ptau"

Write-Host "=== KYC ZK Circuit Compiler ==="
Write-Host ""

if (!(Test-Path $BuildDir)) {
    New-Item -ItemType Directory -Force -Path $BuildDir | Out-Null
}

if (!(Test-Path $PtauFile)) {
    Write-Host "[1/4] Downloading Powers of Tau (Hermez, 2^12)..."
    Invoke-WebRequest -Uri "https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_12.ptau" -OutFile $PtauFile
} else {
    Write-Host "[1/4] Powers of Tau already downloaded."
}

$Circuits = @("age_verify", "income_verify", "kyc_verify", "credit_tier")

foreach ($Circuit in $Circuits) {
    Write-Host ""
    Write-Host "--- Compiling: $Circuit ---"

    $CircuitDir = "$BuildDir\$Circuit"
    if (!(Test-Path $CircuitDir)) {
        New-Item -ItemType Directory -Force -Path $CircuitDir | Out-Null
    }

    Write-Host "[2/4] Compiling $Circuit.circom..."
    circom "$CircuitsDir\$Circuit.circom" --r1cs --wasm --sym -l "$NodeModules" -o "$CircuitDir"

    Write-Host "[3/4] Running trusted setup for $Circuit..."
    npx snarkjs groth16 setup "$CircuitDir\$Circuit.r1cs" "$PtauFile" "$CircuitDir\$($Circuit)_final.zkey"

    Write-Host "[4/4] Exporting verification key for $Circuit..."
    npx snarkjs zkey export verificationkey "$CircuitDir\$($Circuit)_final.zkey" "$CircuitDir\verification_key.json"

    Write-Host "✓ $Circuit compiled successfully."
}

Write-Host ""
Write-Host "=== All circuits compiled! Build output: $BuildDir ==="
