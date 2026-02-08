@echo off
echo ========================================
echo BACKUP DO SISTEMA CARRETAS
echo ========================================
echo.

REM Criar diretório de backups se não existir
if not exist "backups" mkdir backups

REM Gerar timestamp
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set timestamp=%datetime:~0,8%_%datetime:~8,6%

echo Data/Hora: %timestamp%
echo.

REM Backup do banco de dados
echo [1/2] Criando backup do banco de dados...
set PGPASSWORD=postgres
"C:\Program Files\PostgreSQL\16\bin\pg_dump.exe" -h localhost -U postgres -d sistema_carretas -F c -f "backups\sistema_carretas_%timestamp%.backup"

if %ERRORLEVEL% EQU 0 (
    echo ✓ Backup do banco criado com sucesso!
    dir "backups\sistema_carretas_%timestamp%.backup" | find "sistema_carretas"
) else (
    echo ✗ Erro ao criar backup do banco
)

echo.
echo [2/2] Verificando status do Git...
git log -1 --oneline
echo.

echo ========================================
echo BACKUP CONCLUÍDO!
echo ========================================
echo.
echo Arquivos de backup em: %CD%\backups
echo.
pause
