# init-git.ps1 — Initialize git repository for the project (run once)
# วิธีใช้: เปิด PowerShell ในโฟลเดอร์ scripts แล้วรัน:
#   powershell -ExecutionPolicy Bypass -File .\init-git.ps1

$projectRoot = Split-Path $PSScriptRoot -Parent
Set-Location $projectRoot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Initializing git repository at" -ForegroundColor Cyan
Write-Host "  $projectRoot" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# ลบ .git ที่อาจตกค้างจากการลองครั้งก่อน
if (Test-Path ".git") {
    Write-Host "[1/5] Removing existing .git folder..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force ".git"
}

# ตรวจว่ามี git ติดตั้งหรือไม่
$gitVersion = & git --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: ไม่พบ git ในเครื่อง" -ForegroundColor Red
    Write-Host "กรุณาติดตั้ง Git for Windows: https://git-scm.com/download/win" -ForegroundColor Red
    exit 1
}
Write-Host "[2/5] Git found: $gitVersion" -ForegroundColor Green

# git init
Write-Host "[3/5] Running git init..." -ForegroundColor Yellow
git init -b main
git config user.email "devil.of.85@gmail.com"
git config user.name "Champ"

# stage + commit
Write-Host "[4/5] Staging all files..." -ForegroundColor Yellow
git add .
$staged = git diff --cached --stat | Measure-Object -Line | Select-Object -ExpandProperty Lines
Write-Host "       Staged: $staged file(s)" -ForegroundColor Green

Write-Host "[5/5] Creating initial commit..." -ForegroundColor Yellow
git commit -m "Initial commit: project structure after migration from single-file layout

- Moved from ~2,250-line single index.html into modular structure
- Created css/, js/, prototypes/, backend/, scripts/, docs/, backups/
- Added README with run instructions
- Ran v1.0 baseline review (see docs/review-2026-04-21.md)
"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Git repository initialized!" -ForegroundColor Green
Write-Host "  ลองรัน: git log --oneline" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# แสดง log
git log --oneline
