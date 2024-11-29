# 参数设置
param(
    [string]$electronAppPath = "E:\Games Resources\ZZZ-Mod-Manager\ZZZModManager.exe"
)

# 设置输出编码为 UTF-8 
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# 检查当前是否以管理员身份运行
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    # 如果不是管理员，则以管理员身份重新运行脚本 
    if ($PSVersionTable.PSVersion.Major -ge 3) {
        # PowerShell 3.0 及以上版本
        Start-Process powershell.exe "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
    } else {
        # 对于较旧的 PowerShell 版本
        Start-Process powershell.exe "-NoProfile -ExecutionPolicy Bypass -Command `"& '$PSCommandPath'`"" -Verb RunAs
    }
    # 退出当前脚本，因为它将以管理员身份重新运行 
    exit
}

# 以管理员身份启动 Electron 应用 
if (-not (Test-Path $electronAppPath)) {
    Write-Host "未找到 Electron 应用程序: $electronAppPath" -ForegroundColor Red
    [void][System.Console]::ReadKey($true)
    exit
}
Start-Process $electronAppPath
# 退出脚本
exit
[void][System.Console]::ReadKey($true)
