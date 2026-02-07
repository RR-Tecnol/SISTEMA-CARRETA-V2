-- Sistema Carretas - Database Backup
-- Data: 07/02/2026, 18:00:07
-- Database: sistema_carretas
-- Backup automático completo


-- ========================================
-- Tabela: abastecimentos (0 registros)
-- ========================================

-- Nenhum registro


-- ========================================
-- Tabela: acao_caminhoes (0 registros)
-- ========================================

-- Nenhum registro


-- ========================================
-- Tabela: acao_curso_exame (2 registros)
-- ========================================

INSERT INTO "acao_curso_exame" ("id", "acao_id", "curso_exame_id", "vagas", "created_at", "updated_at") VALUES ('7a40c52c-4c27-49d8-991e-3a71946b368d', '53df1c14-a0b7-49ed-9292-607e4f17b15e', 'be4727af-2919-40a8-8284-e827b41eb93d', 100, '2026-02-07T19:39:00.638Z', '2026-02-07T19:39:00.638Z') ON CONFLICT DO NOTHING;
INSERT INTO "acao_curso_exame" ("id", "acao_id", "curso_exame_id", "vagas", "created_at", "updated_at") VALUES ('3ad4c181-6423-4176-bfa3-b72824e01e10', '0d56a264-3f0e-4ae6-a143-757fbe8ec71c', 'be4727af-2919-40a8-8284-e827b41eb93d', 50, '2026-02-07T20:47:36.495Z', '2026-02-07T20:47:36.495Z') ON CONFLICT DO NOTHING;


-- ========================================
-- Tabela: acao_funcionarios (0 registros)
-- ========================================

-- Nenhum registro


-- ========================================
-- Tabela: acoes (2 registros)
-- ========================================

INSERT INTO "acoes" ("id", "numero_acao", "instituicao_id", "tipo", "municipio", "estado", "data_inicio", "data_fim", "status", "descricao", "local_execucao", "vagas_disponiveis", "distancia_km", "preco_combustivel_referencia", "campos_customizados", "created_at", "updated_at", "permitir_inscricao_previa", "nome") VALUES ('53df1c14-a0b7-49ed-9292-607e4f17b15e', 1, 'd2120645-e88f-4c12-a31c-0f60c2ddacbe', 'saude', 'Sao Luis', 'MA', '2026-02-06T03:00:00.000Z', '2026-02-09T03:00:00.000Z', 'planejada', '', 'Renascença', 100, 100, '6.000', '{}', '2026-02-07T19:39:00.584Z', '2026-02-07T20:39:58.331Z', TRUE, 'Campanha de Hemograma') ON CONFLICT DO NOTHING;
INSERT INTO "acoes" ("id", "numero_acao", "instituicao_id", "tipo", "municipio", "estado", "data_inicio", "data_fim", "status", "descricao", "local_execucao", "vagas_disponiveis", "distancia_km", "preco_combustivel_referencia", "campos_customizados", "created_at", "updated_at", "permitir_inscricao_previa", "nome") VALUES ('0d56a264-3f0e-4ae6-a143-757fbe8ec71c', 2, 'd2120645-e88f-4c12-a31c-0f60c2ddacbe', 'saude', 'Sao Luis', 'MA', '2026-02-06T03:00:00.000Z', '2026-02-09T03:00:00.000Z', 'planejada', '', 'Renascença', 50, 1000, '7.000', '{}', '2026-02-07T20:47:36.444Z', '2026-02-07T20:47:36.444Z', TRUE, 'Campanha de Exame de Vista') ON CONFLICT DO NOTHING;


-- ========================================
-- Tabela: acoes_insumos (0 registros)
-- ========================================

-- Nenhum registro


-- ========================================
-- Tabela: caminhoes (0 registros)
-- ========================================

-- Nenhum registro


-- ========================================
-- Tabela: cidadaos (3 registros)
-- ========================================

INSERT INTO "cidadaos" ("id", "cpf", "nome_completo", "data_nascimento", "telefone", "email", "senha", "tipo", "municipio", "estado", "cep", "rua", "numero", "complemento", "bairro", "campos_customizados", "consentimento_lgpd", "data_consentimento", "ip_consentimento", "reset_password_token", "reset_password_expires", "foto_perfil", "created_at", "updated_at", "cartao_sus", "raca", "genero", "nome_mae") VALUES ('c4076994-4fa1-40ba-9123-b697c7bc2ae5', '000.000.000-00', 'Administrador do Sistema', '1989-12-31T02:00:00.000Z', '(00) 00000-0000', 'admin@sistemacarretas.com', '$2b$10$XonP.sI2QulrH.GpcUzJ5exNXtweEumBGsAW0BtDwE4oyg4f92Mui', 'admin', 'São Luís', 'MA', NULL, NULL, NULL, NULL, NULL, '{}', TRUE, '2026-02-06T17:54:41.700Z', '127.0.0.1', NULL, NULL, NULL, '2026-02-06T17:54:41.713Z', '2026-02-06T17:54:41.713Z', NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO "cidadaos" ("id", "cpf", "nome_completo", "data_nascimento", "telefone", "email", "senha", "tipo", "municipio", "estado", "cep", "rua", "numero", "complemento", "bairro", "campos_customizados", "consentimento_lgpd", "data_consentimento", "ip_consentimento", "reset_password_token", "reset_password_expires", "foto_perfil", "created_at", "updated_at", "cartao_sus", "raca", "genero", "nome_mae") VALUES ('00ac8f50-e95e-4312-9b07-28fb94d6ac2e', '111.111.111-11', 'Administrador do Sistema', '1989-12-31T02:00:00.000Z', '(98) 98888-8888', 'admin@sistemacarretas.com', '$2b$10$9zrhSyUDDLB6HlH1JKZB5uug1wSbE6/FqHC4wqdNA4HLViNV.5DuK', 'admin', 'São Luís', 'MA', NULL, NULL, NULL, NULL, NULL, '{}', TRUE, '2026-02-06T18:23:13.848Z', '127.0.0.1', NULL, NULL, NULL, '2026-02-06T18:23:13.860Z', '2026-02-06T18:23:13.860Z', NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO "cidadaos" ("id", "cpf", "nome_completo", "data_nascimento", "telefone", "email", "senha", "tipo", "municipio", "estado", "cep", "rua", "numero", "complemento", "bairro", "campos_customizados", "consentimento_lgpd", "data_consentimento", "ip_consentimento", "reset_password_token", "reset_password_expires", "foto_perfil", "created_at", "updated_at", "cartao_sus", "raca", "genero", "nome_mae") VALUES ('c2b582f1-027b-4402-987c-870637f8a291', '123.456.789-09', 'Administrador System Truck', '1989-12-31T02:00:00.000Z', '(98) 98888-8888', 'admin@systemtruck.com', '$2b$10$YvCXfT9O/8CWbnwICjSw4.aptyXO/chu43dUumRHOtSrNKklB0yRK', 'admin', 'São Luís', 'MA', NULL, NULL, NULL, NULL, NULL, '{}', TRUE, '2026-02-06T18:26:56.655Z', '127.0.0.1', NULL, NULL, NULL, '2026-02-06T18:26:56.670Z', '2026-02-06T19:03:58.953Z', NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;


-- ========================================
-- Tabela: configuracoes_campo (0 registros)
-- ========================================

-- Nenhum registro


-- ========================================
-- Tabela: contas_pagar (0 registros)
-- ========================================

-- Nenhum registro


-- ========================================
-- Tabela: cursos_exames (1 registros)
-- ========================================

INSERT INTO "cursos_exames" ("id", "nome", "tipo", "carga_horaria", "descricao", "requisitos", "certificadora", "ativo") VALUES ('be4727af-2919-40a8-8284-e827b41eb93d', 'hemograma', 'exame', NULL, NULL, NULL, NULL, FALSE) ON CONFLICT DO NOTHING;


-- ========================================
-- Tabela: custos_acoes (0 registros)
-- ========================================

-- Nenhum registro


-- ========================================
-- Tabela: exames (0 registros)
-- ========================================

-- Nenhum registro


-- ========================================
-- Tabela: funcionarios (0 registros)
-- ========================================

-- Nenhum registro


-- ========================================
-- Tabela: inscricoes (0 registros)
-- ========================================

-- Nenhum registro


-- ========================================
-- Tabela: instituicoes (1 registros)
-- ========================================

INSERT INTO "instituicoes" ("id", "razao_social", "cnpj", "responsavel_nome", "responsavel_email", "responsavel_tel", "endereco_completo", "campos_customizados", "ativo", "created_at", "updated_at") VALUES ('d2120645-e88f-4c12-a31c-0f60c2ddacbe', 'SENAI - SÃO LUIS', '10566.16816814', 'joao gabriel ', 'joaogabrieldiniz2307@gmail.com', '98987272826', 'Rua bento freitas', '{}', TRUE, '2026-02-07T19:37:52.905Z', '2026-02-07T19:37:52.905Z') ON CONFLICT DO NOTHING;


-- ========================================
-- Tabela: insumos (0 registros)
-- ========================================

-- Nenhum registro


-- ========================================
-- Tabela: movimentacoes_estoque (0 registros)
-- ========================================

-- Nenhum registro


-- ========================================
-- Tabela: noticias (0 registros)
-- ========================================

-- Nenhum registro


-- ========================================
-- Tabela: notificacoes (0 registros)
-- ========================================

-- Nenhum registro


-- ========================================
-- Tabela: resultados_exames (0 registros)
-- ========================================

-- Nenhum registro

