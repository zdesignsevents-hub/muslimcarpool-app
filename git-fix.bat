@echo off
setlocal
set ARGS=%*
set ARGS=%ARGS:file:///C:=file://C:%
"C:\Program Files\Git\mingw64\bin\git.exe" %ARGS%
