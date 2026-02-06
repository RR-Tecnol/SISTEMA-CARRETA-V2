# Script PowerShell para criar 10 cidadãos via API

$baseUrl = "http://localhost:3001/api/auth/cadastro"

$cidadaos = @(
    @{
        cpf                = "11144477735"
        nome_completo      = "João da Silva Santos"
        data_nascimento    = "1985-03-15"
        telefone           = "(83) 98765-4321"
        email              = "joao.silva@email.com"
        senha              = "senha123"
        municipio          = "João Pessoa"
        estado             = "PB"
        consentimento_lgpd = $true
    },
    @{
        cpf                = "22255588846"
        nome_completo      = "Maria Oliveira Costa"
        data_nascimento    = "1990-07-22"
        telefone           = "(83) 99876-5432"
        email              = "maria.oliveira@email.com"
        senha              = "senha123"
        municipio          = "Campina Grande"
        estado             = "PB"
        consentimento_lgpd = $true
    },
    @{
        cpf                = "33366699957"
        nome_completo      = "Pedro Henrique Alves"
        data_nascimento    = "1988-11-30"
        telefone           = "(83) 98123-4567"
        email              = "pedro.alves@email.com"
        senha              = "senha123"
        municipio          = "Patos"
        estado             = "PB"
        consentimento_lgpd = $true
    },
    @{
        cpf                = "44477700068"
        nome_completo      = "Ana Carolina Ferreira"
        data_nascimento    = "1995-05-18"
        telefone           = "(83) 99234-5678"
        email              = "ana.ferreira@email.com"
        senha              = "senha123"
        municipio          = "Cajazeiras"
        estado             = "PB"
        consentimento_lgpd = $true
    },
    @{
        cpf                = "55588811179"
        nome_completo      = "Carlos Eduardo Mendes"
        data_nascimento    = "1982-09-25"
        telefone           = "(83) 98345-6789"
        email              = "carlos.mendes@email.com"
        senha              = "senha123"
        municipio          = "Sousa"
        estado             = "PB"
        consentimento_lgpd = $true
    },
    @{
        cpf                = "66699922280"
        nome_completo      = "Juliana Santos Lima"
        data_nascimento    = "1992-12-08"
        telefone           = "(83) 99456-7890"
        email              = "juliana.lima@email.com"
        senha              = "senha123"
        municipio          = "João Pessoa"
        estado             = "PB"
        consentimento_lgpd = $true
    },
    @{
        cpf                = "77700033391"
        nome_completo      = "Roberto Carlos Souza"
        data_nascimento    = "1978-04-12"
        telefone           = "(83) 98567-8901"
        email              = "roberto.souza@email.com"
        senha              = "senha123"
        municipio          = "Campina Grande"
        estado             = "PB"
        consentimento_lgpd = $true
    },
    @{
        cpf                = "88811144402"
        nome_completo      = "Fernanda Cristina Rocha"
        data_nascimento    = "1987-08-20"
        telefone           = "(83) 99678-9012"
        email              = "fernanda.rocha@email.com"
        senha              = "senha123"
        municipio          = "Patos"
        estado             = "PB"
        consentimento_lgpd = $true
    },
    @{
        cpf                = "99922255513"
        nome_completo      = "Lucas Gabriel Martins"
        data_nascimento    = "1998-01-14"
        telefone           = "(83) 98789-0123"
        email              = "lucas.martins@email.com"
        senha              = "senha123"
        municipio          = "João Pessoa"
        estado             = "PB"
        consentimento_lgpd = $true
    },
    @{
        cpf                = "10020030044"
        nome_completo      = "Beatriz Almeida Pereira"
        data_nascimento    = "1993-06-28"
        telefone           = "(83) 99890-1234"
        email              = "beatriz.pereira@email.com"
        senha              = "senha123"
        municipio          = "Cajazeiras"
        estado             = "PB"
        consentimento_lgpd = $true
    }
)

Write-Host "👥 Criando 10 cidadãos via API..." -ForegroundColor Cyan
Write-Host ""

$sucessos = 0
$erros = 0

foreach ($cidadao in $cidadaos) {
    try {
        $json = $cidadao | ConvertTo-Json
        $response = Invoke-RestMethod -Uri $baseUrl -Method Post -Body $json -ContentType "application/json" -ErrorAction Stop
        Write-Host "✅ $($cidadao.nome_completo) - CPF: $($cidadao.cpf)" -ForegroundColor Green
        $sucessos++
    }
    catch {
        $errorMessage = $_.Exception.Message
        if ($_.ErrorDetails.Message) {
            $errorDetails = ($_.ErrorDetails.Message | ConvertFrom-Json).error
            Write-Host "❌ $($cidadao.nome_completo) - Erro: $errorDetails" -ForegroundColor Red
        }
        else {
            Write-Host "❌ $($cidadao.nome_completo) - Erro: $errorMessage" -ForegroundColor Red
        }
        $erros++
    }
    Start-Sleep -Milliseconds 200
}

Write-Host ""
Write-Host "📊 Resumo:" -ForegroundColor Cyan
Write-Host "   ✅ Sucessos: $sucessos" -ForegroundColor Green
Write-Host "   ❌ Erros: $erros" -ForegroundColor Red
Write-Host ""
Write-Host "📋 Credenciais de acesso:" -ForegroundColor Yellow
Write-Host "   CPF: qualquer um dos CPFs acima (ex: 12345678901)" -ForegroundColor White
Write-Host "   Senha: senha123" -ForegroundColor White
