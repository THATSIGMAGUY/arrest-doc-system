@echo off
chcp 65001 >nul
echo.
echo  กำลังเปิดระบบจัดทำเอกสารหลังจับกุม...
echo  (อย่าปิดหน้าต่างนี้ขณะใช้งาน)
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0start-server.ps1"
pause
