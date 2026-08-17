@echo off
echo ========================================================
echo [1/2] Building Next.js Frontend (Static Export)...
echo ========================================================
cd /d "D:\HungNDM\Web Order Pum\Source code\frontend"
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo Build failed!
    exit /b %ERRORLEVEL%
)

echo.
echo ========================================================
echo [2/2] Deploying Frontend to MonsterASP (site85172)...
echo ========================================================
"C:\Program Files\IIS\Microsoft Web Deploy V3\msdeploy.exe" -verb:sync -source:contentPath="D:\HungNDM\Web Order Pum\Source code\frontend\out" -dest:contentPath="site85172",computerName="https://site85172.siteasp.net:8172/msdeploy.axd?site=site85172",userName="site85172",password="qE#3%%8BgfZ@2",authType="Basic" -allowUntrusted

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo Frontend deployed successfully!
    echo URL: http://pumorder.runasp.net / https://pumorder.runasp.net
    echo ========================================================
) else (
    echo Deployment failed with error code %ERRORLEVEL%
)
