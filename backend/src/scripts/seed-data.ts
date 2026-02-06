// @ts-nocheck
import { sequelize } from '../config/database';
import { Instituicao } from '../models/Instituicao';
import { Caminhao } from '../models/Caminhao';
import { Funcionario } from '../models/Funcionario';
import { Acao } from '../models/Acao';
import { CursoExame } from '../models/CursoExame';
import { AcaoCaminhao } from '../models/AcaoCaminhao';
import { AcaoFuncionario } from '../models/AcaoFuncionario';
import { AcaoCursoExame } from '../models/AcaoCursoExame';

async function seedData() {
    try {
        await sequelize.authenticate();
        console.log('✅ Conectado ao banco de dados\n');

        // ========================================
        // 1. INSTITUIÇÕES (10)
        // ========================================
        console.log('📍 Criando Instituições...');
        const instituicoes = await Instituicao.bulkCreate([
            {
                razao_social: 'Secretaria de Saúde da Paraíba',
                cnpj: '12.345.678/0001-90',
                responsavel_nome: 'Dr. João Silva',
                responsavel_email: 'joao.silva@saude.pb.gov.br',
                responsavel_tel: '(83) 3218-7272',
                endereco_completo: 'Av. Dom Pedro II, 1826 - Torre, João Pessoa - PB',
                campos_customizados: { tipo: 'saude', municipio: 'João Pessoa', estado: 'PB' },
                ativo: true,
            },
            {
                razao_social: 'Secretaria de Educação da Paraíba',
                cnpj: '23.456.789/0001-91',
                responsavel_nome: 'Profa. Maria Santos',
                responsavel_email: 'maria.santos@see.pb.gov.br',
                responsavel_tel: '(83) 3218-4100',
                endereco_completo: 'Av. João da Mata, s/n - Jaguaribe, João Pessoa - PB',
                campos_customizados: { tipo: 'educacao', municipio: 'João Pessoa', estado: 'PB' },
                ativo: true,
            },
            {
                razao_social: 'Prefeitura Municipal de Campina Grande',
                cnpj: '34.567.890/0001-92',
                responsavel_nome: 'Carlos Eduardo Lima',
                responsavel_email: 'carlos.lima@campinagrande.pb.gov.br',
                responsavel_tel: '(83) 3310-6000',
                endereco_completo: 'Rua Maciel Pinheiro, 206 - Centro, Campina Grande - PB',
                campos_customizados: { tipo: 'assistencia_social', municipio: 'Campina Grande', estado: 'PB' },
                ativo: true,
            },
            {
                razao_social: 'Hospital Universitário Lauro Wanderley',
                cnpj: '45.678.901/0001-93',
                responsavel_nome: 'Dra. Ana Paula Costa',
                responsavel_email: 'ana.costa@hulw.ufpb.br',
                responsavel_tel: '(83) 3216-7000',
                endereco_completo: 'Campus I - UFPB, Cidade Universitária - João Pessoa - PB',
                campos_customizados: { tipo: 'saude', municipio: 'João Pessoa', estado: 'PB' },
                ativo: true,
            },
            {
                razao_social: 'SENAC Paraíba',
                cnpj: '56.789.012/0001-94',
                responsavel_nome: 'Roberto Mendes',
                responsavel_email: 'roberto.mendes@pb.senac.br',
                responsavel_tel: '(83) 3044-5600',
                endereco_completo: 'Av. Epitácio Pessoa, 1234 - Bessa, João Pessoa - PB',
                campos_customizados: { tipo: 'educacao', municipio: 'João Pessoa', estado: 'PB' },
                ativo: true,
            },
            {
                razao_social: 'Prefeitura Municipal de Patos',
                cnpj: '67.890.123/0001-95',
                responsavel_nome: 'Fernando Lima',
                responsavel_email: 'fernando.lima@patos.pb.gov.br',
                responsavel_tel: '(83) 3423-6000',
                endereco_completo: 'Praça Getúlio Vargas, s/n - Centro, Patos - PB',
                campos_customizados: { tipo: 'assistencia_social', municipio: 'Patos', estado: 'PB' },
                ativo: true,
            },
            {
                razao_social: 'Instituto Federal da Paraíba',
                cnpj: '78.901.234/0001-96',
                responsavel_nome: 'Juliana Ferreira',
                responsavel_email: 'juliana.ferreira@ifpb.edu.br',
                responsavel_tel: '(83) 3612-1200',
                endereco_completo: 'Av. Primeiro de Maio, 720 - Jaguaribe, João Pessoa - PB',
                campos_customizados: { tipo: 'educacao', municipio: 'João Pessoa', estado: 'PB' },
                ativo: true,
            },
            {
                razao_social: 'Centro de Saúde Integral de Cajazeiras',
                cnpj: '89.012.345/0001-97',
                responsavel_nome: 'Paula Regina',
                responsavel_email: 'paula.regina@saude.cajazeiras.pb.gov.br',
                responsavel_tel: '(83) 3531-4000',
                endereco_completo: 'Rua Joaquim Nogueira, 456 - Centro, Cajazeiras - PB',
                campos_customizados: { tipo: 'saude', municipio: 'Cajazeiras', estado: 'PB' },
                ativo: true,
            },
            {
                razao_social: 'Secretaria de Ação Social de Sousa',
                cnpj: '90.123.456/0001-98',
                responsavel_nome: 'Marcos Andrade',
                responsavel_email: 'marcos.andrade@sousa.pb.gov.br',
                responsavel_tel: '(83) 3522-2000',
                endereco_completo: 'Praça da Matriz, 100 - Centro, Sousa - PB',
                campos_customizados: { tipo: 'assistencia_social', municipio: 'Sousa', estado: 'PB' },
                ativo: true,
            },
            {
                razao_social: 'SESI Paraíba',
                cnpj: '01.234.567/0001-99',
                responsavel_nome: 'Luciana Oliveira',
                responsavel_email: 'luciana.oliveira@sesi.pb.org.br',
                responsavel_tel: '(83) 3208-3000',
                endereco_completo: 'Av. Cruz das Armas, 25 - Cruz das Armas, João Pessoa - PB',
                campos_customizados: { tipo: 'saude', municipio: 'João Pessoa', estado: 'PB' },
                ativo: true,
            },
        ]);
        console.log(`✅ ${instituicoes.length} instituições criadas\n`);

        // ========================================
        // 2. CAMINHÕES (12)
        // ========================================
        console.log('🚚 Criando Caminhões...');
        const caminhoes = await Caminhao.bulkCreate([
            {
                placa: 'ABC-1234',
                modelo: 'Mercedes-Benz Accelo 1016',
                ano: 2023,
                capacidade_atendimento: 50,
                custo_diario: 350.00,
                status: 'disponivel',
            },
            {
                placa: 'DEF-5678',
                modelo: 'Volkswagen Delivery 9.170',
                ano: 2022,
                capacidade_atendimento: 40,
                custo_diario: 320.00,
                status: 'disponivel',
            },
            {
                placa: 'GHI-9012',
                modelo: 'Ford Cargo 816',
                ano: 2023,
                capacidade_atendimento: 60,
                custo_diario: 400.00,
                status: 'disponivel',
            },
            {
                placa: 'JKL-3456',
                modelo: 'Iveco Daily 70C16',
                ano: 2021,
                capacidade_atendimento: 35,
                custo_diario: 280.00,
                status: 'em_manutencao',
            },
            {
                placa: 'MNO-7890',
                modelo: 'Mercedes-Benz Sprinter 515',
                ano: 2022,
                capacidade_atendimento: 45,
                custo_diario: 330.00,
                status: 'disponivel',
            },
            {
                placa: 'PQR-1357',
                modelo: 'Fiat Ducato Maxicargo',
                ano: 2023,
                capacidade_atendimento: 38,
                custo_diario: 290.00,
                status: 'disponivel',
            },
            {
                placa: 'STU-2468',
                modelo: 'Renault Master',
                ano: 2022,
                capacidade_atendimento: 42,
                custo_diario: 310.00,
                status: 'disponivel',
            },
            {
                placa: 'VWX-3579',
                modelo: 'Mercedes-Benz Atego 1419',
                ano: 2024,
                capacidade_atendimento: 70,
                custo_diario: 450.00,
                status: 'disponivel',
            },
            {
                placa: 'YZA-4680',
                modelo: 'Volkswagen Constellation',
                ano: 2023,
                capacidade_atendimento: 65,
                custo_diario: 420.00,
                status: 'disponivel',
            },
            {
                placa: 'BCD-5791',
                modelo: 'Iveco Tector 9-190',
                ano: 2022,
                capacidade_atendimento: 55,
                custo_diario: 380.00,
                status: 'em_acao',
            },
            {
                placa: 'EFG-6802',
                modelo: 'Ford F-4000',
                ano: 2021,
                capacidade_atendimento: 30,
                custo_diario: 260.00,
                status: 'disponivel',
            },
            {
                placa: 'HIJ-7913',
                modelo: 'Peugeot Boxer',
                ano: 2023,
                capacidade_atendimento: 36,
                custo_diario: 285.00,
                status: 'disponivel',
            },
        ]);
        console.log(`✅ ${caminhoes.length} caminhões criados\n`);

        // ========================================
        // 3. FUNCIONÁRIOS (20)
        // ========================================
        console.log('👥 Criando Funcionários...');
        const funcionarios = await Funcionario.bulkCreate([
            // Equipe Médica
            {
                nome: 'Dr. Carlos Silva',
                cargo: 'Médico Clínico Geral',
                especialidade: 'Clínica Médica',
                custo_diario: 800.00,
                status: 'ativo',
            },
            {
                nome: 'Dra. Maria Santos',
                cargo: 'Enfermeira',
                especialidade: 'Enfermagem Geral',
                custo_diario: 400.00,
                status: 'ativo',
            },
            {
                nome: 'Dr. João Oliveira',
                cargo: 'Dentista',
                especialidade: 'Odontologia',
                custo_diario: 600.00,
                status: 'ativo',
            },
            {
                nome: 'Dra. Fernanda Costa',
                cargo: 'Cardiologista',
                especialidade: 'Cardiologia',
                custo_diario: 1000.00,
                status: 'ativo',
            },
            {
                nome: 'Ana Paula Costa',
                cargo: 'Técnica de Enfermagem',
                especialidade: 'Enfermagem Técnica',
                custo_diario: 300.00,
                status: 'ativo',
            },
            {
                nome: 'Dr. Ricardo Alves',
                cargo: 'Oftalmologista',
                especialidade: 'Oftalmologia',
                custo_diario: 900.00,
                status: 'ativo',
            },
            {
                nome: 'Beatriz Souza',
                cargo: 'Nutricionista',
                especialidade: 'Nutrição Clínica',
                custo_diario: 500.00,
                status: 'ativo',
            },

            // Equipe Educacional
            {
                nome: 'Prof. Roberto Mendes',
                cargo: 'Professor de Informática',
                especialidade: 'Tecnologia da Informação',
                custo_diario: 500.00,
                status: 'ativo',
            },
            {
                nome: 'Prof. Juliana Ferreira',
                cargo: 'Professora de Línguas',
                especialidade: 'Inglês e Espanhol',
                custo_diario: 450.00,
                status: 'ativo',
            },
            {
                nome: 'Prof. Gabriel Martins',
                cargo: 'Professor de Matemática',
                especialidade: 'Matemática e Física',
                custo_diario: 480.00,
                status: 'ativo',
            },
            {
                nome: 'Prof. Amanda Lima',
                cargo: 'Professora de Artes',
                especialidade: 'Artes e Artesanato',
                custo_diario: 420.00,
                status: 'ativo',
            },

            // Equipe de Apoio
            {
                nome: 'Marcos Andrade',
                cargo: 'Motorista',
                especialidade: 'Categoria D',
                custo_diario: 250.00,
                status: 'ativo',
            },
            {
                nome: 'Pedro Silva',
                cargo: 'Motorista',
                especialidade: 'Categoria D',
                custo_diario: 250.00,
                status: 'ativo',
            },
            {
                nome: 'José Santos',
                cargo: 'Motorista',
                especialidade: 'Categoria E',
                custo_diario: 280.00,
                status: 'ativo',
            },
            {
                nome: 'Paula Regina',
                cargo: 'Assistente Social',
                especialidade: 'Assistência Social',
                custo_diario: 400.00,
                status: 'ativo',
            },
            {
                nome: 'Carla Oliveira',
                cargo: 'Psicóloga',
                especialidade: 'Psicologia Clínica',
                custo_diario: 550.00,
                status: 'ativo',
            },
            {
                nome: 'Lucas Ferreira',
                cargo: 'Recepcionista',
                especialidade: 'Atendimento ao Público',
                custo_diario: 200.00,
                status: 'ativo',
            },
            {
                nome: 'Marina Costa',
                cargo: 'Coordenadora',
                especialidade: 'Gestão de Projetos',
                custo_diario: 600.00,
                status: 'ativo',
            },
            {
                nome: 'Rafael Mendes',
                cargo: 'Técnico de Informática',
                especialidade: 'Suporte Técnico',
                custo_diario: 350.00,
                status: 'ativo',
            },
            {
                nome: 'Tatiana Silva',
                cargo: 'Auxiliar Administrativo',
                especialidade: 'Administração',
                custo_diario: 220.00,
                status: 'ativo',
            },
        ]);
        console.log(`✅ ${funcionarios.length} funcionários criados\n`);

        // ========================================
        // 4. CURSOS E EXAMES (15)
        // ========================================
        console.log('📚 Criando Cursos e Exames...');
        const cursosExames = await CursoExame.bulkCreate([
            // Exames de Saúde
            {
                nome: 'Consulta Médica Geral',
                tipo: 'exame',
                descricao: 'Consulta médica de rotina com clínico geral',
                carga_horaria: null,
                ativo: true,
            },
            {
                nome: 'Exame de Glicemia',
                tipo: 'exame',
                descricao: 'Teste de glicemia em jejum',
                carga_horaria: null,
                ativo: true,
            },
            {
                nome: 'Consulta Odontológica',
                tipo: 'exame',
                descricao: 'Avaliação odontológica completa',
                carga_horaria: null,
                ativo: true,
            },
            {
                nome: 'Aferição de Pressão Arterial',
                tipo: 'exame',
                descricao: 'Medição de pressão arterial',
                carga_horaria: null,
                ativo: true,
            },
            {
                nome: 'Eletrocardiograma',
                tipo: 'exame',
                descricao: 'Exame de eletrocardiograma',
                carga_horaria: null,
                ativo: true,
            },
            {
                nome: 'Teste de Visão',
                tipo: 'exame',
                descricao: 'Exame oftalmológico básico',
                carga_horaria: null,
                ativo: true,
            },
            {
                nome: 'Consulta Nutricional',
                tipo: 'exame',
                descricao: 'Avaliação nutricional e orientação alimentar',
                carga_horaria: null,
                ativo: true,
            },

            // Cursos Profissionalizantes
            {
                nome: 'Curso de Informática Básica',
                tipo: 'curso',
                descricao: 'Curso introdutório de informática (Word, Excel, Internet)',
                carga_horaria: 20,
                requisitos: 'Ensino fundamental completo',
                certificadora: 'Secretaria de Educação PB',
                ativo: true,
            },
            {
                nome: 'Curso de Inglês Básico',
                tipo: 'curso',
                descricao: 'Curso de inglês nível iniciante',
                carga_horaria: 40,
                requisitos: 'Ensino fundamental completo',
                certificadora: 'Secretaria de Educação PB',
                ativo: true,
            },
            {
                nome: 'Workshop de Artesanato',
                tipo: 'curso',
                descricao: 'Workshop de artesanato e geração de renda',
                carga_horaria: 8,
                requisitos: 'Nenhum',
                certificadora: 'SENAC PB',
                ativo: true,
            },
            {
                nome: 'Curso de Espanhol Básico',
                tipo: 'curso',
                descricao: 'Introdução ao idioma espanhol',
                carga_horaria: 30,
                requisitos: 'Ensino fundamental completo',
                certificadora: 'Secretaria de Educação PB',
                ativo: true,
            },
            {
                nome: 'Curso de Excel Avançado',
                tipo: 'curso',
                descricao: 'Excel com fórmulas, tabelas dinâmicas e macros',
                carga_horaria: 16,
                requisitos: 'Informática básica',
                certificadora: 'SENAC PB',
                ativo: true,
            },
            {
                nome: 'Curso de Empreendedorismo',
                tipo: 'curso',
                descricao: 'Como iniciar e gerenciar seu próprio negócio',
                carga_horaria: 12,
                requisitos: 'Nenhum',
                certificadora: 'SEBRAE PB',
                ativo: true,
            },
            {
                nome: 'Curso de Panificação',
                tipo: 'curso',
                descricao: 'Técnicas básicas de panificação e confeitaria',
                carga_horaria: 24,
                requisitos: 'Maior de 16 anos',
                certificadora: 'SENAC PB',
                ativo: true,
            },
            {
                nome: 'Curso de Manicure e Pedicure',
                tipo: 'curso',
                descricao: 'Técnicas profissionais de manicure e pedicure',
                carga_horaria: 16,
                requisitos: 'Maior de 16 anos',
                certificadora: 'SENAC PB',
                ativo: true,
            },
        ]);
        console.log(`✅ ${cursosExames.length} cursos e exames criados\n`);

        // ========================================
        // 5. AÇÕES (10)
        // ========================================
        console.log('🎯 Criando Ações...');

        const acao1 = await Acao.create({
            instituicao_id: instituicoes[0].id,
            tipo: 'saude',
            municipio: 'Campina Grande',
            estado: 'PB',
            data_inicio: new Date('2026-02-15'),
            data_fim: new Date('2026-02-17'),
            status: 'planejada',
            descricao: 'Ação de saúde preventiva com consultas médicas, exames e orientações',
            local_execucao: 'Praça da Bandeira',
            vagas_disponiveis: 200,
            campos_customizados: {
                nome: 'Saúde em Movimento - Campina Grande',
                horario_inicio: '08:00',
                horario_fim: '17:00',
            },
        });

        const acao2 = await Acao.create({
            instituicao_id: instituicoes[1].id,
            tipo: 'curso',
            municipio: 'João Pessoa',
            estado: 'PB',
            data_inicio: new Date('2026-02-20'),
            data_fim: new Date('2026-03-05'),
            status: 'planejada',
            descricao: 'Cursos gratuitos de informática e inglês para a comunidade',
            local_execucao: 'Parque Solon de Lucena (Lagoa)',
            vagas_disponiveis: 100,
            campos_customizados: {
                nome: 'Carreta da Educação - João Pessoa',
                horario_inicio: '09:00',
                horario_fim: '18:00',
            },
        });

        const acao3 = await Acao.create({
            instituicao_id: instituicoes[3].id,
            tipo: 'saude',
            municipio: 'Patos',
            estado: 'PB',
            data_inicio: new Date('2026-03-10'),
            data_fim: new Date('2026-03-12'),
            status: 'planejada',
            descricao: 'Campanha de prevenção a doenças cardiovasculares',
            local_execucao: 'Centro de Convenções',
            vagas_disponiveis: 150,
            campos_customizados: {
                nome: 'Saúde do Coração - Patos',
                horario_inicio: '07:00',
                horario_fim: '16:00',
            },
        });

        const acao4 = await Acao.create({
            instituicao_id: instituicoes[2].id,
            tipo: 'curso',
            municipio: 'Campina Grande',
            estado: 'PB',
            data_inicio: new Date('2026-03-15'),
            data_fim: new Date('2026-03-28'),
            status: 'planejada',
            descricao: 'Cursos profissionalizantes para geração de renda',
            local_execucao: 'Centro de Formação Profissional',
            vagas_disponiveis: 80,
            campos_customizados: {
                nome: 'Capacitação Profissional - Campina Grande',
                horario_inicio: '08:00',
                horario_fim: '17:00',
            },
        });

        const acao5 = await Acao.create({
            instituicao_id: instituicoes[7].id,
            tipo: 'saude',
            municipio: 'Cajazeiras',
            estado: 'PB',
            data_inicio: new Date('2026-04-05'),
            data_fim: new Date('2026-04-07'),
            status: 'planejada',
            descricao: 'Atendimento médico e odontológico para a comunidade',
            local_execucao: 'Praça Central',
            vagas_disponiveis: 120,
            campos_customizados: {
                nome: 'Saúde Para Todos - Cajazeiras',
                horario_inicio: '08:00',
                horario_fim: '16:00',
            },
        });

        const acao6 = await Acao.create({
            instituicao_id: instituicoes[6].id,
            tipo: 'curso',
            municipio: 'João Pessoa',
            estado: 'PB',
            data_inicio: new Date('2026-04-10'),
            data_fim: new Date('2026-05-10'),
            status: 'planejada',
            descricao: 'Cursos técnicos e profissionalizantes do IFPB',
            local_execucao: 'Campus IFPB Jaguaribe',
            vagas_disponiveis: 150,
            campos_customizados: {
                nome: 'Jornada Técnica IFPB',
                horario_inicio: '09:00',
                horario_fim: '18:00',
            },
        });

        const acao7 = await Acao.create({
            instituicao_id: instituicoes[9].id,
            tipo: 'saude',
            municipio: 'João Pessoa',
            estado: 'PB',
            data_inicio: new Date('2026-04-20'),
            data_fim: new Date('2026-04-22'),
            status: 'planejada',
            descricao: 'Exames preventivos e orientações sobre saúde ocupacional',
            local_execucao: 'Sede SESI - Cruz das Armas',
            vagas_disponiveis: 180,
            campos_customizados: {
                nome: 'SESI Saúde Preventiva',
                horario_inicio: '07:30',
                horario_fim: '17:30',
            },
        });

        const acao8 = await Acao.create({
            instituicao_id: instituicoes[4].id,
            tipo: 'curso',
            municipio: 'Campina Grande',
            estado: 'PB',
            data_inicio: new Date('2026-05-01'),
            data_fim: new Date('2026-05-20'),
            status: 'planejada',
            descricao: 'Cursos de qualificação profissional SENAC',
            local_execucao: 'Unidade SENAC Campina Grande',
            vagas_disponiveis: 90,
            campos_customizados: {
                nome: 'Qualifica SENAC - Campina Grande',
                horario_inicio: '08:30',
                horario_fim: '17:30',
            },
        });

        const acao9 = await Acao.create({
            instituicao_id: instituicoes[5].id,
            tipo: 'saude',
            municipio: 'Sousa',
            estado: 'PB',
            data_inicio: new Date('2026-05-10'),
            data_fim: new Date('2026-05-12'),
            status: 'planejada',
            descricao: 'Mutirão de saúde com diversos exames e consultas',
            local_execucao: 'Ginásio Municipal',
            vagas_disponiveis: 160,
            campos_customizados: {
                nome: 'Mutirão da Saúde - Sousa',
                horario_inicio: '07:00',
                horario_fim: '17:00',
            },
        });

        const acao10 = await Acao.create({
            instituicao_id: instituicoes[1].id,
            tipo: 'curso',
            municipio: 'Patos',
            estado: 'PB',
            data_inicio: new Date('2026-05-25'),
            data_fim: new Date('2026-06-15'),
            status: 'planejada',
            descricao: 'Cursos de idiomas e informática para jovens',
            local_execucao: 'Escola Estadual de Ensino Médio',
            vagas_disponiveis: 110,
            campos_customizados: {
                nome: 'Educação Digital - Patos',
                horario_inicio: '09:00',
                horario_fim: '18:00',
            },
        });

        const acoes = [acao1, acao2, acao3, acao4, acao5, acao6, acao7, acao8, acao9, acao10];
        console.log(`✅ ${acoes.length} ações criadas\n`);

        // ========================================
        // 6. RELACIONAMENTOS - Ação + Caminhões
        // ========================================
        console.log('🔗 Vinculando Caminhões às Ações...');
        await AcaoCaminhao.bulkCreate([
            // Ação 1 - Campina Grande
            { acao_id: acao1.id, caminhao_id: caminhoes[0].id },
            { acao_id: acao1.id, caminhao_id: caminhoes[1].id },

            // Ação 2 - João Pessoa
            { acao_id: acao2.id, caminhao_id: caminhoes[2].id },

            // Ação 3 - Patos
            { acao_id: acao3.id, caminhao_id: caminhoes[4].id },

            // Ação 4 - Campina Grande
            { acao_id: acao4.id, caminhao_id: caminhoes[5].id },
            { acao_id: acao4.id, caminhao_id: caminhoes[6].id },

            // Ação 5 - Cajazeiras
            { acao_id: acao5.id, caminhao_id: caminhoes[7].id },

            // Ação 6 - João Pessoa
            { acao_id: acao6.id, caminhao_id: caminhoes[8].id },

            // Ação 7 - João Pessoa
            { acao_id: acao7.id, caminhao_id: caminhoes[10].id },

            // Ação 8 - Campina Grande
            { acao_id: acao8.id, caminhao_id: caminhoes[11].id },

            // Ação 9 - Sousa
            { acao_id: acao9.id, caminhao_id: caminhoes[0].id },
            { acao_id: acao9.id, caminhao_id: caminhoes[2].id },

            // Ação 10 - Patos
            { acao_id: acao10.id, caminhao_id: caminhoes[4].id },
        ]);
        console.log('✅ Caminhões vinculados\n');

        // ========================================
        // 7. RELACIONAMENTOS - Ação + Funcionários
        // ========================================
        console.log('🔗 Vinculando Funcionários às Ações...');
        await AcaoFuncionario.bulkCreate([
            // Ação 1 - Saúde Campina Grande
            { acao_id: acao1.id, funcionario_id: funcionarios[0].id }, // Dr. Carlos
            { acao_id: acao1.id, funcionario_id: funcionarios[1].id }, // Enfermeira Maria
            { acao_id: acao1.id, funcionario_id: funcionarios[4].id }, // Técnica Ana
            { acao_id: acao1.id, funcionario_id: funcionarios[11].id }, // Motorista Marcos
            { acao_id: acao1.id, funcionario_id: funcionarios[16].id }, // Recepcionista Lucas

            // Ação 2 - Educação João Pessoa
            { acao_id: acao2.id, funcionario_id: funcionarios[7].id }, // Prof. Roberto
            { acao_id: acao2.id, funcionario_id: funcionarios[8].id }, // Prof. Juliana
            { acao_id: acao2.id, funcionario_id: funcionarios[12].id }, // Motorista Pedro
            { acao_id: acao2.id, funcionario_id: funcionarios[17].id }, // Coordenadora Marina

            // Ação 3 - Saúde Coração Patos
            { acao_id: acao3.id, funcionario_id: funcionarios[0].id }, // Dr. Carlos
            { acao_id: acao3.id, funcionario_id: funcionarios[3].id }, // Cardiologista Fernanda
            { acao_id: acao3.id, funcionario_id: funcionarios[1].id }, // Enfermeira Maria
            { acao_id: acao3.id, funcionario_id: funcionarios[13].id }, // Motorista José

            // Ação 4 - Capacitação Campina Grande
            { acao_id: acao4.id, funcionario_id: funcionarios[7].id }, // Prof. Roberto
            { acao_id: acao4.id, funcionario_id: funcionarios[10].id }, // Prof. Amanda (Artes)
            { acao_id: acao4.id, funcionario_id: funcionarios[11].id }, // Motorista Marcos
            { acao_id: acao4.id, funcionario_id: funcionarios[18].id }, // Técnico Rafael

            // Ação 5 - Saúde Cajazeiras
            { acao_id: acao5.id, funcionario_id: funcionarios[0].id }, // Dr. Carlos
            { acao_id: acao5.id, funcionario_id: funcionarios[2].id }, // Dentista João
            { acao_id: acao5.id, funcionario_id: funcionarios[4].id }, // Técnica Ana
            { acao_id: acao5.id, funcionario_id: funcionarios[12].id }, // Motorista Pedro

            // Ação 6 - Jornada Técnica IFPB
            { acao_id: acao6.id, funcionario_id: funcionarios[7].id }, // Prof. Roberto
            { acao_id: acao6.id, funcionario_id: funcionarios[9].id }, // Prof. Gabriel
            { acao_id: acao6.id, funcionario_id: funcionarios[13].id }, // Motorista José
            { acao_id: acao6.id, funcionario_id: funcionarios[18].id }, // Técnico Rafael

            // Ação 7 - SESI Saúde Preventiva
            { acao_id: acao7.id, funcionario_id: funcionarios[0].id }, // Dr. Carlos
            { acao_id: acao7.id, funcionario_id: funcionarios[5].id }, // Oftalmologista Ricardo
            { acao_id: acao7.id, funcionario_id: funcionarios[6].id }, // Nutricionista Beatriz
            { acao_id: acao7.id, funcionario_id: funcionarios[11].id }, // Motorista Marcos

            // Ação 8 - Qualifica SENAC
            { acao_id: acao8.id, funcionario_id: funcionarios[7].id }, // Prof. Roberto
            { acao_id: acao8.id, funcionario_id: funcionarios[10].id }, // Prof. Amanda
            { acao_id: acao8.id, funcionario_id: funcionarios[12].id }, // Motorista Pedro

            // Ação 9 - Mutirão Sousa
            { acao_id: acao9.id, funcionario_id: funcionarios[0].id }, // Dr. Carlos
            { acao_id: acao9.id, funcionario_id: funcionarios[1].id }, // Enfermeira Maria
            { acao_id: acao9.id, funcionario_id: funcionarios[2].id }, // Dentista João
            { acao_id: acao9.id, funcionario_id: funcionarios[14].id }, // Assistente Social Paula
            { acao_id: acao9.id, funcionario_id: funcionarios[13].id }, // Motorista José

            // Ação 10 - Educação Digital Patos
            { acao_id: acao10.id, funcionario_id: funcionarios[7].id }, // Prof. Roberto
            { acao_id: acao10.id, funcionario_id: funcionarios[8].id }, // Prof. Juliana
            { acao_id: acao10.id, funcionario_id: funcionarios[11].id }, // Motorista Marcos
        ]);
        console.log('✅ Funcionários vinculados\n');

        // ========================================
        // 8. RELACIONAMENTOS - Ação + Cursos/Exames
        // ========================================
        console.log('🔗 Vinculando Cursos e Exames às Ações...');
        await AcaoCursoExame.bulkCreate([
            // Ação 1 - Saúde Campina Grande
            { acao_id: acao1.id, curso_exame_id: cursosExames[0].id }, // Consulta Médica
            { acao_id: acao1.id, curso_exame_id: cursosExames[1].id }, // Glicemia
            { acao_id: acao1.id, curso_exame_id: cursosExames[2].id }, // Odonto
            { acao_id: acao1.id, curso_exame_id: cursosExames[3].id }, // Pressão

            // Ação 2 - Educação João Pessoa
            { acao_id: acao2.id, curso_exame_id: cursosExames[7].id }, // Informática
            { acao_id: acao2.id, curso_exame_id: cursosExames[8].id }, // Inglês

            // Ação 3 - Saúde Coração Patos
            { acao_id: acao3.id, curso_exame_id: cursosExames[0].id }, // Consulta
            { acao_id: acao3.id, curso_exame_id: cursosExames[3].id }, // Pressão
            { acao_id: acao3.id, curso_exame_id: cursosExames[4].id }, // ECG

            // Ação 4 - Capacitação Campina Grande
            { acao_id: acao4.id, curso_exame_id: cursosExames[9].id }, // Artesanato
            { acao_id: acao4.id, curso_exame_id: cursosExames[12].id }, // Empreendedorismo
            { acao_id: acao4.id, curso_exame_id: cursosExames[13].id }, // Panificação

            // Ação 5 - Saúde Cajazeiras
            { acao_id: acao5.id, curso_exame_id: cursosExames[0].id }, // Consulta Médica
            { acao_id: acao5.id, curso_exame_id: cursosExames[2].id }, // Odonto
            { acao_id: acao5.id, curso_exame_id: cursosExames[3].id }, // Pressão

            // Ação 6 - Jornada Técnica IFPB
            { acao_id: acao6.id, curso_exame_id: cursosExames[7].id }, // Informática
            { acao_id: acao6.id, curso_exame_id: cursosExames[11].id }, // Excel Avançado
            { acao_id: acao6.id, curso_exame_id: cursosExames[12].id }, // Empreendedorismo

            // Ação 7 - SESI Saúde Preventiva
            { acao_id: acao7.id, curso_exame_id: cursosExames[0].id }, // Consulta
            { acao_id: acao7.id, curso_exame_id: cursosExames[5].id }, // Teste Visão
            { acao_id: acao7.id, curso_exame_id: cursosExames[6].id }, // Nutricional

            // Ação 8 - Qualifica SENAC
            { acao_id: acao8.id, curso_exame_id: cursosExames[13].id }, // Panificação
            { acao_id: acao8.id, curso_exame_id: cursosExames[14].id }, // Manicure
            { acao_id: acao8.id, curso_exame_id: cursosExames[9].id }, // Artesanato

            // Ação 9 - Mutirão Sousa
            { acao_id: acao9.id, curso_exame_id: cursosExames[0].id }, // Consulta
            { acao_id: acao9.id, curso_exame_id: cursosExames[1].id }, // Glicemia
            { acao_id: acao9.id, curso_exame_id: cursosExames[2].id }, // Odonto
            { acao_id: acao9.id, curso_exame_id: cursosExames[3].id }, // Pressão

            // Ação 10 - Educação Digital Patos
            { acao_id: acao10.id, curso_exame_id: cursosExames[7].id }, // Informática
            { acao_id: acao10.id, curso_exame_id: cursosExames[8].id }, // Inglês
            { acao_id: acao10.id, curso_exame_id: cursosExames[10].id }, // Espanhol
        ]);
        console.log('✅ Cursos e exames vinculados\n');

        // ========================================
        // RESUMO FINAL
        // ========================================
        console.log('\n🎉 ========================================');
        console.log('   DADOS EXPANDIDOS CRIADOS COM SUCESSO!');
        console.log('========================================\n');

        console.log('📊 Resumo Completo:');
        console.log(`   • ${instituicoes.length} Instituições`);
        console.log(`   • ${caminhoes.length} Caminhões`);
        console.log(`   • ${funcionarios.length} Funcionários`);
        console.log(`   • ${cursosExames.length} Cursos/Exames`);
        console.log(`   • ${acoes.length} Ações com relacionamentos completos\n`);

        console.log('🔐 Login de admin:');
        console.log('   CPF: 123.456.789-09\n');

        console.log('🌐 Acesse: http://localhost:3000');
        console.log('   - Sistema totalmente populado!');
        console.log('   - Explore as 10 ações em diferentes cidades');
        console.log('   - Veja os 12 caminhões disponíveis');
        console.log('   - Conheça a equipe de 20 profissionais!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao criar dados de teste:', error);
        console.error('Detalhes:', error.message);
        if (error.parent) {
            console.error('Erro do banco:', error.parent.message);
        }
        process.exit(1);
    }
}

// Executa o seed
seedData();
