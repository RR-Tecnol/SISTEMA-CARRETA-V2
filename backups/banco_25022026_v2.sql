--
-- PostgreSQL database dump
--

\restrict jbD8TeLP2Bt2VepU3KaV9je9f1uFGV6TYfL9WWfGFvYEB9XhLzXhqqP9xtZFRJw

-- Dumped from database version 15.15
-- Dumped by pg_dump version 15.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: enum_acoes_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_acoes_status AS ENUM (
    'planejada',
    'ativa',
    'concluida'
);


--
-- Name: enum_acoes_tipo; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_acoes_tipo AS ENUM (
    'curso',
    'saude'
);


--
-- Name: enum_atendimentos_medicos_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_atendimentos_medicos_status AS ENUM (
    'aguardando',
    'em_andamento',
    'concluido',
    'cancelado'
);


--
-- Name: enum_cidadaos_genero; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_cidadaos_genero AS ENUM (
    'masculino',
    'feminino',
    'outro',
    'nao_declarado'
);


--
-- Name: enum_cidadaos_raca; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_cidadaos_raca AS ENUM (
    'branca',
    'preta',
    'parda',
    'amarela',
    'indigena',
    'nao_declarada'
);


--
-- Name: enum_configuracoes_campo_entidade; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_configuracoes_campo_entidade AS ENUM (
    'instituicao',
    'acao',
    'cidadao',
    'curso_exame'
);


--
-- Name: enum_configuracoes_campo_tipo; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_configuracoes_campo_tipo AS ENUM (
    'text',
    'number',
    'date',
    'select',
    'checkbox'
);


--
-- Name: enum_contas_pagar_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_contas_pagar_status AS ENUM (
    'pendente',
    'paga',
    'vencida',
    'cancelada'
);


--
-- Name: enum_contas_pagar_tipo_conta; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_contas_pagar_tipo_conta AS ENUM (
    'agua',
    'energia',
    'aluguel',
    'internet',
    'telefone',
    'pneu_furado',
    'troca_oleo',
    'abastecimento',
    'manutencao_mecanica',
    'reboque',
    'lavagem',
    'pedagio',
    'funcionario',
    'manutencao',
    'espontaneo',
    'outros'
);


--
-- Name: enum_cursos_exames_tipo; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_cursos_exames_tipo AS ENUM (
    'curso',
    'exame'
);


--
-- Name: enum_custos_acoes_tipo_custo; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_custos_acoes_tipo_custo AS ENUM (
    'abastecimento',
    'alimentacao',
    'hospedagem',
    'transporte',
    'material',
    'pedagio',
    'manutencao',
    'outros'
);


--
-- Name: enum_insumos_categoria; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_insumos_categoria AS ENUM (
    'EPI',
    'MEDICAMENTO',
    'MATERIAL_DESCARTAVEL',
    'EQUIPAMENTO',
    'OUTROS'
);


--
-- Name: enum_movimentacoes_estoque_tipo; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_movimentacoes_estoque_tipo AS ENUM (
    'ENTRADA',
    'SAIDA',
    'TRANSFERENCIA',
    'AJUSTE',
    'PERDA'
);


--
-- Name: enum_notificacoes_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_notificacoes_status AS ENUM (
    'agendada',
    'enviada',
    'erro'
);


--
-- Name: enum_notificacoes_tipo; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_notificacoes_tipo AS ENUM (
    'whatsapp',
    'email',
    'sms'
);


--
-- Name: enum_pontos_medicos_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_pontos_medicos_status AS ENUM (
    'trabalhando',
    'saiu'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: SequelizeMeta; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SequelizeMeta" (
    name character varying(255) NOT NULL
);


--
-- Name: abastecimentos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.abastecimentos (
    id uuid NOT NULL,
    acao_id uuid NOT NULL,
    caminhao_id uuid NOT NULL,
    data_abastecimento timestamp with time zone NOT NULL,
    litros numeric(8,2) NOT NULL,
    valor_total numeric(10,2) NOT NULL,
    preco_por_litro numeric(6,3) NOT NULL,
    observacoes text,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: COLUMN abastecimentos.litros; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.abastecimentos.litros IS 'Quantidade de litros abastecidos';


--
-- Name: COLUMN abastecimentos.valor_total; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.abastecimentos.valor_total IS 'Valor total pago pelo abastecimento';


--
-- Name: COLUMN abastecimentos.preco_por_litro; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.abastecimentos.preco_por_litro IS 'Pre├ºo por litro (calculado: valor_total / litros)';


--
-- Name: acao_caminhoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.acao_caminhoes (
    id uuid NOT NULL,
    acao_id uuid NOT NULL,
    caminhao_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: acao_curso_exame; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.acao_curso_exame (
    id uuid NOT NULL,
    acao_id uuid NOT NULL,
    curso_exame_id uuid NOT NULL,
    vagas integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    periodicidade_meses integer,
    dias_aviso_vencimento integer DEFAULT 30 NOT NULL,
    permitir_repeticao boolean DEFAULT true NOT NULL
);


--
-- Name: acao_funcionarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.acao_funcionarios (
    id uuid NOT NULL,
    acao_id uuid NOT NULL,
    funcionario_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    valor_diaria numeric(10,2),
    dias_trabalhados integer DEFAULT 1
);


--
-- Name: acoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.acoes (
    id uuid NOT NULL,
    numero_acao integer,
    instituicao_id uuid NOT NULL,
    tipo public.enum_acoes_tipo NOT NULL,
    municipio character varying(255) NOT NULL,
    estado character varying(2) NOT NULL,
    data_inicio date NOT NULL,
    data_fim date NOT NULL,
    status public.enum_acoes_status DEFAULT 'planejada'::public.enum_acoes_status NOT NULL,
    descricao text,
    local_execucao character varying(255) NOT NULL,
    vagas_disponiveis integer DEFAULT 0 NOT NULL,
    distancia_km integer,
    preco_combustivel_referencia numeric(6,3),
    campos_customizados jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    permitir_inscricao_previa boolean DEFAULT true NOT NULL,
    nome character varying(255) NOT NULL,
    numero_processo character varying(255),
    lote_regiao character varying(255),
    numero_cnes character varying(20),
    responsavel_tecnico_id uuid,
    meta_mensal_total integer,
    intercorrencias text
);


--
-- Name: COLUMN acoes.distancia_km; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.acoes.distancia_km IS 'Dist├óncia em km de S├úo Lu├¡s at├® o munic├¡pio da a├º├úo';


--
-- Name: COLUMN acoes.preco_combustivel_referencia; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.acoes.preco_combustivel_referencia IS 'Pre├ºo de refer├¬ncia do combust├¡vel em R$/litro';


--
-- Name: COLUMN acoes.permitir_inscricao_previa; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.acoes.permitir_inscricao_previa IS 'Permite inscri├º├úo antecipada para esta a├º├úo';


--
-- Name: acoes_insumos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.acoes_insumos (
    id uuid NOT NULL,
    acao_id uuid NOT NULL,
    insumo_id uuid NOT NULL,
    quantidade_planejada integer NOT NULL,
    quantidade_levada integer,
    quantidade_utilizada integer,
    quantidade_retornada integer,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: COLUMN acoes_insumos.quantidade_planejada; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.acoes_insumos.quantidade_planejada IS 'Quantidade planejada para a a├º├úo';


--
-- Name: COLUMN acoes_insumos.quantidade_levada; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.acoes_insumos.quantidade_levada IS 'Quantidade que o motorista levou';


--
-- Name: COLUMN acoes_insumos.quantidade_utilizada; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.acoes_insumos.quantidade_utilizada IS 'Quantidade efetivamente utilizada na a├º├úo';


--
-- Name: COLUMN acoes_insumos.quantidade_retornada; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.acoes_insumos.quantidade_retornada IS 'Quantidade que retornou ap├│s a a├º├úo';


--
-- Name: acoes_numero_acao_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.acoes_numero_acao_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: acoes_numero_acao_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.acoes_numero_acao_seq OWNED BY public.acoes.numero_acao;


--
-- Name: atendimentos_medicos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.atendimentos_medicos (
    id uuid NOT NULL,
    funcionario_id uuid NOT NULL,
    acao_id uuid,
    cidadao_id uuid,
    ponto_id uuid,
    hora_inicio timestamp with time zone NOT NULL,
    hora_fim timestamp with time zone,
    duracao_minutos integer,
    status public.enum_atendimentos_medicos_status DEFAULT 'em_andamento'::public.enum_atendimentos_medicos_status NOT NULL,
    observacoes text,
    nome_paciente character varying(255),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: COLUMN atendimentos_medicos.duracao_minutos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.atendimentos_medicos.duracao_minutos IS 'Dura├º├úo total do atendimento em minutos (calculado ao finalizar)';


--
-- Name: COLUMN atendimentos_medicos.nome_paciente; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.atendimentos_medicos.nome_paciente IS 'Nome do paciente (preenchido caso n├úo tenha cidadao_id vinculado)';


--
-- Name: caminhoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.caminhoes (
    id uuid NOT NULL,
    placa character varying(10) NOT NULL,
    modelo character varying(255) NOT NULL,
    ano integer NOT NULL,
    km_por_litro numeric(5,2) DEFAULT 0 NOT NULL,
    capacidade_litros integer DEFAULT 0 NOT NULL,
    status character varying(255) DEFAULT 'disponivel'::character varying NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: COLUMN caminhoes.km_por_litro; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.caminhoes.km_por_litro IS 'Autonomia do caminh├úo em km por litro';


--
-- Name: cidadaos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cidadaos (
    id uuid NOT NULL,
    cpf character varying(14) NOT NULL,
    nome_completo character varying(255) NOT NULL,
    data_nascimento date NOT NULL,
    telefone character varying(20) NOT NULL,
    email character varying(255) NOT NULL,
    senha character varying(255),
    tipo character varying(20) DEFAULT 'cidadao'::character varying,
    municipio character varying(255) NOT NULL,
    estado character varying(2) NOT NULL,
    cep character varying(9),
    rua character varying(255),
    numero character varying(10),
    complemento character varying(100),
    bairro character varying(100),
    campos_customizados jsonb DEFAULT '{}'::jsonb,
    consentimento_lgpd boolean DEFAULT false NOT NULL,
    data_consentimento timestamp with time zone,
    ip_consentimento character varying(45),
    reset_password_token character varying(255),
    reset_password_expires timestamp with time zone,
    foto_perfil character varying(255),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    cartao_sus character varying(15),
    raca public.enum_cidadaos_raca,
    genero public.enum_cidadaos_genero,
    nome_mae character varying(255)
);


--
-- Name: COLUMN cidadaos.cartao_sus; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.cidadaos.cartao_sus IS 'N├║mero do Cart├úo Nacional de Sa├║de (CNS)';


--
-- Name: configuracoes_campo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.configuracoes_campo (
    id uuid NOT NULL,
    entidade public.enum_configuracoes_campo_entidade NOT NULL,
    nome_campo character varying(255) NOT NULL,
    tipo public.enum_configuracoes_campo_tipo NOT NULL,
    obrigatorio boolean DEFAULT false NOT NULL,
    mascara character varying(255),
    validacao_regex character varying(255),
    opcoes jsonb,
    ordem_exibicao integer DEFAULT 0 NOT NULL,
    ativo boolean DEFAULT true NOT NULL
);


--
-- Name: contas_pagar; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contas_pagar (
    id uuid NOT NULL,
    tipo_conta public.enum_contas_pagar_tipo_conta NOT NULL,
    descricao character varying(255) NOT NULL,
    valor numeric(10,2) NOT NULL,
    data_vencimento timestamp with time zone NOT NULL,
    data_pagamento timestamp with time zone,
    status public.enum_contas_pagar_status DEFAULT 'pendente'::public.enum_contas_pagar_status NOT NULL,
    comprovante_url character varying(255),
    recorrente boolean DEFAULT false NOT NULL,
    observacoes text,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    tipo_espontaneo character varying(255),
    acao_id uuid,
    cidade character varying(100),
    caminhao_id uuid
);


--
-- Name: COLUMN contas_pagar.comprovante_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contas_pagar.comprovante_url IS 'URL do comprovante de pagamento';


--
-- Name: COLUMN contas_pagar.recorrente; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contas_pagar.recorrente IS 'Indica se a conta ├® recorrente (mensal)';


--
-- Name: cursos_exames; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cursos_exames (
    id uuid NOT NULL,
    nome character varying(255) NOT NULL,
    tipo public.enum_cursos_exames_tipo NOT NULL,
    carga_horaria integer,
    descricao text,
    requisitos text,
    certificadora character varying(255),
    ativo boolean DEFAULT true NOT NULL,
    codigo_sus character varying(20),
    valor_unitario numeric(10,2)
);


--
-- Name: custos_acoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.custos_acoes (
    id uuid NOT NULL,
    acao_id uuid NOT NULL,
    tipo_custo public.enum_custos_acoes_tipo_custo NOT NULL,
    descricao character varying(255) NOT NULL,
    valor numeric(10,2) NOT NULL,
    data_custo timestamp with time zone NOT NULL,
    comprovante_url character varying(255),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: COLUMN custos_acoes.comprovante_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.custos_acoes.comprovante_url IS 'URL do comprovante de despesa';


--
-- Name: estoque_caminhoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.estoque_caminhoes (
    id uuid NOT NULL,
    caminhao_id uuid NOT NULL,
    insumo_id uuid NOT NULL,
    quantidade integer DEFAULT 0 NOT NULL,
    ultima_atualizacao timestamp with time zone NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: COLUMN estoque_caminhoes.quantidade; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.estoque_caminhoes.quantidade IS 'Quantidade atual do insumo no caminh├úo';


--
-- Name: exames; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exames (
    id uuid NOT NULL,
    nome character varying(255) NOT NULL,
    tipo_exame character varying(255) NOT NULL,
    laboratorio_referencia character varying(255),
    instrucoes_preparo text,
    valores_referencia text,
    custo_base numeric(10,2),
    ativo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: COLUMN exames.tipo_exame; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.exames.tipo_exame IS 'Tipo do exame: sangue, urina, imagem, etc.';


--
-- Name: COLUMN exames.instrucoes_preparo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.exames.instrucoes_preparo IS 'Instru├º├Áes de preparo para o exame (ex: jejum de 12h)';


--
-- Name: COLUMN exames.valores_referencia; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.exames.valores_referencia IS 'Valores de refer├¬ncia normais para o exame';


--
-- Name: COLUMN exames.custo_base; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.exames.custo_base IS 'Custo base estimado do exame';


--
-- Name: funcionario_anotacoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.funcionario_anotacoes (
    id uuid NOT NULL,
    funcionario_id uuid NOT NULL,
    titulo character varying(200) NOT NULL,
    conteudo text NOT NULL,
    cor character varying(10) DEFAULT '#4682b4'::character varying NOT NULL,
    pinned boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: funcionarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.funcionarios (
    id uuid NOT NULL,
    nome character varying(255) NOT NULL,
    cargo character varying(255) NOT NULL,
    especialidade character varying(255),
    custo_diaria numeric(10,2) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    cpf character varying(14),
    telefone character varying(20),
    email character varying(255),
    ativo boolean DEFAULT true,
    is_medico boolean DEFAULT false NOT NULL,
    login_cpf character varying(20),
    senha character varying(255),
    crm character varying(30)
);


--
-- Name: inscricoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inscricoes (
    id uuid NOT NULL,
    cidadao_id uuid NOT NULL,
    acao_id uuid NOT NULL,
    curso_exame_id uuid,
    status character varying(255) DEFAULT 'pendente'::character varying NOT NULL,
    data_inscricao timestamp with time zone NOT NULL,
    observacoes text,
    campos_customizados jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    numero_prontuario character varying(50)
);


--
-- Name: instituicoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.instituicoes (
    id uuid NOT NULL,
    razao_social character varying(255) NOT NULL,
    cnpj character varying(18) NOT NULL,
    responsavel_nome character varying(255) NOT NULL,
    responsavel_email character varying(255) NOT NULL,
    responsavel_tel character varying(20) NOT NULL,
    endereco_completo text NOT NULL,
    campos_customizados jsonb DEFAULT '{}'::jsonb,
    ativo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: insumos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.insumos (
    id uuid NOT NULL,
    nome character varying(255) NOT NULL,
    descricao text,
    categoria public.enum_insumos_categoria DEFAULT 'OUTROS'::public.enum_insumos_categoria NOT NULL,
    unidade character varying(255) NOT NULL,
    quantidade_minima integer DEFAULT 0 NOT NULL,
    quantidade_atual integer DEFAULT 0 NOT NULL,
    preco_unitario numeric(10,2),
    codigo_barras character varying(100),
    lote character varying(100),
    data_validade timestamp with time zone,
    fornecedor character varying(200),
    nota_fiscal character varying(100),
    data_entrada timestamp with time zone,
    localizacao character varying(100),
    ativo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: COLUMN insumos.nome; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.insumos.nome IS 'Nome do insumo (ex: Luvas descart├íveis, M├íscaras N95)';


--
-- Name: COLUMN insumos.descricao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.insumos.descricao IS 'Descri├º├úo detalhada do insumo';


--
-- Name: COLUMN insumos.categoria; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.insumos.categoria IS 'Categoria do insumo';


--
-- Name: COLUMN insumos.unidade; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.insumos.unidade IS 'Unidade de medida: unidade, caixa, litro, kg, etc.';


--
-- Name: COLUMN insumos.quantidade_minima; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.insumos.quantidade_minima IS 'Quantidade m├¡nima para alerta de estoque baixo';


--
-- Name: COLUMN insumos.quantidade_atual; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.insumos.quantidade_atual IS 'Quantidade atual em estoque';


--
-- Name: COLUMN insumos.preco_unitario; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.insumos.preco_unitario IS 'Pre├ºo unit├írio m├®dio do insumo';


--
-- Name: COLUMN insumos.codigo_barras; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.insumos.codigo_barras IS 'C├│digo de barras do produto';


--
-- Name: COLUMN insumos.lote; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.insumos.lote IS 'N├║mero do lote';


--
-- Name: COLUMN insumos.data_validade; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.insumos.data_validade IS 'Data de validade do lote';


--
-- Name: COLUMN insumos.fornecedor; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.insumos.fornecedor IS 'Nome do fornecedor';


--
-- Name: COLUMN insumos.nota_fiscal; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.insumos.nota_fiscal IS 'N├║mero da nota fiscal de entrada';


--
-- Name: COLUMN insumos.data_entrada; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.insumos.data_entrada IS 'Data de entrada no estoque';


--
-- Name: COLUMN insumos.localizacao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.insumos.localizacao IS 'Localiza├º├úo f├¡sica no estoque (prateleira, setor)';


--
-- Name: manutencoes_caminhao; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.manutencoes_caminhao (
    id uuid NOT NULL,
    caminhao_id uuid NOT NULL,
    tipo character varying(255) DEFAULT 'preventiva'::character varying NOT NULL,
    titulo character varying(200) NOT NULL,
    descricao text,
    status character varying(255) DEFAULT 'agendada'::character varying NOT NULL,
    prioridade character varying(255) DEFAULT 'media'::character varying NOT NULL,
    km_atual integer,
    km_proximo integer,
    data_agendada date,
    data_conclusao date,
    custo_estimado numeric(10,2),
    custo_real numeric(10,2),
    fornecedor character varying(200),
    responsavel character varying(200),
    observacoes text,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    status_pagamento character varying(10) DEFAULT 'pendente'::character varying
);


--
-- Name: movimentacoes_estoque; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.movimentacoes_estoque (
    id uuid NOT NULL,
    insumo_id uuid NOT NULL,
    tipo public.enum_movimentacoes_estoque_tipo NOT NULL,
    quantidade integer NOT NULL,
    quantidade_anterior integer NOT NULL,
    quantidade_atual integer NOT NULL,
    origem character varying(100),
    destino character varying(100),
    caminhao_id uuid,
    acao_id uuid,
    motorista_id uuid,
    nota_fiscal character varying(100),
    data_movimento timestamp with time zone NOT NULL,
    observacoes text,
    usuario_id uuid,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: COLUMN movimentacoes_estoque.tipo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.movimentacoes_estoque.tipo IS 'Tipo de movimenta├º├úo do estoque';


--
-- Name: COLUMN movimentacoes_estoque.quantidade; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.movimentacoes_estoque.quantidade IS 'Quantidade movimentada';


--
-- Name: COLUMN movimentacoes_estoque.quantidade_anterior; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.movimentacoes_estoque.quantidade_anterior IS 'Quantidade antes da movimenta├º├úo';


--
-- Name: COLUMN movimentacoes_estoque.quantidade_atual; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.movimentacoes_estoque.quantidade_atual IS 'Quantidade ap├│s a movimenta├º├úo';


--
-- Name: COLUMN movimentacoes_estoque.origem; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.movimentacoes_estoque.origem IS 'Origem (CAPITAL, caminhao_id, acao_id)';


--
-- Name: COLUMN movimentacoes_estoque.destino; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.movimentacoes_estoque.destino IS 'Destino (CAPITAL, caminhao_id, acao_id)';


--
-- Name: COLUMN movimentacoes_estoque.nota_fiscal; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.movimentacoes_estoque.nota_fiscal IS 'N├║mero da nota fiscal relacionada';


--
-- Name: COLUMN movimentacoes_estoque.usuario_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.movimentacoes_estoque.usuario_id IS 'ID do usu├írio que realizou a movimenta├º├úo';


--
-- Name: noticias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.noticias (
    id uuid NOT NULL,
    titulo character varying(255) NOT NULL,
    conteudo text NOT NULL,
    imagem_url character varying(255),
    acao_id uuid,
    destaque boolean DEFAULT false NOT NULL,
    data_publicacao timestamp with time zone NOT NULL,
    campos_customizados jsonb DEFAULT '{}'::jsonb,
    ativo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: notificacoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notificacoes (
    id uuid NOT NULL,
    acao_id uuid,
    tipo public.enum_notificacoes_tipo NOT NULL,
    template text NOT NULL,
    destinatarios_filtro jsonb DEFAULT '{}'::jsonb,
    agendamento timestamp with time zone,
    status public.enum_notificacoes_status DEFAULT 'agendada'::public.enum_notificacoes_status NOT NULL,
    estatisticas jsonb DEFAULT '{"falhas": 0, "enviados": 0, "entregues": 0}'::jsonb,
    sent_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL
);


--
-- Name: pontos_medicos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pontos_medicos (
    id uuid NOT NULL,
    funcionario_id uuid NOT NULL,
    acao_id uuid,
    data_hora_entrada timestamp with time zone NOT NULL,
    data_hora_saida timestamp with time zone,
    horas_trabalhadas numeric(5,2),
    status public.enum_pontos_medicos_status DEFAULT 'trabalhando'::public.enum_pontos_medicos_status NOT NULL,
    observacoes text,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: COLUMN pontos_medicos.horas_trabalhadas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.pontos_medicos.horas_trabalhadas IS 'Total de horas trabalhadas no turno (calculado na sa├¡da)';


--
-- Name: resultados_exames; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.resultados_exames (
    id uuid NOT NULL,
    inscricao_id uuid NOT NULL,
    exame_id uuid NOT NULL,
    cidadao_id uuid NOT NULL,
    acao_id uuid NOT NULL,
    data_realizacao timestamp with time zone NOT NULL,
    resultado text,
    arquivo_resultado_url character varying(255),
    observacoes text,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    numero_laudo character varying(50),
    data_emissao_laudo timestamp with time zone
);


--
-- Name: COLUMN resultados_exames.resultado; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.resultados_exames.resultado IS 'Resultado textual do exame';


--
-- Name: COLUMN resultados_exames.arquivo_resultado_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.resultados_exames.arquivo_resultado_url IS 'URL do arquivo PDF com o resultado completo';


--
-- Data for Name: SequelizeMeta; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SequelizeMeta" (name) FROM stdin;
\.


--
-- Data for Name: abastecimentos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.abastecimentos (id, acao_id, caminhao_id, data_abastecimento, litros, valor_total, preco_por_litro, observacoes, created_at, updated_at) FROM stdin;
441e2b16-f455-4a2b-accf-fd884a8aa251	a5695469-45ec-41a0-ab7f-14f5447a93de	6e0bba4d-29c3-43d4-8e6d-02ad332f3683	2026-02-08 00:00:00+00	50.00	300.00	6.000		2026-02-08 18:52:54.888+00	2026-02-08 18:52:54.888+00
7a927b36-290b-48ef-85e4-2283f169e2e6	a5695469-45ec-41a0-ab7f-14f5447a93de	6e0bba4d-29c3-43d4-8e6d-02ad332f3683	2026-02-08 00:00:00+00	50.00	300.00	6.000		2026-02-08 22:42:23.167+00	2026-02-08 22:42:23.167+00
eac6c443-280c-4f3f-b03f-f4853d9a9ff2	53df1c14-a0b7-49ed-9292-607e4f17b15e	6e0bba4d-29c3-43d4-8e6d-02ad332f3683	2026-02-09 00:00:00+00	50.00	300.00	6.000		2026-02-09 16:10:52.116+00	2026-02-09 16:10:52.116+00
\.


--
-- Data for Name: acao_caminhoes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.acao_caminhoes (id, acao_id, caminhao_id, created_at, updated_at) FROM stdin;
2a482724-f033-428a-9f18-a16311b89c7f	a5695469-45ec-41a0-ab7f-14f5447a93de	6e0bba4d-29c3-43d4-8e6d-02ad332f3683	2026-02-08 17:20:07.51+00	2026-02-08 17:20:07.51+00
bf925be5-de0b-4b14-88b3-32c6539b730d	53df1c14-a0b7-49ed-9292-607e4f17b15e	6e0bba4d-29c3-43d4-8e6d-02ad332f3683	2026-02-09 16:10:37.605+00	2026-02-09 16:10:37.605+00
96daba6f-884a-42b6-a4da-53a2accf0f42	e224b611-c6f4-421a-80a9-40ec63f654ff	6e0bba4d-29c3-43d4-8e6d-02ad332f3683	2026-02-09 20:22:53.958+00	2026-02-09 20:22:53.958+00
316250ca-3848-4ce1-ba86-eb7b7d1d3dc5	b1131d02-3ea1-4da3-b856-e498390bc46a	6e0bba4d-29c3-43d4-8e6d-02ad332f3683	2026-02-22 19:43:47.959+00	2026-02-22 19:43:47.959+00
\.


--
-- Data for Name: acao_curso_exame; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.acao_curso_exame (id, acao_id, curso_exame_id, vagas, created_at, updated_at, periodicidade_meses, dias_aviso_vencimento, permitir_repeticao) FROM stdin;
7a40c52c-4c27-49d8-991e-3a71946b368d	53df1c14-a0b7-49ed-9292-607e4f17b15e	be4727af-2919-40a8-8284-e827b41eb93d	100	2026-02-07 19:39:00.638+00	2026-02-07 19:39:00.638+00	\N	30	t
3ad4c181-6423-4176-bfa3-b72824e01e10	0d56a264-3f0e-4ae6-a143-757fbe8ec71c	be4727af-2919-40a8-8284-e827b41eb93d	50	2026-02-07 20:47:36.495+00	2026-02-07 20:47:36.495+00	\N	30	t
e820167a-58f2-4539-bf30-0f10760ced7f	13fcfd57-07c6-418e-a130-f4ff0cf9095d	be4727af-2919-40a8-8284-e827b41eb93d	18	2026-02-08 16:37:43.364+00	2026-02-08 16:37:43.364+00	\N	30	t
1e835ad3-e02e-44a5-a5b6-33b91527490b	a5695469-45ec-41a0-ab7f-14f5447a93de	be4727af-2919-40a8-8284-e827b41eb93d	10	2026-02-08 17:03:49.193+00	2026-02-08 17:03:49.193+00	\N	30	t
4569cda5-9b18-4028-a107-95dff75c7083	e224b611-c6f4-421a-80a9-40ec63f654ff	8770c188-5c28-442c-92b8-b3e3c9ccf2a3	5	2026-02-09 20:22:19.374+00	2026-02-09 20:22:19.374+00	\N	30	t
2db4eecf-24db-4364-916f-51823f9f0872	e224b611-c6f4-421a-80a9-40ec63f654ff	be4727af-2919-40a8-8284-e827b41eb93d	4	2026-02-09 20:22:19.374+00	2026-02-09 20:22:19.374+00	\N	30	t
403fd6e8-1b37-4f57-be46-7f787fa7a213	53df1c14-a0b7-49ed-9292-607e4f17b15e	8770c188-5c28-442c-92b8-b3e3c9ccf2a3	10	2026-02-12 19:00:55.173+00	2026-02-12 19:00:55.173+00	\N	30	t
95d78c9e-eedf-46c4-9771-4d3b22fa479d	13fcfd57-07c6-418e-a130-f4ff0cf9095d	8770c188-5c28-442c-92b8-b3e3c9ccf2a3	10	2026-02-21 20:22:36.999+00	2026-02-21 20:22:36.999+00	\N	30	t
5797de35-8410-4423-ac98-787683ba44c9	b1131d02-3ea1-4da3-b856-e498390bc46a	be4727af-2919-40a8-8284-e827b41eb93d	20	2026-02-22 19:43:35.763+00	2026-02-22 19:43:35.763+00	\N	30	t
\.


--
-- Data for Name: acao_funcionarios; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.acao_funcionarios (id, acao_id, funcionario_id, created_at, updated_at, valor_diaria, dias_trabalhados) FROM stdin;
cb8b8e57-d86c-4287-b197-adcb4828c21b	a5695469-45ec-41a0-ab7f-14f5447a93de	8c4c4416-1e09-4000-b595-65f1b9f6e9de	2026-02-09 16:25:52.382+00	2026-02-09 16:25:58.132+00	200.00	2
1cee335a-2928-44cd-840a-d9e548faaa84	13fcfd57-07c6-418e-a130-f4ff0cf9095d	ccd3a81c-da61-4856-b769-7f8009b8761e	2026-02-09 16:26:28.726+00	2026-02-09 16:26:34.756+00	150.00	2
ebea7685-7a67-45c7-ac22-830dce3af3c3	13fcfd57-07c6-418e-a130-f4ff0cf9095d	6dba833e-0ceb-444a-84dc-7cf27e542145	2026-02-09 16:27:32.983+00	2026-02-09 16:27:46.421+00	600.00	1
2ba3369e-0733-4250-b5f3-23c2fa2bcc30	0d56a264-3f0e-4ae6-a143-757fbe8ec71c	8c4c4416-1e09-4000-b595-65f1b9f6e9de	2026-02-09 16:27:58.456+00	2026-02-09 16:27:58.456+00	200.00	4
7210cbc7-4869-4ef3-b022-004b356e71e3	e224b611-c6f4-421a-80a9-40ec63f654ff	6dba833e-0ceb-444a-84dc-7cf27e542145	2026-02-09 20:26:24.128+00	2026-02-09 20:26:36.813+00	600.00	2
0b36c3a7-65b5-4d18-8048-f85aabe9c6d7	b1131d02-3ea1-4da3-b856-e498390bc46a	8c4c4416-1e09-4000-b595-65f1b9f6e9de	2026-02-22 19:43:55.055+00	2026-02-22 19:43:55.055+00	200.00	2
93708b44-ea57-477f-8491-bcc53153dffd	b1131d02-3ea1-4da3-b856-e498390bc46a	6dba833e-0ceb-444a-84dc-7cf27e542145	2026-02-22 22:13:22.313+00	2026-02-22 22:13:22.313+00	600.00	2
67a8392e-5d5e-4cfc-9a96-c2d5ec5d2856	13fcfd57-07c6-418e-a130-f4ff0cf9095d	8c4c4416-1e09-4000-b595-65f1b9f6e9de	2026-02-23 23:36:31.408+00	2026-02-23 23:37:01.278+00	200.00	13
9d294669-f04e-49cf-a6db-170d132492f2	b1131d02-3ea1-4da3-b856-e498390bc46a	ccd3a81c-da61-4856-b769-7f8009b8761e	2026-02-23 23:37:31.407+00	2026-02-23 23:37:31.407+00	150.00	2
2256c8d8-c51b-495e-be1b-e275b0166163	53df1c14-a0b7-49ed-9292-607e4f17b15e	ccd3a81c-da61-4856-b769-7f8009b8761e	2026-02-23 23:44:20.668+00	2026-02-23 23:44:36.449+00	150.00	2
340be89e-ec6b-4001-b44e-806878fc40f3	53df1c14-a0b7-49ed-9292-607e4f17b15e	8c4c4416-1e09-4000-b595-65f1b9f6e9de	2026-02-09 16:04:01.652+00	2026-02-23 23:44:39.576+00	200.00	5
4c84cf50-4ed8-47c2-827b-97125ef9fbe4	53df1c14-a0b7-49ed-9292-607e4f17b15e	6dba833e-0ceb-444a-84dc-7cf27e542145	2026-02-23 23:36:02.921+00	2026-02-23 23:45:13.844+00	600.00	6
092de00d-3a1b-4bfd-b02e-e0ed5f9ae5e3	e224b611-c6f4-421a-80a9-40ec63f654ff	8c4c4416-1e09-4000-b595-65f1b9f6e9de	2026-02-26 02:14:57.76+00	2026-02-26 02:14:57.76+00	200.00	248
\.


--
-- Data for Name: acoes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.acoes (id, numero_acao, instituicao_id, tipo, municipio, estado, data_inicio, data_fim, status, descricao, local_execucao, vagas_disponiveis, distancia_km, preco_combustivel_referencia, campos_customizados, created_at, updated_at, permitir_inscricao_previa, nome, numero_processo, lote_regiao, numero_cnes, responsavel_tecnico_id, meta_mensal_total, intercorrencias) FROM stdin;
0d56a264-3f0e-4ae6-a143-757fbe8ec71c	2	d2120645-e88f-4c12-a31c-0f60c2ddacbe	saude	Sao Luis	MA	2026-02-06	2026-02-09	planejada		Renascen├ºa	50	1000	7.000	{}	2026-02-07 20:47:36.444+00	2026-02-07 20:47:36.444+00	t	Campanha de Exame de Vista	\N	\N	\N	\N	\N	\N
53df1c14-a0b7-49ed-9292-607e4f17b15e	1	d2120645-e88f-4c12-a31c-0f60c2ddacbe	saude	Sao Luis	MA	2026-02-06	2026-02-09	ativa		Renascen├ºa	110	100	6.000	{}	2026-02-07 19:39:00.584+00	2026-02-12 19:00:45.718+00	f	Campanha de Hemograma	\N	\N	\N	\N	\N	\N
b1131d02-3ea1-4da3-b856-e498390bc46a	6	d2120645-e88f-4c12-a31c-0f60c2ddacbe	saude	Raposa	MA	2026-02-21	2026-02-22	planejada		Hospital Raposa	10	20	6.000	{}	2026-02-22 19:43:34.975+00	2026-02-22 19:43:34.975+00	t	Campanha Raposa	\N	\N	\N	\N	\N	\N
13fcfd57-07c6-418e-a130-f4ff0cf9095d	3	d2120645-e88f-4c12-a31c-0f60c2ddacbe	saude	Sao Luis	MA	2026-05-03	2026-06-04	planejada		Renascen├ºa	45	500	6.000	{}	2026-02-08 16:37:43.308+00	2026-02-22 22:12:25.142+00	t	Campanha de Hemograma	\N	\N	\N	\N	\N	\N
a5695469-45ec-41a0-ab7f-14f5447a93de	4	d2120645-e88f-4c12-a31c-0f60c2ddacbe	saude	Sao Luis	MA	2026-05-04	2026-08-04	planejada	teste	Renascen├ºa	200	500	6.000	{}	2026-02-08 17:03:49.171+00	2026-02-22 22:12:32.722+00	t	Campanha de Hemograma	\N	\N	\N	\N	\N	\N
e224b611-c6f4-421a-80a9-40ec63f654ff	5	d2120645-e88f-4c12-a31c-0f60c2ddacbe	saude	Buriticupu	MA	2026-02-09	2026-10-14	planejada		Renascen├ºa	50	200	6.000	{}	2026-02-09 20:22:19.303+00	2026-02-22 22:12:50.272+00	t	campanha buriticupu	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: acoes_insumos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.acoes_insumos (id, acao_id, insumo_id, quantidade_planejada, quantidade_levada, quantidade_utilizada, quantidade_retornada, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: atendimentos_medicos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.atendimentos_medicos (id, funcionario_id, acao_id, cidadao_id, ponto_id, hora_inicio, hora_fim, duracao_minutos, status, observacoes, nome_paciente, created_at, updated_at) FROM stdin;
75132e4d-0be2-420c-8ff7-106790af306a	8c4c4416-1e09-4000-b595-65f1b9f6e9de	53df1c14-a0b7-49ed-9292-607e4f17b15e	5809ccee-2a55-4cf0-9368-e327d8c578b5	34ae3031-3d21-4d4c-af3b-ef56b4a9e72a	2026-02-22 20:16:23.813+00	2026-02-22 20:16:42.883+00	1	concluido	Paciente com dor de cabe├ºa	Concei├ºao de Maria	2026-02-22 20:16:23.814+00	2026-02-22 20:16:42.883+00
054f63d8-a94c-4254-bb17-dae3b7b2cd49	8c4c4416-1e09-4000-b595-65f1b9f6e9de	a5695469-45ec-41a0-ab7f-14f5447a93de	d27c86e1-4249-4bfa-b678-223942b73224	1962fbcd-8a6c-4940-a64b-156aa131c849	2026-02-22 20:17:48.769+00	2026-02-22 20:17:54.447+00	1	concluido		joao baluz	2026-02-22 20:17:48.77+00	2026-02-22 20:17:54.447+00
07586e19-0a45-47a2-849c-764eb688cc61	8c4c4416-1e09-4000-b595-65f1b9f6e9de	53df1c14-a0b7-49ed-9292-607e4f17b15e	\N	1962fbcd-8a6c-4940-a64b-156aa131c849	2026-02-22 20:18:09.652+00	2026-02-22 20:18:13.021+00	\N	cancelado		jao	2026-02-22 20:18:09.653+00	2026-02-22 20:18:13.021+00
f2c6c62a-1d3e-437b-83e6-0349dae098b7	8c4c4416-1e09-4000-b595-65f1b9f6e9de	b1131d02-3ea1-4da3-b856-e498390bc46a	5ebd04d7-764d-45af-a527-c93384ccabe9	dc56a975-edf6-4b7a-acf9-645b8ec46728	2026-02-22 21:40:17.033+00	2026-02-22 21:41:36.56+00	1	concluido		Giovanna Fecury	2026-02-22 21:40:17.034+00	2026-02-22 21:41:36.561+00
c83073cb-d9ff-4375-a839-a70a19c659c6	8c4c4416-1e09-4000-b595-65f1b9f6e9de	53df1c14-a0b7-49ed-9292-607e4f17b15e	021f1eef-00ca-400c-9762-4f39ab0ea173	bebab502-7ad3-4e4c-8bb0-0bc91614069b	2026-02-23 22:34:11.818+00	2026-02-23 22:35:11.458+00	1	concluido		Jo├úo Gabriel Diniz	2026-02-23 22:34:11.818+00	2026-02-23 22:35:11.458+00
44a6bad1-4a9e-4f1e-b058-7f280adbaf24	8c4c4416-1e09-4000-b595-65f1b9f6e9de	13fcfd57-07c6-418e-a130-f4ff0cf9095d	d27c86e1-4249-4bfa-b678-223942b73224	eea5c565-8d03-4dd0-a863-e95921880667	2026-02-24 00:12:19.094+00	2026-02-24 00:22:13.605+00	10	concluido		joao baluz	2026-02-24 00:12:19.095+00	2026-02-24 00:22:13.606+00
0f976e5a-bde5-460f-8bd7-0a7e534248be	8c4c4416-1e09-4000-b595-65f1b9f6e9de	53df1c14-a0b7-49ed-9292-607e4f17b15e	5809ccee-2a55-4cf0-9368-e327d8c578b5	eea5c565-8d03-4dd0-a863-e95921880667	2026-02-24 00:43:29.461+00	2026-02-24 00:43:56.077+00	1	concluido	\N	\N	2026-02-24 00:43:29.461+00	2026-02-24 00:43:56.078+00
7d4f4e43-54c7-40cb-a3fa-46e9041cbff6	8c4c4416-1e09-4000-b595-65f1b9f6e9de	\N	\N	eea5c565-8d03-4dd0-a863-e95921880667	2026-02-24 00:21:58.613+00	\N	\N	aguardando	\N	Jo├úo Gabriel	2026-02-24 00:21:58.614+00	2026-02-24 00:21:58.614+00
c50a1a68-dece-4e98-a17e-2b381fefa567	8c4c4416-1e09-4000-b595-65f1b9f6e9de	e224b611-c6f4-421a-80a9-40ec63f654ff	021f1eef-00ca-400c-9762-4f39ab0ea173	ab978267-4108-43cb-9410-bfe092c8d146	2026-02-24 01:24:25.814+00	2026-02-24 01:25:36.402+00	1	concluido		Jo├úo Gabriel Diniz	2026-02-24 01:24:25.815+00	2026-02-24 01:25:36.402+00
e396e3e5-66f6-41ef-a5ab-81773755a1d1	8c4c4416-1e09-4000-b595-65f1b9f6e9de	13fcfd57-07c6-418e-a130-f4ff0cf9095d	021f1eef-00ca-400c-9762-4f39ab0ea173	f0ec7491-0b78-4d52-b7b3-78d2ac5d4e92	2026-02-24 04:03:14.029+00	\N	\N	cancelado		Jo├úo Gabriel Diniz	2026-02-24 04:03:14.029+00	2026-02-24 04:03:38.603+00
\.


--
-- Data for Name: caminhoes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.caminhoes (id, placa, modelo, ano, km_por_litro, capacidade_litros, status, created_at, updated_at) FROM stdin;
6e0bba4d-29c3-43d4-8e6d-02ad332f3683	XHL-1012	wolks	2014	8.50	80	em_acao	2026-02-08 17:06:41.912+00	2026-02-21 21:14:38.363+00
a5efd07f-12cf-4289-a55f-fb758ebdec53	trv-5232	FORD	2026	8.00	110	em_manutencao	2026-02-08 14:05:30.406+00	2026-02-21 21:38:45.455+00
\.


--
-- Data for Name: cidadaos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cidadaos (id, cpf, nome_completo, data_nascimento, telefone, email, senha, tipo, municipio, estado, cep, rua, numero, complemento, bairro, campos_customizados, consentimento_lgpd, data_consentimento, ip_consentimento, reset_password_token, reset_password_expires, foto_perfil, created_at, updated_at, cartao_sus, raca, genero, nome_mae) FROM stdin;
c4076994-4fa1-40ba-9123-b697c7bc2ae5	000.000.000-00	Administrador do Sistema	1989-12-31	(00) 00000-0000	admin@sistemacarretas.com	$2b$10$XonP.sI2QulrH.GpcUzJ5exNXtweEumBGsAW0BtDwE4oyg4f92Mui	admin	S├úo Lu├¡s	MA	\N	\N	\N	\N	\N	{}	t	2026-02-06 17:54:41.7+00	127.0.0.1	\N	\N	\N	2026-02-06 17:54:41.713+00	2026-02-09 19:50:54.238+00	\N	\N	masculino	\N
00ac8f50-e95e-4312-9b07-28fb94d6ac2e	111.111.111-11	Administrador do Sistema	1989-12-31	(98) 98888-8888	admin@sistemacarretas.com	$2b$10$9zrhSyUDDLB6HlH1JKZB5uug1wSbE6/FqHC4wqdNA4HLViNV.5DuK	admin	S├úo Lu├¡s	MA	\N	\N	\N	\N	\N	{}	t	2026-02-06 18:23:13.848+00	127.0.0.1	\N	\N	\N	2026-02-06 18:23:13.86+00	2026-02-09 19:50:54.379+00	\N	\N	masculino	\N
d27c86e1-4249-4bfa-b678-223942b73224	012.192.083-61	joao baluz	1993-05-06	98982450008	joaobaluz@gmail.com	$2a$10$jZ7XU1kHoXFEayAB0Mgwje.qx9mTFO1bJ9c6DGMsV6dFzJwsRTnbW	cidadao	S├úo Lu├¡s	MA	665065410	\N	2	jardiomi paulista	olho d'agua	{}	f	\N	\N	745109fc6996898b9c93b96f4b72d31731078b7d	2026-02-12 21:17:42.266+00	/uploads/perfil/perfil-1770903187459-477146419.png	2026-02-09 16:35:55.52+00	2026-02-12 20:17:42.266+00	\N	branca	masculino	rita baluz
5809ccee-2a55-4cf0-9368-e327d8c578b5	198.983.012-53	Concei├ºao de Maria	1964-01-20	98987272826	citadiniz@hotmail.com	123456	cidadao	S├úo Luis	MA	01220000	Rua bento freitas	12		Republica	{}	f	\N	\N	\N	\N	\N	2026-02-09 17:01:14.676+00	2026-02-09 19:50:54.386+00	\N	parda	feminino	Cleonice
021f1eef-00ca-400c-9762-4f39ab0ea173	008.953.993-18	Jo├úo Gabriel Diniz	2001-07-23	98987272826	joaogabrieldiniz23@gmail.com	1234556	cidadao	S├úo Paulo	SP	01220000	Rua bento freitas	12	ap 401	Republica	{}	f	\N	\N	\N	\N	\N	2026-02-09 16:52:29.49+00	2026-02-09 19:58:02.179+00	\N	parda	masculino	Concei├ºao
c2b582f1-027b-4402-987c-870637f8a291	123.456.789-09	Administrador System Truck	1989-12-31	(98) 98888-8888	admin@systemtruck.com	$2b$10$YvCXfT9O/8CWbnwICjSw4.aptyXO/chu43dUumRHOtSrNKklB0yRK	admin	S├úo Lu├¡s	MA	\N	\N	\N	\N	\N	{}	t	2026-02-06 18:26:56.655+00	127.0.0.1	\N	\N	/uploads/perfil/admin-1770753881684-749683646.jpg	2026-02-06 18:26:56.67+00	2026-02-10 20:04:41.688+00	\N	\N	feminino	\N
5ebd04d7-764d-45af-a527-c93384ccabe9	605.022.853-11	Giovanna Fecury	2001-08-02	98987272826	giovannafecy@gmail.com	123456	cidadao	S├úo Paulo	MA	01220000	Rua Bento Freitas 	420		Republica	{}	f	\N	\N	\N	\N	\N	2026-02-22 19:46:24.388+00	2026-02-22 22:05:29.904+00	\N	preta	masculino	Hilzi Oliveira
\.


--
-- Data for Name: configuracoes_campo; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.configuracoes_campo (id, entidade, nome_campo, tipo, obrigatorio, mascara, validacao_regex, opcoes, ordem_exibicao, ativo) FROM stdin;
\.


--
-- Data for Name: contas_pagar; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.contas_pagar (id, tipo_conta, descricao, valor, data_vencimento, data_pagamento, status, comprovante_url, recorrente, observacoes, created_at, updated_at, tipo_espontaneo, acao_id, cidade, caminhao_id) FROM stdin;
2bbd298e-7e39-44cd-b924-fda7e0e162e6	pneu_furado		100.00	2026-02-04 00:00:00+00	\N	paga	\N	f		2026-02-08 16:46:30.477+00	2026-02-08 16:46:30.477+00	\N	\N	\N	\N
7a039957-6ec4-4a3b-8086-90569babc0c8	pneu_furado	pneu furou indo para imperatriz na br	500.00	2026-02-09 00:00:00+00	\N	paga	\N	f	teste	2026-02-08 16:50:36.817+00	2026-02-08 16:50:36.817+00	\N	\N	\N	\N
a403864a-8c9f-49ed-a574-a286ae512678	energia		50.00	2026-02-01 00:00:00+00	\N	vencida	\N	f		2026-02-08 17:04:41.862+00	2026-02-08 17:04:41.862+00	\N	\N	\N	\N
54f2fcd3-7ebe-4257-806f-a13d89d81d3d	abastecimento	Abastecimento XHL-1012 - 50.00L	300.00	2026-02-08 00:00:00+00	2026-02-08 00:00:00+00	paga	\N	f	\N	2026-02-08 18:52:54.912+00	2026-02-08 18:52:54.912+00	\N	a5695469-45ec-41a0-ab7f-14f5447a93de	\N	6e0bba4d-29c3-43d4-8e6d-02ad332f3683
574bb34e-0287-4c26-a9af-6699fb235f8a	espontaneo	pneu furado	100.00	2026-02-07 00:00:00+00	\N	pendente	\N	f	\N	2026-02-08 22:33:07.657+00	2026-02-08 22:33:07.657+00	\N	\N	\N	\N
449c7dca-5306-4a03-8667-9e35a29b1965	espontaneo	pneu furado	500.00	2026-06-07 00:00:00+00	\N	pendente	\N	f	\N	2026-02-08 22:42:11.907+00	2026-02-08 22:42:11.907+00	\N	\N	\N	\N
280a2b8e-34b7-43ea-b7d2-e2ca858daf4d	abastecimento	Abastecimento XHL-1012 - 50.00L	300.00	2026-02-08 00:00:00+00	2026-02-08 00:00:00+00	paga	\N	f	\N	2026-02-08 22:42:23.187+00	2026-02-08 22:42:23.187+00	\N	a5695469-45ec-41a0-ab7f-14f5447a93de	\N	6e0bba4d-29c3-43d4-8e6d-02ad332f3683
54fb47ac-80d0-401f-8c01-5140cba45167	espontaneo	penu furaado	200.00	2026-02-09 00:00:00+00	\N	pendente	\N	f	\N	2026-02-08 22:53:32.456+00	2026-02-08 22:53:32.456+00	\N	\N	\N	\N
4e2c9c4b-02fd-42c8-840d-2038b90b873e	espontaneo	Pneu Furado	150.00	2026-02-08 00:00:00+00	\N	pendente	\N	f	\N	2026-02-09 14:50:29.497+00	2026-02-09 14:50:29.497+00	\N	\N	\N	\N
570052ef-228d-44a2-9ff8-5eb772b06352	espontaneo	Troca de Oleo 	250.00	2026-02-08 00:00:00+00	\N	pendente	\N	f	\N	2026-02-09 14:58:05.468+00	2026-02-09 14:58:05.468+00	\N	\N	\N	\N
c0815faa-5426-4d46-a418-14fafbfd78d0	espontaneo	Reboque	1000.00	2026-02-08 00:00:00+00	\N	pendente	\N	f	\N	2026-02-09 14:58:48.869+00	2026-02-09 14:58:48.869+00	\N	\N	\N	\N
39ba9101-2bdd-4449-9708-e7b9945aa48c	espontaneo	CUSTO ALIMENTA├çAO	200.00	2026-02-08 00:00:00+00	\N	pendente	\N	f	\N	2026-02-09 15:04:53.209+00	2026-02-09 15:04:53.209+00	\N	\N	\N	\N
20580fce-76a5-4d4f-a512-ab7785f213e3	espontaneo	Troca de Oleo 2	100.00	2026-02-09 00:00:00+00	\N	pendente	\N	f	\N	2026-02-09 15:08:21.934+00	2026-02-09 15:08:21.934+00	\N	\N	\N	\N
d7058d81-d327-4116-ad77-93a321ee63fd	espontaneo	Pneu 4 	200.00	2026-02-09 15:00:00+00	\N	pendente	\N	f	\N	2026-02-09 15:17:02.388+00	2026-02-09 15:17:02.388+00	\N	\N	\N	\N
8fd10117-a3c5-4725-a0b7-11936e2d28f7	espontaneo	Pneu 01	150.00	2026-02-09 15:00:00+00	\N	pendente	\N	f	\N	2026-02-09 15:19:54.602+00	2026-02-09 15:19:54.602+00	\N	\N	\N	\N
dac4bd0d-2b08-4f88-a7bc-c7fa3058d17e	espontaneo	pneu 3	100.00	2026-02-09 15:00:00+00	\N	pendente	\N	f	\N	2026-02-09 15:23:32.726+00	2026-02-09 15:23:32.726+00	\N	\N	\N	\N
0f787b67-1757-44e8-8592-01414f410776	espontaneo	pneu 3 	100.00	2026-02-09 15:00:00+00	\N	pendente	\N	f	\N	2026-02-09 15:25:48.798+00	2026-02-09 15:25:48.798+00	\N	53df1c14-a0b7-49ed-9292-607e4f17b15e	Sao Luis	\N
fa6dda4e-c363-479a-a2e7-7e8b979ca5c5	espontaneo	pneu 6	100.00	2026-02-09 15:00:00+00	\N	pendente	\N	f	\N	2026-02-09 15:56:06.566+00	2026-02-09 15:56:06.566+00	\N	53df1c14-a0b7-49ed-9292-607e4f17b15e	Sao Luis	\N
683de0eb-ef60-47c9-8fc0-6266db2dec89	abastecimento	Abastecimento XHL-1012 - 50.00L	300.00	2026-02-09 00:00:00+00	2026-02-09 00:00:00+00	paga	\N	f	\N	2026-02-09 16:10:52.137+00	2026-02-09 16:10:52.137+00	\N	53df1c14-a0b7-49ed-9292-607e4f17b15e	\N	6e0bba4d-29c3-43d4-8e6d-02ad332f3683
8f1eadb0-f7e6-4ffe-abb8-333d10639e4f	espontaneo	penu furado 8	100.00	2026-02-09 15:00:00+00	\N	pendente	\N	f	\N	2026-02-09 16:20:03.407+00	2026-02-09 16:20:03.407+00	\N	a5695469-45ec-41a0-ab7f-14f5447a93de	Sao Luis	\N
86890639-f220-411b-9546-b7711739b7b5	funcionario	Funcion├írio: Jo├úo Baluz - A├º├úo 4	18600.00	2026-08-04 15:00:00+00	\N	pendente	\N	f	Custo di├írio: R$ 200.00 ├ù 93 dias	2026-02-09 16:25:52.385+00	2026-02-09 16:25:52.385+00	\N	a5695469-45ec-41a0-ab7f-14f5447a93de	Sao Luis	\N
07e8233a-ac0c-49f3-9146-d53f6cf58190	funcionario	Funcion├írio: gabriel diniz - A├º├úo 3	4950.00	2026-06-04 15:00:00+00	\N	pendente	\N	f	Custo di├írio: R$ 150.00 ├ù 33 dias	2026-02-09 16:26:28.73+00	2026-02-09 16:26:28.73+00	\N	13fcfd57-07c6-418e-a130-f4ff0cf9095d	Sao Luis	\N
07502332-ab09-433c-9897-bf66081abf4b	funcionario	Funcion├írio: Ronaldo - A├º├úo 3	19800.00	2026-06-04 15:00:00+00	\N	pendente	\N	f	Custo di├írio: R$ 600.00 ├ù 33 dias	2026-02-09 16:27:32.986+00	2026-02-09 16:27:32.986+00	\N	13fcfd57-07c6-418e-a130-f4ff0cf9095d	Sao Luis	\N
23665d66-70df-499f-aae2-277e0dcf4487	funcionario	Funcion├írio: Jo├úo Baluz - A├º├úo 2	800.00	2026-02-09 15:00:00+00	\N	pendente	\N	f	Custo di├írio: R$ 200.00 ├ù 4 dias	2026-02-09 16:27:58.458+00	2026-02-09 16:27:58.458+00	\N	0d56a264-3f0e-4ae6-a143-757fbe8ec71c	Sao Luis	\N
3f7278cb-cc39-4b95-b6b5-9f39f9f1804f	funcionario	Funcion├írio: Ronaldo - A├º├úo 5	148800.00	2026-10-14 15:00:00+00	\N	pendente	\N	f	Custo di├írio: R$ 600.00 ├ù 248 dias	2026-02-09 20:26:24.139+00	2026-02-09 20:26:24.139+00	\N	e224b611-c6f4-421a-80a9-40ec63f654ff	Sao Luis	\N
61fa75a8-1dbf-4b15-bb8d-80baa45de81a	espontaneo	pneu furou	100.00	2026-02-09 15:00:00+00	\N	pendente	\N	f	\N	2026-02-09 20:27:05.223+00	2026-02-09 20:27:05.223+00	\N	e224b611-c6f4-421a-80a9-40ec63f654ff	Sao Luis	\N
15617de1-a159-4608-83ac-30d14a4c6d70	manutencao	Manuten├º├úo: Troca de ├ôleo 	600.00	2026-02-22 15:00:00+00	\N	pendente	\N	f	\N	2026-02-21 21:05:42.389+00	2026-02-21 21:05:42.389+00	\N	\N	\N	6e0bba4d-29c3-43d4-8e6d-02ad332f3683
7cd33a72-7074-4b72-9320-03b706526f64	manutencao	Manuten├º├úo: Troca de ├ôleo 	500.00	2026-02-19 15:00:00+00	2026-02-21 21:38:53.993+00	paga	\N	f	\N	2026-02-21 21:04:00.873+00	2026-02-21 21:38:53.993+00	\N	\N	\N	a5efd07f-12cf-4289-a55f-fb758ebdec53
17c571ba-fe03-42f8-a814-22cf5ef5467a	funcionario	Funcion├írio: Jo├úo Baluz - A├º├úo 6	400.00	2026-02-22 15:00:00+00	\N	pendente	\N	f	Custo di├írio: R$ 200.00 ├ù 2 dias	2026-02-22 19:43:55.188+00	2026-02-22 19:43:55.188+00	\N	b1131d02-3ea1-4da3-b856-e498390bc46a	Raposa	\N
cb5cb817-992e-412f-b5eb-57aa6b212c02	funcionario	Funcion├írio: Ronaldo - A├º├úo 6	1200.00	2026-02-22 15:00:00+00	\N	pendente	\N	f	Custo di├írio: R$ 600.00 ├ù 2 dias	2026-02-22 22:13:22.359+00	2026-02-22 22:13:22.359+00	\N	b1131d02-3ea1-4da3-b856-e498390bc46a	Raposa	\N
399a8936-ce8a-4714-a676-c92039e733f3	funcionario	Funcion├írio: Jo├úo Baluz - A├º├úo 5	49600.00	2026-10-14 15:00:00+00	\N	pendente	\N	f	Custo di├írio: R$ 200.00 ├ù 248 dias	2026-02-23 22:29:58.487+00	2026-02-23 22:29:58.487+00	\N	e224b611-c6f4-421a-80a9-40ec63f654ff	Buriticupu	\N
3524c6d3-a45e-49cf-8585-282aeb6f1882	funcionario	Funcion├írio: gabriel diniz - A├º├úo 1	1000.00	2026-02-09 15:00:00+00	\N	pendente	\N	f	Custo di├írio: R$ 200.00 ├ù 5 dias	2026-02-23 23:44:20.699+00	2026-02-23 23:44:39.613+00	\N	53df1c14-a0b7-49ed-9292-607e4f17b15e	Sao Luis	\N
77c0dde8-9005-4060-992f-22b9c4ee080c	funcionario	Funcion├írio: Ronaldo - A├º├úo 1	3600.00	2026-02-09 15:00:00+00	\N	pendente	\N	f	Custo di├írio: R$ 600.00 ├ù 6 dias	2026-02-23 23:36:03.058+00	2026-02-23 23:45:13.864+00	\N	53df1c14-a0b7-49ed-9292-607e4f17b15e	Sao Luis	\N
0088f17b-007e-484f-ba88-86cc7b430291	funcionario	Funcion├írio: Jo├úo Baluz - A├º├úo 5	49600.00	2026-10-14 15:00:00+00	\N	pendente	\N	f	Custo di├írio: R$ 200.00 ├ù 248 dias	2026-02-26 02:14:57.807+00	2026-02-26 02:14:57.807+00	\N	e224b611-c6f4-421a-80a9-40ec63f654ff	Buriticupu	\N
b2e7c641-15f9-44ca-890a-4699b330d51c	troca_oleo	troca de oleo 	120.00	2026-05-04 15:00:00+00	\N	paga	\N	f		2026-02-08 17:02:19.462+00	2026-02-23 23:04:00.295+00	\N	\N	\N	\N
90c64633-f6eb-49bf-b1a0-223890bd44f6	pneu_furado		200.00	2026-02-23 23:08:05.923+00	\N	paga	\N	f		2026-02-23 23:08:05.923+00	2026-02-23 23:08:05.923+00	\N	b1131d02-3ea1-4da3-b856-e498390bc46a	Raposa	\N
cc0f83cc-3e83-4e3d-b8e6-9c5a99600a8a	funcionario	Funcion├írio: Jo├úo Baluz - A├º├úo 3	6600.00	2026-06-04 15:00:00+00	\N	pendente	\N	f	Custo di├írio: R$ 200.00 ├ù 33 dias	2026-02-23 23:36:31.513+00	2026-02-23 23:36:31.513+00	\N	13fcfd57-07c6-418e-a130-f4ff0cf9095d	Sao Luis	\N
db666ed7-154b-4781-9d22-44e654443332	funcionario	Funcion├írio: gabriel diniz - A├º├úo 6	300.00	2026-02-22 15:00:00+00	\N	pendente	\N	f	Custo di├írio: R$ 150.00 ├ù 2 dias	2026-02-23 23:37:31.507+00	2026-02-23 23:37:31.507+00	\N	b1131d02-3ea1-4da3-b856-e498390bc46a	Raposa	\N
\.


--
-- Data for Name: cursos_exames; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cursos_exames (id, nome, tipo, carga_horaria, descricao, requisitos, certificadora, ativo, codigo_sus, valor_unitario) FROM stdin;
be4727af-2919-40a8-8284-e827b41eb93d	hemograma	exame	\N	\N	\N	\N	t	\N	\N
8770c188-5c28-442c-92b8-b3e3c9ccf2a3	Exame de Vista	exame	\N	\N	\N	\N	t	\N	\N
\.


--
-- Data for Name: custos_acoes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.custos_acoes (id, acao_id, tipo_custo, descricao, valor, data_custo, comprovante_url, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: estoque_caminhoes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.estoque_caminhoes (id, caminhao_id, insumo_id, quantidade, ultima_atualizacao, created_at, updated_at) FROM stdin;
6d0ef5e5-e197-4627-8f7f-04d5381c30e1	a5efd07f-12cf-4289-a55f-fb758ebdec53	e14bd579-1896-4809-b418-479c39dd3381	5	2026-02-08 21:08:22.469+00	2026-02-08 21:08:22.469+00	2026-02-08 21:08:22.469+00
caf0c2a3-8efd-46ef-b00d-975c797f53b9	6e0bba4d-29c3-43d4-8e6d-02ad332f3683	dab32be1-4363-44c9-b97f-c370e7c0bcad	5	2026-02-08 21:08:44.212+00	2026-02-08 21:08:44.212+00	2026-02-08 21:08:44.212+00
dff020c9-a2a0-42ca-971c-61fb9d42c023	a5efd07f-12cf-4289-a55f-fb758ebdec53	34e5de8d-42cf-484f-9b68-a7ebb0022ea8	2	2026-02-09 20:34:03.459+00	2026-02-09 20:34:03.46+00	2026-02-09 20:34:03.46+00
\.


--
-- Data for Name: exames; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.exames (id, nome, tipo_exame, laboratorio_referencia, instrucoes_preparo, valores_referencia, custo_base, ativo, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: funcionario_anotacoes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.funcionario_anotacoes (id, funcionario_id, titulo, conteudo, cor, pinned, created_at, updated_at) FROM stdin;
feb5c3e9-72c4-45b9-8946-b450d568f087	8c4c4416-1e09-4000-b595-65f1b9f6e9de	Contrata├º├úo jo├úo Baluz	No dia 23 foi a entrada e contrata├º├úo do medico	#27ae60	f	2026-02-24 00:06:50.436+00	2026-02-24 00:11:12.675+00
\.


--
-- Data for Name: funcionarios; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.funcionarios (id, nome, cargo, especialidade, custo_diaria, created_at, updated_at, cpf, telefone, email, ativo, is_medico, login_cpf, senha, crm) FROM stdin;
ccd3a81c-da61-4856-b769-7f8009b8761e	gabriel diniz	motorista	Caminh├Áes	150.00	2026-02-08 17:13:17.007+00	2026-02-08 17:23:10.53+00	11144477735	9888888888	gg@gmail.com	t	f	\N	\N	\N
6dba833e-0ceb-444a-84dc-7cf27e542145	Ronaldo	Auiliar	Assistente de Dev	600.00	2026-02-09 16:27:23.225+00	2026-02-09 17:15:49.42+00	22244477736	98999999999	rrtecnol@rrtecnol.com.br	t	f	\N	\N	\N
8c4c4416-1e09-4000-b595-65f1b9f6e9de	Jo├úo Baluz	M├®dico	Clinico Geral	200.00	2026-02-08 17:37:19.43+00	2026-02-26 02:17:49.433+00	22423192304	98982450008	joaobaluz@gmail.com	t	t		$2b$10$/Ptxe6Zw0KwtPany0DIqn.vlI55ACzQTcda7Ml/vSaaZlWlIRjcHe	678978
\.


--
-- Data for Name: inscricoes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inscricoes (id, cidadao_id, acao_id, curso_exame_id, status, data_inscricao, observacoes, campos_customizados, created_at, updated_at, numero_prontuario) FROM stdin;
36e6f420-0522-4367-9335-ba781c89a7b6	021f1eef-00ca-400c-9762-4f39ab0ea173	0d56a264-3f0e-4ae6-a143-757fbe8ec71c	be4727af-2919-40a8-8284-e827b41eb93d	atendido	2026-02-09 17:30:07.424+00	\N	{}	2026-02-09 17:30:07.425+00	2026-02-09 19:54:47.696+00	\N
eb8a48b9-576f-409c-8d46-f46c3067ac2d	d27c86e1-4249-4bfa-b678-223942b73224	e224b611-c6f4-421a-80a9-40ec63f654ff	8770c188-5c28-442c-92b8-b3e3c9ccf2a3	atendido	2026-02-09 20:25:52.771+00	\N	{}	2026-02-09 20:25:52.772+00	2026-02-09 20:29:25.52+00	\N
2bbbfd30-5781-40ec-b16a-7a16c3b85140	d27c86e1-4249-4bfa-b678-223942b73224	53df1c14-a0b7-49ed-9292-607e4f17b15e	8770c188-5c28-442c-92b8-b3e3c9ccf2a3	atendido	2026-02-12 19:01:08.436+00	\N	{}	2026-02-12 19:01:08.437+00	2026-02-12 19:01:44.422+00	\N
b4b4bd0b-e197-4b72-83f4-edaf2782625a	021f1eef-00ca-400c-9762-4f39ab0ea173	13fcfd57-07c6-418e-a130-f4ff0cf9095d	be4727af-2919-40a8-8284-e827b41eb93d	pendente	2026-02-21 20:09:30.797+00	\N	{}	2026-02-21 20:09:30.798+00	2026-02-21 20:09:30.798+00	\N
859be910-744f-41ad-b90e-1a98abc18c5b	021f1eef-00ca-400c-9762-4f39ab0ea173	a5695469-45ec-41a0-ab7f-14f5447a93de	be4727af-2919-40a8-8284-e827b41eb93d	atendido	2026-02-21 20:10:00.482+00	\N	{}	2026-02-21 20:10:00.482+00	2026-02-21 20:10:08.55+00	\N
864c679e-309c-46d4-aee3-d847cd03d1f8	5809ccee-2a55-4cf0-9368-e327d8c578b5	13fcfd57-07c6-418e-a130-f4ff0cf9095d	8770c188-5c28-442c-92b8-b3e3c9ccf2a3	pendente	2026-02-21 20:22:46.23+00	\N	{}	2026-02-21 20:22:46.23+00	2026-02-21 20:22:46.23+00	\N
46acde2e-8f75-4b9d-99e3-ab7dda2b8c5d	5809ccee-2a55-4cf0-9368-e327d8c578b5	53df1c14-a0b7-49ed-9292-607e4f17b15e	be4727af-2919-40a8-8284-e827b41eb93d	atendido	2026-02-09 17:02:07.05+00	\N	{}	2026-02-09 17:02:07.051+00	2026-02-22 20:16:42.921+00	\N
2586f2b3-2d71-471b-96db-b36f06385f31	d27c86e1-4249-4bfa-b678-223942b73224	a5695469-45ec-41a0-ab7f-14f5447a93de	be4727af-2919-40a8-8284-e827b41eb93d	atendido	2026-02-09 16:36:19.33+00	\N	{}	2026-02-09 16:36:19.331+00	2026-02-22 20:17:54.461+00	\N
f805a610-ff92-4763-9488-4dc657fb5512	5ebd04d7-764d-45af-a527-c93384ccabe9	b1131d02-3ea1-4da3-b856-e498390bc46a	be4727af-2919-40a8-8284-e827b41eb93d	atendido	2026-02-22 19:46:50.411+00	\N	{}	2026-02-22 19:46:50.411+00	2026-02-22 21:41:36.597+00	\N
9a384e00-3d60-4a4a-87cd-bcfeb2927b32	021f1eef-00ca-400c-9762-4f39ab0ea173	53df1c14-a0b7-49ed-9292-607e4f17b15e	8770c188-5c28-442c-92b8-b3e3c9ccf2a3	atendido	2026-02-22 22:03:18.245+00	\N	{}	2026-02-22 22:03:18.245+00	2026-02-23 22:35:11.505+00	\N
c0c98e21-0728-41cb-8b27-c57514b694b9	021f1eef-00ca-400c-9762-4f39ab0ea173	53df1c14-a0b7-49ed-9292-607e4f17b15e	be4727af-2919-40a8-8284-e827b41eb93d	atendido	2026-02-09 16:56:02.841+00	\N	{}	2026-02-09 16:56:02.841+00	2026-02-23 22:35:11.505+00	\N
8cfce84c-4c23-4a0e-805a-e48c1d1388a7	d27c86e1-4249-4bfa-b678-223942b73224	13fcfd57-07c6-418e-a130-f4ff0cf9095d	be4727af-2919-40a8-8284-e827b41eb93d	atendido	2026-02-21 20:03:25.184+00	\N	{}	2026-02-21 20:03:25.185+00	2026-02-24 00:22:14.235+00	\N
e13f3f5c-e6a5-46c0-bc88-e1a3ece9a351	021f1eef-00ca-400c-9762-4f39ab0ea173	e224b611-c6f4-421a-80a9-40ec63f654ff	be4727af-2919-40a8-8284-e827b41eb93d	atendido	2026-02-21 20:11:10.344+00	\N	{}	2026-02-21 20:11:10.344+00	2026-02-24 01:25:36.417+00	\N
\.


--
-- Data for Name: instituicoes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.instituicoes (id, razao_social, cnpj, responsavel_nome, responsavel_email, responsavel_tel, endereco_completo, campos_customizados, ativo, created_at, updated_at) FROM stdin;
d2120645-e88f-4c12-a31c-0f60c2ddacbe	SENAI - S├âO LUIS	10566.16816814	joao gabriel 	joaogabrieldiniz2307@gmail.com	98987272826	Rua bento freitas	{}	t	2026-02-07 19:37:52.905+00	2026-02-07 19:37:52.905+00
\.


--
-- Data for Name: insumos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.insumos (id, nome, descricao, categoria, unidade, quantidade_minima, quantidade_atual, preco_unitario, codigo_barras, lote, data_validade, fornecedor, nota_fiscal, data_entrada, localizacao, ativo, created_at, updated_at) FROM stdin;
26b817e4-12df-4627-92d0-5b187cad6e18	luva sintetica	\N	MATERIAL_DESCARTAVEL	caixa	10	50	\N	564684	45	\N	Gov Ma	\N	\N	mesa 2	t	2026-02-08 19:23:39.359+00	2026-02-08 20:07:22.938+00
dab32be1-4363-44c9-b97f-c370e7c0bcad	Mascara	\N	OUTROS	caixa	10	95	\N	561531	25	2027-01-20 00:00:00+00	GOV MA	\N	\N	Gaveta 02	t	2026-02-08 20:12:11.952+00	2026-02-08 21:08:44.209+00
e14bd579-1896-4809-b418-479c39dd3381	Luvas Descartaveis	\N	EPI	caixa	10	5	\N	\N	\N	2026-02-09 00:00:00+00	\N	\N	\N	\N	t	2026-02-08 19:30:14.45+00	2026-02-08 21:59:51.737+00
34e5de8d-42cf-484f-9b68-a7ebb0022ea8	Luva plastica	lva ├ºatex branca	MATERIAL_DESCARTAVEL	caixa	2	3	\N	000125458788	1908	2028-06-08 00:00:00+00	Governo	\N	\N	prateleira 24	t	2026-02-09 20:33:44.013+00	2026-02-09 20:34:03.457+00
\.


--
-- Data for Name: manutencoes_caminhao; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.manutencoes_caminhao (id, caminhao_id, tipo, titulo, descricao, status, prioridade, km_atual, km_proximo, data_agendada, data_conclusao, custo_estimado, custo_real, fornecedor, responsavel, observacoes, created_at, updated_at, status_pagamento) FROM stdin;
8ca28c9e-eaad-4a10-b8cd-4f710c929206	a5efd07f-12cf-4289-a55f-fb758ebdec53	revisao	Troca de ├ôleo 	Servi├ºo feito no posto s├úo marcos	concluida	media	4000	8000	2026-02-19	2026-02-19	\N	500.00	Posto s├úo marcos	Julio	\N	2026-02-21 21:04:00.722+00	2026-02-22 17:26:18.409+00	paga
2f53a951-d1d6-44bb-bcf7-9091f1b831b8	6e0bba4d-29c3-43d4-8e6d-02ad332f3683	corretiva	Troca de ├ôleo 	Feita rapidamente	concluida	media	4000	8000	2026-02-22	2026-02-22	\N	600.00	Posto s├úo marcos	Julio	\N	2026-02-21 21:05:42.37+00	2026-02-23 19:43:05.153+00	pendente
\.


--
-- Data for Name: movimentacoes_estoque; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.movimentacoes_estoque (id, insumo_id, tipo, quantidade, quantidade_anterior, quantidade_atual, origem, destino, caminhao_id, acao_id, motorista_id, nota_fiscal, data_movimento, observacoes, usuario_id, created_at, updated_at) FROM stdin;
d721a7a5-f8d8-455a-9923-ef5ce7bf5883	e14bd579-1896-4809-b418-479c39dd3381	ENTRADA	10	50	60	\N	\N	\N	\N	\N	\N	2026-02-08 19:30:29.964+00	Teste de movimenta´┐¢´┐¢o	\N	2026-02-08 19:30:29.965+00	2026-02-08 19:30:29.965+00
e54929f4-d834-4b59-99cf-cee85aa6b567	e14bd579-1896-4809-b418-479c39dd3381	ENTRADA	10	60	70	\N	\N	\N	\N	\N	\N	2026-02-08 19:49:09.708+00	jbkj 	\N	2026-02-08 19:49:09.709+00	2026-02-08 19:49:09.709+00
5d86be07-a433-4778-82fa-be96839621c6	e14bd579-1896-4809-b418-479c39dd3381	SAIDA	10	70	60	\N	\N	\N	\N	\N	\N	2026-02-08 19:49:20.695+00	\N	\N	2026-02-08 19:49:20.695+00	2026-02-08 19:49:20.695+00
d4ac09ce-4972-4b94-89e0-0b1663adeec9	e14bd579-1896-4809-b418-479c39dd3381	AJUSTE	5	60	5	\N	\N	\N	\N	\N	\N	2026-02-08 19:49:34.736+00	\N	\N	2026-02-08 19:49:34.736+00	2026-02-08 19:49:34.736+00
937cc9df-67c4-4f82-aace-c642b7516d06	e14bd579-1896-4809-b418-479c39dd3381	ENTRADA	10	5	15	\N	\N	\N	\N	\N	\N	2026-02-08 19:54:49.881+00	\N	\N	2026-02-08 19:54:49.881+00	2026-02-08 19:54:49.881+00
57a38953-a7b0-4779-bcbe-ca14ba840cad	26b817e4-12df-4627-92d0-5b187cad6e18	SAIDA	5	50	45	\N	\N	\N	\N	\N	\N	2026-02-08 19:55:18.055+00	\N	\N	2026-02-08 19:55:18.055+00	2026-02-08 19:55:18.055+00
0cfe85e0-ec28-4bd7-b590-a730160cdffd	26b817e4-12df-4627-92d0-5b187cad6e18	SAIDA	5	45	40	\N	\N	\N	\N	\N	\N	2026-02-08 19:58:28.92+00	\N	\N	2026-02-08 19:58:28.92+00	2026-02-08 19:58:28.92+00
b970cc88-b1ac-4f19-ba06-b3fdd38d4eb1	26b817e4-12df-4627-92d0-5b187cad6e18	ENTRADA	10	40	50	\N	\N	\N	\N	\N	\N	2026-02-08 20:01:46.034+00	\N	\N	2026-02-08 20:01:46.034+00	2026-02-08 20:01:46.034+00
8ca88727-3420-49f9-b9bb-1982c159439a	26b817e4-12df-4627-92d0-5b187cad6e18	ENTRADA	10	50	60	\N	\N	\N	\N	\N	\N	2026-02-08 20:07:14.952+00	\N	\N	2026-02-08 20:07:14.952+00	2026-02-08 20:07:14.952+00
e786ea61-c3af-4b05-8cec-3f2dc09bc5e4	26b817e4-12df-4627-92d0-5b187cad6e18	SAIDA	10	60	50	\N	\N	\N	\N	\N	\N	2026-02-08 20:07:22.939+00	\N	\N	2026-02-08 20:07:22.939+00	2026-02-08 20:07:22.939+00
ee8325cd-3153-4d0e-8783-c5f8b79a8d4d	e14bd579-1896-4809-b418-479c39dd3381	SAIDA	10	11	1	\N	\N	\N	\N	\N	\N	2026-02-08 20:22:30.964+00	\N	\N	2026-02-08 20:22:30.964+00	2026-02-08 20:22:30.964+00
c9e861e2-39ac-4726-8315-334c1d6c97d6	e14bd579-1896-4809-b418-479c39dd3381	ENTRADA	9	1	10	\N	\N	\N	\N	\N	\N	2026-02-08 20:22:45.166+00	\N	\N	2026-02-08 20:22:45.166+00	2026-02-08 20:22:45.166+00
7d1c7e11-497a-4093-845a-e365ed145b9d	e14bd579-1896-4809-b418-479c39dd3381	ENTRADA	5	10	5	CENTRAL	a5efd07f-12cf-4289-a55f-fb758ebdec53	a5efd07f-12cf-4289-a55f-fb758ebdec53	\N	\N	\N	2026-02-08 21:08:22.473+00	\N	\N	2026-02-08 21:08:22.473+00	2026-02-08 21:08:22.473+00
7fd122cb-9e91-4f89-9a7b-680ed7b3ce90	dab32be1-4363-44c9-b97f-c370e7c0bcad	ENTRADA	5	100	95	CENTRAL	6e0bba4d-29c3-43d4-8e6d-02ad332f3683	6e0bba4d-29c3-43d4-8e6d-02ad332f3683	\N	\N	\N	2026-02-08 21:08:44.215+00	\N	\N	2026-02-08 21:08:44.215+00	2026-02-08 21:08:44.215+00
1a83e7db-004d-462d-be89-55397f002f77	34e5de8d-42cf-484f-9b68-a7ebb0022ea8	ENTRADA	2	5	3	CENTRAL	a5efd07f-12cf-4289-a55f-fb758ebdec53	a5efd07f-12cf-4289-a55f-fb758ebdec53	\N	\N	\N	2026-02-09 20:34:03.463+00	\N	\N	2026-02-09 20:34:03.463+00	2026-02-09 20:34:03.463+00
\.


--
-- Data for Name: noticias; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.noticias (id, titulo, conteudo, imagem_url, acao_id, destaque, data_publicacao, campos_customizados, ativo, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: notificacoes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notificacoes (id, acao_id, tipo, template, destinatarios_filtro, agendamento, status, estatisticas, sent_at, created_at) FROM stdin;
\.


--
-- Data for Name: pontos_medicos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pontos_medicos (id, funcionario_id, acao_id, data_hora_entrada, data_hora_saida, horas_trabalhadas, status, observacoes, created_at, updated_at) FROM stdin;
6f42d610-9b3e-4bcb-b118-55eb6ea52862	8c4c4416-1e09-4000-b595-65f1b9f6e9de	53df1c14-a0b7-49ed-9292-607e4f17b15e	2026-02-22 18:20:33.613+00	2026-02-22 19:41:36.042+00	1.35	saiu	\N	2026-02-22 18:20:33.613+00	2026-02-22 19:41:36.042+00
c61f885e-3f48-4cc5-bcf5-bb92f6042b4e	8c4c4416-1e09-4000-b595-65f1b9f6e9de	\N	2026-02-22 19:41:41.164+00	2026-02-22 19:41:43.309+00	0.00	saiu	\N	2026-02-22 19:41:41.164+00	2026-02-22 19:41:43.309+00
34ae3031-3d21-4d4c-af3b-ef56b4a9e72a	8c4c4416-1e09-4000-b595-65f1b9f6e9de	\N	2026-02-22 19:47:19.254+00	2026-02-22 20:16:46.706+00	0.49	saiu	\N	2026-02-22 19:47:19.254+00	2026-02-22 20:16:46.706+00
1962fbcd-8a6c-4940-a64b-156aa131c849	8c4c4416-1e09-4000-b595-65f1b9f6e9de	\N	2026-02-22 20:16:51.031+00	2026-02-22 20:18:20.49+00	0.02	saiu	\N	2026-02-22 20:16:51.031+00	2026-02-22 20:18:20.491+00
8c0b4194-bbbe-4096-992e-99838cb0548d	8c4c4416-1e09-4000-b595-65f1b9f6e9de	0d56a264-3f0e-4ae6-a143-757fbe8ec71c	2026-02-22 20:56:43.293+00	2026-02-22 21:17:24.43112+00	0.00	saiu	\N	2026-02-22 20:56:43.293+00	2026-02-22 20:56:43.293+00
dc56a975-edf6-4b7a-acf9-645b8ec46728	8c4c4416-1e09-4000-b595-65f1b9f6e9de	\N	2026-02-22 21:22:36.86+00	2026-02-22 21:44:29.657+00	0.36	saiu	\N	2026-02-22 21:22:36.86+00	2026-02-22 21:44:29.657+00
bebab502-7ad3-4e4c-8bb0-0bc91614069b	8c4c4416-1e09-4000-b595-65f1b9f6e9de	53df1c14-a0b7-49ed-9292-607e4f17b15e	2026-02-23 20:04:08.113+00	2026-02-23 22:41:03.853+00	2.62	saiu	\N	2026-02-23 20:04:08.113+00	2026-02-23 22:41:03.854+00
c89f1fcc-32da-4c5f-88f4-b26c186bf4c8	8c4c4416-1e09-4000-b595-65f1b9f6e9de	e224b611-c6f4-421a-80a9-40ec63f654ff	2026-02-24 00:11:41.631+00	2026-02-24 00:12:05.105+00	0.01	saiu	\N	2026-02-24 00:11:41.632+00	2026-02-24 00:12:05.105+00
eea5c565-8d03-4dd0-a863-e95921880667	8c4c4416-1e09-4000-b595-65f1b9f6e9de	\N	2026-02-24 00:12:17.628+00	2026-02-24 00:56:03.79+00	0.73	saiu	\N	2026-02-24 00:12:17.628+00	2026-02-24 00:56:03.791+00
6124664b-84c9-40b4-8324-916307f9de75	8c4c4416-1e09-4000-b595-65f1b9f6e9de	\N	2026-02-24 00:56:13.634+00	2026-02-24 00:57:04.495+00	0.01	saiu	\N	2026-02-24 00:56:13.634+00	2026-02-24 00:57:04.495+00
ab978267-4108-43cb-9410-bfe092c8d146	8c4c4416-1e09-4000-b595-65f1b9f6e9de	\N	2026-02-24 00:57:07.097+00	2026-02-24 01:25:52.418+00	0.48	saiu	\N	2026-02-24 00:57:07.097+00	2026-02-24 01:25:52.418+00
2a47ef57-5e6b-4d32-b3ce-cba329a8c303	8c4c4416-1e09-4000-b595-65f1b9f6e9de	\N	2026-02-24 01:25:54.581+00	2026-02-24 01:26:01.903+00	0.00	saiu	\N	2026-02-24 01:25:54.581+00	2026-02-24 01:26:01.903+00
83679b7f-9447-4fb6-ad4d-c6546334f130	8c4c4416-1e09-4000-b595-65f1b9f6e9de	13fcfd57-07c6-418e-a130-f4ff0cf9095d	2026-02-24 01:26:07.054+00	2026-02-24 01:53:11.462+00	0.45	saiu	\N	2026-02-24 01:26:07.054+00	2026-02-24 01:53:11.463+00
e81ce9de-2c73-4985-9a21-76c67bd0c8a9	8c4c4416-1e09-4000-b595-65f1b9f6e9de	53df1c14-a0b7-49ed-9292-607e4f17b15e	2026-02-24 01:53:15.929+00	2026-02-24 01:53:19.214+00	0.00	saiu	\N	2026-02-24 01:53:15.93+00	2026-02-24 01:53:19.214+00
6b26cb29-7da0-4e24-807c-6dca4ee56524	8c4c4416-1e09-4000-b595-65f1b9f6e9de	\N	2026-02-24 01:53:59.148+00	2026-02-24 01:54:06.324+00	0.00	saiu	\N	2026-02-24 01:53:59.148+00	2026-02-24 01:54:06.324+00
5f56978b-6511-4354-8527-965516c4bff6	8c4c4416-1e09-4000-b595-65f1b9f6e9de	13fcfd57-07c6-418e-a130-f4ff0cf9095d	2026-02-24 02:13:55.355+00	2026-02-24 02:20:58.669+00	0.12	saiu	\N	2026-02-24 02:13:55.356+00	2026-02-24 02:20:58.669+00
dcd2a7df-c172-4693-8632-f5c7c8a66bc5	8c4c4416-1e09-4000-b595-65f1b9f6e9de	a5695469-45ec-41a0-ab7f-14f5447a93de	2026-02-24 02:21:03.011+00	2026-02-24 02:23:05.181+00	0.03	saiu	\N	2026-02-24 02:21:03.011+00	2026-02-24 02:23:05.181+00
20a1d324-85c2-4137-b483-2487abc0c05d	8c4c4416-1e09-4000-b595-65f1b9f6e9de	\N	2026-02-24 02:23:25.257+00	2026-02-24 02:23:39.906+00	0.00	saiu	\N	2026-02-24 02:23:25.257+00	2026-02-24 02:23:39.906+00
8c13eab0-0e14-4015-ab55-a8e4007a9f2e	8c4c4416-1e09-4000-b595-65f1b9f6e9de	13fcfd57-07c6-418e-a130-f4ff0cf9095d	2026-02-24 03:56:58.491+00	2026-02-24 03:57:05.281+00	0.00	saiu	\N	2026-02-24 03:56:58.492+00	2026-02-24 03:57:05.281+00
bf9b2cdf-01a9-40c5-a679-9a7c544b233a	8c4c4416-1e09-4000-b595-65f1b9f6e9de	53df1c14-a0b7-49ed-9292-607e4f17b15e	2026-02-24 03:57:09.816+00	2026-02-24 03:57:15.03+00	0.00	saiu	\N	2026-02-24 03:57:09.817+00	2026-02-24 03:57:15.03+00
f0ec7491-0b78-4d52-b7b3-78d2ac5d4e92	8c4c4416-1e09-4000-b595-65f1b9f6e9de	13fcfd57-07c6-418e-a130-f4ff0cf9095d	2026-02-24 04:02:45.091+00	2026-02-24 04:03:38.6+00	0.01	saiu	\N	2026-02-24 04:02:45.091+00	2026-02-24 04:03:38.6+00
3b0579d2-9d49-4ca1-bd3a-542dad40f463	8c4c4416-1e09-4000-b595-65f1b9f6e9de	13fcfd57-07c6-418e-a130-f4ff0cf9095d	2026-02-24 04:09:50.182+00	\N	\N	trabalhando	\N	2026-02-24 04:09:50.182+00	2026-02-24 04:09:50.182+00
\.


--
-- Data for Name: resultados_exames; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.resultados_exames (id, inscricao_id, exame_id, cidadao_id, acao_id, data_realizacao, resultado, arquivo_resultado_url, observacoes, created_at, updated_at, numero_laudo, data_emissao_laudo) FROM stdin;
\.


--
-- Name: acoes_numero_acao_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.acoes_numero_acao_seq', 6, true);


--
-- Name: SequelizeMeta SequelizeMeta_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SequelizeMeta"
    ADD CONSTRAINT "SequelizeMeta_pkey" PRIMARY KEY (name);


--
-- Name: abastecimentos abastecimentos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.abastecimentos
    ADD CONSTRAINT abastecimentos_pkey PRIMARY KEY (id);


--
-- Name: acao_caminhoes acao_caminhoes_acao_id_caminhao_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acao_caminhoes
    ADD CONSTRAINT acao_caminhoes_acao_id_caminhao_id_key UNIQUE (acao_id, caminhao_id);


--
-- Name: acao_caminhoes acao_caminhoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acao_caminhoes
    ADD CONSTRAINT acao_caminhoes_pkey PRIMARY KEY (id);


--
-- Name: acao_curso_exame acao_curso_exame_acao_id_curso_exame_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acao_curso_exame
    ADD CONSTRAINT acao_curso_exame_acao_id_curso_exame_id_key UNIQUE (acao_id, curso_exame_id);


--
-- Name: acao_curso_exame acao_curso_exame_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acao_curso_exame
    ADD CONSTRAINT acao_curso_exame_pkey PRIMARY KEY (id);


--
-- Name: acao_funcionarios acao_funcionarios_acao_id_funcionario_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acao_funcionarios
    ADD CONSTRAINT acao_funcionarios_acao_id_funcionario_id_key UNIQUE (acao_id, funcionario_id);


--
-- Name: acao_funcionarios acao_funcionarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acao_funcionarios
    ADD CONSTRAINT acao_funcionarios_pkey PRIMARY KEY (id);


--
-- Name: acoes_insumos acoes_insumos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acoes_insumos
    ADD CONSTRAINT acoes_insumos_pkey PRIMARY KEY (id);


--
-- Name: acoes acoes_numero_acao_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acoes
    ADD CONSTRAINT acoes_numero_acao_key UNIQUE (numero_acao);


--
-- Name: acoes acoes_numero_acao_key1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acoes
    ADD CONSTRAINT acoes_numero_acao_key1 UNIQUE (numero_acao);


--
-- Name: acoes acoes_numero_acao_key2; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acoes
    ADD CONSTRAINT acoes_numero_acao_key2 UNIQUE (numero_acao);


--
-- Name: acoes acoes_numero_acao_key3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acoes
    ADD CONSTRAINT acoes_numero_acao_key3 UNIQUE (numero_acao);


--
-- Name: acoes acoes_numero_acao_key4; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acoes
    ADD CONSTRAINT acoes_numero_acao_key4 UNIQUE (numero_acao);


--
-- Name: acoes acoes_numero_acao_key5; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acoes
    ADD CONSTRAINT acoes_numero_acao_key5 UNIQUE (numero_acao);


--
-- Name: acoes acoes_numero_acao_key6; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acoes
    ADD CONSTRAINT acoes_numero_acao_key6 UNIQUE (numero_acao);


--
-- Name: acoes acoes_numero_acao_key7; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acoes
    ADD CONSTRAINT acoes_numero_acao_key7 UNIQUE (numero_acao);


--
-- Name: acoes acoes_numero_acao_key8; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acoes
    ADD CONSTRAINT acoes_numero_acao_key8 UNIQUE (numero_acao);


--
-- Name: acoes acoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acoes
    ADD CONSTRAINT acoes_pkey PRIMARY KEY (id);


--
-- Name: atendimentos_medicos atendimentos_medicos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atendimentos_medicos
    ADD CONSTRAINT atendimentos_medicos_pkey PRIMARY KEY (id);


--
-- Name: caminhoes caminhoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.caminhoes
    ADD CONSTRAINT caminhoes_pkey PRIMARY KEY (id);


--
-- Name: caminhoes caminhoes_placa_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.caminhoes
    ADD CONSTRAINT caminhoes_placa_key UNIQUE (placa);


--
-- Name: caminhoes caminhoes_placa_key1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.caminhoes
    ADD CONSTRAINT caminhoes_placa_key1 UNIQUE (placa);


--
-- Name: caminhoes caminhoes_placa_key2; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.caminhoes
    ADD CONSTRAINT caminhoes_placa_key2 UNIQUE (placa);


--
-- Name: caminhoes caminhoes_placa_key3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.caminhoes
    ADD CONSTRAINT caminhoes_placa_key3 UNIQUE (placa);


--
-- Name: caminhoes caminhoes_placa_key4; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.caminhoes
    ADD CONSTRAINT caminhoes_placa_key4 UNIQUE (placa);


--
-- Name: caminhoes caminhoes_placa_key5; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.caminhoes
    ADD CONSTRAINT caminhoes_placa_key5 UNIQUE (placa);


--
-- Name: caminhoes caminhoes_placa_key6; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.caminhoes
    ADD CONSTRAINT caminhoes_placa_key6 UNIQUE (placa);


--
-- Name: cidadaos cidadaos_cpf_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cidadaos
    ADD CONSTRAINT cidadaos_cpf_key UNIQUE (cpf);


--
-- Name: cidadaos cidadaos_cpf_key1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cidadaos
    ADD CONSTRAINT cidadaos_cpf_key1 UNIQUE (cpf);


--
-- Name: cidadaos cidadaos_cpf_key2; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cidadaos
    ADD CONSTRAINT cidadaos_cpf_key2 UNIQUE (cpf);


--
-- Name: cidadaos cidadaos_cpf_key3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cidadaos
    ADD CONSTRAINT cidadaos_cpf_key3 UNIQUE (cpf);


--
-- Name: cidadaos cidadaos_cpf_key4; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cidadaos
    ADD CONSTRAINT cidadaos_cpf_key4 UNIQUE (cpf);


--
-- Name: cidadaos cidadaos_cpf_key5; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cidadaos
    ADD CONSTRAINT cidadaos_cpf_key5 UNIQUE (cpf);


--
-- Name: cidadaos cidadaos_cpf_key6; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cidadaos
    ADD CONSTRAINT cidadaos_cpf_key6 UNIQUE (cpf);


--
-- Name: cidadaos cidadaos_cpf_key7; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cidadaos
    ADD CONSTRAINT cidadaos_cpf_key7 UNIQUE (cpf);


--
-- Name: cidadaos cidadaos_cpf_key8; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cidadaos
    ADD CONSTRAINT cidadaos_cpf_key8 UNIQUE (cpf);


--
-- Name: cidadaos cidadaos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cidadaos
    ADD CONSTRAINT cidadaos_pkey PRIMARY KEY (id);


--
-- Name: configuracoes_campo configuracoes_campo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuracoes_campo
    ADD CONSTRAINT configuracoes_campo_pkey PRIMARY KEY (id);


--
-- Name: contas_pagar contas_pagar_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contas_pagar
    ADD CONSTRAINT contas_pagar_pkey PRIMARY KEY (id);


--
-- Name: cursos_exames cursos_exames_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cursos_exames
    ADD CONSTRAINT cursos_exames_pkey PRIMARY KEY (id);


--
-- Name: custos_acoes custos_acoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custos_acoes
    ADD CONSTRAINT custos_acoes_pkey PRIMARY KEY (id);


--
-- Name: estoque_caminhoes estoque_caminhoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estoque_caminhoes
    ADD CONSTRAINT estoque_caminhoes_pkey PRIMARY KEY (id);


--
-- Name: exames exames_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exames
    ADD CONSTRAINT exames_pkey PRIMARY KEY (id);


--
-- Name: funcionario_anotacoes funcionario_anotacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.funcionario_anotacoes
    ADD CONSTRAINT funcionario_anotacoes_pkey PRIMARY KEY (id);


--
-- Name: funcionarios funcionarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.funcionarios
    ADD CONSTRAINT funcionarios_pkey PRIMARY KEY (id);


--
-- Name: inscricoes inscricoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscricoes
    ADD CONSTRAINT inscricoes_pkey PRIMARY KEY (id);


--
-- Name: instituicoes instituicoes_cnpj_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instituicoes
    ADD CONSTRAINT instituicoes_cnpj_key UNIQUE (cnpj);


--
-- Name: instituicoes instituicoes_cnpj_key1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instituicoes
    ADD CONSTRAINT instituicoes_cnpj_key1 UNIQUE (cnpj);


--
-- Name: instituicoes instituicoes_cnpj_key10; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instituicoes
    ADD CONSTRAINT instituicoes_cnpj_key10 UNIQUE (cnpj);


--
-- Name: instituicoes instituicoes_cnpj_key11; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instituicoes
    ADD CONSTRAINT instituicoes_cnpj_key11 UNIQUE (cnpj);


--
-- Name: instituicoes instituicoes_cnpj_key12; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instituicoes
    ADD CONSTRAINT instituicoes_cnpj_key12 UNIQUE (cnpj);


--
-- Name: instituicoes instituicoes_cnpj_key13; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instituicoes
    ADD CONSTRAINT instituicoes_cnpj_key13 UNIQUE (cnpj);


--
-- Name: instituicoes instituicoes_cnpj_key2; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instituicoes
    ADD CONSTRAINT instituicoes_cnpj_key2 UNIQUE (cnpj);


--
-- Name: instituicoes instituicoes_cnpj_key3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instituicoes
    ADD CONSTRAINT instituicoes_cnpj_key3 UNIQUE (cnpj);


--
-- Name: instituicoes instituicoes_cnpj_key4; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instituicoes
    ADD CONSTRAINT instituicoes_cnpj_key4 UNIQUE (cnpj);


--
-- Name: instituicoes instituicoes_cnpj_key5; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instituicoes
    ADD CONSTRAINT instituicoes_cnpj_key5 UNIQUE (cnpj);


--
-- Name: instituicoes instituicoes_cnpj_key6; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instituicoes
    ADD CONSTRAINT instituicoes_cnpj_key6 UNIQUE (cnpj);


--
-- Name: instituicoes instituicoes_cnpj_key7; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instituicoes
    ADD CONSTRAINT instituicoes_cnpj_key7 UNIQUE (cnpj);


--
-- Name: instituicoes instituicoes_cnpj_key8; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instituicoes
    ADD CONSTRAINT instituicoes_cnpj_key8 UNIQUE (cnpj);


--
-- Name: instituicoes instituicoes_cnpj_key9; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instituicoes
    ADD CONSTRAINT instituicoes_cnpj_key9 UNIQUE (cnpj);


--
-- Name: instituicoes instituicoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instituicoes
    ADD CONSTRAINT instituicoes_pkey PRIMARY KEY (id);


--
-- Name: insumos insumos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insumos
    ADD CONSTRAINT insumos_pkey PRIMARY KEY (id);


--
-- Name: manutencoes_caminhao manutencoes_caminhao_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manutencoes_caminhao
    ADD CONSTRAINT manutencoes_caminhao_pkey PRIMARY KEY (id);


--
-- Name: movimentacoes_estoque movimentacoes_estoque_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimentacoes_estoque
    ADD CONSTRAINT movimentacoes_estoque_pkey PRIMARY KEY (id);


--
-- Name: noticias noticias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.noticias
    ADD CONSTRAINT noticias_pkey PRIMARY KEY (id);


--
-- Name: notificacoes notificacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificacoes
    ADD CONSTRAINT notificacoes_pkey PRIMARY KEY (id);


--
-- Name: pontos_medicos pontos_medicos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pontos_medicos
    ADD CONSTRAINT pontos_medicos_pkey PRIMARY KEY (id);


--
-- Name: resultados_exames resultados_exames_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resultados_exames
    ADD CONSTRAINT resultados_exames_pkey PRIMARY KEY (id);


--
-- Name: unique_caminhao_insumo; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX unique_caminhao_insumo ON public.estoque_caminhoes USING btree (caminhao_id, insumo_id);


--
-- Name: abastecimentos abastecimentos_acao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.abastecimentos
    ADD CONSTRAINT abastecimentos_acao_id_fkey FOREIGN KEY (acao_id) REFERENCES public.acoes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: abastecimentos abastecimentos_caminhao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.abastecimentos
    ADD CONSTRAINT abastecimentos_caminhao_id_fkey FOREIGN KEY (caminhao_id) REFERENCES public.caminhoes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: acao_caminhoes acao_caminhoes_acao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acao_caminhoes
    ADD CONSTRAINT acao_caminhoes_acao_id_fkey FOREIGN KEY (acao_id) REFERENCES public.acoes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: acao_caminhoes acao_caminhoes_caminhao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acao_caminhoes
    ADD CONSTRAINT acao_caminhoes_caminhao_id_fkey FOREIGN KEY (caminhao_id) REFERENCES public.caminhoes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: acao_curso_exame acao_curso_exame_acao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acao_curso_exame
    ADD CONSTRAINT acao_curso_exame_acao_id_fkey FOREIGN KEY (acao_id) REFERENCES public.acoes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: acao_curso_exame acao_curso_exame_curso_exame_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acao_curso_exame
    ADD CONSTRAINT acao_curso_exame_curso_exame_id_fkey FOREIGN KEY (curso_exame_id) REFERENCES public.cursos_exames(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: acao_funcionarios acao_funcionarios_acao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acao_funcionarios
    ADD CONSTRAINT acao_funcionarios_acao_id_fkey FOREIGN KEY (acao_id) REFERENCES public.acoes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: acao_funcionarios acao_funcionarios_funcionario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acao_funcionarios
    ADD CONSTRAINT acao_funcionarios_funcionario_id_fkey FOREIGN KEY (funcionario_id) REFERENCES public.funcionarios(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: acoes acoes_instituicao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acoes
    ADD CONSTRAINT acoes_instituicao_id_fkey FOREIGN KEY (instituicao_id) REFERENCES public.instituicoes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: acoes_insumos acoes_insumos_acao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acoes_insumos
    ADD CONSTRAINT acoes_insumos_acao_id_fkey FOREIGN KEY (acao_id) REFERENCES public.acoes(id) ON UPDATE CASCADE;


--
-- Name: acoes acoes_responsavel_tecnico_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acoes
    ADD CONSTRAINT acoes_responsavel_tecnico_id_fkey FOREIGN KEY (responsavel_tecnico_id) REFERENCES public.funcionarios(id) ON DELETE SET NULL;


--
-- Name: atendimentos_medicos atendimentos_medicos_acao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atendimentos_medicos
    ADD CONSTRAINT atendimentos_medicos_acao_id_fkey FOREIGN KEY (acao_id) REFERENCES public.acoes(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: atendimentos_medicos atendimentos_medicos_cidadao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atendimentos_medicos
    ADD CONSTRAINT atendimentos_medicos_cidadao_id_fkey FOREIGN KEY (cidadao_id) REFERENCES public.cidadaos(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: atendimentos_medicos atendimentos_medicos_funcionario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atendimentos_medicos
    ADD CONSTRAINT atendimentos_medicos_funcionario_id_fkey FOREIGN KEY (funcionario_id) REFERENCES public.funcionarios(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: atendimentos_medicos atendimentos_medicos_ponto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atendimentos_medicos
    ADD CONSTRAINT atendimentos_medicos_ponto_id_fkey FOREIGN KEY (ponto_id) REFERENCES public.pontos_medicos(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: custos_acoes custos_acoes_acao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custos_acoes
    ADD CONSTRAINT custos_acoes_acao_id_fkey FOREIGN KEY (acao_id) REFERENCES public.acoes(id) ON UPDATE CASCADE;


--
-- Name: estoque_caminhoes estoque_caminhoes_caminhao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estoque_caminhoes
    ADD CONSTRAINT estoque_caminhoes_caminhao_id_fkey FOREIGN KEY (caminhao_id) REFERENCES public.caminhoes(id) ON UPDATE CASCADE;


--
-- Name: funcionario_anotacoes funcionario_anotacoes_funcionario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.funcionario_anotacoes
    ADD CONSTRAINT funcionario_anotacoes_funcionario_id_fkey FOREIGN KEY (funcionario_id) REFERENCES public.funcionarios(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: inscricoes inscricoes_acao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscricoes
    ADD CONSTRAINT inscricoes_acao_id_fkey FOREIGN KEY (acao_id) REFERENCES public.acoes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: inscricoes inscricoes_cidadao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscricoes
    ADD CONSTRAINT inscricoes_cidadao_id_fkey FOREIGN KEY (cidadao_id) REFERENCES public.cidadaos(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: inscricoes inscricoes_curso_exame_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscricoes
    ADD CONSTRAINT inscricoes_curso_exame_id_fkey FOREIGN KEY (curso_exame_id) REFERENCES public.cursos_exames(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: manutencoes_caminhao manutencoes_caminhao_caminhao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manutencoes_caminhao
    ADD CONSTRAINT manutencoes_caminhao_caminhao_id_fkey FOREIGN KEY (caminhao_id) REFERENCES public.caminhoes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: movimentacoes_estoque movimentacoes_estoque_acao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimentacoes_estoque
    ADD CONSTRAINT movimentacoes_estoque_acao_id_fkey FOREIGN KEY (acao_id) REFERENCES public.acoes(id);


--
-- Name: movimentacoes_estoque movimentacoes_estoque_caminhao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimentacoes_estoque
    ADD CONSTRAINT movimentacoes_estoque_caminhao_id_fkey FOREIGN KEY (caminhao_id) REFERENCES public.caminhoes(id);


--
-- Name: movimentacoes_estoque movimentacoes_estoque_motorista_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimentacoes_estoque
    ADD CONSTRAINT movimentacoes_estoque_motorista_id_fkey FOREIGN KEY (motorista_id) REFERENCES public.funcionarios(id);


--
-- Name: noticias noticias_acao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.noticias
    ADD CONSTRAINT noticias_acao_id_fkey FOREIGN KEY (acao_id) REFERENCES public.acoes(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: notificacoes notificacoes_acao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificacoes
    ADD CONSTRAINT notificacoes_acao_id_fkey FOREIGN KEY (acao_id) REFERENCES public.acoes(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: pontos_medicos pontos_medicos_acao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pontos_medicos
    ADD CONSTRAINT pontos_medicos_acao_id_fkey FOREIGN KEY (acao_id) REFERENCES public.acoes(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: pontos_medicos pontos_medicos_funcionario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pontos_medicos
    ADD CONSTRAINT pontos_medicos_funcionario_id_fkey FOREIGN KEY (funcionario_id) REFERENCES public.funcionarios(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: resultados_exames resultados_exames_acao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resultados_exames
    ADD CONSTRAINT resultados_exames_acao_id_fkey FOREIGN KEY (acao_id) REFERENCES public.acoes(id) ON UPDATE CASCADE;


--
-- Name: resultados_exames resultados_exames_cidadao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resultados_exames
    ADD CONSTRAINT resultados_exames_cidadao_id_fkey FOREIGN KEY (cidadao_id) REFERENCES public.cidadaos(id) ON UPDATE CASCADE;


--
-- Name: resultados_exames resultados_exames_exame_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resultados_exames
    ADD CONSTRAINT resultados_exames_exame_id_fkey FOREIGN KEY (exame_id) REFERENCES public.exames(id) ON UPDATE CASCADE;


--
-- Name: resultados_exames resultados_exames_inscricao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resultados_exames
    ADD CONSTRAINT resultados_exames_inscricao_id_fkey FOREIGN KEY (inscricao_id) REFERENCES public.inscricoes(id) ON UPDATE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict jbD8TeLP2Bt2VepU3KaV9je9f1uFGV6TYfL9WWfGFvYEB9XhLzXhqqP9xtZFRJw

