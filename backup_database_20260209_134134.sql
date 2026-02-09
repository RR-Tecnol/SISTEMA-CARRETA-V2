--
-- PostgreSQL database dump
--

\restrict YgwgebnkkK43M2yKVjXPFwqdAIcfePq66wI2B6jImMviPuKlccKWuHx7ymFEabH

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
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: enum_acoes_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_acoes_status AS ENUM (
    'planejada',
    'ativa',
    'concluida'
);


ALTER TYPE public.enum_acoes_status OWNER TO postgres;

--
-- Name: enum_acoes_tipo; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_acoes_tipo AS ENUM (
    'curso',
    'saude'
);


ALTER TYPE public.enum_acoes_tipo OWNER TO postgres;

--
-- Name: enum_cidadaos_genero; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_cidadaos_genero AS ENUM (
    'masculino',
    'feminino',
    'outro',
    'nao_declarado'
);


ALTER TYPE public.enum_cidadaos_genero OWNER TO postgres;

--
-- Name: enum_cidadaos_raca; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_cidadaos_raca AS ENUM (
    'branca',
    'preta',
    'parda',
    'amarela',
    'indigena',
    'nao_declarada'
);


ALTER TYPE public.enum_cidadaos_raca OWNER TO postgres;

--
-- Name: enum_configuracoes_campo_entidade; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_configuracoes_campo_entidade AS ENUM (
    'instituicao',
    'acao',
    'cidadao',
    'curso_exame'
);


ALTER TYPE public.enum_configuracoes_campo_entidade OWNER TO postgres;

--
-- Name: enum_configuracoes_campo_tipo; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_configuracoes_campo_tipo AS ENUM (
    'text',
    'number',
    'date',
    'select',
    'checkbox'
);


ALTER TYPE public.enum_configuracoes_campo_tipo OWNER TO postgres;

--
-- Name: enum_contas_pagar_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_contas_pagar_status AS ENUM (
    'pendente',
    'paga',
    'vencida',
    'cancelada'
);


ALTER TYPE public.enum_contas_pagar_status OWNER TO postgres;

--
-- Name: enum_contas_pagar_tipo_conta; Type: TYPE; Schema: public; Owner: postgres
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


ALTER TYPE public.enum_contas_pagar_tipo_conta OWNER TO postgres;

--
-- Name: enum_cursos_exames_tipo; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_cursos_exames_tipo AS ENUM (
    'curso',
    'exame'
);


ALTER TYPE public.enum_cursos_exames_tipo OWNER TO postgres;

--
-- Name: enum_custos_acoes_tipo_custo; Type: TYPE; Schema: public; Owner: postgres
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


ALTER TYPE public.enum_custos_acoes_tipo_custo OWNER TO postgres;

--
-- Name: enum_insumos_categoria; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_insumos_categoria AS ENUM (
    'EPI',
    'MEDICAMENTO',
    'MATERIAL_DESCARTAVEL',
    'EQUIPAMENTO',
    'OUTROS'
);


ALTER TYPE public.enum_insumos_categoria OWNER TO postgres;

--
-- Name: enum_movimentacoes_estoque_tipo; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_movimentacoes_estoque_tipo AS ENUM (
    'ENTRADA',
    'SAIDA',
    'TRANSFERENCIA',
    'AJUSTE',
    'PERDA'
);


ALTER TYPE public.enum_movimentacoes_estoque_tipo OWNER TO postgres;

--
-- Name: enum_notificacoes_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_notificacoes_status AS ENUM (
    'agendada',
    'enviada',
    'erro'
);


ALTER TYPE public.enum_notificacoes_status OWNER TO postgres;

--
-- Name: enum_notificacoes_tipo; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_notificacoes_tipo AS ENUM (
    'whatsapp',
    'email',
    'sms'
);


ALTER TYPE public.enum_notificacoes_tipo OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: SequelizeMeta; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SequelizeMeta" (
    name character varying(255) NOT NULL
);


ALTER TABLE public."SequelizeMeta" OWNER TO postgres;

--
-- Name: abastecimentos; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.abastecimentos OWNER TO postgres;

--
-- Name: COLUMN abastecimentos.litros; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.abastecimentos.litros IS 'Quantidade de litros abastecidos';


--
-- Name: COLUMN abastecimentos.valor_total; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.abastecimentos.valor_total IS 'Valor total pago pelo abastecimento';


--
-- Name: COLUMN abastecimentos.preco_por_litro; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.abastecimentos.preco_por_litro IS 'Pre├ºo por litro (calculado: valor_total / litros)';


--
-- Name: acao_caminhoes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.acao_caminhoes (
    id uuid NOT NULL,
    acao_id uuid NOT NULL,
    caminhao_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.acao_caminhoes OWNER TO postgres;

--
-- Name: acao_curso_exame; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.acao_curso_exame (
    id uuid NOT NULL,
    acao_id uuid NOT NULL,
    curso_exame_id uuid NOT NULL,
    vagas integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.acao_curso_exame OWNER TO postgres;

--
-- Name: acao_funcionarios; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.acao_funcionarios OWNER TO postgres;

--
-- Name: acoes; Type: TABLE; Schema: public; Owner: postgres
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
    nome character varying(255) NOT NULL
);


ALTER TABLE public.acoes OWNER TO postgres;

--
-- Name: COLUMN acoes.distancia_km; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.acoes.distancia_km IS 'Dist├óncia em km de S├úo Lu├¡s at├® o munic├¡pio da a├º├úo';


--
-- Name: COLUMN acoes.preco_combustivel_referencia; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.acoes.preco_combustivel_referencia IS 'Pre├ºo de refer├¬ncia do combust├¡vel em R$/litro';


--
-- Name: COLUMN acoes.permitir_inscricao_previa; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.acoes.permitir_inscricao_previa IS 'Permite inscri├º├úo antecipada para esta a├º├úo';


--
-- Name: acoes_insumos; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.acoes_insumos OWNER TO postgres;

--
-- Name: COLUMN acoes_insumos.quantidade_planejada; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.acoes_insumos.quantidade_planejada IS 'Quantidade planejada para a a├º├úo';


--
-- Name: COLUMN acoes_insumos.quantidade_levada; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.acoes_insumos.quantidade_levada IS 'Quantidade que o motorista levou';


--
-- Name: COLUMN acoes_insumos.quantidade_utilizada; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.acoes_insumos.quantidade_utilizada IS 'Quantidade efetivamente utilizada na a├º├úo';


--
-- Name: COLUMN acoes_insumos.quantidade_retornada; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.acoes_insumos.quantidade_retornada IS 'Quantidade que retornou ap├│s a a├º├úo';


--
-- Name: acoes_numero_acao_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.acoes_numero_acao_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.acoes_numero_acao_seq OWNER TO postgres;

--
-- Name: acoes_numero_acao_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.acoes_numero_acao_seq OWNED BY public.acoes.numero_acao;


--
-- Name: caminhoes; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.caminhoes OWNER TO postgres;

--
-- Name: COLUMN caminhoes.km_por_litro; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.caminhoes.km_por_litro IS 'Autonomia do caminh├úo em km por litro';


--
-- Name: cidadaos; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.cidadaos OWNER TO postgres;

--
-- Name: COLUMN cidadaos.cartao_sus; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.cidadaos.cartao_sus IS 'N├║mero do Cart├úo Nacional de Sa├║de (CNS)';


--
-- Name: configuracoes_campo; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.configuracoes_campo OWNER TO postgres;

--
-- Name: contas_pagar; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.contas_pagar OWNER TO postgres;

--
-- Name: COLUMN contas_pagar.comprovante_url; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.contas_pagar.comprovante_url IS 'URL do comprovante de pagamento';


--
-- Name: COLUMN contas_pagar.recorrente; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.contas_pagar.recorrente IS 'Indica se a conta ├® recorrente (mensal)';


--
-- Name: cursos_exames; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cursos_exames (
    id uuid NOT NULL,
    nome character varying(255) NOT NULL,
    tipo public.enum_cursos_exames_tipo NOT NULL,
    carga_horaria integer,
    descricao text,
    requisitos text,
    certificadora character varying(255),
    ativo boolean DEFAULT true NOT NULL
);


ALTER TABLE public.cursos_exames OWNER TO postgres;

--
-- Name: custos_acoes; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.custos_acoes OWNER TO postgres;

--
-- Name: COLUMN custos_acoes.comprovante_url; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.custos_acoes.comprovante_url IS 'URL do comprovante de despesa';


--
-- Name: estoque_caminhoes; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.estoque_caminhoes OWNER TO postgres;

--
-- Name: COLUMN estoque_caminhoes.quantidade; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.estoque_caminhoes.quantidade IS 'Quantidade atual do insumo no caminh├úo';


--
-- Name: exames; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.exames OWNER TO postgres;

--
-- Name: COLUMN exames.tipo_exame; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.exames.tipo_exame IS 'Tipo do exame: sangue, urina, imagem, etc.';


--
-- Name: COLUMN exames.instrucoes_preparo; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.exames.instrucoes_preparo IS 'Instru├º├Áes de preparo para o exame (ex: jejum de 12h)';


--
-- Name: COLUMN exames.valores_referencia; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.exames.valores_referencia IS 'Valores de refer├¬ncia normais para o exame';


--
-- Name: COLUMN exames.custo_base; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.exames.custo_base IS 'Custo base estimado do exame';


--
-- Name: funcionarios; Type: TABLE; Schema: public; Owner: postgres
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
    ativo boolean DEFAULT true
);


ALTER TABLE public.funcionarios OWNER TO postgres;

--
-- Name: inscricoes; Type: TABLE; Schema: public; Owner: postgres
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
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.inscricoes OWNER TO postgres;

--
-- Name: instituicoes; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.instituicoes OWNER TO postgres;

--
-- Name: insumos; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.insumos OWNER TO postgres;

--
-- Name: COLUMN insumos.nome; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.insumos.nome IS 'Nome do insumo (ex: Luvas descart├íveis, M├íscaras N95)';


--
-- Name: COLUMN insumos.descricao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.insumos.descricao IS 'Descri├º├úo detalhada do insumo';


--
-- Name: COLUMN insumos.categoria; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.insumos.categoria IS 'Categoria do insumo';


--
-- Name: COLUMN insumos.unidade; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.insumos.unidade IS 'Unidade de medida: unidade, caixa, litro, kg, etc.';


--
-- Name: COLUMN insumos.quantidade_minima; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.insumos.quantidade_minima IS 'Quantidade m├¡nima para alerta de estoque baixo';


--
-- Name: COLUMN insumos.quantidade_atual; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.insumos.quantidade_atual IS 'Quantidade atual em estoque';


--
-- Name: COLUMN insumos.preco_unitario; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.insumos.preco_unitario IS 'Pre├ºo unit├írio m├®dio do insumo';


--
-- Name: COLUMN insumos.codigo_barras; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.insumos.codigo_barras IS 'C├│digo de barras do produto';


--
-- Name: COLUMN insumos.lote; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.insumos.lote IS 'N├║mero do lote';


--
-- Name: COLUMN insumos.data_validade; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.insumos.data_validade IS 'Data de validade do lote';


--
-- Name: COLUMN insumos.fornecedor; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.insumos.fornecedor IS 'Nome do fornecedor';


--
-- Name: COLUMN insumos.nota_fiscal; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.insumos.nota_fiscal IS 'N├║mero da nota fiscal de entrada';


--
-- Name: COLUMN insumos.data_entrada; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.insumos.data_entrada IS 'Data de entrada no estoque';


--
-- Name: COLUMN insumos.localizacao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.insumos.localizacao IS 'Localiza├º├úo f├¡sica no estoque (prateleira, setor)';


--
-- Name: movimentacoes_estoque; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.movimentacoes_estoque OWNER TO postgres;

--
-- Name: COLUMN movimentacoes_estoque.tipo; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.movimentacoes_estoque.tipo IS 'Tipo de movimenta├º├úo do estoque';


--
-- Name: COLUMN movimentacoes_estoque.quantidade; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.movimentacoes_estoque.quantidade IS 'Quantidade movimentada';


--
-- Name: COLUMN movimentacoes_estoque.quantidade_anterior; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.movimentacoes_estoque.quantidade_anterior IS 'Quantidade antes da movimenta├º├úo';


--
-- Name: COLUMN movimentacoes_estoque.quantidade_atual; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.movimentacoes_estoque.quantidade_atual IS 'Quantidade ap├│s a movimenta├º├úo';


--
-- Name: COLUMN movimentacoes_estoque.origem; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.movimentacoes_estoque.origem IS 'Origem (CAPITAL, caminhao_id, acao_id)';


--
-- Name: COLUMN movimentacoes_estoque.destino; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.movimentacoes_estoque.destino IS 'Destino (CAPITAL, caminhao_id, acao_id)';


--
-- Name: COLUMN movimentacoes_estoque.nota_fiscal; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.movimentacoes_estoque.nota_fiscal IS 'N├║mero da nota fiscal relacionada';


--
-- Name: COLUMN movimentacoes_estoque.usuario_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.movimentacoes_estoque.usuario_id IS 'ID do usu├írio que realizou a movimenta├º├úo';


--
-- Name: noticias; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.noticias OWNER TO postgres;

--
-- Name: notificacoes; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.notificacoes OWNER TO postgres;

--
-- Name: resultados_exames; Type: TABLE; Schema: public; Owner: postgres
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
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.resultados_exames OWNER TO postgres;

--
-- Name: COLUMN resultados_exames.resultado; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.resultados_exames.resultado IS 'Resultado textual do exame';


--
-- Name: COLUMN resultados_exames.arquivo_resultado_url; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.resultados_exames.arquivo_resultado_url IS 'URL do arquivo PDF com o resultado completo';


--
-- Data for Name: SequelizeMeta; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SequelizeMeta" (name) FROM stdin;
\.


--
-- Data for Name: abastecimentos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.abastecimentos (id, acao_id, caminhao_id, data_abastecimento, litros, valor_total, preco_por_litro, observacoes, created_at, updated_at) FROM stdin;
441e2b16-f455-4a2b-accf-fd884a8aa251	a5695469-45ec-41a0-ab7f-14f5447a93de	6e0bba4d-29c3-43d4-8e6d-02ad332f3683	2026-02-08 00:00:00+00	50.00	300.00	6.000		2026-02-08 18:52:54.888+00	2026-02-08 18:52:54.888+00
7a927b36-290b-48ef-85e4-2283f169e2e6	a5695469-45ec-41a0-ab7f-14f5447a93de	6e0bba4d-29c3-43d4-8e6d-02ad332f3683	2026-02-08 00:00:00+00	50.00	300.00	6.000		2026-02-08 22:42:23.167+00	2026-02-08 22:42:23.167+00
eac6c443-280c-4f3f-b03f-f4853d9a9ff2	53df1c14-a0b7-49ed-9292-607e4f17b15e	6e0bba4d-29c3-43d4-8e6d-02ad332f3683	2026-02-09 00:00:00+00	50.00	300.00	6.000		2026-02-09 16:10:52.116+00	2026-02-09 16:10:52.116+00
\.


--
-- Data for Name: acao_caminhoes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.acao_caminhoes (id, acao_id, caminhao_id, created_at, updated_at) FROM stdin;
0d633bf1-9813-4d50-a551-f659d4a15eda	0d56a264-3f0e-4ae6-a143-757fbe8ec71c	a5efd07f-12cf-4289-a55f-fb758ebdec53	2026-02-08 16:57:39.694+00	2026-02-08 16:57:39.694+00
2a482724-f033-428a-9f18-a16311b89c7f	a5695469-45ec-41a0-ab7f-14f5447a93de	6e0bba4d-29c3-43d4-8e6d-02ad332f3683	2026-02-08 17:20:07.51+00	2026-02-08 17:20:07.51+00
bf925be5-de0b-4b14-88b3-32c6539b730d	53df1c14-a0b7-49ed-9292-607e4f17b15e	6e0bba4d-29c3-43d4-8e6d-02ad332f3683	2026-02-09 16:10:37.605+00	2026-02-09 16:10:37.605+00
\.


--
-- Data for Name: acao_curso_exame; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.acao_curso_exame (id, acao_id, curso_exame_id, vagas, created_at, updated_at) FROM stdin;
7a40c52c-4c27-49d8-991e-3a71946b368d	53df1c14-a0b7-49ed-9292-607e4f17b15e	be4727af-2919-40a8-8284-e827b41eb93d	100	2026-02-07 19:39:00.638+00	2026-02-07 19:39:00.638+00
3ad4c181-6423-4176-bfa3-b72824e01e10	0d56a264-3f0e-4ae6-a143-757fbe8ec71c	be4727af-2919-40a8-8284-e827b41eb93d	50	2026-02-07 20:47:36.495+00	2026-02-07 20:47:36.495+00
e820167a-58f2-4539-bf30-0f10760ced7f	13fcfd57-07c6-418e-a130-f4ff0cf9095d	be4727af-2919-40a8-8284-e827b41eb93d	18	2026-02-08 16:37:43.364+00	2026-02-08 16:37:43.364+00
1e835ad3-e02e-44a5-a5b6-33b91527490b	a5695469-45ec-41a0-ab7f-14f5447a93de	be4727af-2919-40a8-8284-e827b41eb93d	10	2026-02-08 17:03:49.193+00	2026-02-08 17:03:49.193+00
\.


--
-- Data for Name: acao_funcionarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.acao_funcionarios (id, acao_id, funcionario_id, created_at, updated_at, valor_diaria, dias_trabalhados) FROM stdin;
340be89e-ec6b-4001-b44e-806878fc40f3	53df1c14-a0b7-49ed-9292-607e4f17b15e	8c4c4416-1e09-4000-b595-65f1b9f6e9de	2026-02-09 16:04:01.652+00	2026-02-09 16:04:01.652+00	200.00	4
cb8b8e57-d86c-4287-b197-adcb4828c21b	a5695469-45ec-41a0-ab7f-14f5447a93de	8c4c4416-1e09-4000-b595-65f1b9f6e9de	2026-02-09 16:25:52.382+00	2026-02-09 16:25:58.132+00	200.00	2
1cee335a-2928-44cd-840a-d9e548faaa84	13fcfd57-07c6-418e-a130-f4ff0cf9095d	ccd3a81c-da61-4856-b769-7f8009b8761e	2026-02-09 16:26:28.726+00	2026-02-09 16:26:34.756+00	150.00	2
ebea7685-7a67-45c7-ac22-830dce3af3c3	13fcfd57-07c6-418e-a130-f4ff0cf9095d	6dba833e-0ceb-444a-84dc-7cf27e542145	2026-02-09 16:27:32.983+00	2026-02-09 16:27:46.421+00	600.00	1
2ba3369e-0733-4250-b5f3-23c2fa2bcc30	0d56a264-3f0e-4ae6-a143-757fbe8ec71c	8c4c4416-1e09-4000-b595-65f1b9f6e9de	2026-02-09 16:27:58.456+00	2026-02-09 16:27:58.456+00	200.00	4
\.


--
-- Data for Name: acoes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.acoes (id, numero_acao, instituicao_id, tipo, municipio, estado, data_inicio, data_fim, status, descricao, local_execucao, vagas_disponiveis, distancia_km, preco_combustivel_referencia, campos_customizados, created_at, updated_at, permitir_inscricao_previa, nome) FROM stdin;
0d56a264-3f0e-4ae6-a143-757fbe8ec71c	2	d2120645-e88f-4c12-a31c-0f60c2ddacbe	saude	Sao Luis	MA	2026-02-06	2026-02-09	planejada		Renascen├ºa	50	1000	7.000	{}	2026-02-07 20:47:36.444+00	2026-02-07 20:47:36.444+00	t	Campanha de Exame de Vista
53df1c14-a0b7-49ed-9292-607e4f17b15e	1	d2120645-e88f-4c12-a31c-0f60c2ddacbe	saude	Sao Luis	MA	2026-02-06	2026-02-09	planejada		Renascen├ºa	100	100	6.000	{}	2026-02-07 19:39:00.584+00	2026-02-08 16:00:33.208+00	t	Campanha de Hemograma
13fcfd57-07c6-418e-a130-f4ff0cf9095d	3	d2120645-e88f-4c12-a31c-0f60c2ddacbe	saude	Sao Luis	MT	2026-05-03	2026-06-04	planejada		Renascen├ºa	45	500	6.000	{}	2026-02-08 16:37:43.308+00	2026-02-08 16:37:43.308+00	t	Campanha de Hemograma
a5695469-45ec-41a0-ab7f-14f5447a93de	4	d2120645-e88f-4c12-a31c-0f60c2ddacbe	saude	Sao Luis	PA	2026-05-04	2026-08-04	planejada	teste	Renascen├ºa	200	500	6.000	{}	2026-02-08 17:03:49.171+00	2026-02-08 17:03:49.171+00	t	Campanha de Hemograma
\.


--
-- Data for Name: acoes_insumos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.acoes_insumos (id, acao_id, insumo_id, quantidade_planejada, quantidade_levada, quantidade_utilizada, quantidade_retornada, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: caminhoes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.caminhoes (id, placa, modelo, ano, km_por_litro, capacidade_litros, status, created_at, updated_at) FROM stdin;
a5efd07f-12cf-4289-a55f-fb758ebdec53	trv-5232	FORD	2026	8.00	110	em_manutencao	2026-02-08 14:05:30.406+00	2026-02-08 15:29:50.811+00
6e0bba4d-29c3-43d4-8e6d-02ad332f3683	XHL-1012	wolks	2014	8.50	80	disponivel	2026-02-08 17:06:41.912+00	2026-02-08 17:06:41.912+00
\.


--
-- Data for Name: cidadaos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cidadaos (id, cpf, nome_completo, data_nascimento, telefone, email, senha, tipo, municipio, estado, cep, rua, numero, complemento, bairro, campos_customizados, consentimento_lgpd, data_consentimento, ip_consentimento, reset_password_token, reset_password_expires, foto_perfil, created_at, updated_at, cartao_sus, raca, genero, nome_mae) FROM stdin;
c4076994-4fa1-40ba-9123-b697c7bc2ae5	000.000.000-00	Administrador do Sistema	1989-12-31	(00) 00000-0000	admin@sistemacarretas.com	$2b$10$XonP.sI2QulrH.GpcUzJ5exNXtweEumBGsAW0BtDwE4oyg4f92Mui	admin	S├úo Lu├¡s	MA	\N	\N	\N	\N	\N	{}	t	2026-02-06 17:54:41.7+00	127.0.0.1	\N	\N	\N	2026-02-06 17:54:41.713+00	2026-02-06 17:54:41.713+00	\N	\N	\N	\N
00ac8f50-e95e-4312-9b07-28fb94d6ac2e	111.111.111-11	Administrador do Sistema	1989-12-31	(98) 98888-8888	admin@sistemacarretas.com	$2b$10$9zrhSyUDDLB6HlH1JKZB5uug1wSbE6/FqHC4wqdNA4HLViNV.5DuK	admin	S├úo Lu├¡s	MA	\N	\N	\N	\N	\N	{}	t	2026-02-06 18:23:13.848+00	127.0.0.1	\N	\N	\N	2026-02-06 18:23:13.86+00	2026-02-06 18:23:13.86+00	\N	\N	\N	\N
c2b582f1-027b-4402-987c-870637f8a291	123.456.789-09	Administrador System Truck	1989-12-31	(98) 98888-8888	admin@systemtruck.com	$2b$10$YvCXfT9O/8CWbnwICjSw4.aptyXO/chu43dUumRHOtSrNKklB0yRK	admin	S├úo Lu├¡s	MA	\N	\N	\N	\N	\N	{}	t	2026-02-06 18:26:56.655+00	127.0.0.1	\N	\N	\N	2026-02-06 18:26:56.67+00	2026-02-06 19:03:58.953657+00	\N	\N	\N	\N
d27c86e1-4249-4bfa-b678-223942b73224	012.192.083-61	joao baluz	1993-05-06	98982450008	joaobaluz@gmail.com	123456	cidadao	S├úo Lu├¡s	MA	665065410	\N	2	jardiomi paulista	olho d'agua	{}	f	\N	\N	\N	\N	\N	2026-02-09 16:35:55.52+00	2026-02-09 16:35:55.52+00	\N	branca	\N	rita baluz
\.


--
-- Data for Name: configuracoes_campo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.configuracoes_campo (id, entidade, nome_campo, tipo, obrigatorio, mascara, validacao_regex, opcoes, ordem_exibicao, ativo) FROM stdin;
\.


--
-- Data for Name: contas_pagar; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contas_pagar (id, tipo_conta, descricao, valor, data_vencimento, data_pagamento, status, comprovante_url, recorrente, observacoes, created_at, updated_at, tipo_espontaneo, acao_id, cidade, caminhao_id) FROM stdin;
2bbd298e-7e39-44cd-b924-fda7e0e162e6	pneu_furado		100.00	2026-02-04 00:00:00+00	\N	paga	\N	f		2026-02-08 16:46:30.477+00	2026-02-08 16:46:30.477+00	\N	\N	\N	\N
7a039957-6ec4-4a3b-8086-90569babc0c8	pneu_furado	pneu furou indo para imperatriz na br	500.00	2026-02-09 00:00:00+00	\N	paga	\N	f	teste	2026-02-08 16:50:36.817+00	2026-02-08 16:50:36.817+00	\N	\N	\N	\N
a403864a-8c9f-49ed-a574-a286ae512678	energia		50.00	2026-02-01 00:00:00+00	\N	vencida	\N	f		2026-02-08 17:04:41.862+00	2026-02-08 17:04:41.862+00	\N	\N	\N	\N
b2e7c641-15f9-44ca-890a-4699b330d51c	troca_oleo	troca de oleo 	120.00	2026-05-04 00:00:00+00	\N	pendente	\N	f		2026-02-08 17:02:19.462+00	2026-02-08 18:44:24.583+00	\N	\N	\N	\N
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
\.


--
-- Data for Name: cursos_exames; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cursos_exames (id, nome, tipo, carga_horaria, descricao, requisitos, certificadora, ativo) FROM stdin;
8770c188-5c28-442c-92b8-b3e3c9ccf2a3	Exame de Vista	exame	\N	\N	\N	\N	t
be4727af-2919-40a8-8284-e827b41eb93d	hemograma	exame	\N	\N	\N	\N	t
\.


--
-- Data for Name: custos_acoes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.custos_acoes (id, acao_id, tipo_custo, descricao, valor, data_custo, comprovante_url, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: estoque_caminhoes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.estoque_caminhoes (id, caminhao_id, insumo_id, quantidade, ultima_atualizacao, created_at, updated_at) FROM stdin;
6d0ef5e5-e197-4627-8f7f-04d5381c30e1	a5efd07f-12cf-4289-a55f-fb758ebdec53	e14bd579-1896-4809-b418-479c39dd3381	5	2026-02-08 21:08:22.469+00	2026-02-08 21:08:22.469+00	2026-02-08 21:08:22.469+00
caf0c2a3-8efd-46ef-b00d-975c797f53b9	6e0bba4d-29c3-43d4-8e6d-02ad332f3683	dab32be1-4363-44c9-b97f-c370e7c0bcad	5	2026-02-08 21:08:44.212+00	2026-02-08 21:08:44.212+00	2026-02-08 21:08:44.212+00
\.


--
-- Data for Name: exames; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.exames (id, nome, tipo_exame, laboratorio_referencia, instrucoes_preparo, valores_referencia, custo_base, ativo, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: funcionarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.funcionarios (id, nome, cargo, especialidade, custo_diaria, created_at, updated_at, cpf, telefone, email, ativo) FROM stdin;
ccd3a81c-da61-4856-b769-7f8009b8761e	gabriel diniz	motorista	Caminh├Áes	150.00	2026-02-08 17:13:17.007+00	2026-02-08 17:23:10.53+00	11144477735	9888888888	gg@gmail.com	t
8c4c4416-1e09-4000-b595-65f1b9f6e9de	Jo├úo Baluz	M├®dico	Clinico Geral	200.00	2026-02-08 17:37:19.43+00	2026-02-08 17:37:19.43+00	01219208361	98982450008	joaobaluz@gmail.com	t
6dba833e-0ceb-444a-84dc-7cf27e542145	Ronaldo	Auiliar	chefe	600.00	2026-02-09 16:27:23.225+00	2026-02-09 16:27:23.225+00	22244477736	98999999999	rrtecnol@rrtecnol.com.br	t
\.


--
-- Data for Name: inscricoes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inscricoes (id, cidadao_id, acao_id, curso_exame_id, status, data_inscricao, observacoes, campos_customizados, created_at, updated_at) FROM stdin;
2586f2b3-2d71-471b-96db-b36f06385f31	d27c86e1-4249-4bfa-b678-223942b73224	a5695469-45ec-41a0-ab7f-14f5447a93de	be4727af-2919-40a8-8284-e827b41eb93d	pendente	2026-02-09 16:36:19.33+00	\N	{}	2026-02-09 16:36:19.331+00	2026-02-09 16:36:19.331+00
\.


--
-- Data for Name: instituicoes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.instituicoes (id, razao_social, cnpj, responsavel_nome, responsavel_email, responsavel_tel, endereco_completo, campos_customizados, ativo, created_at, updated_at) FROM stdin;
d2120645-e88f-4c12-a31c-0f60c2ddacbe	SENAI - S├âO LUIS	10566.16816814	joao gabriel 	joaogabrieldiniz2307@gmail.com	98987272826	Rua bento freitas	{}	t	2026-02-07 19:37:52.905+00	2026-02-07 19:37:52.905+00
\.


--
-- Data for Name: insumos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.insumos (id, nome, descricao, categoria, unidade, quantidade_minima, quantidade_atual, preco_unitario, codigo_barras, lote, data_validade, fornecedor, nota_fiscal, data_entrada, localizacao, ativo, created_at, updated_at) FROM stdin;
26b817e4-12df-4627-92d0-5b187cad6e18	luva sintetica	\N	MATERIAL_DESCARTAVEL	caixa	10	50	\N	564684	45	\N	Gov Ma	\N	\N	mesa 2	t	2026-02-08 19:23:39.359+00	2026-02-08 20:07:22.938+00
dab32be1-4363-44c9-b97f-c370e7c0bcad	Mascara	\N	OUTROS	caixa	10	95	\N	561531	25	2027-01-20 00:00:00+00	GOV MA	\N	\N	Gaveta 02	t	2026-02-08 20:12:11.952+00	2026-02-08 21:08:44.209+00
e14bd579-1896-4809-b418-479c39dd3381	Luvas Descartaveis	\N	EPI	caixa	10	5	\N	\N	\N	2026-02-09 00:00:00+00	\N	\N	\N	\N	t	2026-02-08 19:30:14.45+00	2026-02-08 21:59:51.737+00
\.


--
-- Data for Name: movimentacoes_estoque; Type: TABLE DATA; Schema: public; Owner: postgres
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
\.


--
-- Data for Name: noticias; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.noticias (id, titulo, conteudo, imagem_url, acao_id, destaque, data_publicacao, campos_customizados, ativo, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: notificacoes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notificacoes (id, acao_id, tipo, template, destinatarios_filtro, agendamento, status, estatisticas, sent_at, created_at) FROM stdin;
\.


--
-- Data for Name: resultados_exames; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.resultados_exames (id, inscricao_id, exame_id, cidadao_id, acao_id, data_realizacao, resultado, arquivo_resultado_url, observacoes, created_at, updated_at) FROM stdin;
\.


--
-- Name: acoes_numero_acao_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.acoes_numero_acao_seq', 4, true);


--
-- Name: SequelizeMeta SequelizeMeta_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SequelizeMeta"
    ADD CONSTRAINT "SequelizeMeta_pkey" PRIMARY KEY (name);


--
-- Name: abastecimentos abastecimentos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.abastecimentos
    ADD CONSTRAINT abastecimentos_pkey PRIMARY KEY (id);


--
-- Name: acao_caminhoes acao_caminhoes_acao_id_caminhao_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.acao_caminhoes
    ADD CONSTRAINT acao_caminhoes_acao_id_caminhao_id_key UNIQUE (acao_id, caminhao_id);


--
-- Name: acao_caminhoes acao_caminhoes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.acao_caminhoes
    ADD CONSTRAINT acao_caminhoes_pkey PRIMARY KEY (id);


--
-- Name: acao_curso_exame acao_curso_exame_acao_id_curso_exame_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.acao_curso_exame
    ADD CONSTRAINT acao_curso_exame_acao_id_curso_exame_id_key UNIQUE (acao_id, curso_exame_id);


--
-- Name: acao_curso_exame acao_curso_exame_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.acao_curso_exame
    ADD CONSTRAINT acao_curso_exame_pkey PRIMARY KEY (id);


--
-- Name: acao_funcionarios acao_funcionarios_acao_id_funcionario_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.acao_funcionarios
    ADD CONSTRAINT acao_funcionarios_acao_id_funcionario_id_key UNIQUE (acao_id, funcionario_id);


--
-- Name: acao_funcionarios acao_funcionarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.acao_funcionarios
    ADD CONSTRAINT acao_funcionarios_pkey PRIMARY KEY (id);


--
-- Name: acoes_insumos acoes_insumos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.acoes_insumos
    ADD CONSTRAINT acoes_insumos_pkey PRIMARY KEY (id);


--
-- Name: acoes acoes_numero_acao_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.acoes
    ADD CONSTRAINT acoes_numero_acao_key UNIQUE (numero_acao);


--
-- Name: acoes acoes_numero_acao_key1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.acoes
    ADD CONSTRAINT acoes_numero_acao_key1 UNIQUE (numero_acao);


--
-- Name: acoes acoes_numero_acao_key2; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.acoes
    ADD CONSTRAINT acoes_numero_acao_key2 UNIQUE (numero_acao);


--
-- Name: acoes acoes_numero_acao_key3; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.acoes
    ADD CONSTRAINT acoes_numero_acao_key3 UNIQUE (numero_acao);


--
-- Name: acoes acoes_numero_acao_key4; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.acoes
    ADD CONSTRAINT acoes_numero_acao_key4 UNIQUE (numero_acao);


--
-- Name: acoes acoes_numero_acao_key5; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.acoes
    ADD CONSTRAINT acoes_numero_acao_key5 UNIQUE (numero_acao);


--
-- Name: acoes acoes_numero_acao_key6; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.acoes
    ADD CONSTRAINT acoes_numero_acao_key6 UNIQUE (numero_acao);


--
-- Name: acoes acoes_numero_acao_key7; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.acoes
    ADD CONSTRAINT acoes_numero_acao_key7 UNIQUE (numero_acao);


--
-- Name: acoes acoes_numero_acao_key8; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.acoes
    ADD CONSTRAINT acoes_numero_acao_key8 UNIQUE (numero_acao);


--
-- Name: acoes acoes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.acoes
    ADD CONSTRAINT acoes_pkey PRIMARY KEY (id);


--
-- Name: caminhoes caminhoes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.caminhoes
    ADD CONSTRAINT caminhoes_pkey PRIMARY KEY (id);


--
-- Name: caminhoes caminhoes_placa_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.caminhoes
    ADD CONSTRAINT caminhoes_placa_key UNIQUE (placa);


--
-- Name: caminhoes caminhoes_placa_key1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.caminhoes
    ADD CONSTRAINT caminhoes_placa_key1 UNIQUE (placa);


--
-- Name: caminhoes caminhoes_placa_key2; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.caminhoes
    ADD CONSTRAINT caminhoes_placa_key2 UNIQUE (placa);


--
-- Name: caminhoes caminhoes_placa_key3; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.caminhoes
    ADD CONSTRAINT caminhoes_placa_key3 UNIQUE (placa);


--
-- Name: caminhoes caminhoes_placa_key4; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.caminhoes
    ADD CONSTRAINT caminhoes_placa_key4 UNIQUE (placa);


--
-- Name: caminhoes caminhoes_placa_key5; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.caminhoes
    ADD CONSTRAINT caminhoes_placa_key5 UNIQUE (placa);


--
-- Name: caminhoes caminhoes_placa_key6; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.caminhoes
    ADD CONSTRAINT caminhoes_placa_key6 UNIQUE (placa);


--
-- Name: cidadaos cidadaos_cpf_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cidadaos
    ADD CONSTRAINT cidadaos_cpf_key UNIQUE (cpf);


--
-- Name: cidadaos cidadaos_cpf_key1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cidadaos
    ADD CONSTRAINT cidadaos_cpf_key1 UNIQUE (cpf);


--
-- Name: cidadaos cidadaos_cpf_key2; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cidadaos
    ADD CONSTRAINT cidadaos_cpf_key2 UNIQUE (cpf);


--
-- Name: cidadaos cidadaos_cpf_key3; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cidadaos
    ADD CONSTRAINT cidadaos_cpf_key3 UNIQUE (cpf);


--
-- Name: cidadaos cidadaos_cpf_key4; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cidadaos
    ADD CONSTRAINT cidadaos_cpf_key4 UNIQUE (cpf);


--
-- Name: cidadaos cidadaos_cpf_key5; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cidadaos
    ADD CONSTRAINT cidadaos_cpf_key5 UNIQUE (cpf);


--
-- Name: cidadaos cidadaos_cpf_key6; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cidadaos
    ADD CONSTRAINT cidadaos_cpf_key6 UNIQUE (cpf);


--
-- Name: cidadaos cidadaos_cpf_key7; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cidadaos
    ADD CONSTRAINT cidadaos_cpf_key7 UNIQUE (cpf);


--
-- Name: cidadaos cidadaos_cpf_key8; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cidadaos
    ADD CONSTRAINT cidadaos_cpf_key8 UNIQUE (cpf);


--
-- Name: cidadaos cidadaos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cidadaos
    ADD CONSTRAINT cidadaos_pkey PRIMARY KEY (id);


--
-- Name: configuracoes_campo configuracoes_campo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.configuracoes_campo
    ADD CONSTRAINT configuracoes_campo_pkey PRIMARY KEY (id);


--
-- Name: contas_pagar contas_pagar_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contas_pagar
    ADD CONSTRAINT contas_pagar_pkey PRIMARY KEY (id);


--
-- Name: cursos_exames cursos_exames_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cursos_exames
    ADD CONSTRAINT cursos_exames_pkey PRIMARY KEY (id);


--
-- Name: custos_acoes custos_acoes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.custos_acoes
    ADD CONSTRAINT custos_acoes_pkey PRIMARY KEY (id);


--
-- Name: estoque_caminhoes estoque_caminhoes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.estoque_caminhoes
    ADD CONSTRAINT estoque_caminhoes_pkey PRIMARY KEY (id);


--
-- Name: exames exames_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exames
    ADD CONSTRAINT exames_pkey PRIMARY KEY (id);


--
-- Name: funcionarios funcionarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.funcionarios
    ADD CONSTRAINT funcionarios_pkey PRIMARY KEY (id);


--
-- Name: inscricoes inscricoes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inscricoes
    ADD CONSTRAINT inscricoes_pkey PRIMARY KEY (id);


--
-- Name: instituicoes instituicoes_cnpj_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.instituicoes
    ADD CONSTRAINT instituicoes_cnpj_key UNIQUE (cnpj);


--
-- Name: instituicoes instituicoes_cnpj_key1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.instituicoes
    ADD CONSTRAINT instituicoes_cnpj_key1 UNIQUE (cnpj);


--
-- Name: instituicoes instituicoes_cnpj_key10; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.instituicoes
    ADD CONSTRAINT instituicoes_cnpj_key10 UNIQUE (cnpj);


--
-- Name: instituicoes instituicoes_cnpj_key11; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.instituicoes
    ADD CONSTRAINT instituicoes_cnpj_key11 UNIQUE (cnpj);


--
-- Name: instituicoes instituicoes_cnpj_key12; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.instituicoes
    ADD CONSTRAINT instituicoes_cnpj_key12 UNIQUE (cnpj);


--
-- Name: instituicoes instituicoes_cnpj_key13; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.instituicoes
    ADD CONSTRAINT instituicoes_cnpj_key13 UNIQUE (cnpj);


--
-- Name: instituicoes instituicoes_cnpj_key2; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.instituicoes
    ADD CONSTRAINT instituicoes_cnpj_key2 UNIQUE (cnpj);


--
-- Name: instituicoes instituicoes_cnpj_key3; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.instituicoes
    ADD CONSTRAINT instituicoes_cnpj_key3 UNIQUE (cnpj);


--
-- Name: instituicoes instituicoes_cnpj_key4; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.instituicoes
    ADD CONSTRAINT instituicoes_cnpj_key4 UNIQUE (cnpj);


--
-- Name: instituicoes instituicoes_cnpj_key5; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.instituicoes
    ADD CONSTRAINT instituicoes_cnpj_key5 UNIQUE (cnpj);


--
-- Name: instituicoes instituicoes_cnpj_key6; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.instituicoes
    ADD CONSTRAINT instituicoes_cnpj_key6 UNIQUE (cnpj);


--
-- Name: instituicoes instituicoes_cnpj_key7; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.instituicoes
    ADD CONSTRAINT instituicoes_cnpj_key7 UNIQUE (cnpj);


--
-- Name: instituicoes instituicoes_cnpj_key8; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.instituicoes
    ADD CONSTRAINT instituicoes_cnpj_key8 UNIQUE (cnpj);


--
-- Name: instituicoes instituicoes_cnpj_key9; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.instituicoes
    ADD CONSTRAINT instituicoes_cnpj_key9 UNIQUE (cnpj);


--
-- Name: instituicoes instituicoes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.instituicoes
    ADD CONSTRAINT instituicoes_pkey PRIMARY KEY (id);


--
-- Name: insumos insumos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.insumos
    ADD CONSTRAINT insumos_pkey PRIMARY KEY (id);


--
-- Name: movimentacoes_estoque movimentacoes_estoque_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimentacoes_estoque
    ADD CONSTRAINT movimentacoes_estoque_pkey PRIMARY KEY (id);


--
-- Name: noticias noticias_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.noticias
    ADD CONSTRAINT noticias_pkey PRIMARY KEY (id);


--
-- Name: notificacoes notificacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notificacoes
    ADD CONSTRAINT notificacoes_pkey PRIMARY KEY (id);


--
-- Name: resultados_exames resultados_exames_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resultados_exames
    ADD CONSTRAINT resultados_exames_pkey PRIMARY KEY (id);


--
-- Name: unique_caminhao_insumo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX unique_caminhao_insumo ON public.estoque_caminhoes USING btree (caminhao_id, insumo_id);


--
-- Name: abastecimentos abastecimentos_acao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.abastecimentos
    ADD CONSTRAINT abastecimentos_acao_id_fkey FOREIGN KEY (acao_id) REFERENCES public.acoes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: abastecimentos abastecimentos_caminhao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.abastecimentos
    ADD CONSTRAINT abastecimentos_caminhao_id_fkey FOREIGN KEY (caminhao_id) REFERENCES public.caminhoes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: acao_caminhoes acao_caminhoes_acao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.acao_caminhoes
    ADD CONSTRAINT acao_caminhoes_acao_id_fkey FOREIGN KEY (acao_id) REFERENCES public.acoes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: acao_caminhoes acao_caminhoes_caminhao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.acao_caminhoes
    ADD CONSTRAINT acao_caminhoes_caminhao_id_fkey FOREIGN KEY (caminhao_id) REFERENCES public.caminhoes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: acao_curso_exame acao_curso_exame_acao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.acao_curso_exame
    ADD CONSTRAINT acao_curso_exame_acao_id_fkey FOREIGN KEY (acao_id) REFERENCES public.acoes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: acao_curso_exame acao_curso_exame_curso_exame_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.acao_curso_exame
    ADD CONSTRAINT acao_curso_exame_curso_exame_id_fkey FOREIGN KEY (curso_exame_id) REFERENCES public.cursos_exames(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: acao_funcionarios acao_funcionarios_acao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.acao_funcionarios
    ADD CONSTRAINT acao_funcionarios_acao_id_fkey FOREIGN KEY (acao_id) REFERENCES public.acoes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: acao_funcionarios acao_funcionarios_funcionario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.acao_funcionarios
    ADD CONSTRAINT acao_funcionarios_funcionario_id_fkey FOREIGN KEY (funcionario_id) REFERENCES public.funcionarios(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: acoes acoes_instituicao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.acoes
    ADD CONSTRAINT acoes_instituicao_id_fkey FOREIGN KEY (instituicao_id) REFERENCES public.instituicoes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: acoes_insumos acoes_insumos_acao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.acoes_insumos
    ADD CONSTRAINT acoes_insumos_acao_id_fkey FOREIGN KEY (acao_id) REFERENCES public.acoes(id) ON UPDATE CASCADE;


--
-- Name: custos_acoes custos_acoes_acao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.custos_acoes
    ADD CONSTRAINT custos_acoes_acao_id_fkey FOREIGN KEY (acao_id) REFERENCES public.acoes(id) ON UPDATE CASCADE;


--
-- Name: estoque_caminhoes estoque_caminhoes_caminhao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.estoque_caminhoes
    ADD CONSTRAINT estoque_caminhoes_caminhao_id_fkey FOREIGN KEY (caminhao_id) REFERENCES public.caminhoes(id) ON UPDATE CASCADE;


--
-- Name: inscricoes inscricoes_acao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inscricoes
    ADD CONSTRAINT inscricoes_acao_id_fkey FOREIGN KEY (acao_id) REFERENCES public.acoes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: inscricoes inscricoes_cidadao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inscricoes
    ADD CONSTRAINT inscricoes_cidadao_id_fkey FOREIGN KEY (cidadao_id) REFERENCES public.cidadaos(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: inscricoes inscricoes_curso_exame_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inscricoes
    ADD CONSTRAINT inscricoes_curso_exame_id_fkey FOREIGN KEY (curso_exame_id) REFERENCES public.cursos_exames(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: movimentacoes_estoque movimentacoes_estoque_acao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimentacoes_estoque
    ADD CONSTRAINT movimentacoes_estoque_acao_id_fkey FOREIGN KEY (acao_id) REFERENCES public.acoes(id);


--
-- Name: movimentacoes_estoque movimentacoes_estoque_caminhao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimentacoes_estoque
    ADD CONSTRAINT movimentacoes_estoque_caminhao_id_fkey FOREIGN KEY (caminhao_id) REFERENCES public.caminhoes(id);


--
-- Name: movimentacoes_estoque movimentacoes_estoque_motorista_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimentacoes_estoque
    ADD CONSTRAINT movimentacoes_estoque_motorista_id_fkey FOREIGN KEY (motorista_id) REFERENCES public.funcionarios(id);


--
-- Name: noticias noticias_acao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.noticias
    ADD CONSTRAINT noticias_acao_id_fkey FOREIGN KEY (acao_id) REFERENCES public.acoes(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: notificacoes notificacoes_acao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notificacoes
    ADD CONSTRAINT notificacoes_acao_id_fkey FOREIGN KEY (acao_id) REFERENCES public.acoes(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: resultados_exames resultados_exames_acao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resultados_exames
    ADD CONSTRAINT resultados_exames_acao_id_fkey FOREIGN KEY (acao_id) REFERENCES public.acoes(id) ON UPDATE CASCADE;


--
-- Name: resultados_exames resultados_exames_cidadao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resultados_exames
    ADD CONSTRAINT resultados_exames_cidadao_id_fkey FOREIGN KEY (cidadao_id) REFERENCES public.cidadaos(id) ON UPDATE CASCADE;


--
-- Name: resultados_exames resultados_exames_exame_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resultados_exames
    ADD CONSTRAINT resultados_exames_exame_id_fkey FOREIGN KEY (exame_id) REFERENCES public.exames(id) ON UPDATE CASCADE;


--
-- Name: resultados_exames resultados_exames_inscricao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resultados_exames
    ADD CONSTRAINT resultados_exames_inscricao_id_fkey FOREIGN KEY (inscricao_id) REFERENCES public.inscricoes(id) ON UPDATE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict YgwgebnkkK43M2yKVjXPFwqdAIcfePq66wI2B6jImMviPuKlccKWuHx7ymFEabH

