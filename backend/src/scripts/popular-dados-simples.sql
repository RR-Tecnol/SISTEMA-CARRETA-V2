-- ============================================
-- SCRIPT SIMPLIFICADO DE POPULAÇÃO DE DADOS
-- Sistema de Carretas - Dados Realistas
-- ============================================

-- ============================================
-- 1. INSTITUIÇÕES
-- ============================================
INSERT INTO instituicoes (id, razao_social, cnpj, responsavel_nome, responsavel_email, responsavel_tel, endereco_completo, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'Secretaria Municipal de Saúde de São Luís', '12345678000190', 'Dr. José Carlos Silva', 'saude@saoluis.ma.gov.br', '(98) 3214-5678', 'Avenida Pedro II, 100 - Centro, São Luís/MA - CEP: 65000-000', NOW(), NOW()),
    (gen_random_uuid(), 'Instituto de Educação Profissional do Maranhão', '23456789000191', 'Prof. Maria Eduarda Santos', 'contato@iepma.edu.br', '(98) 3215-6789', 'Rua Grande, 250 - Centro, São Luís/MA - CEP: 65010-000', NOW(), NOW()),
    (gen_random_uuid(), 'Fundação de Amparo ao Trabalhador', '34567890000192', 'Roberto Almeida', 'contato@fat.org.br', '(98) 3216-7890', 'Avenida Colares Moreira, 500 - Renascença, São Luís/MA - CEP: 65020-000', NOW(), NOW()),
    (gen_random_uuid(), 'Centro de Capacitação Técnica', '45678901000193', 'Ana Paula Costa', 'cct@capacitacao.com.br', '(98) 3217-8901', 'Rua do Sol, 789 - Cohab, São Luís/MA - CEP: 65030-000', NOW(), NOW())
ON CONFLICT (cnpj) DO NOTHING;

-- ============================================
-- 2. CURSOS E EXAMES
-- ============================================
INSERT INTO cursos_exames (id, nome, tipo, descricao, carga_horaria, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'Hemograma Completo', 'exame', 'Exame de sangue completo para análise de células sanguíneas', NULL, NOW(), NOW()),
    (gen_random_uuid(), 'Glicemia em Jejum', 'exame', 'Medição da taxa de glicose no sangue', NULL, NOW(), NOW()),
    (gen_random_uuid(), 'Colesterol Total e Frações', 'exame', 'Análise dos níveis de colesterol HDL, LDL e VLDL', NULL, NOW(), NOW()),
    (gen_random_uuid(), 'Mamografia', 'exame', 'Exame de rastreamento de câncer de mama', NULL, NOW(), NOW()),
    (gen_random_uuid(), 'Papanicolau', 'exame', 'Exame preventivo do câncer de colo de útero', NULL, NOW(), NOW()),
    (gen_random_uuid(), 'Eletricista Residencial', 'curso', 'Curso básico de instalações elétricas residenciais', 40, NOW(), NOW()),
    (gen_random_uuid(), 'Pedreiro', 'curso', 'Técnicas de construção civil e alvenaria', 60, NOW(), NOW()),
    (gen_random_uuid(), 'Cabeleireiro', 'curso', 'Corte, coloração e tratamentos capilares', 80, NOW(), NOW()),
    (gen_random_uuid(), 'Manicure e Pedicure', 'curso', 'Técnicas de embelezamento de unhas', 40, NOW(), NOW()),
    (gen_random_uuid(), 'Informática Básica', 'curso', 'Windows, Word, Excel e Internet', 60, NOW(), NOW()),
    (gen_random_uuid(), 'Costura Industrial', 'curso', 'Operação de máquinas de costura industrial', 80, NOW(), NOW()),
    (gen_random_uuid(), 'Padeiro e Confeiteiro', 'curso', 'Produção de pães, bolos e doces', 100, NOW(), NOW())
ON CONFLICT (nome) DO NOTHING;

-- ============================================
-- 3. CAMINHÕES
-- ============================================
INSERT INTO caminhoes (id, placa, modelo, ano, capacidade, tipo, status, km_atual, ultima_manutencao, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'ABC-1234', 'Mercedes-Benz Atego 1719', 2020, 7000, 'saude', 'disponivel', 45000, '2026-01-15', NOW(), NOW()),
    (gen_random_uuid(), 'DEF-5678', 'Volkswagen Delivery 11.180', 2021, 5000, 'saude', 'disponivel', 32000, '2026-01-20', NOW(), NOW()),
    (gen_random_uuid(), 'GHI-9012', 'Ford Cargo 1319', 2019, 6000, 'educacao', 'disponivel', 58000, '2025-12-10', NOW(), NOW()),
    (gen_random_uuid(), 'JKL-3456', 'Iveco Daily 55C16', 2022, 4000, 'educacao', 'disponivel', 18000, '2026-02-01', NOW(), NOW()),
    (gen_random_uuid(), 'MNO-7890', 'Mercedes-Benz Accelo 1016', 2020, 5500, 'saude', 'manutencao', 51000, '2025-11-25', NOW(), NOW())
ON CONFLICT (placa) DO NOTHING;

-- ============================================
-- 4. FUNCIONÁRIOS
-- ============================================
INSERT INTO funcionarios (id, nome, cpf, cargo, especialidade, telefone, email, custo_diario, status, data_admissao, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'Dr. Paulo Henrique Martins', '11122233344', 'Médico', 'Clínico Geral', '(98) 99111-2222', 'paulo.martins@saude.gov.br', 500.00, 'ativo', '2020-03-15', NOW(), NOW()),
    (gen_random_uuid(), 'Enf. Carla Regina Santos', '22233344455', 'Enfermeiro', 'Enfermagem Geral', '(98) 99222-3333', 'carla.santos@saude.gov.br', 300.00, 'ativo', '2019-08-20', NOW(), NOW()),
    (gen_random_uuid(), 'Téc. Marcos Vinícius Lima', '33344455566', 'Técnico de Enfermagem', 'Coleta de Exames', '(98) 99333-4444', 'marcos.lima@saude.gov.br', 200.00, 'ativo', '2021-01-10', NOW(), NOW()),
    (gen_random_uuid(), 'Prof. Fernanda Oliveira', '44455566677', 'Professor', 'Informática', '(98) 99444-5555', 'fernanda.oliveira@educacao.gov.br', 350.00, 'ativo', '2018-05-12', NOW(), NOW()),
    (gen_random_uuid(), 'Inst. Ricardo Souza', '55566677788', 'Instrutor', 'Construção Civil', '(98) 99555-6666', 'ricardo.souza@educacao.gov.br', 320.00, 'ativo', '2019-11-03', NOW(), NOW()),
    (gen_random_uuid(), 'Inst. Juliana Costa', '66677788899', 'Instrutor', 'Beleza e Estética', '(98) 99666-7777', 'juliana.costa@educacao.gov.br', 280.00, 'ativo', '2020-07-18', NOW(), NOW()),
    (gen_random_uuid(), 'Motorista João Silva', '77788899900', 'Motorista', 'Categoria D', '(98) 99777-8888', 'joao.silva@transporte.gov.br', 250.00, 'ativo', '2017-02-25', NOW(), NOW()),
    (gen_random_uuid(), 'Motorista Pedro Santos', '88899900011', 'Motorista', 'Categoria D', '(98) 99888-9999', 'pedro.santos@transporte.gov.br', 250.00, 'ativo', '2018-09-14', NOW(), NOW())
ON CONFLICT (cpf) DO NOTHING;

-- ============================================
-- 5. CIDADÃOS
-- ============================================
INSERT INTO cidadaos (id, nome_completo, cpf, data_nascimento, genero, raca, telefone, email, municipio, estado, cep, rua, numero, complemento, bairro, senha, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'Maria Silva Santos', '12345678901', '1985-03-15', 'feminino', 'parda', '(98) 98765-4321', 'maria.silva@email.com', 'São Luís', 'MA', '65000-000', 'Rua das Flores', '123', 'Apto 201', 'Centro', '$2a$10$rZ5qH8qH8qH8qH8qH8qH8.N8N8N8N8N8N8N8N8N8N8N8N8N8N8', NOW(), NOW()),
    (gen_random_uuid(), 'João Pedro Oliveira', '23456789012', '1990-07-22', 'masculino', 'branca', '(98) 99876-5432', 'joao.oliveira@email.com', 'São Luís', 'MA', '65010-000', 'Avenida dos Holandeses', '456', '', 'Calhau', '$2a$10$rZ5qH8qH8qH8qH8qH8qH8.N8N8N8N8N8N8N8N8N8N8N8N8N8N8', NOW(), NOW()),
    (gen_random_uuid(), 'Ana Carolina Ferreira', '34567890123', '1978-11-30', 'feminino', 'branca', '(98) 98234-5678', 'ana.ferreira@email.com', 'São Luís', 'MA', '65020-000', 'Rua Grande', '789', 'Casa', 'Centro', '$2a$10$rZ5qH8qH8qH8qH8qH8qH8.N8N8N8N8N8N8N8N8N8N8N8N8N8N8', NOW(), NOW()),
    (gen_random_uuid(), 'Carlos Eduardo Souza', '45678901234', '1995-05-18', 'masculino', 'preta', '(98) 99345-6789', 'carlos.souza@email.com', 'São Luís', 'MA', '65030-000', 'Avenida Kennedy', '321', 'Bloco B', 'Renascença', '$2a$10$rZ5qH8qH8qH8qH8qH8qH8.N8N8N8N8N8N8N8N8N8N8N8N8N8N8', NOW(), NOW()),
    (gen_random_uuid(), 'Juliana Costa Lima', '56789012345', '1988-09-25', 'feminino', 'parda', '(98) 98456-7890', 'juliana.lima@email.com', 'São Luís', 'MA', '65040-000', 'Rua do Sol', '654', '', 'Cohab', '$2a$10$rZ5qH8qH8qH8qH8qH8qH8.N8N8N8N8N8N8N8N8N8N8N8N8N8N8', NOW(), NOW()),
    (gen_random_uuid(), 'Roberto Alves Pereira', '67890123456', '1982-12-10', 'masculino', 'branca', '(98) 99567-8901', 'roberto.pereira@email.com', 'São Luís', 'MA', '65050-000', 'Avenida Colares Moreira', '987', 'Sala 5', 'Renascença', '$2a$10$rZ5qH8qH8qH8qH8qH8qH8.N8N8N8N8N8N8N8N8N8N8N8N8N8N8', NOW(), NOW()),
    (gen_random_uuid(), 'Patrícia Rodrigues Martins', '78901234567', '1992-04-08', 'feminino', 'parda', '(98) 98678-9012', 'patricia.martins@email.com', 'São Luís', 'MA', '65060-000', 'Rua da Paz', '147', 'Apto 302', 'Turu', '$2a$10$rZ5qH8qH8qH8qH8qH8qH8.N8N8N8N8N8N8N8N8N8N8N8N8N8N8', NOW(), NOW()),
    (gen_random_uuid(), 'Fernando Santos Araújo', '89012345678', '1987-08-14', 'masculino', 'preta', '(98) 99789-0123', 'fernando.araujo@email.com', 'São Luís', 'MA', '65070-000', 'Avenida São Luís Rei de França', '258', '', 'São Francisco', '$2a$10$rZ5qH8qH8qH8qH8qH8qH8.N8N8N8N8N8N8N8N8N8N8N8N8N8N8', NOW(), NOW()),
    (gen_random_uuid(), 'Camila Mendes Rocha', '90123456789', '1994-02-20', 'feminino', 'amarela', '(98) 98890-1234', 'camila.rocha@email.com', 'São Luís', 'MA', '65080-000', 'Rua do Comércio', '369', 'Loja 2', 'Centro', '$2a$10$rZ5qH8qH8qH8qH8qH8qH8.N8N8N8N8N8N8N8N8N8N8N8N8N8N8', NOW(), NOW()),
    (gen_random_uuid(), 'Ricardo Barbosa Nunes', '01234567890', '1980-06-05', 'masculino', 'indigena', '(98) 99901-2345', 'ricardo.nunes@email.com', 'São Luís', 'MA', '65090-000', 'Avenida Guajajaras', '741', 'Casa 3', 'Cohama', '$2a$10$rZ5qH8qH8qH8qH8qH8qH8.N8N8N8N8N8N8N8N8N8N8N8N8N8N8', NOW(), NOW())
ON CONFLICT (cpf) DO NOTHING;

-- ============================================
-- RESUMO DOS DADOS CRIADOS
-- ============================================
SELECT 
    'Instituições' as tabela, 
    COUNT(*) as total 
FROM instituicoes
UNION ALL
SELECT 'Cursos/Exames', COUNT(*) FROM cursos_exames
UNION ALL
SELECT 'Caminhões', COUNT(*) FROM caminhoes
UNION ALL
SELECT 'Funcionários', COUNT(*) FROM funcionarios
UNION ALL
SELECT 'Cidadãos', COUNT(*) FROM cidadaos;
