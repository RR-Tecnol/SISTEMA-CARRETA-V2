-- Atualiza senha do admin
UPDATE cidadaos 
SET senha = '$2b$10$leFOUhA4lu27hH9.wMUPAucc/nCPF4PL2NGbBUd3Ak7MKl4eCbkYyG'
WHERE cpf = '123.456.789-09';

-- Verifica
SELECT cpf, email, tipo, senha 
FROM cidadaos 
WHERE cpf = '123.456.789-09';
