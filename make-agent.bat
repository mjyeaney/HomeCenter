@echo off

pushd "%~dp0"

set _csc_=C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe

@echo Clearing output target location...

del .\Bin\*.* /q

@echo Copying references to output target location..

copy ".\Lib\Windows Azure 1.8\Microsoft.WindowsAzure.StorageClient.dll" ".\Bin\Microsoft.WindowsAzure.StorageClient.dll"
copy ".\Lib\Windows Azure 1.8\Microsoft.WindowsAzure.Storage.dll" ".\Bin\Microsoft.WindowsAzure.Storage.dll"
copy ".\Lib\Windows Azure 1.8\Microsoft.WindowsAzure.Configuration.dll" ".\Bin\Microsoft.WindowsAzure.Configuration.dll"
copy ".\Code\Agent\app.config" ".\Bin\agent.exe.config"

@echo Compiling code...

%_csc_% /out:".\Bin\agent.exe" /target:exe /r:".\Lib\Windows Azure 1.8\Microsoft.WindowsAzure.StorageClient.dll" /r:".\Lib\Windows Azure 1.8\Microsoft.WindowsAzure.Storage.dll" /r:".\Lib\Windows Azure 1.8\Microsoft.WindowsAzure.Configuration.dll" /debug /nologo ".\Code\Agent\*.cs"
 
popd
