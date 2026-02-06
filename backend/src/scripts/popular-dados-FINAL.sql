-- SCRIPT FINAL DE POPULAÇÃO DE DADOS
-- Execute este script diretamente no PostgreSQL

-- Habilitar extensão para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. EXAMES
DELETE FROM cursos_exames WHERE tipo = 'exame';

INSERT INTO cursos_exames (id, nome, tipo, descricao, ativo, created_at, updated_at) VALUES
(gen_random_uuid(), 'Hemograma Completo', 'exame', 'Exame de sangue completo para análise de células sanguíneas', true, NOW(), NOW()),
(gen_random_uuid(), 'Glicemia em Jejum', 'exame', 'Medição da taxa de glicose no sangue', true, NOW(), NOW()),
(gen_random_uuid(), 'Colesterol Total e Frações', 'exame', 'Análise dos níveis de colesterol HDL, LDL e VLDL', true, NOW(), NOW()),
(gen_random_uuid(), 'Triglicerídeos', 'exame', 'Medição dos níveis de triglicerídeos no sangue', true, NOW(), NOW()),
(gen_random_uuid(), 'Ureia e Creatinina', 'exame', 'Avaliação da função renal', true, NOW(), NOW()),
(gen_random_uuid(), 'TGO e TGP', 'exame', 'Avaliação da função hepática', true, NOW(), NOW()),
(gen_random_uuid(), 'TSH', 'exame', 'Avaliação da função da tireoide', true, NOW(), NOW()),
(gen_random_uuid(), 'Mamografia', 'exame', 'Exame de rastreamento de câncer de mama', true, NOW(), NOW()),
(gen_random_uuid(), 'Papanicolau', 'exame', 'Exame preventivo do câncer de colo de útero', true, NOW(), NOW()),
(gen_random_uuid(), 'PSA', 'exame', 'Rastreamento de câncer de próstata', true, NOW(), NOW());

-- 2. INSTITUIÇÕES
DELETE FROM instituicoes;

INSERT INTO instituicoes (id, razao_social, cnpj, responsavel_nome, responsavel_email, responsavel_tel, endereco_completo, created_at, updated_at) VALUES
(gen_random_uuid(), 'Secretaria Municipal de Saúde de São Luís', '12345678000190', 'Dr. José Carlos Silva', 'saude@saoluis.ma.gov.br', '(98) 3214-5678', 'Avenida Pedro II, 100 - Centro, São Luís/MA - CEP: 65000-000', NOW(), NOW()),
(gen_random_uuid(), 'Secretaria Estadual de Saúde do Maranhão', '23456789000191', 'Dra. Maria Eduarda Santos', 'ses@saude.ma.gov.br', '(98) 3215-6789', 'Rua Grande, 250 - Centro, São Luís/MA - CEP: 65010-000', NOW(), NOW()),
(gen_random_uuid(), 'Hospital Municipal de Imperatriz', '34567890000192', 'Dr. Roberto Almeida', 'hospital@imperatriz.ma.gov.br', '(99) 3216-7890', 'Avenida Getúlio Vargas, 500 - Centro, Imperatriz/MA - CEP: 65900-000', NOW(), NOW());

-- 3. CAMINHÕES
DELETE FROM caminhoes;

INSERT INTO caminhoes (id, placa, modelo, ano, km_por_litro, capacidade_litros, status, created_at, updated_at) VALUES
(gen_random_uuid(), 'ABC-1234', 'Mercedes-Benz Atego 1719', 2020, 3.5, 300, 'disponivel', NOW(), NOW()),
(gen_random_uuid(), 'DEF-5678', 'Volkswagen Delivery 11.180', 2021, 4.2, 250, 'disponivel', NOW(), NOW()),
(gen_random_uuid(), 'GHI-9012', 'Ford Cargo 1319', 2019, 3.8, 280, 'disponivel', NOW(), NOW()),
(gen_random_uuid(), 'JKL-3456', 'Iveco Daily 55C16', 2022, 5.0, 200, 'disponivel', NOW(), NOW()),
(gen_random_uuid(), 'MNO-7890', 'Mercedes-Benz Accelo 1016', 2020, 4.5, 220, 'manutencao', NOW(), NOW());

-- VERIFICAR TOTAIS
SELECT 
    'Cidadãos' as tabela, COUNT(*) as total FROM cidadaos
UNION ALL
SELECT 'Exames', COUNT(*) FROM cursos_exames WHERE tipo = 'exame'
UNION ALL
SELECT 'Instituições', COUNT(*) FROM instituicoes
UNION ALL
SELECT 'Caminhões', COUNT(*) FROM caminhoes;
