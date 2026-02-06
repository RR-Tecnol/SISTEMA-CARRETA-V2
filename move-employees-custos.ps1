$filePath = "frontend\src\pages\admin\GerenciarAcao.tsx"
$lines = Get-Content $filePath

Write-Host "Total de linhas: $($lines.Count)"

# Extrair seção de funcionários (linhas 1539-1643, índice 1538-1642)
$employeeSection = $lines[1538..1642]
Write-Host "Seção de funcionários extraída: $($employeeSection.Count) linhas"

# Criar novo array sem a seção de funcionários
$newLines = @()
$newLines += $lines[0..1537]  # Até antes da seção de funcionários
$newLines += $lines[1643..($lines.Count - 1)]  # Depois da seção de funcionários

Write-Host "Linhas após remoção: $($newLines.Count)"

# Encontrar onde inserir (antes do </Box> da linha 1476, agora índice 1475)
$insertIndex = 1475  # Linha 1476 (</Box>) está no índice 1475

# Criar array final
$finalLines = @()
$finalLines += $newLines[0..($insertIndex - 1)]  # Até antes do </Box>
$finalLines += ""  # Linha vazia
$finalLines += $employeeSection  # Seção de funcionários
$finalLines += $newLines[$insertIndex..($newLines.Count - 1)]  # Resto do arquivo

Write-Host "Linhas finais: $($finalLines.Count)"

# Salvar arquivo
$finalLines | Set-Content $filePath -Encoding UTF8

Write-Host "✅ Seção de funcionários movida para dentro da aba CUSTOS!"
