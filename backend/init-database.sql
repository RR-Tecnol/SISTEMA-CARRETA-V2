-- ============================================
-- SISTEMA CARRETAS - Inicialização do Banco
-- ============================================
-- Este script cria todas as tabelas e popula com dados de teste
-- Execute: docker exec -i carretas-postgres psql -U postgres -d sistema_carretas < backend/init-database.sql

-- ============================================
-- 1. DROP TABLES (se existir)
-- ============================================
DROP TABLE IF EXISTS notificacoes CASCADE;
DROP TABLE IF EXISTS inscricoes CASCADE;
DROP TABLE IF EXISTS noticias CASCADE;
DROP TABLE IF EXISTS abastecimentos CASCADE;
DROP TABLE IF EXISTS acao_funcionarios CASCADE;
DROP TABLE IF EXISTS acao_caminhoes CASCADE;
DROP TABLE IF EXISTS acao_curso_exame CASCADE;
DROP TABLE IF EXISTS acoes CASCADE;
DROP TABLE IF EXISTS cidadaos CASCADE;
DROP TABLE IF EXISTS curso_exames CASCADE;
DROP TABLE IF EXISTS funcionarios CASCADE;
DROP TABLE IF EXISTS caminhoes CASCADE;
DROP TABLE IF EXISTS instituicoes CASCADE;
DROP TABLE IF EXISTS configuracoes_campo CASCADE;
DROP SEQUENCE IF EXISTS acoes_numero_acao_seq CASCADE;

-- ============================================
-- 2. CREATE TABLES
-- ============================================

-- Sequence para numero_acao
CREATE SEQUENCE acoes_numero_acao_seq START 1;

-- Instituições
CREATE TABLE instituicoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    razao_social VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) UNIQUE NOT NULL,
    responsavel_nome VARCHAR(255) NOT NULL,
    responsavel_email VARCHAR(255) NOT NULL,
    responsavel_tel VARCHAR(20) NOT NULL,
    endereco_completo TEXT NOT NULL,
    campos_customizados JSONB DEFAULT '{}',
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Cursos e Exames
CREATE TABLE cursos_exames (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('curso', 'exame')),
    carga_horaria INTEGER,
    descricao TEXT,
    requisitos TEXT,
    certificadora VARCHAR(255),
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(), -- Adicionado Timestamps
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()  -- Adicionado Timestamps
);

-- Caminhões
CREATE TABLE caminhoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    placa VARCHAR(10) UNIQUE NOT NULL,
    modelo VARCHAR(255) NOT NULL,
    ano INTEGER,
    capacidade_litros DECIMAL(10, 2),
    km_por_litro DECIMAL(10, 2),
    status VARCHAR(20) NOT NULL DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'em_uso', 'manutencao')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Funcionários
CREATE TABLE funcionarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    cargo VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    telefone VARCHAR(20),
    diaria DECIMAL(10, 2),
    especialidade VARCHAR(255),
    custo_diario DECIMAL(10, 2),
    status VARCHAR(20) NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'disponivel', 'em_missao', 'ferias')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Ações
CREATE TABLE acoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_acao SERIAL UNIQUE, -- Alterado para SERIAL para auto-incremento correto
    instituicao_id UUID NOT NULL REFERENCES instituicoes(id),
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('curso', 'saude')),
    municipio VARCHAR(255) NOT NULL,
    estado VARCHAR(2) NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'planejada' CHECK (status IN ('planejada', 'ativa', 'concluida')),
    descricao TEXT,
    local_execucao VARCHAR(255) NOT NULL,
    vagas_disponiveis INTEGER NOT NULL DEFAULT 0,
    distancia_km DECIMAL(10, 2), -- Corrigido para DECIMAL
    preco_combustivel_referencia DECIMAL(10, 2), -- Corrigido para DECIMAL
    campos_customizados JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Ação - Curso/Exame (N-N)
CREATE TABLE acao_curso_exame (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    acao_id UUID NOT NULL REFERENCES acoes(id) ON DELETE CASCADE,
    curso_exame_id UUID NOT NULL REFERENCES cursos_exames(id) ON DELETE CASCADE,
    vagas INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(acao_id, curso_exame_id)
);

-- Ação - Caminhão (N-N)
CREATE TABLE acao_caminhoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    acao_id UUID NOT NULL REFERENCES acoes(id) ON DELETE CASCADE,
    caminhao_id UUID NOT NULL REFERENCES caminhoes(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(acao_id, caminhao_id)
);

-- Ação - Funcionário (N-N)
CREATE TABLE acao_funcionarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    acao_id UUID NOT NULL REFERENCES acoes(id) ON DELETE CASCADE,
    funcionario_id UUID NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(acao_id, funcionario_id)
);

-- Cidadãos
CREATE TABLE cidadaos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cpf VARCHAR(255) UNIQUE NOT NULL,
    nome_completo VARCHAR(255) NOT NULL,
    data_nascimento DATE NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    senha VARCHAR(255),
    tipo VARCHAR(20) DEFAULT 'cidadao',
    municipio VARCHAR(255) NOT NULL,
    estado VARCHAR(2) NOT NULL,
    cep VARCHAR(9),
    rua VARCHAR(255),
    numero VARCHAR(10),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    campos_customizados JSONB DEFAULT '{}',
    consentimento_lgpd BOOLEAN NOT NULL DEFAULT false,
    data_consentimento TIMESTAMP,
    ip_consentimento VARCHAR(45),
    reset_password_token VARCHAR(255),
    reset_password_expires TIMESTAMP,
    foto_perfil VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Inscrições
CREATE TABLE inscricoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cidadao_id UUID NOT NULL REFERENCES cidadaos(id) ON DELETE CASCADE,
    acao_id UUID NOT NULL REFERENCES acoes(id) ON DELETE CASCADE,
    curso_exame_id UUID REFERENCES cursos_exames(id) ON DELETE SET NULL,
    data_inscricao TIMESTAMP NOT NULL DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'atendido', 'faltou')),
    observacoes TEXT, -- Adicionado campo Observacões
    campos_customizados JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Abastecimentos
CREATE TABLE abastecimentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caminhao_id UUID NOT NULL REFERENCES caminhoes(id) ON DELETE CASCADE,
    acao_id UUID REFERENCES acoes(id) ON DELETE SET NULL,
    data_abastecimento TIMESTAMP NOT NULL,
    litros DECIMAL(10, 3) NOT NULL,
    preco_por_litro DECIMAL(6, 3) NOT NULL,
    valor_total DECIMAL(10, 2) NOT NULL,
    km_atual INTEGER,
    observacoes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Notícias
CREATE TABLE noticias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo VARCHAR(255) NOT NULL,
    conteudo TEXT NOT NULL,
    imagem_url VARCHAR(500),
    acao_id UUID REFERENCES acoes(id) ON DELETE SET NULL,
    destaque BOOLEAN NOT NULL DEFAULT false,
    data_publicacao TIMESTAMP NOT NULL DEFAULT NOW(),
    campos_customizados JSONB DEFAULT '{}',
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Notificações
CREATE TABLE notificacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cidadao_id UUID NOT NULL REFERENCES cidadaos(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    mensagem TEXT NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    lida BOOLEAN NOT NULL DEFAULT false,
    data_leitura TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Configurações de Campo
CREATE TABLE configuracoes_campo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_campo VARCHAR(255) UNIQUE NOT NULL,
    tipo_campo VARCHAR(50) NOT NULL,
    obrigatorio BOOLEAN NOT NULL DEFAULT false,
    opcoes JSONB,
    ordem_exibicao INTEGER,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- 3. POPULAR DADOS DE TESTE
-- ============================================

-- Instituições
INSERT INTO instituicoes (id, razao_social, cnpj, responsavel_nome, responsavel_email, responsavel_tel, endereco_completo) VALUES
('11111111-1111-1111-1111-111111111111', 'SENAI - Serviço Nacional de Aprendizagem Industrial', '03.775.428/0001-40', 'Carlos Alberto', 'carlos@senai.br', '(11) 3528-2000', 'Av. Paulista, 1313 - São Paulo, SP'),
('22222222-2222-2222-2222-222222222222', 'SENAC - Serviço Nacional de Aprendizagem Comercial', '03.709.814/0001-98', 'Maria Silva', 'maria@senac.br', '(11) 2626-2000', 'Rua 24 de Maio, 208 - São Paulo, SP'),
('33333333-3333-3333-3333-333333333333', 'SESI - Serviço Social da Indústria', '03.775.428/0002-21', 'João Santos', 'joao@sesi.org.br', '(11) 3528-2100', 'Av. Paulista, 1313 - São Paulo, SP');

-- Cursos e Exames
INSERT INTO cursos_exames (id, nome, tipo, carga_horaria, descricao, requisitos, certificadora) VALUES
('c1111111-1111-1111-1111-111111111111', 'Eletricista Industrial', 'curso', 160, 'Curso completo de eletricidade industrial', 'Ensino fundamental completo', 'SENAI'),
('c2222222-2222-2222-2222-222222222222', 'Mecânico de Automóveis', 'curso', 200, 'Formação em manutenção automotiva', 'Ensino fundamental completo', 'SENAI'),
('c3333333-3333-3333-3333-333333333333', 'Informática Básica', 'curso', 60, 'Introdução à informática e internet', 'Alfabetizado', 'SENAC'),
('e1111111-1111-1111-1111-111111111111', 'Exame de Vista', 'exame', 2, 'Exame oftalmológico completo', 'Nenhum', 'Clínica Parceira'),
('e2222222-2222-2222-2222-222222222222', 'Exame Médico Admissional', 'exame', 1, 'Exame médico para admissão', 'Nenhum', 'Clínica Parceira');

-- Caminhões
INSERT INTO caminhoes (id, placa, modelo, ano, capacidade_litros, km_por_litro, status) VALUES
('t1111111-1111-1111-1111-111111111111', 'ABC-1234', 'Mercedes-Benz Atego 1719', 2020, 300, 3.5, 'disponivel'),
('t2222222-2222-2222-2222-222222222222', 'DEF-5678', 'Volkswagen Delivery 11.180', 2021, 250, 4.0, 'disponivel'),
('t3333333-3333-3333-3333-333333333333', 'GHI-9012', 'Ford Cargo 1719', 2019, 280, 3.8, 'disponivel');

-- Funcionários
INSERT INTO funcionarios (id, nome, cargo, especialidade, custo_diario, status) VALUES
('f1111111-1111-1111-1111-111111111111', 'João Silva Santos', 'Instrutor', 'Eletricidade', 350.00, 'ativo'),
('f2222222-2222-2222-2222-222222222222', 'Maria Oliveira Costa', 'Instrutora', 'Mecânica Automotiva', 380.00, 'ativo'),
('f3333333-3333-3333-3333-333333333333', 'Pedro Souza Lima', 'Coordenador', 'Gestão de Ações', 450.00, 'ativo'),
('f4444444-4444-4444-4444-444444444444', 'Ana Paula Ferreira', 'Instrutora', 'Informática', 320.00, 'ativo');

-- Ações
INSERT INTO acoes (id, instituicao_id, tipo, municipio, estado, data_inicio, data_fim, status, descricao, local_execucao, vagas_disponiveis) VALUES
('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'curso', 'Campinas', 'SP', '2026-03-01', '2026-03-15', 'planejada', 'Ação de capacitação em eletricidade industrial', 'Centro SENAI Campinas', 40),
('a2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'curso', 'Santos', 'SP', '2026-03-10', '2026-03-20', 'planejada', 'Cursos de informática para a comunidade', 'SENAC Santos', 30),
('a3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'saude', 'São José dos Campos', 'SP', '2026-02-20', '2026-02-20', 'planejada', 'Mutirão de exames médicos e oftalmológicos', 'Ginásio Municipal', 200);

-- Ação - Curso/Exame
INSERT INTO acao_curso_exame (acao_id, curso_exame_id, vagas) VALUES
('a1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 40),
('a2222222-2222-2222-2222-222222222222', 'c3333333-3333-3333-3333-333333333333', 30),
('a3333333-3333-3333-3333-333333333333', 'e1111111-1111-1111-1111-111111111111', 100),
('a3333333-3333-3333-3333-333333333333', 'e2222222-2222-2222-2222-222222222222', 100);

-- Ação - Caminhões
INSERT INTO acao_caminhoes (acao_id, caminhao_id) VALUES
('a1111111-1111-1111-1111-111111111111', 't1111111-1111-1111-1111-111111111111'),
('a2222222-2222-2222-2222-222222222222', 't2222222-2222-2222-2222-222222222222'),
('a3333333-3333-3333-3333-333333333333', 't1111111-1111-1111-1111-111111111111'),
('a3333333-3333-3333-3333-333333333333', 't3333333-3333-3333-3333-333333333333');

-- Ação - Funcionários
INSERT INTO acao_funcionarios (acao_id, funcionario_id) VALUES
('a1111111-1111-1111-1111-111111111111', 'f1111111-1111-1111-1111-111111111111'),
('a1111111-1111-1111-1111-111111111111', 'f3333333-3333-3333-3333-333333333333'),
('a2222222-2222-2222-2222-222222222222', 'f4444444-4444-4444-4444-444444444444'),
('a3333333-3333-3333-3333-333333333333', 'f3333333-3333-3333-3333-333333333333');

-- Admin (CPF: 123.456.789-09, Senha: admin123)
INSERT INTO cidadaos (id, cpf, nome_completo, data_nascimento, telefone, email, senha, tipo, municipio, estado, consentimento_lgpd, data_consentimento) VALUES
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '123.456.789-09',
    'Administrador do Sistema',
    '1990-01-01',
    '(83) 99999-9999',
    'admin@sistemacarretas.com.br',
    '$2b$10$W3VGx5pF7NZqF6vE9yKHv.YvN0BzFz6vF5Q7KkGx3rZ8QwHfN5aHm',
    'admin',
    'João Pessoa',
    'PB',
    true,
    NOW()
);

-- Notícias
INSERT INTO noticias (titulo, conteudo, acao_id, destaque) VALUES
('Inscrições Abertas: Curso de Eletricista Industrial em Campinas', 'Estão abertas as inscrições para o curso de Eletricista Industrial que será realizado em Campinas de 01 a 15 de março. São 40 vagas com certificação SENAI.', 'a1111111-1111-1111-1111-111111111111', true),
('Mutirão de Exames em São José dos Campos', 'Participe do mutirão de exames médicos e oftalmológicos gratuitos no dia 20 de fevereiro. Atendimento por ordem de chegada.', 'a3333333-3333-3333-3333-333333333333', true),
('SENAC oferece cursos gratuitos em Santos', 'O SENAC Santos está com inscrições abertas para cursos de Informática Básica. Não perca essa oportunidade!', 'a2222222-2222-2222-2222-222222222222', true);

-- ============================================
-- SUCESSO
-- ============================================
\echo '\n✅ Banco de dados inicializado com sucesso!\n'
\echo 'Credenciais Admin:'
\echo '  CPF: 123.456.789-09'
\echo '  Senha: admin123'
\echo '  Email: admin@sistemacarretas.com.br\n'

SELECT 'Tabelas criadas: ' || COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
SELECT 'Instituições: ' || COUNT(*) FROM instituicoes;
SELECT 'Cursos/Exames: ' || COUNT(*) FROM cursos_exames;
SELECT 'Caminhões: ' || COUNT(*) FROM caminhoes;
SELECT 'Funcionários: ' || COUNT(*) FROM funcionarios;
SELECT 'Ações: ' || COUNT(*) FROM acoes;
SELECT 'Notícias: ' || COUNT(*) FROM noticias;
SELECT 'Cidadãos: ' || COUNT(*) FROM cidadaos;
