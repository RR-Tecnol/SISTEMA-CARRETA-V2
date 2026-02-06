--
-- PostgreSQL database dump
--

\restrict UuiH0CnsLX0e6y6bQAkp5sVag1SDyxVdflNL0c1G1nrMnxjiKjxuWB7UumoK7Yg

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: abastecimentos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.abastecimentos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    caminhao_id uuid NOT NULL,
    acao_id uuid,
    data_abastecimento timestamp without time zone NOT NULL,
    litros numeric(10,3) NOT NULL,
    preco_por_litro numeric(6,3) NOT NULL,
    valor_total numeric(10,2) NOT NULL,
    km_atual integer,
    observacoes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.abastecimentos OWNER TO postgres;

--
-- Name: acao_caminhoes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.acao_caminhoes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    acao_id uuid NOT NULL,
    caminhao_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.acao_caminhoes OWNER TO postgres;

--
-- Name: acao_curso_exame; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.acao_curso_exame (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    acao_id uuid NOT NULL,
    curso_exame_id uuid NOT NULL,
    vagas integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.acao_curso_exame OWNER TO postgres;

--
-- Name: acao_funcionarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.acao_funcionarios (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    acao_id uuid NOT NULL,
    funcionario_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.acao_funcionarios OWNER TO postgres;

--
-- Name: acoes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.acoes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    numero_acao integer NOT NULL,
    instituicao_id uuid NOT NULL,
    tipo character varying(20) NOT NULL,
    municipio character varying(255) NOT NULL,
    estado character varying(2) NOT NULL,
    data_inicio date NOT NULL,
    data_fim date NOT NULL,
    status character varying(20) DEFAULT 'planejada'::character varying NOT NULL,
    descricao text,
    local_execucao character varying(255) NOT NULL,
    vagas_disponiveis integer DEFAULT 0 NOT NULL,
    distancia_km numeric(10,2),
    preco_combustivel_referencia numeric(10,2),
    campos_customizados jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT acoes_status_check CHECK (((status)::text = ANY (ARRAY[('planejada'::character varying)::text, ('ativa'::character varying)::text, ('concluida'::character varying)::text]))),
    CONSTRAINT acoes_tipo_check CHECK (((tipo)::text = ANY (ARRAY[('curso'::character varying)::text, ('saude'::character varying)::text])))
);


ALTER TABLE public.acoes OWNER TO postgres;

--
-- Name: acoes_numero_acao_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.acoes_numero_acao_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.acoes_numero_acao_seq OWNER TO postgres;

--
-- Name: acoes_numero_acao_seq1; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.acoes_numero_acao_seq1
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.acoes_numero_acao_seq1 OWNER TO postgres;

--
-- Name: acoes_numero_acao_seq1; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.acoes_numero_acao_seq1 OWNED BY public.acoes.numero_acao;


--
-- Name: caminhoes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.caminhoes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    placa character varying(10) NOT NULL,
    modelo character varying(255) NOT NULL,
    ano integer,
    capacidade_litros numeric(10,2),
    km_por_litro numeric(10,2),
    status character varying(20) DEFAULT 'disponivel'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT caminhoes_status_check CHECK (((status)::text = ANY (ARRAY[('disponivel'::character varying)::text, ('em_uso'::character varying)::text, ('manutencao'::character varying)::text])))
);


ALTER TABLE public.caminhoes OWNER TO postgres;

--
-- Name: cidadaos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cidadaos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    cpf character varying(255) NOT NULL,
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
    data_consentimento timestamp without time zone,
    ip_consentimento character varying(45),
    reset_password_token character varying(255),
    reset_password_expires timestamp without time zone,
    foto_perfil character varying(255),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.cidadaos OWNER TO postgres;

--
-- Name: configuracoes_campo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.configuracoes_campo (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome_campo character varying(255) NOT NULL,
    tipo_campo character varying(50) NOT NULL,
    obrigatorio boolean DEFAULT false NOT NULL,
    opcoes jsonb,
    ordem_exibicao integer,
    ativo boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.configuracoes_campo OWNER TO postgres;

--
-- Name: cursos_exames; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cursos_exames (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome character varying(255) NOT NULL,
    tipo character varying(20) NOT NULL,
    carga_horaria integer,
    descricao text,
    requisitos text,
    certificadora character varying(255),
    ativo boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT cursos_exames_tipo_check CHECK (((tipo)::text = ANY (ARRAY[('curso'::character varying)::text, ('exame'::character varying)::text])))
);


ALTER TABLE public.cursos_exames OWNER TO postgres;

--
-- Name: funcionarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.funcionarios (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome character varying(255) NOT NULL,
    cargo character varying(100) NOT NULL,
    email character varying(255),
    telefone character varying(20),
    diaria numeric(10,2),
    especialidade character varying(255),
    custo_diario numeric(10,2),
    status character varying(20) DEFAULT 'disponivel'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT funcionarios_status_check CHECK (((status)::text = ANY (ARRAY[('ativo'::character varying)::text, ('inativo'::character varying)::text, ('disponivel'::character varying)::text, ('em_missao'::character varying)::text, ('ferias'::character varying)::text])))
);


ALTER TABLE public.funcionarios OWNER TO postgres;

--
-- Name: inscricoes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inscricoes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    cidadao_id uuid NOT NULL,
    acao_id uuid NOT NULL,
    curso_exame_id uuid,
    data_inscricao timestamp without time zone DEFAULT now() NOT NULL,
    status character varying(20) DEFAULT 'pendente'::character varying NOT NULL,
    observacoes text,
    campos_customizados jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT inscricoes_status_check CHECK (((status)::text = ANY (ARRAY[('pendente'::character varying)::text, ('atendido'::character varying)::text, ('faltou'::character varying)::text])))
);


ALTER TABLE public.inscricoes OWNER TO postgres;

--
-- Name: instituicoes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.instituicoes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    razao_social character varying(255) NOT NULL,
    cnpj character varying(18) NOT NULL,
    responsavel_nome character varying(255) NOT NULL,
    responsavel_email character varying(255) NOT NULL,
    responsavel_tel character varying(20) NOT NULL,
    endereco_completo text NOT NULL,
    campos_customizados jsonb DEFAULT '{}'::jsonb,
    ativo boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.instituicoes OWNER TO postgres;

--
-- Name: noticias; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.noticias (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    titulo character varying(255) NOT NULL,
    conteudo text NOT NULL,
    imagem_url character varying(500),
    acao_id uuid,
    destaque boolean DEFAULT false NOT NULL,
    data_publicacao timestamp without time zone DEFAULT now() NOT NULL,
    campos_customizados jsonb DEFAULT '{}'::jsonb,
    ativo boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.noticias OWNER TO postgres;

--
-- Name: notificacoes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notificacoes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    cidadao_id uuid NOT NULL,
    titulo character varying(255) NOT NULL,
    mensagem text NOT NULL,
    tipo character varying(50) NOT NULL,
    lida boolean DEFAULT false NOT NULL,
    data_leitura timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.notificacoes OWNER TO postgres;

--
-- Name: acoes numero_acao; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.acoes ALTER COLUMN numero_acao SET DEFAULT nextval('public.acoes_numero_acao_seq1'::regclass);


--
-- Data for Name: abastecimentos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.abastecimentos (id, caminhao_id, acao_id, data_abastecimento, litros, preco_por_litro, valor_total, km_atual, observacoes, created_at, updated_at) FROM stdin;
c2a75c5e-f455-4831-afd1-16ecd3afeeb8	cc91823c-a70e-4d26-8b60-c599760498fd	81ddd37b-86af-4bae-b4e4-bc65a67bbee5	2026-02-03 00:00:00	50.000	8.000	400.00	\N		2026-02-03 23:23:46.625	2026-02-03 23:23:46.625
7cefe18a-4fb4-40f1-8233-89659b5ad52b	cc91823c-a70e-4d26-8b60-c599760498fd	81ddd37b-86af-4bae-b4e4-bc65a67bbee5	2026-02-04 00:00:00	12.000	8.333	100.00	\N		2026-02-04 01:59:51.969	2026-02-04 01:59:51.969
1d266d00-c2c3-4fba-b24d-ebb9f4b375ce	cc91823c-a70e-4d26-8b60-c599760498fd	81ddd37b-86af-4bae-b4e4-bc65a67bbee5	2026-02-04 00:00:00	1000.000	1.000	1000.00	\N		2026-02-04 02:00:14.986	2026-02-04 02:00:14.986
\.


--
-- Data for Name: acao_caminhoes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.acao_caminhoes (id, acao_id, caminhao_id, created_at, updated_at) FROM stdin;
a40e4c78-d938-4414-912f-2c92f8662052	81ddd37b-86af-4bae-b4e4-bc65a67bbee5	cc91823c-a70e-4d26-8b60-c599760498fd	2026-02-03 23:23:28.935	2026-02-03 23:23:28.935
\.


--
-- Data for Name: acao_curso_exame; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.acao_curso_exame (id, acao_id, curso_exame_id, vagas, created_at, updated_at) FROM stdin;
68d23f06-e85a-48ed-81f6-ddf540b7b537	81ddd37b-86af-4bae-b4e4-bc65a67bbee5	c1111111-1111-1111-1111-111111111111	100	2026-02-03 23:22:03.929	2026-02-03 23:22:03.929
40454611-2035-4dc7-9f5a-73f37c61192d	8cb09655-b082-43f0-8a56-1ddb3800fe51	c2222222-2222-2222-2222-222222222222	100	2026-02-04 12:13:23.312	2026-02-04 12:13:23.312
30147e42-1a0b-4aeb-817f-042348424e7a	6f37bc1d-19be-43b4-9ebf-b693944d1cc9	e1111111-1111-1111-1111-111111111111	100	2026-02-04 12:18:38.014	2026-02-04 12:18:38.014
9b443581-f20d-4a18-9221-214fb76de53b	109070d5-9640-4b51-8585-41cff9361066	e2222222-2222-2222-2222-222222222222	0	2026-02-04 12:25:47.191	2026-02-04 12:25:47.191
42d82060-67d0-4626-9712-b9df3339e585	d2c2defc-47c8-48c6-8b03-e6728ac773f2	442ebe2a-e798-4777-a246-6f3f01cd34ef	20	2026-02-04 12:50:36.498	2026-02-04 12:50:36.498
\.


--
-- Data for Name: acao_funcionarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.acao_funcionarios (id, acao_id, funcionario_id, created_at, updated_at) FROM stdin;
eae54415-6750-401c-8665-6c41d26dd139	81ddd37b-86af-4bae-b4e4-bc65a67bbee5	4c5f4432-5fad-41cf-8314-10efe60df554	2026-02-04 02:00:25.125	2026-02-04 02:00:25.125
e102124c-9a40-4a1a-a89f-f947296b5f86	81ddd37b-86af-4bae-b4e4-bc65a67bbee5	a90a6e5e-a975-46ee-aebe-d2c63d3ef66f	2026-02-04 02:16:07.19	2026-02-04 02:16:07.19
\.


--
-- Data for Name: acoes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.acoes (id, numero_acao, instituicao_id, tipo, municipio, estado, data_inicio, data_fim, status, descricao, local_execucao, vagas_disponiveis, distancia_km, preco_combustivel_referencia, campos_customizados, created_at, updated_at) FROM stdin;
81ddd37b-86af-4bae-b4e4-bc65a67bbee5	1	22222222-2222-2222-2222-222222222222	curso	São Luis	MA	2026-01-06	2026-06-29	planejada		Buriticupu	100	799.00	6.00	{}	2026-02-03 23:22:03.827	2026-02-04 02:09:33.058
8cb09655-b082-43f0-8a56-1ddb3800fe51	2	33333333-3333-3333-3333-333333333333	curso	São Paulo	SP	2026-07-23	2026-08-01	planejada		Higienopolis	100	1000.00	5.00	{}	2026-02-04 12:13:23.024	2026-02-04 12:13:23.024
6f37bc1d-19be-43b4-9ebf-b693944d1cc9	3	11111111-1111-1111-1111-111111111111	saude	São Luis	MA	2026-03-20	2026-03-30	planejada		Jardim Renascença	0	1000.00	100.00	{}	2026-02-04 12:18:37.908	2026-02-04 12:18:37.908
109070d5-9640-4b51-8585-41cff9361066	4	33333333-3333-3333-3333-333333333333	saude	Imperatiz	MA	2026-02-05	2026-02-20	planejada		Rua tres	50	1000.00	5.00	{}	2026-02-04 12:25:47.06	2026-02-04 12:25:47.06
d2c2defc-47c8-48c6-8b03-e6728ac773f2	5	11111111-1111-1111-1111-111111111111	saude	Imperatriz	MA	2026-02-04	2026-02-07	planejada		Imperatriz	100	999.00	6.00	{}	2026-02-04 12:50:36.473	2026-02-04 12:50:36.473
\.


--
-- Data for Name: caminhoes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.caminhoes (id, placa, modelo, ano, capacidade_litros, km_por_litro, status, created_at, updated_at) FROM stdin;
cc91823c-a70e-4d26-8b60-c599760498fd	obp-2045	Volksss	2026	0.00	9.00	disponivel	2026-02-03 23:23:01.337	2026-02-03 23:23:01.337
480e536d-eb7b-4fb7-a6f1-b8a61465810e	uip-2531	volks	2026	0.00	10.00	disponivel	2026-02-03 23:32:59.017	2026-02-03 23:32:59.017
\.


--
-- Data for Name: cidadaos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cidadaos (id, cpf, nome_completo, data_nascimento, telefone, email, senha, tipo, municipio, estado, cep, rua, numero, complemento, bairro, campos_customizados, consentimento_lgpd, data_consentimento, ip_consentimento, reset_password_token, reset_password_expires, foto_perfil, created_at, updated_at) FROM stdin;
e1b0eaa6-9e08-4260-bd91-05a9b3089727	008.953.993-18	joao	2001-07-23	(98) 98727-2826	joaogabrieldiniz23@gmail.com	$2b$10$WupucBoYH17lnZAsP6xHR.uu2EVdQAmr0aUl.5wIM6ejlsrVXs26O	cidadao	São Luis	MA	\N	\N	\N	\N	\N	{}	t	2026-02-03 22:38:51.208	::ffff:172.18.0.5	\N	\N	/uploads/perfil/perfil-1770173128269-857919435.jpg	2026-02-03 22:38:51.211	2026-02-04 02:45:28.271
aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	123.456.789-09	Administrador do Sistema	1990-01-01	(83) 99999-9999	admin@sistemacarretas.com.br	$2b$10$boS1rCKPngqaV1ebpFzAueEYbBAGXWnQp2r4ZkpV2VkuzZQONUv5a	admin	João Pessoa	PB	\N	\N	\N		\N	{}	t	2026-02-03 22:51:36.15225	\N	\N	\N	/uploads/perfil/admin-1770208605609-210017711.jpg	2026-02-03 22:51:36.15225	2026-02-04 12:36:45.612
\.


--
-- Data for Name: configuracoes_campo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.configuracoes_campo (id, nome_campo, tipo_campo, obrigatorio, opcoes, ordem_exibicao, ativo, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: cursos_exames; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cursos_exames (id, nome, tipo, carga_horaria, descricao, requisitos, certificadora, ativo, created_at, updated_at) FROM stdin;
c1111111-1111-1111-1111-111111111111	Eletricista Industrial	curso	160	Curso completo de eletricidade industrial	Ensino fundamental completo	SENAI	t	2026-02-03 22:34:59.198075	2026-02-03 22:34:59.198075
c2222222-2222-2222-2222-222222222222	Mecânico de Automóveis	curso	200	Formação em manutenção automotiva	Ensino fundamental completo	SENAI	t	2026-02-03 22:34:59.198075	2026-02-03 22:34:59.198075
c3333333-3333-3333-3333-333333333333	Informática Básica	curso	60	Introdução à informática e internet	Alfabetizado	SENAC	t	2026-02-03 22:34:59.198075	2026-02-03 22:34:59.198075
e1111111-1111-1111-1111-111111111111	Exame de Vista	exame	2	Exame oftalmológico completo	Nenhum	Clínica Parceira	t	2026-02-03 22:34:59.198075	2026-02-03 22:34:59.198075
e2222222-2222-2222-2222-222222222222	Exame Médico Admissional	exame	1	Exame médico para admissão	Nenhum	Clínica Parceira	t	2026-02-03 22:34:59.198075	2026-02-03 22:34:59.198075
442ebe2a-e798-4777-a246-6f3f01cd34ef	hemograma completo	exame	\N	\N	\N	\N	t	2026-02-04 02:13:11.281146	2026-02-04 02:13:11.281146
69b7cc83-8565-46ed-876f-04aa2b3ea38b	Inteligencia Artificial	curso	\N	\N	\N	\N	t	2026-02-04 02:13:35.407995	2026-02-04 02:13:35.407995
e40a2071-c224-4ffe-bea8-0d4c2d8f3027	Inteligencia Artificial	curso	\N	\N	\N	\N	t	2026-02-04 02:13:51.068148	2026-02-04 02:13:51.068148
ea6ecf7f-dbf3-4084-860d-87ad45ed5275	Inteligencia Artificial	curso	\N	\N	\N	\N	t	2026-02-04 02:13:51.825973	2026-02-04 02:13:51.825973
\.


--
-- Data for Name: funcionarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.funcionarios (id, nome, cargo, email, telefone, diaria, especialidade, custo_diario, status, created_at, updated_at) FROM stdin;
4c5f4432-5fad-41cf-8314-10efe60df554	gabriel diniz	medico	\N	\N	\N	neuro	100.00	ativo	2026-02-04 01:24:57.812	2026-02-04 01:38:05.072
0f0fe6de-2b65-4bfb-ad38-467bea5c34b8	giovanna	atentimento	\N	\N	\N	recepcionista	50.00	inativo	2026-02-04 02:16:03.81	2026-02-04 02:16:20.109
ee9f8aaa-14e5-459c-ad4c-bd9c81a20f23	giovanna	atentimento	\N	\N	\N	recepcionista	50.00	inativo	2026-02-04 02:16:03.593	2026-02-04 02:16:23.505
cc5a2d90-abce-46a2-af4d-db4815589a64	giovanna	atentimento	\N	\N	\N	recepcionista	50.00	inativo	2026-02-04 02:16:01.811	2026-02-04 02:16:26.855
9d523b64-905b-4f50-b882-e665630cd55a	diniz 	advogado	\N	\N	\N	criminalista	110.00	ativo	2026-02-04 02:17:57.535	2026-02-04 02:17:57.535
a90a6e5e-a975-46ee-aebe-d2c63d3ef66f	giovanna	atentimento	\N	\N	\N	recepcionista	50.00	ativo	2026-02-04 02:15:52.308	2026-02-04 12:04:32.748
\.


--
-- Data for Name: inscricoes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inscricoes (id, cidadao_id, acao_id, curso_exame_id, data_inscricao, status, observacoes, campos_customizados, created_at, updated_at) FROM stdin;
7386c954-e38e-4a5c-b0b3-826fa81f94b3	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	81ddd37b-86af-4bae-b4e4-bc65a67bbee5	c1111111-1111-1111-1111-111111111111	2026-02-04 01:10:29.396	atendido	\N	{}	2026-02-04 01:10:29.397	2026-02-04 02:32:51.878
c17739cf-0fe9-4fea-a738-d117234ee2ee	e1b0eaa6-9e08-4260-bd91-05a9b3089727	81ddd37b-86af-4bae-b4e4-bc65a67bbee5	c1111111-1111-1111-1111-111111111111	2026-02-03 23:33:44.194	pendente	\N	{}	2026-02-03 23:33:44.194	2026-02-04 02:33:01.476
31ce8db8-f02f-4adf-a3fe-1de9fe8d3915	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	8cb09655-b082-43f0-8a56-1ddb3800fe51	c2222222-2222-2222-2222-222222222222	2026-02-04 12:16:42.631	pendente	\N	{}	2026-02-04 12:16:42.631	2026-02-04 12:16:42.631
\.


--
-- Data for Name: instituicoes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.instituicoes (id, razao_social, cnpj, responsavel_nome, responsavel_email, responsavel_tel, endereco_completo, campos_customizados, ativo, created_at, updated_at) FROM stdin;
11111111-1111-1111-1111-111111111111	SENAI - Serviço Nacional de Aprendizagem Industrial	03.775.428/0001-40	Carlos Alberto	carlos@senai.br	(11) 3528-2000	Av. Paulista, 1313 - São Paulo, SP	{}	t	2026-02-03 22:34:59.052494	2026-02-03 22:34:59.052494
22222222-2222-2222-2222-222222222222	SENAC - Serviço Nacional de Aprendizagem Comercial	03.709.814/0001-98	Maria Silva	maria@senac.br	(11) 2626-2000	Rua 24 de Maio, 208 - São Paulo, SP	{}	t	2026-02-03 22:34:59.052494	2026-02-03 22:34:59.052494
33333333-3333-3333-3333-333333333333	SESI - Serviço Social da Indústria	03.775.428/0002-21	João Santos	joao@sesi.org.br	(11) 3528-2100	Av. Paulista, 1313 - São Paulo, SP	{}	t	2026-02-03 22:34:59.052494	2026-02-03 22:34:59.052494
7c3b78e8-4e42-4698-b68e-39c35c00d79f	casa diniz	00161646415166111	diniz	joaodiniz@gmail.com	989872728241	dsfsfsfsfsf	{}	t	2026-02-04 02:01:35.612	2026-02-04 02:01:35.612
\.


--
-- Data for Name: noticias; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.noticias (id, titulo, conteudo, imagem_url, acao_id, destaque, data_publicacao, campos_customizados, ativo, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: notificacoes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notificacoes (id, cidadao_id, titulo, mensagem, tipo, lida, data_leitura, created_at, updated_at) FROM stdin;
\.


--
-- Name: acoes_numero_acao_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.acoes_numero_acao_seq', 5, true);


--
-- Name: acoes_numero_acao_seq1; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.acoes_numero_acao_seq1', 1, false);


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
-- Name: acoes acoes_numero_acao_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.acoes
    ADD CONSTRAINT acoes_numero_acao_key UNIQUE (numero_acao);


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
-- Name: cidadaos cidadaos_cpf_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cidadaos
    ADD CONSTRAINT cidadaos_cpf_key UNIQUE (cpf);


--
-- Name: cidadaos cidadaos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cidadaos
    ADD CONSTRAINT cidadaos_pkey PRIMARY KEY (id);


--
-- Name: configuracoes_campo configuracoes_campo_nome_campo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.configuracoes_campo
    ADD CONSTRAINT configuracoes_campo_nome_campo_key UNIQUE (nome_campo);


--
-- Name: configuracoes_campo configuracoes_campo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.configuracoes_campo
    ADD CONSTRAINT configuracoes_campo_pkey PRIMARY KEY (id);


--
-- Name: cursos_exames cursos_exames_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cursos_exames
    ADD CONSTRAINT cursos_exames_pkey PRIMARY KEY (id);


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
-- Name: instituicoes instituicoes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.instituicoes
    ADD CONSTRAINT instituicoes_pkey PRIMARY KEY (id);


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
-- Name: abastecimentos abastecimentos_acao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.abastecimentos
    ADD CONSTRAINT abastecimentos_acao_id_fkey FOREIGN KEY (acao_id) REFERENCES public.acoes(id) ON DELETE SET NULL;


--
-- Name: abastecimentos abastecimentos_caminhao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.abastecimentos
    ADD CONSTRAINT abastecimentos_caminhao_id_fkey FOREIGN KEY (caminhao_id) REFERENCES public.caminhoes(id) ON DELETE CASCADE;


--
-- Name: acao_caminhoes acao_caminhoes_acao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.acao_caminhoes
    ADD CONSTRAINT acao_caminhoes_acao_id_fkey FOREIGN KEY (acao_id) REFERENCES public.acoes(id) ON DELETE CASCADE;


--
-- Name: acao_caminhoes acao_caminhoes_caminhao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.acao_caminhoes
    ADD CONSTRAINT acao_caminhoes_caminhao_id_fkey FOREIGN KEY (caminhao_id) REFERENCES public.caminhoes(id) ON DELETE CASCADE;


--
-- Name: acao_curso_exame acao_curso_exame_acao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.acao_curso_exame
    ADD CONSTRAINT acao_curso_exame_acao_id_fkey FOREIGN KEY (acao_id) REFERENCES public.acoes(id) ON DELETE CASCADE;


--
-- Name: acao_curso_exame acao_curso_exame_curso_exame_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.acao_curso_exame
    ADD CONSTRAINT acao_curso_exame_curso_exame_id_fkey FOREIGN KEY (curso_exame_id) REFERENCES public.cursos_exames(id) ON DELETE CASCADE;


--
-- Name: acao_funcionarios acao_funcionarios_acao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.acao_funcionarios
    ADD CONSTRAINT acao_funcionarios_acao_id_fkey FOREIGN KEY (acao_id) REFERENCES public.acoes(id) ON DELETE CASCADE;


--
-- Name: acao_funcionarios acao_funcionarios_funcionario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.acao_funcionarios
    ADD CONSTRAINT acao_funcionarios_funcionario_id_fkey FOREIGN KEY (funcionario_id) REFERENCES public.funcionarios(id) ON DELETE CASCADE;


--
-- Name: acoes acoes_instituicao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.acoes
    ADD CONSTRAINT acoes_instituicao_id_fkey FOREIGN KEY (instituicao_id) REFERENCES public.instituicoes(id);


--
-- Name: inscricoes inscricoes_acao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inscricoes
    ADD CONSTRAINT inscricoes_acao_id_fkey FOREIGN KEY (acao_id) REFERENCES public.acoes(id) ON DELETE CASCADE;


--
-- Name: inscricoes inscricoes_cidadao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inscricoes
    ADD CONSTRAINT inscricoes_cidadao_id_fkey FOREIGN KEY (cidadao_id) REFERENCES public.cidadaos(id) ON DELETE CASCADE;


--
-- Name: inscricoes inscricoes_curso_exame_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inscricoes
    ADD CONSTRAINT inscricoes_curso_exame_id_fkey FOREIGN KEY (curso_exame_id) REFERENCES public.cursos_exames(id) ON DELETE SET NULL;


--
-- Name: noticias noticias_acao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.noticias
    ADD CONSTRAINT noticias_acao_id_fkey FOREIGN KEY (acao_id) REFERENCES public.acoes(id) ON DELETE SET NULL;


--
-- Name: notificacoes notificacoes_cidadao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notificacoes
    ADD CONSTRAINT notificacoes_cidadao_id_fkey FOREIGN KEY (cidadao_id) REFERENCES public.cidadaos(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict UuiH0CnsLX0e6y6bQAkp5sVag1SDyxVdflNL0c1G1nrMnxjiKjxuWB7UumoK7Yg

