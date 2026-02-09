# Instruções de Backup do Banco de Dados

## Backup Manual do PostgreSQL

### Usando pg_dump (Recomendado)

```powershell
# Backup completo em formato customizado (compactado)
pg_dump -h localhost -p 5432 -U postgres -d sistema_carretas -F c -f "backup_$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss').backup"

# Backup em formato SQL (texto)
pg_dump -h localhost -p 5432 -U postgres -d sistema_carretas -f "backup_$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss').sql"
```

### Restauração do Backup

```powershell
# Restaurar backup em formato customizado
pg_restore -h localhost -p 5432 -U postgres -d sistema_carretas -c backup_2026-02-09_17-43-00.backup

# Restaurar backup em formato SQL
psql -h localhost -p 5432 -U postgres -d sistema_carretas -f backup_2026-02-09_17-43-00.sql
```

## Backup via Docker (se estiver usando Docker)

```powershell
# Backup
docker exec -t sistema-carretas-db pg_dump -U postgres sistema_carretas > backup_$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss').sql

# Restauração
Get-Content backup_2026-02-09_17-43-00.sql | docker exec -i sistema-carretas-db psql -U postgres -d sistema_carretas
```

## Backup Automático

Crie um script PowerShell para backup automático:

```powershell
# backup-automatico.ps1
$backupDir = "C:\backups\sistema-carretas"
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupFile = "$backupDir\backup_$timestamp.backup"

# Criar diretório se não existir
if (!(Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir
}

# Executar backup
pg_dump -h localhost -p 5432 -U postgres -d sistema_carretas -F c -f $backupFile

# Remover backups antigos (manter últimos 7 dias)
Get-ChildItem $backupDir -Filter "backup_*.backup" | 
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) } | 
    Remove-Item
```

Agende este script no Agendador de Tarefas do Windows para execução diária.

## Estado Atual do Banco

**Última atualização:** 2026-02-09

### Dados Populados:
- ✅ Cidadãos (com campo `genero` preenchido)
- ✅ Inscrições
- ✅ Ações
- ✅ Instituições
- ✅ Cursos/Exames
- ✅ Caminhões
- ✅ Funcionários
- ✅ Contas a Pagar

### Endpoints Utilitários:
- `POST /api/utils/populate-genero` - Popular gêneros de cidadãos sem gênero
- `POST /api/utils/update-genero-by-cpf` - Atualizar gênero de cidadão específico por CPF

## Notas Importantes

1. **Senha do PostgreSQL**: Certifique-se de ter a senha configurada ou use variável de ambiente `PGPASSWORD`
2. **Espaço em Disco**: Verifique espaço disponível antes de fazer backup
3. **Teste de Restauração**: Sempre teste a restauração em ambiente de desenvolvimento
4. **Backup Regular**: Faça backups antes de mudanças importantes no sistema
