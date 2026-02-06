-- Script para popular o banco de dados do Sistema Carretas
-- Execute: docker exec -i 1b9d79cf6704 psql -U postgres -d sistema_carretas < seed-database.sql

-- 1. INSTITUIÇÕES
INSERT INTO instituicoes (id, razao_social, cnpj, telefone, email, municipio, estado, created_at, updated_at) VALUES
('11111111-1111-1111-1111-111111111111', 'SENAI - Serviço Nacional de Aprendizagem Industrial', '03.775.428/0001-40', '(11) 3528-2000', 'contato@senai.br', 'São Paulo', 'SP', NOW(), NOW()),
('22222222-2222-2222-2222-222222222222', 'SENAC - Serviço Nacional de Aprendizagem Comercial', '03.709.814/0001-98', '(11) 2626-2000', 'contato@senac.br', 'São Paulo', 'SP', NOW(), NOW()),
('33333333-3333-3333-3333-333333333333', 'SESI - Serviço Social da Indústria', '03.775.428/0002-21', '(11) 3528-2100', 'contato@sesi.org.br', 'São Paulo', 'SP', NOW(), NOW()),
('44444444-4444-4444-4444-444444444444', 'SEBRAE - Serviço Brasileiro de Apoio às Micro e Pequenas Empresas', '00.000.000/0001-00', '0800 570 0800', 'contato@sebrae.com.br', 'Brasília', 'DF', NOW(), NOW()),
('55555555-5555-5555-5555-555555555555', 'Instituto Federal de São Paulo - IFSP', '10.882.594/0001-65', '(11) 3775-4502', 'contato@ifsp.edu.br', 'São Paulo', 'SP', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 2. CURSOS E EXAMES
INSERT INTO cursos_exames (id, nome, tipo, carga_horaria, descricao, requisitos, certificadora, ativo, created_at, updated_at) VALUES
('c1111111-1111-1111-1111-111111111111', 'Eletricista Industrial', 'curso', 160, 'Curso completo de eletricidade industrial com práticas em instalações elétricas', 'Ensino fundamental completo', 'SENAI', true, NOW(), NOW()),
('c2222222-2222-2222-2222-222222222222', 'Mecânico de Automóveis', 'curso', 200, 'Formação em manutenção automotiva com foco em motores e sistemas', 'Ensino fundamental completo', 'SENAI', true, NOW(), NOW()),
('c3333333-3333-3333-3333-333333333333', 'Operador de Empilhadeira', 'curso', 40, 'Capacitação para operação segura de empilhadeiras', 'Maior de 18 anos, alfabetizado', 'SESI', true, NOW(), NOW()),
('c4444444-4444-4444-4444-444444444444', 'Assistente Administrativo', 'curso', 120, 'Curso de gestão administrativa e organização empresarial', 'Ensino médio completo', 'SENAC', true, NOW(), NOW()),
('c5555555-5555-5555-5555-555555555555', 'Informática Básica', 'curso', 60, 'Introdução à informática, Windows, Word, Excel e Internet', 'Alfabetizado', 'SENAC', true, NOW(), NOW()),
('c6666666-6666-6666-6666-666666666666', 'Soldador', 'curso', 180, 'Técnicas de soldagem MIG, TIG e eletrodo revestido', 'Ensino fundamental completo', 'SENAI', true, NOW(), NOW()),
('c7777777-7777-7777-7777-777777777777', 'Confeiteiro', 'curso', 80, 'Técnicas de confeitaria e panificação profissional', 'Maior de 16 anos', 'SENAC', true, NOW(), NOW()),
('c8888888-8888-8888-8888-888888888888', 'Empreendedorismo', 'curso', 40, 'Planejamento e gestão de pequenos negócios', 'Ensino médio completo', 'SEBRAE', true, NOW(), NOW()),
('e1111111-1111-1111-1111-111111111111', 'Exame de Vista', 'exame', 2, 'Exame oftalmológico completo', 'Nenhum', 'Clínica Parceira', true, NOW(), NOW()),
('e2222222-2222-2222-2222-222222222222', 'Exame Médico Admissional', 'exame', 1, 'Exame médico para admissão em empresas', 'Nenhum', 'Clínica Parceira', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. CAMINHÕES
INSERT INTO caminhoes (id, placa, modelo, ano, capacidade_litros, km_por_litro, status, created_at, updated_at) VALUES
('t1111111-1111-1111-1111-111111111111', 'ABC-1234', 'Mercedes-Benz Atego 1719', 2020, 300, 3.5, 'disponivel', NOW(), NOW()),
('t2222222-2222-2222-2222-222222222222', 'DEF-5678', 'Volkswagen Delivery 11.180', 2021, 250, 4.0, 'disponivel', NOW(), NOW()),
('t3333333-3333-3333-3333-333333333333', 'GHI-9012', 'Ford Cargo 1719', 2019, 280, 3.8, 'disponivel', NOW(), NOW()),
('t4444444-4444-4444-4444-444444444444', 'JKL-3456', 'Iveco Daily 55C17', 2022, 200, 5.0, 'disponivel', NOW(), NOW()),
('t5555555-5555-5555-5555-555555555555', 'MNO-7890', 'Mercedes-Benz Accelo 1016', 2020, 220, 4.2, 'disponivel', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 4. FUNCIONÁRIOS
INSERT INTO funcionarios (id, nome, cargo, especialidade, custo_diario, status, created_at, updated_at) VALUES
('f1111111-1111-1111-1111-111111111111', 'João Silva Santos', 'Instrutor', 'Eletricidade', 350.00, 'ativo', NOW(), NOW()),
('f2222222-2222-2222-2222-222222222222', 'Maria Oliveira Costa', 'Instrutora', 'Mecânica Automotiva', 380.00, 'ativo', NOW(), NOW()),
('f3333333-3333-3333-3333-333333333333', 'Pedro Souza Lima', 'Coordenador', 'Gestão de Ações', 450.00, 'ativo', NOW(), NOW()),
('f4444444-4444-4444-4444-444444444444', 'Ana Paula Ferreira', 'Instrutora', 'Informática', 320.00, 'ativo', NOW(), NOW()),
('f5555555-5555-5555-5555-555555555555', 'Carlos Eduardo Alves', 'Motorista', 'Transporte', 280.00, 'ativo', NOW(), NOW()),
('f6666666-6666-6666-6666-666666666666', 'Juliana Martins Rocha', 'Assistente Administrativa', 'Atendimento', 250.00, 'ativo', NOW(), NOW()),
('f7777777-7777-7777-7777-777777777777', 'Roberto Carlos Dias', 'Instrutor', 'Soldagem', 370.00, 'ativo', NOW(), NOW()),
('f8888888-8888-8888-8888-888888888888', 'Fernanda Lima Santos', 'Instrutora', 'Confeitaria', 340.00, 'ativo', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 5. AÇÕES
INSERT INTO acoes (id, instituicao_id, tipo, municipio, estado, data_inicio, data_fim, status, descricao, local_execucao, vagas_disponiveis, created_at, updated_at) VALUES
('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'curso', 'Campinas', 'SP', '2026-03-01', '2026-03-15', 'planejada', 'Ação de capacitação em eletricidade industrial', 'Centro de Treinamento SENAI Campinas', 40, NOW(), NOW()),
('a2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'curso', 'Santos', 'SP', '2026-03-10', '2026-03-25', 'planejada', 'Cursos de informática e administração', 'SENAC Santos', 60, NOW(), NOW()),
('a3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'exame', 'São José dos Campos', 'SP', '2026-02-20', '2026-02-20', 'em_andamento', 'Mutirão de exames médicos e oftalmológicos', 'SESI São José dos Campos', 100, NOW(), NOW()),
('a4444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'curso', 'Sorocaba', 'SP', '2026-04-01', '2026-04-10', 'planejada', 'Workshop de empreendedorismo', 'SEBRAE Sorocaba', 30, NOW(), NOW()),
('a5555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'curso', 'Ribeirão Preto', 'SP', '2026-03-15', '2026-04-05', 'planejada', 'Capacitação em mecânica automotiva e soldagem', 'SENAI Ribeirão Preto', 50, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 6. AÇÃO_CURSO_EXAME (Relacionamento entre Ações e Cursos/Exames)
INSERT INTO acao_curso_exame (id, acao_id, curso_exame_id, vagas, horarios, created_at, updated_at) VALUES
('ac111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 40, '["08:00-12:00", "13:00-17:00"]', NOW(), NOW()),
('ac222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'c5555555-5555-5555-5555-555555555555', 30, '["08:00-12:00"]', NOW(), NOW()),
('ac333333-3333-3333-3333-333333333333', 'a2222222-2222-2222-2222-222222222222', 'c4444444-4444-4444-4444-444444444444', 30, '["13:00-17:00"]', NOW(), NOW()),
('ac444444-4444-4444-4444-444444444444', 'a3333333-3333-3333-3333-333333333333', 'e1111111-1111-1111-1111-111111111111', 50, '["08:00-12:00"]', NOW(), NOW()),
('ac555555-5555-5555-5555-555555555555', 'a3333333-3333-3333-3333-333333333333', 'e2222222-2222-2222-2222-222222222222', 50, '["13:00-17:00"]', NOW(), NOW()),
('ac666666-6666-6666-6666-666666666666', 'a4444444-4444-4444-4444-444444444444', 'c8888888-8888-8888-8888-888888888888', 30, '["09:00-13:00"]', NOW(), NOW()),
('ac777777-7777-7777-7777-777777777777', 'a5555555-5555-5555-5555-555555555555', 'c2222222-2222-2222-2222-222222222222', 25, '["08:00-12:00", "13:00-17:00"]', NOW(), NOW()),
('ac888888-8888-8888-8888-888888888888', 'a5555555-5555-5555-5555-555555555555', 'c6666666-6666-6666-6666-666666666666', 25, '["08:00-12:00", "13:00-17:00"]', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 7. AÇÃO_CAMINHOES (Relacionamento entre Ações e Caminhões)
INSERT INTO acao_caminhoes (id, acao_id, caminhao_id, created_at, updated_at) VALUES
('atc11111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 't1111111-1111-1111-1111-111111111111', NOW(), NOW()),
('atc22222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 't2222222-2222-2222-2222-222222222222', NOW(), NOW()),
('atc33333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', 't3333333-3333-3333-3333-333333333333', NOW(), NOW()),
('atc44444-4444-4444-4444-444444444444', 'a4444444-4444-4444-4444-444444444444', 't4444444-4444-4444-4444-444444444444', NOW(), NOW()),
('atc55555-5555-5555-5555-555555555555', 'a5555555-5555-5555-5555-555555555555', 't5555555-5555-5555-5555-555555555555', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 8. AÇÃO_FUNCIONARIOS (Relacionamento entre Ações e Funcionários)
INSERT INTO acao_funcionarios (id, acao_id, funcionario_id, created_at, updated_at) VALUES
('af111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'f1111111-1111-1111-1111-111111111111', NOW(), NOW()),
('af222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', 'f3333333-3333-3333-3333-333333333333', NOW(), NOW()),
('af333333-3333-3333-3333-333333333333', 'a2222222-2222-2222-2222-222222222222', 'f4444444-4444-4444-4444-444444444444', NOW(), NOW()),
('af444444-4444-4444-4444-444444444444', 'a2222222-2222-2222-2222-222222222222', 'f6666666-6666-6666-6666-666666666666', NOW(), NOW()),
('af555555-5555-5555-5555-555555555555', 'a3333333-3333-3333-3333-333333333333', 'f3333333-3333-3333-3333-333333333333', NOW(), NOW()),
('af666666-6666-6666-6666-666666666666', 'a4444444-4444-4444-4444-444444444444', 'f3333333-3333-3333-3333-333333333333', NOW(), NOW()),
('af777777-7777-7777-7777-777777777777', 'a5555555-5555-5555-5555-555555555555', 'f2222222-2222-2222-2222-222222222222', NOW(), NOW()),
('af888888-8888-8888-8888-888888888888', 'a5555555-5555-5555-5555-555555555555', 'f7777777-7777-7777-7777-777777777777', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 9. NOTÍCIAS
INSERT INTO noticias (id, titulo, conteudo, acao_id, destaque, data_publicacao, ativo, created_at, updated_at) VALUES
('n1111111-1111-1111-1111-111111111111', 'Inscrições Abertas: Curso de Eletricista Industrial em Campinas', 'Estão abertas as inscrições para o curso de Eletricista Industrial que será realizado em Campinas de 01 a 15 de março. São 40 vagas disponíveis com certificação SENAI.', 'a1111111-1111-1111-1111-111111111111', true, NOW(), true, NOW(), NOW()),
('n2222222-2222-2222-2222-222222222222', 'Mutirão de Exames em São José dos Campos', 'Participe do mutirão de exames médicos e oftalmológicos gratuitos no dia 20 de fevereiro. Atendimento por ordem de chegada.', 'a3333333-3333-3333-3333-333333333333', true, NOW(), true, NOW(), NOW()),
('n3333333-3333-3333-3333-333333333333', 'SENAC oferece cursos gratuitos em Santos', 'O SENAC Santos está com inscrições abertas para cursos de Informática Básica e Assistente Administrativo. Não perca essa oportunidade!', 'a2222222-2222-2222-2222-222222222222', true, NOW(), true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Mensagem de sucesso
SELECT 'Banco de dados populado com sucesso!' as status;
SELECT 'Instituições: ' || COUNT(*) FROM instituicoes;
SELECT 'Cursos/Exames: ' || COUNT(*) FROM cursos_exames;
SELECT 'Caminhões: ' || COUNT(*) FROM caminhoes;
SELECT 'Funcionários: ' || COUNT(*) FROM funcionarios;
SELECT 'Ações: ' || COUNT(*) FROM acoes;
SELECT 'Notícias: ' || COUNT(*) FROM noticias;
