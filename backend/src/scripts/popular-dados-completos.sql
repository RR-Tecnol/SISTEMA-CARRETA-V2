-- ============================================
-- SCRIPT DE POPULAÇÃO DE DADOS FICTÍCIOS
-- Sistema de Carretas - Dados Realistas
-- ============================================

-- ============================================
-- 1. INSTITUIÇÕES
-- ============================================
INSERT INTO instituicoes (id, razao_social, cnpj, tipo, responsavel, telefone, email, cep, rua, numero, complemento, bairro, municipio, estado, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'Secretaria Municipal de Saúde de São Luís', '12345678000190', 'publica', 'Dr. José Carlos Silva', '(98) 3214-5678', 'saude@saoluis.ma.gov.br', '65000-000', 'Avenida Pedro II', '100', 'Prédio Principal', 'Centro', 'São Luís', 'MA', NOW(), NOW()),
    (gen_random_uuid(), 'Instituto de Educação Profissional do Maranhão', '23456789000191', 'publica', 'Prof. Maria Eduarda Santos', '(98) 3215-6789', 'contato@iepma.edu.br', '65010-000', 'Rua Grande', '250', '', 'Centro', 'São Luís', 'MA', NOW(), NOW()),
    (gen_random_uuid(), 'Fundação de Amparo ao Trabalhador', '34567890000192', 'privada', 'Roberto Almeida', '(98) 3216-7890', 'contato@fat.org.br', '65020-000', 'Avenida Colares Moreira', '500', 'Sala 201', 'Renascença', 'São Luís', 'MA', NOW(), NOW()),
    (gen_random_uuid(), 'Centro de Capacitação Técnica', '45678901000193', 'privada', 'Ana Paula Costa', '(98) 3217-8901', 'cct@capacitacao.com.br', '65030-000', 'Rua do Sol', '789', '', 'Cohab', 'São Luís', 'MA', NOW(), NOW())
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
-- 5. AÇÕES
-- ============================================
-- Primeiro, vamos criar variáveis temporárias para os IDs
DO $$
DECLARE
    inst_saude_id UUID;
    inst_educacao_id UUID;
    caminhao1_id UUID;
    caminhao2_id UUID;
    caminhao3_id UUID;
    func_medico_id UUID;
    func_enfermeira_id UUID;
    func_tecnico_id UUID;
    func_prof_info_id UUID;
    func_inst_civil_id UUID;
    func_motorista1_id UUID;
    func_motorista2_id UUID;
    curso_eletricista_id UUID;
    curso_pedreiro_id UUID;
    curso_informatica_id UUID;
    exame_hemograma_id UUID;
    exame_glicemia_id UUID;
    exame_colesterol_id UUID;
    exame_mamografia_id UUID;
    acao1_id UUID;
    acao2_id UUID;
    acao3_id UUID;
BEGIN
    -- Buscar IDs das instituições
    SELECT id INTO inst_saude_id FROM instituicoes WHERE cnpj = '12345678000190';
    SELECT id INTO inst_educacao_id FROM instituicoes WHERE cnpj = '23456789000191';
    
    -- Buscar IDs dos caminhões
    SELECT id INTO caminhao1_id FROM caminhoes WHERE placa = 'ABC-1234';
    SELECT id INTO caminhao2_id FROM caminhoes WHERE placa = 'DEF-5678';
    SELECT id INTO caminhao3_id FROM caminhoes WHERE placa = 'GHI-9012';
    
    -- Buscar IDs dos funcionários
    SELECT id INTO func_medico_id FROM funcionarios WHERE cpf = '11122233344';
    SELECT id INTO func_enfermeira_id FROM funcionarios WHERE cpf = '22233344455';
    SELECT id INTO func_tecnico_id FROM funcionarios WHERE cpf = '33344455566';
    SELECT id INTO func_prof_info_id FROM funcionarios WHERE cpf = '44455566677';
    SELECT id INTO func_inst_civil_id FROM funcionarios WHERE cpf = '55566677788';
    SELECT id INTO func_motorista1_id FROM funcionarios WHERE cpf = '77788899900';
    SELECT id INTO func_motorista2_id FROM funcionarios WHERE cpf = '88899900011';
    
    -- Buscar IDs dos cursos/exames
    SELECT id INTO curso_eletricista_id FROM cursos_exames WHERE nome = 'Eletricista Residencial';
    SELECT id INTO curso_pedreiro_id FROM cursos_exames WHERE nome = 'Pedreiro';
    SELECT id INTO curso_informatica_id FROM cursos_exames WHERE nome = 'Informática Básica';
    SELECT id INTO exame_hemograma_id FROM cursos_exames WHERE nome = 'Hemograma Completo';
    SELECT id INTO exame_glicemia_id FROM cursos_exames WHERE nome = 'Glicemia em Jejum';
    SELECT id INTO exame_colesterol_id FROM cursos_exames WHERE nome = 'Colesterol Total e Frações';
    SELECT id INTO exame_mamografia_id FROM cursos_exames WHERE nome = 'Mamografia';
    
    -- Criar Ação 1: Saúde em São Luís
    INSERT INTO acoes (id, instituicao_id, tipo, municipio, estado, data_inicio, data_fim, descricao, local_execucao, vagas_disponiveis, status, created_at, updated_at)
    VALUES (gen_random_uuid(), inst_saude_id, 'saude', 'São Luís', 'MA', '2026-03-15', '2026-03-17', 'Ação de saúde preventiva com exames gratuitos', 'Praça Deodoro - Centro', 200, 'planejada', NOW(), NOW())
    RETURNING id INTO acao1_id;
    
    -- Vincular cursos/exames à Ação 1
    INSERT INTO acoes_cursos_exames (id, acao_id, curso_exame_id, vagas, created_at, updated_at)
    VALUES
        (gen_random_uuid(), acao1_id, exame_hemograma_id, 80, NOW(), NOW()),
        (gen_random_uuid(), acao1_id, exame_glicemia_id, 60, NOW(), NOW()),
        (gen_random_uuid(), acao1_id, exame_colesterol_id, 40, NOW(), NOW()),
        (gen_random_uuid(), acao1_id, exame_mamografia_id, 20, NOW(), NOW());
    
    -- Vincular caminhões à Ação 1
    INSERT INTO acoes_caminhoes (acao_id, caminhao_id, created_at, updated_at)
    VALUES
        (acao1_id, caminhao1_id, NOW(), NOW()),
        (acao1_id, caminhao2_id, NOW(), NOW());
    
    -- Vincular funcionários à Ação 1
    INSERT INTO acoes_funcionarios (acao_id, funcionario_id, created_at, updated_at)
    VALUES
        (acao1_id, func_medico_id, NOW(), NOW()),
        (acao1_id, func_enfermeira_id, NOW(), NOW()),
        (acao1_id, func_tecnico_id, NOW(), NOW()),
        (acao1_id, func_motorista1_id, NOW(), NOW());
    
    -- Criar Ação 2: Capacitação Profissional
    INSERT INTO acoes (id, instituicao_id, tipo, municipio, estado, data_inicio, data_fim, descricao, local_execucao, vagas_disponiveis, status, created_at, updated_at)
    VALUES (gen_random_uuid(), inst_educacao_id, 'curso', 'São Luís', 'MA', '2026-04-01', '2026-04-30', 'Cursos profissionalizantes gratuitos', 'Bairro do Turu - Escola Municipal', 150, 'planejada', NOW(), NOW())
    RETURNING id INTO acao2_id;
    
    -- Vincular cursos à Ação 2
    INSERT INTO acoes_cursos_exames (id, acao_id, curso_exame_id, vagas, created_at, updated_at)
    VALUES
        (gen_random_uuid(), acao2_id, curso_eletricista_id, 30, NOW(), NOW()),
        (gen_random_uuid(), acao2_id, curso_pedreiro_id, 40, NOW(), NOW()),
        (gen_random_uuid(), acao2_id, curso_informatica_id, 50, NOW(), NOW());
    
    -- Vincular caminhão à Ação 2
    INSERT INTO acoes_caminhoes (acao_id, caminhao_id, created_at, updated_at)
    VALUES (acao2_id, caminhao3_id, NOW(), NOW());
    
    -- Vincular funcionários à Ação 2
    INSERT INTO acoes_funcionarios (acao_id, funcionario_id, created_at, updated_at)
    VALUES
        (acao2_id, func_prof_info_id, NOW(), NOW()),
        (acao2_id, func_inst_civil_id, NOW(), NOW()),
        (acao2_id, func_motorista2_id, NOW(), NOW());
    
    -- Criar Ação 3: Saúde da Mulher
    INSERT INTO acoes (id, instituicao_id, tipo, municipio, estado, data_inicio, data_fim, descricao, local_execucao, vagas_disponiveis, status, created_at, updated_at)
    VALUES (gen_random_uuid(), inst_saude_id, 'saude', 'Imperatriz', 'MA', '2026-05-10', '2026-05-12', 'Campanha de prevenção ao câncer de mama e colo de útero', 'Centro de Saúde - Bairro Bacuri', 100, 'planejada', NOW(), NOW())
    RETURNING id INTO acao3_id;
    
    -- Vincular exames à Ação 3
    INSERT INTO acoes_cursos_exames (id, acao_id, curso_exame_id, vagas, created_at, updated_at)
    VALUES
        (gen_random_uuid(), acao3_id, exame_mamografia_id, 50, NOW(), NOW()),
        (gen_random_uuid(), acao3_id, (SELECT id FROM cursos_exames WHERE nome = 'Papanicolau'), 50, NOW(), NOW());
    
    -- Vincular caminhão à Ação 3
    INSERT INTO acoes_caminhoes (acao_id, caminhao_id, created_at, updated_at)
    VALUES (acao3_id, caminhao1_id, NOW(), NOW());
    
    -- Vincular funcionários à Ação 3
    INSERT INTO acoes_funcionarios (acao_id, funcionario_id, created_at, updated_at)
    VALUES
        (acao3_id, func_medico_id, NOW(), NOW()),
        (acao3_id, func_enfermeira_id, NOW(), NOW()),
        (acao3_id, func_motorista1_id, NOW(), NOW());
END $$;

-- ============================================
-- 6. CIDADÃOS (se ainda não foram criados)
-- ============================================
INSERT INTO cidadaos (id, nome_completo, cpf, data_nascimento, genero, raca, telefone, email, cep, rua, numero, complemento, bairro, municipio, estado, senha, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'Maria Silva Santos', '12345678901', '1985-03-15', 'feminino', 'parda', '(98) 98765-4321', 'maria.silva@email.com', '65000-000', 'Rua das Flores', '123', 'Apto 201', 'Centro', 'São Luís', 'MA', '$2a$10$rZ5qH8qH8qH8qH8qH8qH8.N8N8N8N8N8N8N8N8N8N8N8N8N8N8', NOW(), NOW()),
    (gen_random_uuid(), 'João Pedro Oliveira', '23456789012', '1990-07-22', 'masculino', 'branca', '(98) 99876-5432', 'joao.oliveira@email.com', '65010-000', 'Avenida dos Holandeses', '456', '', 'Calhau', 'São Luís', 'MA', '$2a$10$rZ5qH8qH8qH8qH8qH8qH8.N8N8N8N8N8N8N8N8N8N8N8N8N8N8', NOW(), NOW()),
    (gen_random_uuid(), 'Ana Carolina Ferreira', '34567890123', '1978-11-30', 'feminino', 'branca', '(98) 98234-5678', 'ana.ferreira@email.com', '65020-000', 'Rua Grande', '789', 'Casa', 'Centro', 'São Luís', 'MA', '$2a$10$rZ5qH8qH8qH8qH8qH8qH8.N8N8N8N8N8N8N8N8N8N8N8N8N8N8', NOW(), NOW()),
    (gen_random_uuid(), 'Carlos Eduardo Souza', '45678901234', '1995-05-18', 'masculino', 'preta', '(98) 99345-6789', 'carlos.souza@email.com', '65030-000', 'Avenida Kennedy', '321', 'Bloco B', 'Renascença', 'São Luís', 'MA', '$2a$10$rZ5qH8qH8qH8qH8qH8qH8.N8N8N8N8N8N8N8N8N8N8N8N8N8N8', NOW(), NOW()),
    (gen_random_uuid(), 'Juliana Costa Lima', '56789012345', '1988-09-25', 'feminino', 'parda', '(98) 98456-7890', 'juliana.lima@email.com', '65040-000', 'Rua do Sol', '654', '', 'Cohab', 'São Luís', 'MA', '$2a$10$rZ5qH8qH8qH8qH8qH8qH8.N8N8N8N8N8N8N8N8N8N8N8N8N8N8', NOW(), NOW()),
    (gen_random_uuid(), 'Roberto Alves Pereira', '67890123456', '1982-12-10', 'masculino', 'branca', '(98) 99567-8901', 'roberto.pereira@email.com', '65050-000', 'Avenida Colares Moreira', '987', 'Sala 5', 'Renascença', 'São Luís', 'MA', '$2a$10$rZ5qH8qH8qH8qH8qH8qH8.N8N8N8N8N8N8N8N8N8N8N8N8N8N8', NOW(), NOW()),
    (gen_random_uuid(), 'Patrícia Rodrigues Martins', '78901234567', '1992-04-08', 'feminino', 'parda', '(98) 98678-9012', 'patricia.martins@email.com', '65060-000', 'Rua da Paz', '147', 'Apto 302', 'Turu', 'São Luís', 'MA', '$2a$10$rZ5qH8qH8qH8qH8qH8qH8.N8N8N8N8N8N8N8N8N8N8N8N8N8N8', NOW(), NOW()),
    (gen_random_uuid(), 'Fernando Santos Araújo', '89012345678', '1987-08-14', 'masculino', 'preta', '(98) 99789-0123', 'fernando.araujo@email.com', '65070-000', 'Avenida São Luís Rei de França', '258', '', 'São Francisco', 'São Luís', 'MA', '$2a$10$rZ5qH8qH8qH8qH8qH8qH8.N8N8N8N8N8N8N8N8N8N8N8N8N8N8', NOW(), NOW()),
    (gen_random_uuid(), 'Camila Mendes Rocha', '90123456789', '1994-02-20', 'feminino', 'amarela', '(98) 98890-1234', 'camila.rocha@email.com', '65080-000', 'Rua do Comércio', '369', 'Loja 2', 'Centro', 'São Luís', 'MA', '$2a$10$rZ5qH8qH8qH8qH8qH8qH8.N8N8N8N8N8N8N8N8N8N8N8N8N8N8', NOW(), NOW()),
    (gen_random_uuid(), 'Ricardo Barbosa Nunes', '01234567890', '1980-06-05', 'masculino', 'indigena', '(98) 99901-2345', 'ricardo.nunes@email.com', '65090-000', 'Avenida Guajajaras', '741', 'Casa 3', 'Cohama', 'São Luís', 'MA', '$2a$10$rZ5qH8qH8qH8qH8qH8qH8.N8N8N8N8N8N8N8N8N8N8N8N8N8N8', NOW(), NOW())
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
SELECT 'Ações', COUNT(*) FROM acoes
UNION ALL
SELECT 'Cidadãos', COUNT(*) FROM cidadaos;
