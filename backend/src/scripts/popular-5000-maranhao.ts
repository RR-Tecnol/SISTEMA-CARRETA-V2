// @ts-nocheck
import { sequelize } from '../config/database';
import { Cidadao } from '../models/Cidadao';
import { Acao } from '../models/Acao';
import { Instituicao } from '../models/Instituicao';
import { Inscricao } from '../models/Inscricao';
import { FichaAtendimento } from '../models/FichaAtendimento';
import { CursoExame } from '../models/CursoExame';
import { AtendimentoMedico } from '../models/AtendimentoMedico';
import { Funcionario } from '../models/Funcionario';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

/**
 * MEGA SEEDER 5000 - MARANHÃO
 * Povoamento complementar e massivo para testes de carga e fluxo real.
 */

const NOMES = ['José', 'Maria', 'João', 'Ana', 'Carlos', 'Francisca', 'Antônio', 'Adriana', 'Paulo', 'Márcia', 'Luís', 'Sandra', 'Fernando', 'Patrícia', 'Ricardo', 'Camila', 'Roberto', 'Juliana', 'Marcos', 'Beatriz'];
const SOBRENOMES = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes', 'Soares', 'Barbosa', 'Vieira', 'Machado'];
const CIDADES_MA = [
    { nome: 'São Luís', cep: '65000-000' },
    { nome: 'Imperatriz', cep: '65900-000' },
    { nome: 'Pinheiro', cep: '65200-000' },
    { nome: 'Caxias', cep: '65600-000' },
    { nome: 'Santa Inês', cep: '65300-000' },
    { nome: 'Codó', cep: '65700-000' },
    { nome: 'Balsas', cep: '65800-000' },
    { nome: 'Açailândia', cep: '65930-000' },
    { nome: 'Bacabal', cep: '65700-000' },
    { nome: 'Timon', cep: '65630-000' }
];

async function megaSeeder5000() {
    try {
        await sequelize.authenticate();
        console.log('🚀 Conectado para Povoamento Massivo (5.000 registros)');

        const hash = await bcrypt.hash('senha123', 10);
        
        // 1. Buscar dependências essenciais
        console.log('🔍 Buscando dependências...');
        const instituicao = await Instituicao.findOne();
        if (!instituicao) {
            console.error('❌ Nenhuma instituição encontrada. Execute o seed-data primeiro.');
            return;
        }
        console.log(`✅ Instituição: ${instituicao.id}`);

        const medico = await Funcionario.findOne({ where: { cargo: { [sequelize.Sequelize.Op.iLike]: '%médico%' } } });
        console.log(`✅ Médico: ${medico?.id || 'Nenhum'}`);
        
        const cursoExame = await CursoExame.findOne({ where: { tipo: 'exame' } });
        console.log(`✅ Exame: ${cursoExame?.id || 'Nenhum'}`);

        // 2. Criar Novas Ações no Maranhão (ou buscar se já existem)
        console.log('📍 Verificando/Criando ações no Maranhão...');
        const acaoSpecs = [
            {
                nome: 'Mega Ação São Luís - Polo Centro',
                tipo: 'saude' as const,
                municipio: 'São Luís',
                estado: 'MA',
                data_inicio: new Date(),
                data_fim: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                status: 'ativa' as const,
                instituicao_id: instituicao.id,
                local_execucao: 'Praça Maria Aragão',
                vagas_disponiveis: 2000,
            },
            {
                nome: 'Expedição Interior - Imperatriz',
                tipo: 'saude' as const,
                municipio: 'Imperatriz',
                estado: 'MA',
                data_inicio: new Date(),
                data_fim: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
                status: 'ativa' as const,
                instituicao_id: instituicao.id,
                local_execucao: 'Beira-Rio',
                vagas_disponiveis: 1500,
            },
            {
                nome: 'Saúde na Estrada - Pinheiro (Finalizada)',
                tipo: 'saude' as const,
                municipio: 'Pinheiro',
                estado: 'MA',
                data_inicio: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
                data_fim: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
                status: 'concluida' as const,
                instituicao_id: instituicao.id,
                local_execucao: 'Polo Universitário',
                vagas_disponiveis: 1000,
            },
            {
                nome: 'Ciclo de Prevenção - Caxias (Finalizada)',
                tipo: 'saude' as const,
                municipio: 'Caxias',
                estado: 'MA',
                data_inicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                data_fim: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
                status: 'concluida' as const,
                instituicao_id: instituicao.id,
                local_execucao: 'Centro Histórico',
                vagas_disponiveis: 500,
            }
        ];

        const acoesNovas = [];
        for (const spec of acaoSpecs) {
            const [acaoInstance] = await Acao.findOrCreate({
                where: { nome: spec.nome },
                defaults: spec
            });
            acoesNovas.push(acaoInstance);
        }
        console.log(`✅ ${acoesNovas.length} ações prontas.`);

        // 3. Gerar 5.000 Cidadãos
        console.log('👥 Gerando 5.000 Cidadãos (Faixa 200.x)...');
        const totalCidadaos = 5000;
        const cidadaosData = [];
        const baseCPF = 20000000000; // Alterado para evitar conflito com 100.x de tentativas anteriores

        for (let i = 0; i < totalCidadaos; i++) {
            const nome1 = NOMES[Math.floor(Math.random() * NOMES.length)];
            const nome2 = SOBRENOMES[Math.floor(Math.random() * SOBRENOMES.length)];
            const nome3 = SOBRENOMES[Math.floor(Math.random() * SOBRENOMES.length)];
            const cidade = CIDADES_MA[Math.floor(Math.random() * CIDADES_MA.length)];
            
            const cpfNum = (baseCPF + i).toString();
            const cpfFormatado = `${cpfNum.substring(0,3)}.${cpfNum.substring(3,6)}.${cpfNum.substring(6,9)}-${cpfNum.substring(9,11)}`;

            cidadaosData.push({
                id: uuidv4(),
                nome_completo: `${nome1} ${nome2} ${nome3}`,
                cpf: cpfFormatado,
                data_nascimento: new Date(1960 + Math.floor(Math.random() * 45), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)),
                telefone: `(98) 9${80000000 + Math.floor(Math.random() * 19999999)}`,
                email: `usuario${i}@exemplo.com.br`,
                senha: hash,
                municipio: cidade.nome,
                estado: 'MA',
                cep: cidade.cep,
                genero: Math.random() > 0.5 ? 'masculino' : 'feminino',
                raca: ['branca', 'preta', 'parda'][Math.floor(Math.random() * 3)],
                consentimento_lgpd: true,
                data_consentimento: new Date(),
            });

            if (cidadaosData.length === 500) {
                await Cidadao.bulkCreate(cidadaosData, { ignoreDuplicates: true });
                process.stdout.write('.');
                cidadaosData.length = 0;
            }
        }
        if (cidadaosData.length > 0) {
            await Cidadao.bulkCreate(cidadaosData, { ignoreDuplicates: true });
        }
        console.log('\n✅ 5.000 Cidadãos inseridos!');

        // 4. Inscrições e Histórico
        console.log('📝 Vinculando Cidadãos às Ações e gerando histórico...');
        const cidadaos = await Cidadao.findAll({ order: [['created_at', 'DESC']], limit: totalCidadaos });
        
        const inscricoes = [];
        const atendimentos = [];
        const fichas = [];

        for (let i = 0; i < cidadaos.length; i++) {
            const cid = cidadaos[i];
            const acao = acoesNovas[i % acoesNovas.length];
            const statusAcao = acao.status;

            const inscId = uuidv4();
            inscricoes.push({
                id: inscId,
                cidadao_id: cid.id,
                acao_id: acao.id,
                curso_exame_id: cursoExame?.id,
                status: statusAcao === 'concluida' ? 'atendido' : 'pendente',
                data_inscricao: new Date(),
            });

            // Gerar Ficha e Atendimento para ações concluídas
            if (statusAcao === 'concluida') {
                const fichaId = uuidv4();
                fichas.push({
                    id: fichaId,
                    inscricao_id: inscId,
                    cidadao_id: cid.id,
                    acao_id: acao.id,
                    status: 'concluido',
                    numero_ficha: i + 1000,
                    hora_entrada: new Date(acao.data_inicio),
                    hora_conclusao: new Date(acao.data_inicio),
                });

                atendimentos.push({
                    id: uuidv4(),
                    funcionario_id: medico?.id,
                    acao_id: acao.id,
                    cidadao_id: cid.id,
                    ponto_id: null,
                    hora_inicio: new Date(acao.data_inicio),
                    hora_fim: new Date(acao.data_inicio),
                    status: 'concluido',
                    nome_paciente: cid.nome_completo,
                    observacoes: 'Atendimento de rotina realizado durante a ação massiva.',
                });
            }

            if (inscricoes.length >= 500) {
                await Inscricao.bulkCreate(inscricoes, { ignoreDuplicates: true });
                if (fichas.length > 0) await FichaAtendimento.bulkCreate(fichas, { ignoreDuplicates: true });
                if (atendimentos.length > 0) await AtendimentoMedico.bulkCreate(atendimentos, { ignoreDuplicates: true });
                
                process.stdout.write('+');
                inscricoes.length = 0;
                fichas.length = 0;
                atendimentos.length = 0;
            }
        }

        if (inscricoes.length > 0) await Inscricao.bulkCreate(inscricoes, { ignoreDuplicates: true });
        if (fichas.length > 0) await FichaAtendimento.bulkCreate(fichas, { ignoreDuplicates: true });
        if (atendimentos.length > 0) await AtendimentoMedico.bulkCreate(atendimentos, { ignoreDuplicates: true });

        console.log('\n✅ Processamento de 5.000 inscrições concluído!');
        console.log('🌟 POVOAMENTO MEGA 5000 CONCLUÍDO COM SUCESSO!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Erro no Mega Seeder:', error);
        process.exit(1);
    }
}

megaSeeder5000();
