import { Router, Request, Response } from 'express';
import { Op, fn, col, literal, where as seqWhere } from 'sequelize';
import { sendExameResultadoEmail } from '../utils/email'; // F5
import { FichaAtendimento } from '../models/FichaAtendimento';
import { ConfiguracaoFilaAcao } from '../models/ConfiguracaoFilaAcao';
import {
    notificarCidadao,
    notificarChamado,
} from '../utils/notificacoes';
import type { ConfigNotif, CidadaoNotif } from '../utils/notificacoes';

// Condicao para identificar medicos (is_medico=true OU cargo tipico)
const cargoMedicoWhere = {
    [Op.or]: [
        { is_medico: true },
        { cargo: { [Op.iLike]: '%medic%' } },
        { cargo: { [Op.iLike]: '%m\u00e9dic%' } },
        { cargo: { [Op.iLike]: '%doutor%' } },
        { cargo: { [Op.iLike]: '%dr.%' } },
    ],
};
import { authenticate, authorizeAdmin, authorizeAdminOrEstrada } from '../middlewares/auth';
import { Funcionario } from '../models/Funcionario';
import { PontoMedico } from '../models/PontoMedico';
import { AtendimentoMedico } from '../models/AtendimentoMedico';
import { Acao } from '../models/Acao';
import { Cidadao } from '../models/Cidadao';
import { AcaoFuncionario } from '../models/AcaoFuncionario';
import { Inscricao } from '../models/Inscricao';
import { CursoExame } from '../models/CursoExame';
import { AcaoCursoExame } from '../models/AcaoCursoExame';


const router = Router();


// Middleware que permite admin OU mÃ©dico autenticado
const authorizeMedicoOrAdmin = (req: any, res: any, next: any) => {
    if (!req.user) { res.status(401).json({ error: 'NÃ£o autenticado' }); return; }
    if (req.user.tipo === 'admin' || req.user.tipo === 'medico') { next(); return; }
    res.status(403).json({ error: 'Acesso negado' });
};

// â• â• â•  GET /minhas-acoes â• â• â•  AÃ§Ãµes em que o mÃ©dico estÃ¡ cadastrado
router.get('/minhas-acoes', authenticate, authorizeMedicoOrAdmin, async (req: any, res: Response) => {
    try {
        const funcionarioId = req.user.id;
        const hoje = new Date();

        // Buscar vÃ­nculos aÃ§Ã£o-funcionÃ¡rio
        const vinculos = await AcaoFuncionario.findAll({
            where: { funcionario_id: funcionarioId },
        });
        const acaoIds = vinculos.map((v) => v.acao_id);

        if (acaoIds.length === 0) {
            res.json([]);
            return;
        }

        // Buscar aÃ§Ãµes vinculadas (ativas ou planejadas â€” sem filtro de data)
        const acoes = await Acao.findAll({
            where: {
                id: { [Op.in]: acaoIds },
                status: { [Op.in]: ['ativa', 'planejada'] },
            },
            order: [['data_inicio', 'ASC']],
        });

        // Para cada aÃ§Ã£o, contar inscritos pendentes
        const acoesCom = await Promise.all(acoes.map(async (acao) => {
            const totalInscritos = await Inscricao.count({
                where: { acao_id: acao.id },
            });
            const pendentes = await Inscricao.count({
                where: { acao_id: acao.id, status: 'pendente' },
            });
            const atendidos = await Inscricao.count({
                where: { acao_id: acao.id, status: 'atendido' },
            });
            return {
                ...acao.toJSON(),
                totalInscritos,
                pendentes,
                atendidos,
            };
        }));

        res.json(acoesCom);
    } catch (error) {
        console.error('Erro ao buscar aÃ§Ãµes do mÃ©dico:', error);
        res.status(500).json({ error: 'Erro ao buscar aÃ§Ãµes' });
    }
});

// ═══ GET /me/exames-do-dia ═══ F7 — exames da ação filtrados pela especialidade do médico
// Retorna apenas os CursoExame das ações do médico que correspondem à sua especialidade
router.get('/me/exames-do-dia', authenticate, authorizeMedicoOrAdmin, async (req: any, res: Response) => {
    try {
        const funcionarioId = req.user.id;

        // Buscar dados do médico para ver a especialidade
        const medico = await Funcionario.findByPk(funcionarioId, {
            attributes: ['id', 'nome', 'especialidade', 'cargo'],
        });
        if (!medico) {
            res.status(404).json({ error: 'Médico não encontrado' });
            return;
        }

        // Buscar ações vinculadas ao médico (ativas/planejadas)
        const vinculos = await AcaoFuncionario.findAll({
            where: { funcionario_id: funcionarioId },
        });
        const acaoIds = vinculos.map((v) => v.acao_id);

        if (acaoIds.length === 0) {
            res.json({ medico, exames: [] });
            return;
        }

        // Buscar todos os CursoExame das ações do médico
        const acaoCursos = await AcaoCursoExame.findAll({
            where: { acao_id: { [Op.in]: acaoIds } },
            include: [
                { model: CursoExame, as: 'curso_exame', attributes: ['id', 'nome', 'tipo', 'codigo_sus'] },
                { model: Acao, as: 'acao', attributes: ['id', 'numero_acao', 'nome', 'municipio', 'status'] },
            ],
        });

        // F7 — filtrar pelo nome do exame que contém a especialidade do médico
        // Se o médico tem especialidade definida, mostra apenas exames do seu tipo
        // Se não tem especialidade, mostra todos (para não bloquear médicos sem especialidade cadastrada)
        const especialidade = medico.especialidade?.toLowerCase().trim();
        const examesFiltrados = especialidade
            ? acaoCursos.filter((ac: any) => {
                const nomeExame = (ac.curso_exame?.nome || '').toLowerCase();
                return nomeExame.includes(especialidade) || especialidade.includes(nomeExame.split(' ')[0]);
            })
            : acaoCursos;

        // Agrupar por ação
        const porAcao = examesFiltrados.reduce((acc: any, ac: any) => {
            const acaoId = ac.acao_id;
            if (!acc[acaoId]) {
                acc[acaoId] = { acao: ac.acao, exames: [] };
            }
            acc[acaoId].exames.push({
                id: ac.id,
                curso_exame_id: ac.curso_exame_id,
                nome: ac.curso_exame?.nome,
                tipo: ac.curso_exame?.tipo,
                codigo_sus: ac.curso_exame?.codigo_sus,
                vagas: ac.vagas,
            });
            return acc;
        }, {});

        res.json({
            medico: { id: medico.id, nome: medico.nome, especialidade: medico.especialidade, cargo: medico.cargo },
            totalExames: examesFiltrados.length,
            filtroAplicado: Boolean(especialidade),
            acoes: Object.values(porAcao),
        });
    } catch (error) {
        console.error('Erro ao buscar exames do médico:', error);
        res.status(500).json({ error: 'Erro ao buscar exames' });
    }
});

// â• â• â•  GET /acao/:id/inscricoes â• â• â•  Lista inscritos de uma aÃ§Ã£o para o mÃ©dico atender
router.get('/acao/:id/inscricoes', authenticate, authorizeMedicoOrAdmin, async (req: any, res: Response) => {
    try {
        const { id: acaoId } = req.params;
        const { status = 'pendente', page = '1', limit = '50' } = req.query as any;
        const offset = (Number(page) - 1) * Number(limit);

        console.log(`[inscricoes] acao_id=${acaoId} status=${status} limit=${limit}`);

        // Verificar total sem filtro de status
        const totalSemFiltro = await Inscricao.count({ where: { acao_id: acaoId } });
        console.log(`[inscricoes] Total de inscriÃ§Ãµes na aÃ§Ã£o (sem filtro de status): ${totalSemFiltro}`);

        const whereClause: any = {
            acao_id: acaoId,
            ...(status !== 'todos' ? { status } : {}),
        };

        const { rows: inscricoes, count } = await Inscricao.findAndCountAll({
            where: whereClause,
            include: [
                { model: Cidadao, as: 'cidadao', attributes: [['nome_completo', 'nome'], 'id', 'cpf', 'data_nascimento', 'telefone', 'genero'] },
                { model: CursoExame, as: 'curso_exame', attributes: ['id', 'nome', 'tipo'] },
            ],
            order: [['data_inscricao', 'ASC']],
            limit: Number(limit),
            offset,
        });

        console.log(`[inscricoes] Encontrados: ${count} inscrições com filtro status=${status}`);

        res.json({ inscricoes, total: count, page: Number(page), pages: Math.ceil(count / Number(limit)) });
    } catch (error) {
        console.error('Erro ao buscar inscritos:', error);
        res.status(500).json({ error: 'Erro ao buscar inscritos' });
    }
});


// â•â•â• GET /me â•â•â• Dados do mÃ©dico logado (para o painel mÃ©dico) â€” aceita ?acao_id
router.get('/me', authenticate, authorizeMedicoOrAdmin, async (req: any, res: Response) => {
    try {
        const funcionarioId = req.user.id;
        const { acao_id } = req.query as any;
        const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
        const amanha = new Date(hoje); amanha.setDate(amanha.getDate() + 1);

        // Ponto ativo
        const pontoAtivo = await PontoMedico.findOne({
            where: { funcionario_id: funcionarioId, status: 'trabalhando' },
        });

        // Atendimentos do dia (filtrar por acao_id se informado; excluir 'aguardando' = fila de espera)
        const whereAtend: any = {
            funcionario_id: funcionarioId,
            hora_inicio: { [Op.between]: [hoje, amanha] },
            status: { [Op.ne]: 'aguardando' }, // Exclui pacientes na fila (gerenciados pelo admin)
        };
        if (acao_id) whereAtend.acao_id = acao_id;

        const atendimentos = await AtendimentoMedico.findAll({
            where: whereAtend,
            order: [['hora_inicio', 'DESC']],
        });

        const emAndamento = atendimentos.find((a) => a.status === 'em_andamento') || null;

        res.json({
            pontoId: pontoAtivo?.id || null,
            pontoStatus: pontoAtivo?.status || null,
            emAndamento,
            atendimentos: atendimentos.map((a) => a.toJSON()),
            serverTime: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Erro ao buscar dados do médico:', error);
        res.status(500).json({ error: 'Erro ao buscar dados' });
    }
});



// ─── POST /atendimento/iniciar ─── Inicia consulta (médico ou admin)
router.post('/atendimento/iniciar', authenticate, authorizeMedicoOrAdmin, async (req: any, res: Response) => {
    try {
        const { funcionario_id, nome_paciente, cidadao_id, acao_id, ponto_id, observacoes, inscricao_id } = req.body;
        const funcId = funcionario_id || req.user.id;

        if (!funcId) {
            res.status(400).json({ error: 'funcionario_id é obrigatório' });
            return;
        }

        // Verificar ponto ativo — abrir automaticamente se não tiver
        let pontoAtivo = ponto_id;
        if (!pontoAtivo) {
            const ponto = await PontoMedico.findOne({ where: { funcionario_id: funcId, status: 'trabalhando' } });
            if (ponto) {
                pontoAtivo = ponto.id;
            } else {
                // Abrir ponto automaticamente
                const novoPonto = await PontoMedico.create({
                    funcionario_id: funcId,
                    data_hora_entrada: new Date(),
                    status: 'trabalhando',
                });
                pontoAtivo = novoPonto.id;
            }
        }

        const atendimento = await AtendimentoMedico.create({
            funcionario_id: funcId,
            acao_id: acao_id || undefined,
            cidadao_id: cidadao_id || undefined,
            ponto_id: pontoAtivo || undefined,
            hora_inicio: new Date(),
            status: 'em_andamento',
            observacoes,
            nome_paciente,
        });

        // ✅ Atualizar ficha da inscrição para em_atendimento
        if (inscricao_id || (cidadao_id && acao_id)) {
            const whereficha: any = { status: { [Op.in]: ['aguardando', 'chamado'] } };
            if (inscricao_id) whereficha.inscricao_id = inscricao_id;
            else { whereficha.cidadao_id = cidadao_id; whereficha.acao_id = acao_id; }

            await FichaAtendimento.update(
                { status: 'em_atendimento', hora_atendimento: new Date() },
                { where: whereficha }
            );

            // Emitir Socket.IO
            const io = (req.app as any).get('io');
            if (io && acao_id) io.to(`acao:${acao_id}`).emit('fila_atualizada', { acao_id });

            // 📲 Notificar cidadão via WhatsApp/SMS/Email
            if (cidadao_id) {
                const cidadao = await Cidadao.findByPk(cidadao_id, { attributes: ['nome_completo', 'email', 'telefone'] });
                if (cidadao) {
                    const config = acao_id ? await ConfiguracaoFilaAcao.findOne({ where: { acao_id } }) : null;
                    const cfg: ConfigNotif = {
                        notif_email: config?.notif_email ?? false,
                        notif_sms: config?.notif_sms ?? false,
                        notif_whatsapp: config?.notif_whatsapp ?? true,
                    };
                    const cid: CidadaoNotif = { nome_completo: (cidadao as any).nome_completo, email: (cidadao as any).email, telefone: (cidadao as any).telefone };
                    const primeiroNome = cid.nome_completo.split(' ')[0];
                    await notificarCidadao(cid,
                        '💉 Seu atendimento foi iniciado!',
                        `💉 ${primeiroNome}, seu atendimento médico FOI INICIADO agora.\nHora: *${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}*\nAguarde as orientações do profissional.`,
                        cfg
                    );
                }
            }
        }

        res.status(201).json(atendimento);
    } catch (error) {
        console.error('Erro ao iniciar atendimento:', error);
        res.status(500).json({ error: 'Erro ao iniciar atendimento' });
    }
});

// ─── PUT /atendimento/:id/finalizar ─── (médico ou admin)
router.put('/atendimento/:id/finalizar', authenticate, authorizeMedicoOrAdmin, async (req: any, res: Response) => {
    try {
        const atendimento = await AtendimentoMedico.findByPk(req.params.id);
        if (!atendimento) { res.status(404).json({ error: 'Atendimento não encontrado' }); return; }
        const fim = new Date();
        const duracaoMs = fim.getTime() - atendimento.hora_inicio.getTime();
        const duracaoMinutos = Math.max(1, Math.round(duracaoMs / (1000 * 60)));
        await atendimento.update({ hora_fim: fim, duracao_minutos: duracaoMinutos, status: 'concluido', observacoes: req.body.observacoes || atendimento.observacoes });

        const inscricao_id = req.body.inscricao_id;

        // Atualizar status da inscrição para 'atendido' — apenas a inscrição específica
        if (atendimento.cidadao_id && atendimento.acao_id) {
            if (inscricao_id) {
                // Rota precisa: marcar apenas a inscrição do exame específico
                await Inscricao.update(
                    { status: 'atendido' },
                    { where: { id: inscricao_id, cidadao_id: atendimento.cidadao_id, status: 'pendente' } }
                );
            } else {
                // Fallback legado: marcar todas pendentes do cidadão nessa ação
                await Inscricao.update(
                    { status: 'atendido' },
                    { where: { cidadao_id: atendimento.cidadao_id, acao_id: atendimento.acao_id, status: 'pendente' } }
                );
            }
        }

        // ✅ Atualizar ficha para concluido
        if (atendimento.cidadao_id && atendimento.acao_id) {
            const whereFinish: any = { status: 'em_atendimento' };
            if (inscricao_id) whereFinish.inscricao_id = inscricao_id;
            else { whereFinish.cidadao_id = atendimento.cidadao_id; whereFinish.acao_id = atendimento.acao_id; }

            await FichaAtendimento.update(
                { status: 'concluido', hora_conclusao: fim },
                { where: whereFinish }
            );

            // Emitir Socket.IO
            const io = (req.app as any).get('io');
            if (io) io.to(`acao:${atendimento.acao_id}`).emit('fila_atualizada', { acao_id: atendimento.acao_id });

            // 📲 Notificar cidadão — atendimento concluído
            if (atendimento.cidadao_id) {
                const cidadao = await Cidadao.findByPk(atendimento.cidadao_id, { attributes: ['nome_completo', 'email', 'telefone'] });
                if (cidadao) {
                    const config = await ConfiguracaoFilaAcao.findOne({ where: { acao_id: atendimento.acao_id } });
                    const cfg: ConfigNotif = {
                        notif_email: config?.notif_email ?? false,
                        notif_sms: config?.notif_sms ?? false,
                        notif_whatsapp: config?.notif_whatsapp ?? true,
                    };
                    const cid: CidadaoNotif = { nome_completo: (cidadao as any).nome_completo, email: (cidadao as any).email, telefone: (cidadao as any).telefone };
                    const primeiroNome = cid.nome_completo.split(' ')[0];
                    await notificarCidadao(cid,
                        '✅ Atendimento concluído!',
                        `✅ ${primeiroNome}, seu atendimento foi *CONCLUÍDO*!\nHorário: *${fim.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}*\nDuração: *${duracaoMinutos} min*\nObrigado por utilizar nossos serviços. 💙`,
                        cfg
                    );
                }
            }
        }

        res.json(atendimento);
    } catch (error) {
        console.error('Erro ao finalizar atendimento:', error);
        res.status(500).json({ error: 'Erro ao finalizar atendimento' });
    }
});

// â•â•â• PUT /atendimento/:id/cancelar â•â•â• (mÃ©dico ou admin)
router.put('/atendimento/:id/cancelar', authenticate, authorizeMedicoOrAdmin, async (req: any, res: Response) => {
    try {
        const atendimento = await AtendimentoMedico.findByPk(req.params.id);
        if (!atendimento) { res.status(404).json({ error: 'Atendimento nÃ£o encontrado' }); return; }
        await atendimento.update({ status: 'cancelado', hora_fim: new Date() });

        // Manter inscriÃ§Ã£o como pendente (nÃ£o foi atendido, mas pode ser reagendado)
        // NÃ£o altera o status da inscriÃ§Ã£o ao cancelar

        res.json(atendimento);
    } catch (error) {
        console.error('Erro ao cancelar atendimento:', error);
        res.status(500).json({ error: 'Erro ao cancelar atendimento' });
    }
});



// ï¿½"?ï¿½"?ï¿½"? Mï¿½?DICOS ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?
// GET /medicos ï¿½?" lista apenas funcionÃ¡rios com cargo mÃ©dico
router.get('/medicos', authenticate, authorizeAdminOrEstrada, async (_req: Request, res: Response) => {
    try {
        const medicos = await Funcionario.findAll({
            where: {
                ...cargoMedicoWhere,
                ativo: true,
            },
            order: [['nome', 'ASC']],
        });
        res.json(medicos);
    } catch (error) {
        console.error('Erro ao buscar mÃ©dicos:', error);
        res.status(500).json({ error: 'Erro ao buscar mÃ©dicos' });
    }
});

// ï¿½"?ï¿½"?ï¿½"? DASHBOARD ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?
// GET /dashboard ï¿½?" KPIs globais
router.get('/dashboard', authenticate, authorizeAdminOrEstrada, async (_req: Request, res: Response) => {
    try {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const amanha = new Date(hoje);
        amanha.setDate(amanha.getDate() + 1);

        // MÃ©dicos ativos agora (com ponto aberto)
        const medicosAtivos = await PontoMedico.count({
            where: { status: 'trabalhando' },
        });

        // Total de atendimentos hoje
        const atendimentosHoje = await AtendimentoMedico.count({
            where: {
                hora_inicio: { [Op.between]: [hoje, amanha] },
                status: { [Op.in]: ['concluido', 'em_andamento'] },
            },
        });

        // Atendimentos concluÃ­dos hoje
        const atendimentosConcluidos = await AtendimentoMedico.count({
            where: {
                hora_inicio: { [Op.between]: [hoje, amanha] },
                status: 'concluido',
            },
        });

        // Tempo mÃ©dio de atendimento (em minutos) ï¿½?" apenas concluÃ­dos hoje
        const tempoMedioRaw = await AtendimentoMedico.findOne({
            attributes: [[fn('AVG', col('duracao_minutos')), 'media']],
            where: {
                hora_inicio: { [Op.between]: [hoje, amanha] },
                status: 'concluido',
                duracao_minutos: { [Op.ne]: null },
            },
            raw: true,
        }) as any;
        const tempoMedio = tempoMedioRaw?.media ? Math.round(Number(tempoMedioRaw.media)) : 0;

        // Total de mÃ©dicos cadastrados (ativos)
        const totalMedicos = await Funcionario.count({
            where: { ...cargoMedicoWhere, ativo: true },
        });

        // Top mÃ©dico do dia (mais atendimentos)
        const topMedicoRaw = await AtendimentoMedico.findAll({
            attributes: [
                'funcionario_id',
                [fn('COUNT', col('AtendimentoMedico.id')), 'total'],
            ],
            where: {
                hora_inicio: { [Op.between]: [hoje, amanha] },
                status: 'concluido',
            },
            include: [{ model: Funcionario, as: 'funcionario', attributes: ['nome', 'especialidade'] }],
            group: ['funcionario_id', 'funcionario.id'],
            order: [[literal('"total"'), 'DESC']],
            limit: 1,
            raw: false,
        });

        const topMedico = topMedicoRaw.length > 0 ? {
            nome: (topMedicoRaw[0] as any).funcionario?.nome,
            total: (topMedicoRaw[0] as any).dataValues.total,
        } : null;

        // Alertas: mÃ©dicos trabalhando sem atendimentos na Ãºltima 1h
        const umaHoraAtras = new Date(Date.now() - 60 * 60 * 1000);
        const pontosSemAtendimento = await PontoMedico.findAll({
            where: {
                status: 'trabalhando',
                data_hora_entrada: { [Op.lt]: umaHoraAtras },
            },
            include: [
                { model: Funcionario, as: 'funcionario', attributes: ['nome', 'cargo'] },
                {
                    model: AtendimentoMedico,
                    as: 'atendimentos',
                    required: false,
                    where: { hora_inicio: { [Op.gt]: umaHoraAtras } },
                    attributes: ['id'],
                },
            ],
        });

        const alertas = pontosSemAtendimento
            .filter((p: any) => !p.atendimentos || p.atendimentos.length === 0)
            .map((p: any) => ({
                medico_nome: p.funcionario?.nome,
                entrada: p.data_hora_entrada,
                ponto_id: p.id,
            }));

        res.json({
            medicosAtivos,
            atendimentosHoje,
            atendimentosConcluidos,
            tempoMedioMinutos: tempoMedio,
            totalMedicos,
            topMedico,
            alertas,
        });
    } catch (error) {
        console.error('Erro no dashboard mÃ©dico:', error);
        res.status(500).json({ error: 'Erro ao gerar dashboard' });
    }
});

// ï¿½"?ï¿½"?ï¿½"? PONTO ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?
// POST /ponto/entrada
router.post('/ponto/entrada', authenticate, authorizeMedicoOrAdmin, async (req: Request, res: Response) => {
    try {
        const { funcionario_id, acao_id, observacoes } = req.body;
        if (!funcionario_id) {
            res.status(400).json({ error: 'funcionario_id Ã© obrigatÃ³rio' });
            return;
        }

        // Verificar se jÃ¡ tem ponto aberto
        const pontoAberto = await PontoMedico.findOne({
            where: { funcionario_id, status: 'trabalhando' },
        });
        if (pontoAberto) {
            res.status(409).json({ error: 'MÃ©dico jÃ¡ possui ponto aberto', ponto: pontoAberto });
            return;
        }

        const ponto = await PontoMedico.create({
            funcionario_id,
            acao_id: acao_id || undefined,
            data_hora_entrada: new Date(),
            status: 'trabalhando',
            observacoes,
        });

        res.status(201).json(ponto);
    } catch (error) {
        console.error('Erro ao registrar entrada:', error);
        res.status(500).json({ error: 'Erro ao registrar entrada' });
    }
});

// PUT /ponto/:id/saida
router.put('/ponto/:id/saida', authenticate, authorizeMedicoOrAdmin, async (req: Request, res: Response) => {
    try {
        const ponto = await PontoMedico.findByPk(req.params.id);
        if (!ponto) {
            res.status(404).json({ error: 'Ponto nÃ£o encontrado' });
            return;
        }
        if (ponto.status === 'saiu') {
            res.status(409).json({ error: 'Ponto jÃ¡ encerrado' });
            return;
        }

        const saida = new Date();
        const diferencaMs = saida.getTime() - ponto.data_hora_entrada.getTime();
        const horasTrabalhadas = parseFloat((diferencaMs / (1000 * 60 * 60)).toFixed(2));

        await ponto.update({
            data_hora_saida: saida,
            status: 'saiu',
            horas_trabalhadas: horasTrabalhadas,
            observacoes: req.body.observacoes || ponto.observacoes,
        });

        // Finalizar atendimentos em andamento
        await AtendimentoMedico.update(
            { status: 'cancelado' },
            { where: { ponto_id: ponto.id, status: 'em_andamento' } }
        );

        res.json(ponto);
    } catch (error) {
        console.error('Erro ao registrar saÃ­da:', error);
        res.status(500).json({ error: 'Erro ao registrar saÃ­da' });
    }
});

// GET /ponto ï¿½?" listar pontos com filtros
router.get('/ponto', authenticate, authorizeAdminOrEstrada, async (req: Request, res: Response) => {
    try {
        const { funcionario_id, acao_id, data_inicio, data_fim, status } = req.query;

        const where: any = {};
        if (funcionario_id) where.funcionario_id = funcionario_id;
        if (acao_id) where.acao_id = acao_id;
        if (status) where.status = status;
        if (data_inicio || data_fim) {
            where.data_hora_entrada = {};
            if (data_inicio) {
                const inicio = new Date(data_inicio as string);
                inicio.setTime(inicio.getTime() + 3 * 60 * 60 * 1000); // 00:00 BRT = 03:00 UTC
                where.data_hora_entrada[Op.gte] = inicio;
            }
            if (data_fim) {
                const fim = new Date(data_fim as string);
                fim.setTime(fim.getTime() + 27 * 60 * 60 * 1000 - 1); // 23:59:59.999 BRT = 02:59:59.999 UTC do dia seguinte
                where.data_hora_entrada[Op.lte] = fim;
            }
        }

        // Step 1: buscar pontos sem include aninhado (evita ambiguidade de colunas SQL)
        const pontos = await PontoMedico.findAll({
            where,
            include: [
                { model: Funcionario, as: 'funcionario', attributes: ['id', 'nome', 'cargo', 'especialidade'], required: false },
                { model: Acao, as: 'acao', attributes: ['id', 'numero_acao', 'nome'], required: false },
            ],
            order: [['data_hora_entrada', 'DESC']],
        });

        // Step 2: buscar atendimentos separadamente para os pontos encontrados
        const pontoIds = pontos.map((p) => p.id);
        const atendimentosMap: Record<string, any[]> = {};

        if (pontoIds.length > 0) {
            const atendimentos = await AtendimentoMedico.findAll({
                where: { ponto_id: { [Op.in]: pontoIds } },
                attributes: ['id', 'ponto_id', 'hora_inicio', 'hora_fim', 'duracao_minutos', 'status', 'nome_paciente', 'cidadao_id', 'observacoes'],
                order: [['hora_inicio', 'ASC']],
            });
            atendimentos.forEach((atd) => {
                const pid = String(atd.ponto_id);
                if (!atendimentosMap[pid]) atendimentosMap[pid] = [];
                atendimentosMap[pid].push(atd.toJSON());
            });
        }

        // Step 3: combinar resultado
        const resultado = pontos.map((p) => ({
            ...(p.toJSON() as any),
            atendimentos: atendimentosMap[p.id] || [],
        }));

        res.json(resultado);
    } catch (error) {
        console.error('Erro ao buscar pontos:', error);
        res.status(500).json({ error: 'Erro ao buscar pontos' });
    }
});

// ï¿½"?ï¿½"?ï¿½"? ATENDIMENTOS ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?
// POST /atendimentos ï¿½?" iniciar atendimento
router.post('/atendimentos', authenticate, authorizeAdminOrEstrada, async (req: Request, res: Response) => {
    try {
        const { funcionario_id, acao_id, cidadao_id, ponto_id, observacoes, nome_paciente } = req.body;
        if (!funcionario_id) {
            res.status(400).json({ error: 'funcionario_id Ã© obrigatÃ³rio' });
            return;
        }

        // Buscar ponto ativo automaticamente se nÃ£o informado
        let pontoAtivo = ponto_id;
        if (!pontoAtivo) {
            const ponto = await PontoMedico.findOne({
                where: { funcionario_id, status: 'trabalhando' },
            });
            pontoAtivo = ponto?.id;
        }

        const atendimento = await AtendimentoMedico.create({
            funcionario_id,
            acao_id: acao_id || undefined,
            cidadao_id: cidadao_id || undefined,
            ponto_id: pontoAtivo || undefined,
            hora_inicio: new Date(),
            status: 'aguardando', // Admin adiciona Ã  fila de espera; mÃ©dico muda para em_andamento ao chamar
            observacoes,
            nome_paciente,
        });

        const atendimentoCompleto = await AtendimentoMedico.findByPk(atendimento.id, {
            include: [
                { model: Cidadao, as: 'cidadao', attributes: ['id', 'nome'] },
                { model: Funcionario, as: 'funcionario', attributes: ['id', 'nome'] },
            ],
        });

        res.status(201).json(atendimentoCompleto);
    } catch (error) {
        console.error('Erro ao iniciar atendimento:', error);
        res.status(500).json({ error: 'Erro ao iniciar atendimento' });
    }
});

// PUT /atendimentos/:id/finalizar
router.put('/atendimentos/:id/finalizar', authenticate, authorizeAdminOrEstrada, async (req: Request, res: Response) => {
    try {
        const atendimento = await AtendimentoMedico.findByPk(req.params.id);
        if (!atendimento) {
            res.status(404).json({ error: 'Atendimento nÃ£o encontrado' });
            return;
        }

        const fim = new Date();
        const duracaoMs = fim.getTime() - atendimento.hora_inicio.getTime();
        const duracaoMinutos = Math.round(duracaoMs / (1000 * 60));

        await atendimento.update({
            hora_fim: fim,
            duracao_minutos: duracaoMinutos,
            status: 'concluido',
            observacoes: req.body.observacoes || atendimento.observacoes,
        });

        res.json(atendimento);
    } catch (error) {
        console.error('Erro ao finalizar atendimento:', error);
        res.status(500).json({ error: 'Erro ao finalizar atendimento' });
    }
});

// PUT /atendimentos/:id/cancelar
router.put('/atendimentos/:id/cancelar', authenticate, authorizeAdminOrEstrada, async (req: Request, res: Response) => {
    try {
        const atendimento = await AtendimentoMedico.findByPk(req.params.id);
        if (!atendimento) {
            res.status(404).json({ error: 'Atendimento nÃ£o encontrado' });
            return;
        }
        await atendimento.update({ status: 'cancelado', observacoes: req.body.observacoes || atendimento.observacoes });
        res.json(atendimento);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao cancelar atendimento' });
    }
});

// GET /debug-timestamps â€” endpoint temporÃ¡rio para diagnÃ³stico de timezone
// Remove este endpoint apÃ³s diagnosticar o problema
router.get('/debug-timestamps', authenticate, authorizeAdminOrEstrada, async (req: Request, res: Response) => {
    try {
        const ultimos = await AtendimentoMedico.findAll({
            order: [['hora_inicio', 'DESC']],
            limit: 10,
            attributes: ['id', 'funcionario_id', 'hora_inicio', 'hora_fim', 'status', 'nome_paciente'],
        });

        const dataParam = req.query.data as string || new Date().toISOString().split('T')[0];
        // Range sem ajuste (como o frontend envia)
        const inicioSemAjuste = new Date(dataParam);
        const fimSemAjuste = new Date(dataParam);
        fimSemAjuste.setHours(23, 59, 59, 999);

        // Range com ajuste UTC-3 (brasileiro)
        const inicioComAjuste = new Date(dataParam);
        inicioComAjuste.setHours(0 + 3, 0, 0, 0); // 03:00 UTC = 00:00 BRT
        const fimComAjuste = new Date(dataParam);
        fimComAjuste.setHours(23 + 3, 59, 59, 999); // PrÃ³ximo dia 02:59:59 UTC = 23:59 BRT

        res.json({
            serverTime: new Date().toISOString(),
            serverTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            dataParam,
            rangeSemAjuste: { inicio: inicioSemAjuste.toISOString(), fim: fimSemAjuste.toISOString() },
            rangeComAjusteBRT: { inicio: inicioComAjuste.toISOString(), fim: fimComAjuste.toISOString() },
            ultimosAtendimentos: ultimos.map(a => ({
                id: a.id,
                funcionario_id: a.funcionario_id,
                hora_inicio_iso: new Date(a.hora_inicio).toISOString(),
                hora_inicio_local: new Date(a.hora_inicio).toLocaleString('pt-BR', { timeZone: 'America/Fortaleza' }),
                status: a.status,
                nome_paciente: a.nome_paciente,
            })),
        });
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

// GET /atendimentos â€” listar com filtros
router.get('/atendimentos', authenticate, authorizeAdminOrEstrada, async (req: Request, res: Response) => {
    try {
        const { funcionario_id, acao_id, data_inicio, data_fim, status, limit } = req.query;

        const where: any = {};
        if (funcionario_id) where.funcionario_id = funcionario_id;
        if (acao_id) where.acao_id = acao_id;
        if (status) where.status = status;
        if (data_inicio || data_fim) {
            where.hora_inicio = {};
            if (data_inicio) {
                // data_inicio = 'YYYY-MM-DD' (dia no fuso BRT = UTC-3)
                // new Date('YYYY-MM-DD') = UTC midnight. Para cobrir BRT, precisamos de UTC+3h = inÃ­cio do dia BRT
                const inicio = new Date(data_inicio as string);
                inicio.setTime(inicio.getTime() + 3 * 60 * 60 * 1000); // 00:00 BRT = 03:00 UTC
                where.hora_inicio[Op.gte] = inicio;
            }
            if (data_fim) {
                // Fim do dia BRT (23:59:59) = prÃ³ximo dia 02:59:59 UTC
                const fim = new Date(data_fim as string);
                fim.setTime(fim.getTime() + 27 * 60 * 60 * 1000 - 1); // 23:59:59.999 BRT = 02:59:59.999 UTC do dia seguinte
                where.hora_inicio[Op.lte] = fim;
            }
        }

        const atendimentos = await AtendimentoMedico.findAll({
            where,
            include: [
                { model: Funcionario, as: 'funcionario', attributes: ['id', 'nome', 'cargo', 'especialidade'] },
                { model: Acao, as: 'acao', attributes: ['id', 'numero_acao', 'nome'] },
                // 'nome' Ã© alias de 'nome_completo' para manter compatibilidade com o frontend
                { model: Cidadao, as: 'cidadao', attributes: ['id', [literal('nome_completo'), 'nome']] },
            ],
            order: [['hora_inicio', 'DESC']],
            limit: limit ? parseInt(limit as string) : undefined,
        });

        res.json(atendimentos);
    } catch (error) {
        console.error('Erro ao buscar atendimentos:', error);
        res.status(500).json({ error: 'Erro ao buscar atendimentos' });
    }
});


// ï¿½"?ï¿½"?ï¿½"? RELATï¿½"RIO ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?ï¿½"?
// GET /relatorio/geral â€” DEVE vir ANTES de /relatorio/:funcionario_id
router.get('/relatorio/geral', authenticate, authorizeAdminOrEstrada, async (req: Request, res: Response) => {
    try {
        const { data_inicio, data_fim, acao_id } = req.query;

        const whereAtendimento: any = {};
        const wherePonto: any = {};

        if (acao_id) {
            whereAtendimento.acao_id = acao_id;
            wherePonto.acao_id = acao_id;
        }
        if (data_inicio || data_fim) {
            whereAtendimento.hora_inicio = {};
            wherePonto.data_hora_entrada = {};
            if (data_inicio) {
                whereAtendimento.hora_inicio[Op.gte] = new Date(data_inicio as string);
                wherePonto.data_hora_entrada[Op.gte] = new Date(data_inicio as string);
            }
            if (data_fim) {
                const fim = new Date(data_fim as string);
                fim.setHours(23, 59, 59, 999);
                whereAtendimento.hora_inicio[Op.lte] = fim;
                wherePonto.data_hora_entrada[Op.lte] = fim;
            }
        }

        const medicos = await Funcionario.findAll({
            where: { ...cargoMedicoWhere, ativo: true },
            order: [['nome', 'ASC']],
        });

        const atendimentos = await AtendimentoMedico.findAll({
            where: whereAtendimento,
            include: [
                { model: Acao, as: 'acao', attributes: ['id', 'numero_acao', 'nome'] },
                { model: Cidadao, as: 'cidadao', attributes: ['id', [literal("nome_completo"), 'nome']] },
            ],
            order: [['funcionario_id', 'ASC'], ['hora_inicio', 'ASC']],
        });

        const pontos = await PontoMedico.findAll({
            where: wherePonto,
            order: [['funcionario_id', 'ASC'], ['data_hora_entrada', 'ASC']],
        });

        const resumoPorMedico = medicos.map((m: any) => {
            const atdMedico = atendimentos.filter((a: any) => String(a.funcionario_id) === String(m.id));
            const pontosMedico = pontos.filter((p: any) => String(p.funcionario_id) === String(m.id));
            const concluidos = atdMedico.filter((a: any) => a.status === 'concluido');
            const duracoes = concluidos.filter((a: any) => a.duracao_minutos != null);
            const tempoMedio = duracoes.length > 0
                ? Math.round(duracoes.reduce((acc: number, a: any) => acc + (a.duracao_minutos || 0), 0) / duracoes.length)
                : 0;
            const horasTrabalhadas = pontosMedico
                .filter((p: any) => p.status === 'saiu' && p.horas_trabalhadas)
                .reduce((acc: number, p: any) => acc + Number(p.horas_trabalhadas || 0), 0);
            const diasTrabalhados = pontosMedico.filter((p: any) => p.status === 'saiu').length;
            const custoTotal = parseFloat((Number(m.custo_diaria || 0) * diasTrabalhados).toFixed(2));
            return {
                medico: { id: m.id, nome: m.nome, cargo: m.cargo, especialidade: m.especialidade, custo_diaria: m.custo_diaria },
                metricas: {
                    totalAtendidos: concluidos.length,
                    totalAtendimentos: atdMedico.length,
                    atendimentosCancelados: atdMedico.filter((a: any) => a.status === 'cancelado').length,
                    atendimentosEmAndamento: atdMedico.filter((a: any) => a.status === 'em_andamento').length,
                    tempoMedioMinutos: tempoMedio,
                    totalHorasTrabalhadas: parseFloat(horasTrabalhadas.toFixed(2)),
                    totalDiasTrabalhados: diasTrabalhados,
                    custoTotal,
                },
                atendimentos: atdMedico.map((a: any) => a.toJSON()),
            };
        });

        const totalAtendidos = resumoPorMedico.reduce((acc, m) => acc + m.metricas.totalAtendidos, 0);
        const allDuracoes = atendimentos.filter((a: any) => a.status === 'concluido' && a.duracao_minutos != null);
        const tempoMedioGeral = allDuracoes.length > 0
            ? Math.round((allDuracoes as any[]).reduce((acc, a) => acc + (a.duracao_minutos || 0), 0) / allDuracoes.length)
            : 0;

        res.json({
            periodo: { data_inicio: data_inicio || null, data_fim: data_fim || null },
            totais: {
                totalAtendidos,
                totalMedicos: medicos.length,
                tempoMedioMinutos: tempoMedioGeral,
                custoTotalGeral: parseFloat(resumoPorMedico.reduce((acc, m) => acc + m.metricas.custoTotal, 0).toFixed(2)),
            },
            medicos: resumoPorMedico,
            gerado_em: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Erro ao gerar relatÃ³rio geral:', error);
        res.status(500).json({ error: 'Erro ao gerar relatÃ³rio geral' });
    }
});

// GET /relatorio/:funcionario_id â€” relatÃ³rio individual (vem DEPOIS de /relatorio/geral)
router.get('/relatorio/:funcionario_id', authenticate, authorizeAdminOrEstrada, async (req: Request, res: Response) => {
    try {
        const { funcionario_id } = req.params;
        const { data_inicio, data_fim, acao_id } = req.query;

        const funcionario = await Funcionario.findByPk(funcionario_id);
        if (!funcionario) {
            res.status(404).json({ error: 'FuncionÃ¡rio nÃ£o encontrado' });
            return;
        }

        const wherePonto: any = { funcionario_id };
        const whereAtendimento: any = { funcionario_id };
        if (acao_id) { wherePonto.acao_id = acao_id; whereAtendimento.acao_id = acao_id; }
        if (data_inicio || data_fim) {
            wherePonto.data_hora_entrada = {};
            whereAtendimento.hora_inicio = {};
            if (data_inicio) {
                wherePonto.data_hora_entrada[Op.gte] = new Date(data_inicio as string);
                whereAtendimento.hora_inicio[Op.gte] = new Date(data_inicio as string);
            }
            if (data_fim) {
                const fim = new Date(data_fim as string);
                fim.setHours(23, 59, 59, 999);
                wherePonto.data_hora_entrada[Op.lte] = fim;
                whereAtendimento.hora_inicio[Op.lte] = fim;
            }
        }

        const pontos = await PontoMedico.findAll({
            where: wherePonto,
            include: [{ model: Acao, as: 'acao', attributes: ['id', 'numero_acao', 'nome'] }],
            order: [['data_hora_entrada', 'DESC']],
        });

        const atendimentos = await AtendimentoMedico.findAll({
            where: whereAtendimento,
            include: [
                {
                    model: Acao, as: 'acao', attributes: ['id', 'numero_acao', 'nome'],
                    include: [{ model: CursoExame, as: 'cursos', attributes: ['nome'] }]
                },
                { model: Cidadao, as: 'cidadao', attributes: ['id', [literal('nome_completo'), 'nome']] },
            ],
            order: [['hora_inicio', 'DESC']],
        });

        // Calcular mÃ©tricas
        const totalHorasTrabalhadas = pontos
            .filter((p) => p.status === 'saiu' && p.horas_trabalhadas)
            .reduce((acc, p) => acc + (Number(p.horas_trabalhadas) || 0), 0);

        const atendimentosConcluidos = atendimentos.filter((a) => a.status === 'concluido');
        const totalAtendidos = atendimentosConcluidos.length;
        const duracoesValidas = atendimentosConcluidos.filter((a) => a.duracao_minutos);
        const tempoMedioMinutos = duracoesValidas.length > 0
            ? Math.round(duracoesValidas.reduce((acc, a) => acc + (a.duracao_minutos || 0), 0) / duracoesValidas.length)
            : 0;

        const custoDiaria = Number(funcionario.custo_diaria);
        const diasTrabalhados = pontos.filter((p) => p.status === 'saiu').length;

        res.json({
            funcionario: {
                id: funcionario.id,
                nome: funcionario.nome,
                cargo: funcionario.cargo,
                especialidade: funcionario.especialidade,
                custo_diaria: custoDiaria,
            },
            metricas: {
                totalDiasTrabalhados: diasTrabalhados,
                totalHorasTrabalhadas: parseFloat(totalHorasTrabalhadas.toFixed(2)),
                totalAtendidos,
                atendimentosCancelados: atendimentos.filter((a) => a.status === 'cancelado').length,
                atendimentosEmAndamento: atendimentos.filter((a) => a.status === 'em_andamento').length,
                tempoMedioMinutos,
                custoTotal: parseFloat((custoDiaria * diasTrabalhados).toFixed(2)),
            },
            pontos,
            atendimentos,
        });
    } catch (error) {
        console.error('Erro ao gerar relatÃ³rio:', error);
        res.status(500).json({ error: 'Erro ao gerar relatÃ³rio' });
    }
});


// â•â•â• GET /stats/tempo-real â•â•â• (admin) â€” atendimentos em andamento AGORA + resumo do dia por mÃ©dico
router.get('/stats/tempo-real', authenticate, authorizeAdminOrEstrada, async (_req: Request, res: Response) => {
    try {
        const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
        const amanha = new Date(hoje); amanha.setDate(amanha.getDate() + 1);

        // Atendimentos em andamento AGORA
        const ativos = await AtendimentoMedico.findAll({
            where: { status: 'em_andamento' },
            include: [
                { model: Funcionario, as: 'funcionario', attributes: ['id', 'nome', 'cargo', 'especialidade'] },
                { model: Acao, as: 'acao', attributes: ['id', 'numero_acao', 'nome'] },
                { model: Cidadao, as: 'cidadao', attributes: ['id', [literal("nome_completo"), 'nome']] },
            ],
            order: [['hora_inicio', 'ASC']],
        });

        const agora = Date.now();
        const resultado = ativos.map((a: any) => {
            const inicio = new Date(a.hora_inicio).getTime();
            const segundos = Math.floor((agora - inicio) / 1000);
            const json = a.toJSON();
            return {
                ...json,
                tempo_decorrido_segundos: segundos,
                nome_paciente_display: json.cidadao?.nome || json.nome_paciente || 'â€”',
            };
        });

        // Resumo do dia por mÃ©dico (concluÃ­dos, em andamento, aguardando, cancelados)
        const todosHoje = await AtendimentoMedico.findAll({
            where: {
                hora_inicio: { [Op.between]: [hoje, amanha] },
                status: { [Op.ne]: 'aguardando' }, // Fila de espera nÃ£o conta como atendimento
            },
            attributes: ['funcionario_id', 'status'],
        });

        const resumoPorMedico: Record<string, { concluidos: number; emAndamento: number; cancelados: number; total: number }> = {};
        todosHoje.forEach((a: any) => {
            const fid = String(a.funcionario_id);
            if (!resumoPorMedico[fid]) resumoPorMedico[fid] = { concluidos: 0, emAndamento: 0, cancelados: 0, total: 0 };
            resumoPorMedico[fid].total++;
            if (a.status === 'concluido') resumoPorMedico[fid].concluidos++;
            else if (a.status === 'em_andamento') resumoPorMedico[fid].emAndamento++;
            else if (a.status === 'cancelado') resumoPorMedico[fid].cancelados++;
        });

        const pontosAtivos = await PontoMedico.findAll({
            where: { status: 'trabalhando' },
            include: [{ model: Acao, as: 'acao', attributes: ['id', 'numero_acao', 'nome'] }]
        });

        res.json({
            total: resultado.length,
            em_andamento: resultado,
            resumoPorMedico,
            pontosAtivos,
            gerado_em: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Erro ao buscar tempo real:', error);
        res.status(500).json({ error: 'Erro ao buscar dados de tempo real' });
    }
});


// â•â•â• GET /cidadaos/buscar â•â•â• Busca cidadÃ£os cadastrados (com filtro por aÃ§Ã£o)
// Usado pelo autocomplete do modal "Novo Atendimento" no admin
router.get('/cidadaos/buscar', authenticate, authorizeAdminOrEstrada, async (req: Request, res: Response) => {
    try {
        const { q = '', acao_id } = req.query as { q?: string; acao_id?: string };
        const termo = String(q).trim();

        if (acao_id) {
            // Busca inscritos da aÃ§Ã£o que ainda nÃ£o foram atendidos
            const inscricoes = await Inscricao.findAll({
                where: { acao_id, status: { [Op.in]: ['pendente', 'atendido'] } },
                include: [{
                    model: Cidadao,
                    as: 'cidadao',
                    attributes: ['id', [literal('nome_completo'), 'nome'], 'cpf', 'telefone', 'data_nascimento'],
                    ...(termo ? {
                        where: {
                            [Op.or]: [
                                { nome_completo: { [Op.iLike]: `%${termo}%` } },
                                { cpf: { [Op.iLike]: `%${termo}%` } },
                            ],
                        },
                    } : {}),
                    required: Boolean(termo),
                }],
                limit: 20,
            });
            const resultado = inscricoes
                .filter((i: any) => i.cidadao)
                .map((i: any) => ({
                    id: i.cidadao.id,
                    nome: i.cidadao.nome || i.cidadao.nome_completo,
                    cpf: i.cidadao.cpf,
                    telefone: i.cidadao.telefone,
                    inscricao_id: i.id,
                    inscricao_status: i.status,
                }));
            res.json(resultado);
        } else {
            // Busca geral de cidadÃ£os cadastrados
            const where: any = termo
                ? { [Op.or]: [{ nome_completo: { [Op.iLike]: `%${termo}%` } }, { cpf: { [Op.iLike]: `%${termo}%` } }] }
                : {};
            const cidadaos = await Cidadao.findAll({
                where,
                attributes: ['id', [literal('nome_completo'), 'nome'], 'cpf', 'telefone'],
                limit: 20,
                order: [['nome_completo', 'ASC']],
            });
            res.json(cidadaos.map((c: any) => c.toJSON()));
        }
    } catch (error) {
        console.error('Erro ao buscar cidadÃ£os:', error);
        res.status(500).json({ error: 'Erro ao buscar cidadÃ£os' });
    }
});

// â•â•â• GET /fila/:funcionario_id â•â•â• Fila de espera do mÃ©dico (atendimentos aguardando hoje)
// Usado pelo painel do mÃ©dico via polling para notificaÃ§Ãµes e lista de espera
router.get('/fila/:funcionario_id', authenticate, authorizeMedicoOrAdmin, async (req: any, res: Response) => {
    try {
        const { funcionario_id } = req.params;

        // Apenas o prÃ³prio mÃ©dico ou admin pode ver a fila
        if (req.user.tipo !== 'admin' && String(req.user.id) !== String(funcionario_id)) {
            res.status(403).json({ error: 'Acesso negado' });
            return;
        }

        const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
        const amanha = new Date(hoje); amanha.setDate(amanha.getDate() + 1);

        const { acao_id } = req.query as { acao_id?: string };

        const whereFila: any = {
            funcionario_id,
            status: 'aguardando',
            hora_inicio: { [Op.between]: [hoje, amanha] },
        };
        // Filtra por aÃ§Ã£o se informada (paciente visto sÃ³ na aÃ§Ã£o correta)
        if (acao_id) whereFila.acao_id = acao_id;

        const aguardando = await AtendimentoMedico.findAll({
            where: whereFila,
            include: [
                { model: Cidadao, as: 'cidadao', attributes: ['id', [literal('nome_completo'), 'nome'], 'cpf', 'telefone'] },
                { model: Acao, as: 'acao', attributes: ['id', 'numero_acao', 'nome'] },
            ],
            order: [['hora_inicio', 'ASC']],
        });

        const agora = Date.now();
        const fila = aguardando.map((a: any) => {
            const json = a.toJSON();
            const segundos = Math.floor((agora - new Date(a.hora_inicio).getTime()) / 1000);
            return {
                ...json,
                nome_display: json.cidadao?.nome || json.nome_paciente || 'Paciente',
                tempo_espera_segundos: segundos,
            };
        });

        res.json({ total: fila.length, fila, gerado_em: new Date().toISOString() });
    } catch (error) {
        console.error('Erro ao buscar fila:', error);
        res.status(500).json({ error: 'Erro ao buscar fila' });
    }
});

// ═══ POST /atendimento/:id/enviar-resultado ═══ F5 — Enviar resultado de exame por e-mail
router.post('/atendimento/:id/enviar-resultado', authenticate, authorizeMedicoOrAdmin, async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const { resultado, observacoes } = req.body;

        if (!resultado || !resultado.trim()) {
            res.status(400).json({ error: 'O campo resultado é obrigatório' });
            return;
        }

        const atendimento = await AtendimentoMedico.findByPk(id, {
            include: [
                { model: Cidadao, as: 'cidadao', attributes: ['id', 'nome_completo', 'email'] },
                { model: Funcionario, as: 'funcionario', attributes: ['id', 'nome', 'especialidade'] },
                {
                    model: Acao, as: 'acao',
                    attributes: ['id', 'nome'],
                    include: [{ model: CursoExame, as: 'cursos', attributes: ['nome'] }]
                },
            ],
        });

        if (!atendimento) {
            res.status(404).json({ error: 'Atendimento não encontrado' });
            return;
        }

        const cidadao = (atendimento as any).cidadao;
        if (!cidadao?.email) {
            res.status(422).json({
                sucesso: false,
                motivo: 'Cidadão não possui e-mail cadastrado — resultado não enviado',
                cidadao: cidadao?.nome_completo,
            });
            return;
        }

        // Determinar nome do exame
        const nomeExame = (atendimento as any).acao?.cursos?.[0]?.nome
            || (atendimento as any).funcionario?.especialidade
            || 'Exame Médico';

        const dataExame = atendimento.hora_inicio
            ? new Date(atendimento.hora_inicio).toLocaleDateString('pt-BR')
            : undefined;

        const medicoNome = (atendimento as any).funcionario?.nome;

        await sendExameResultadoEmail(
            cidadao.email,
            cidadao.nome_completo,
            nomeExame,
            resultado,
            observacoes,
            medicoNome,
            dataExame
        );

        // Salvar resultado nas observações do atendimento
        const obsAtual = atendimento.observacoes || '';
        await atendimento.update({
            observacoes: obsAtual ? `${obsAtual}\n\nResultado: ${resultado}` : `Resultado: ${resultado}`,
        });

        res.json({
            sucesso: true,
            mensagem: `Resultado enviado para ${cidadao.email}`,
            cidadao: cidadao.nome_completo,
        });
    } catch (error) {
        console.error('Erro ao enviar resultado por e-mail:', error);
        res.status(500).json({ error: 'Erro ao enviar resultado' });
    }
});

export default router;
