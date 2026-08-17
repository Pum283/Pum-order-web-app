$msdeploy = "C:\Program Files\IIS\Microsoft Web Deploy V3\msdeploy.exe"
if (-not (Test-Path $msdeploy)) {
    $msdeploy = "C:\Program Files (x86)\IIS\Microsoft Web Deploy V3\msdeploy.exe"
}

$sourceDir = "D:\HungNDM\Web Order Pum\Source code\frontend\out"
$server = "site85172.siteasp.net"
$site = "site85172"
$user = "site85172"
$pwd = 'qE#3%8BgfZ@2'

Write-Host "Deploying Frontend from $sourceDir to $server ($site)..."

$argList = @(
    "-verb:sync",
    "-source:iisApp=`"$sourceDir`"",
    "-dest:iisApp=`"$site`",computerName=`"https://${server}:8172/msdeploy.axd`",userName=`"$user`",password=`"$pwd`",authType=`"Basic`"",
    "-allowUntrusted",
    "-enableRule:DoNotDeleteRule"
)

$process = Start-Process -FilePath $msdeploy -ArgumentList $argList -NoNewWindow -Wait -PassThru

if ($process.ExitCode -eq 0) {
    Write-Host "Frontend deployed successfully to http://pumorder.runasp.net / https://pumorder.runasp.net" -ForegroundColor Green
} else {
    Write-Host "Deployment failed with exit code $($process.ExitCode)" -ForegroundColor Red
}
