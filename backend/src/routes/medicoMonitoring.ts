import { Router, Request, Response } from 'express';
import { Op, fn, col, literal, where as seqWhere } from 'sequelize';
import { sendExameResultadoEmail } from '../utils/email'; // F5
import { registrarAuditoria, extrairDadosUsuario } from '../utils/auditoria';
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
import { ResultadoExame } from '../models/ResultadoExame';
import { EstacaoExame } from '../models/EstacaoExame';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import exceljs from 'exceljs';
import bcrypt from 'bcrypt';
import { consultarCidadaoNoCadsus } from '../services/cadsusService';

const storageDir = path.join(__dirname, '..', '..', 'uploads', 'resultados');
if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir, { recursive: true });

const resultadoStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, storageDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `laudo-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});
const uploadResultado = multer({ storage: resultadoStorage });


const router = Router();


// Middleware que permite admin OU médico autenticado
const authorizeMedicoOrAdmin = (req: any, res: any, next: any) => {
    if (!req.user) { res.status(401).json({ error: 'Não autenticado' }); return; }
    if (req.user.tipo === 'admin' || req.user.tipo === 'medico') { next(); return; }
    res.status(403).json({ error: 'Acesso negado' });
};

// â• â• â•  GET /minhas-acoes â• â• â•  Ações em que o médico está cadastrado
router.get('/minhas-acoes', authenticate, authorizeMedicoOrAdmin, async (req: any, res: Response) => {
    try {
        const { id: userId, tipo: userTipo } = req.user;
        let acaoIds: string[] = [];

        if (userTipo === 'admin') {
            // Administradores veem todas as ações ativas/planejadas para supervisão
            const todasAcoes = await Acao.findAll({
                where: { status: { [Op.in]: ['ativa', 'planejada'] } },
                attributes: ['id']
            });
            acaoIds = todasAcoes.map(a => a.id);
        } else {
            // Médicos veem apenas onde estão escalados
            const vinculos = await AcaoFuncionario.findAll({
                where: { funcionario_id: userId },
            });
            acaoIds = vinculos.map((v) => v.acao_id);
        }

        if (acaoIds.length === 0) {
            return res.json([]);
        }

        // Buscar ações vinculadas (ativas ou planejadas â€” sem filtro de data)
        const acoes = await Acao.findAll({
            where: {
                id: { [Op.in]: acaoIds },
                status: { [Op.in]: ['ativa', 'planejada'] },
            },
            order: [['data_inicio', 'ASC']],
        });

        // Para cada ação, contar inscritos pendentes
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
        console.error('Erro ao buscar ações do médico:', error);
        res.status(500).json({ error: 'Erro ao buscar ações' });
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

// â• â• â•  GET /acao/:id/inscricoes â• â• â•  Lista inscritos de uma ação para o médico atender
router.get('/acao/:id/inscricoes', authenticate, authorizeMedicoOrAdmin, async (req: any, res: Response) => {
    try {
        const { id: acaoId } = req.params;
        const { status = 'pendente', page = '1', limit = '500' } = req.query as any;
        const offset = (Number(page) - 1) * Number(limit);

        console.log(`[inscricoes] acao_id=${acaoId} status=${status} limit=${limit}`);

        // Verificar total sem filtro de status
        const totalSemFiltro = await Inscricao.count({ where: { acao_id: acaoId } });
        console.log(`[inscricoes] Total de inscrições na ação (sem filtro de status): ${totalSemFiltro}`);

        const whereClause: any = {
            acao_id: acaoId,
            ...(status !== 'todos' ? { status } : {}),
        };

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const { rows: inscricoes, count } = await Inscricao.findAndCountAll({
            where: whereClause,
            include: [
                { model: Cidadao, as: 'cidadao', attributes: [['nome_completo', 'nome'], 'id', 'cpf', 'data_nascimento', 'telefone', 'genero', 'cartao_sus', 'campos_customizados', 'email', 'raca'] },
                { model: CursoExame, as: 'curso_exame', attributes: ['id', 'nome', 'tipo'] },
                { model: FichaAtendimento, as: 'fichas', required: false, where: { acao_id: acaoId, hora_entrada: { [Op.gte]: hoje } }, attributes: ['id', 'numero_ficha', 'status', 'hora_chamada'] }
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


// â•â•â• GET /me â•â•â• Dados do médico logado (para o painel médico) â€” aceita ?acao_id
router.get('/me', authenticate, authorizeMedicoOrAdmin, async (req: any, res: Response) => {
    try {
        const funcionarioId = req.user.id;
        const { acao_id } = req.query as any;
        const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
        const amanha = new Date(hoje); amanha.setDate(amanha.getDate() + 1);

        // Ponto ativo
        const pontoAtivo = await PontoMedico.findOne({
            where: { funcionario_id: funcionarioId, status: { [Op.in]: ['trabalhando', 'intervalo'] } },
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
            include: [{ model: Cidadao, as: 'cidadao', attributes: ['id', 'nome_completo', 'cpf'] }],
            order: [['hora_inicio', 'DESC']],
        });

        const cidadaosIds = atendimentos.map(a => a.cidadao_id).filter(id => id);
        let fichasCursor: any[] = [];
        if (cidadaosIds.length > 0) {
            fichasCursor = await FichaAtendimento.findAll({
                where: { cidadao_id: { [Op.in]: cidadaosIds } },
                include: [{ model: Inscricao, as: 'inscricao', include: [{ model: CursoExame, as: 'curso_exame', attributes: ['nome'] }] }]
            });
        }
        
        const mapFichas = new Map<string, string>();
        fichasCursor.forEach(f => {
            if (f.inscricao && f.inscricao.curso_exame && f.inscricao.curso_exame.nome) {
                mapFichas.set(`${f.cidadao_id}_${f.acao_id}`, f.inscricao.curso_exame.nome);
            }
        });

        const atendimentosJson = atendimentos.map((a: any) => {
            const j = a.toJSON();
            if (j.cidadao?.nome_completo) { j.nome_paciente = j.cidadao.nome_completo; }
            j.nome_exame = mapFichas.get(`${a.cidadao_id}_${a.acao_id}`) || null;
            return j;
        });

        const emAndamento = atendimentosJson.find((a: any) => a.status === 'em_andamento') || null;

        res.json({
            pontoId: pontoAtivo?.id || null,
            pontoStatus: pontoAtivo?.status || null,
            pontoSala: pontoAtivo?.sala || null,
            emAndamento,
            atendimentos: atendimentosJson,
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

        // A5 — Verificar se já existe atendimento em_andamento para este cidadão (em QUALQUER ação)
        // L2-40: Impede chamado duplo
        if (cidadao_id) {
            const atendimentoExistente = await AtendimentoMedico.findOne({
                where: { cidadao_id, status: 'em_andamento' },
            });
            if (atendimentoExistente) {
                // Se o atendimento existente já for deste MESMO médico, apenas retorne sucesso (Recuperação de estado)
                if (atendimentoExistente.funcionario_id === funcId) {
                    const atendimentoCompleto = await AtendimentoMedico.findByPk(atendimentoExistente.id, {
                        include: [
                            { model: Cidadao, as: 'cidadao', attributes: ['id', 'nome_completo'] },
                            { model: Funcionario, as: 'funcionario', attributes: ['id', 'nome'] },
                        ],
                    });
                    res.status(200).json(atendimentoCompleto);
                    return;
                }

                res.status(409).json({
                    error: 'Este paciente já está em atendimento por outro médico. Finalize o atendimento atual antes de iniciar um novo.',
                    atendimento_id: atendimentoExistente.id,
                });
                return;
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

        // ✅ Atualizar ficha da inscrição para em_atendimento & Auto-Chamada
        try {
            if (inscricao_id || (cidadao_id && acao_id)) {
                const whereficha: any = { status: { [Op.in]: ['pendente', 'aguardando', 'chamado'] } };
                if (inscricao_id) whereficha.inscricao_id = inscricao_id;
                else { whereficha.cidadao_id = cidadao_id; whereficha.acao_id = acao_id; }

                const ficha = await FichaAtendimento.findOne({
                    where: whereficha,
                    include: [
                        { model: Cidadao, as: 'cidadao', attributes: ['nome_completo', 'email', 'telefone'] }
                    ]
                });

                const io = (req.app as any).get('io');

                if (ficha) {
                    // Auto-Chamada: se estava pendente/aguardando, o médico esqueceu do megafone.
                    if (ficha.status !== 'chamado' && io) {
                        io.to(`acao:${ficha.acao_id}`).emit('paciente_chamado', {
                            ficha,
                            cidadao: (ficha as any).cidadao,
                            guiche: ficha.guiche || 'Consultório Médico'
                        });
                    }

                    await ficha.update({ status: 'em_atendimento', hora_atendimento: new Date() });
                }

                // Atualizar e render a nova Fila Ativa no painel de Ação e na TV
                if (io && acao_id) {
                    const filaAtualizada = await FichaAtendimento.findAll({
                        where: { acao_id, status: { [Op.in]: ['aguardando', 'chamado', 'em_atendimento', 'concluido'] } },
                        include: [
                            { model: Cidadao, as: 'cidadao', attributes: ['nome_completo', 'cpf', 'telefone'] }
                        ],
                        order: [['numero_ficha', 'ASC'], ['hora_entrada', 'ASC']],
                    });
                    io.to(`acao:${acao_id}`).emit('fila_atualizada', { acao_id, fila: filaAtualizada });
                }

                // 📲 Notificar cidadão via WhatsApp/SMS/Email
                if (cidadao_id) {
                    const cidadao = await Cidadao.findByPk(cidadao_id, { attributes: ['nome_completo', 'email', 'telefone'] });
                    if (cidadao && (cidadao as any).nome_completo) {
                        const config = acao_id ? await ConfiguracaoFilaAcao.findOne({ where: { acao_id } }) : null;
                        const cfg: ConfigNotif = {
                            notif_email: config?.notif_email ?? false,
                            notif_sms: config?.notif_sms ?? false,
                            notif_whatsapp: config?.notif_whatsapp ?? true,
                        };
                        const cid: CidadaoNotif = { nome_completo: (cidadao as any).nome_completo, email: (cidadao as any).email, telefone: (cidadao as any).telefone };
                        const primeiroNome = cid.nome_completo.split(' ')[0] || 'Cidadão';
                        await notificarCidadao(cid,
                            '💉 Seu atendimento foi iniciado!',
                            `💉 ${primeiroNome}, seu atendimento médico FOI INICIADO agora.\nHora: *${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}*\nAguarde as orientações do profissional.`,
                            cfg
                        ).catch(() => { });
                    }
                }
            }
        } catch (subErr) {
            console.error('Falha silenciosa pós-criação do atendimento:', subErr);
        }

        registrarAuditoria({
            ...extrairDadosUsuario(req),
            acao: 'ATENDIMENTO_INICIADO',
            tabela_afetada: 'atendimentos_medicos',
            registro_id: atendimento.id,
            descricao: `Atendimento iniciado para cidadão ${cidadao_id || nome_paciente || 'N/A'}`,
        }).catch(() => { });

        res.status(201).json(atendimento);
    } catch (error: any) {
        console.error('Erro ao iniciar atendimento:', error);
        res.status(500).json({ error: 'Erro ao iniciar atendimento', details: error.message, stack: error.stack });
    }
});

// ─── PATCH /atendimento/:id/ficha ─── B1: salva prontário em andamento (autosave)
router.patch('/atendimento/:id/ficha', authenticate, authorizeMedicoOrAdmin, async (req: any, res: Response) => {
    try {
        const atendimento = await AtendimentoMedico.findByPk(req.params.id);
        if (!atendimento) { res.status(404).json({ error: 'Atendimento não encontrado' }); return; }
        const { ficha_clinica, observacoes } = req.body;
        const updates: any = {};
        if (ficha_clinica !== undefined) updates.ficha_clinica = ficha_clinica;
        if (observacoes !== undefined) updates.observacoes = observacoes;
        await atendimento.update(updates);

        registrarAuditoria({
            ...extrairDadosUsuario(req),
            acao: 'PRONTUARIO_ATUALIZADO',
            tabela_afetada: 'atendimentos_medicos',
            registro_id: atendimento.id,
            descricao: `Ficha clínica atualizada no atendimento ${req.params.id}`,
        }).catch(() => { });

        res.json({ ok: true });
    } catch (error) {
        console.error('Erro ao salvar ficha:', error);
        res.status(500).json({ error: 'Erro ao salvar ficha' });
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
        await atendimento.update({
            hora_fim: fim,
            duracao_minutos: duracaoMinutos,
            status: 'concluido',
            observacoes: req.body.observacoes || atendimento.observacoes,
            ficha_clinica: req.body.ficha_clinica || atendimento.ficha_clinica,
        });

        const inscricao_id = req.body.inscricao_id;

        // Atualizar status da inscrição para 'atendido' — APENAS a inscrição específica (L1-10)
        if (atendimento.cidadao_id && atendimento.acao_id) {
            if (inscricao_id) {
                // Rota precisa: marcar apenas a inscrição do exame específico
                await Inscricao.update(
                    { status: 'atendido' },
                    { where: { id: inscricao_id, cidadao_id: atendimento.cidadao_id, status: 'pendente' } }
                );
            } else {
                console.warn(`⚠️ [Atendimento] Finalizando sem inscricao_id (Atendimento ID: ${atendimento.id}). Nenhuma inscrição marcada como atendida.`);
            }
        }

        // ✅ Atualizar ficha para concluido
        if (atendimento.cidadao_id && atendimento.acao_id) {
            const whereFinish: any = { status: { [Op.in]: ['aguardando', 'chamado', 'em_atendimento'] } };
            if (inscricao_id) whereFinish.inscricao_id = inscricao_id;
            else { whereFinish.cidadao_id = atendimento.cidadao_id; whereFinish.acao_id = atendimento.acao_id; }

            await FichaAtendimento.update(
                { status: 'concluido', hora_conclusao: fim },
                { where: whereFinish }
            );

            // Emitir Socket.IO
            const io = (req.app as any).get('io');
            if (io) {
                const filaAtualizada = await FichaAtendimento.findAll({
                    where: { acao_id: atendimento.acao_id, status: { [Op.in]: ['aguardando', 'chamado', 'em_atendimento', 'concluido'] } },
                    include: [
                        { model: Cidadao, as: 'cidadao', attributes: ['nome_completo', 'cpf', 'telefone'] },
                        { model: Inscricao, as: 'inscricao', include: [{ model: CursoExame, as: 'curso_exame', attributes: ['nome'] }] },
                    ],
                    order: [['hora_conclusao', 'DESC NULLS LAST'], ['numero_ficha', 'ASC']],
                    limit: 30
                });
                io.to(`acao:${atendimento.acao_id}`).emit('fila_atualizada', { acao_id: atendimento.acao_id, fila: filaAtualizada });
                io.to(`acao:${atendimento.acao_id}`).emit('atendimento_concluido', { acao_id: atendimento.acao_id });
            }

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
                    const cid: CidadaoNotif = { nome_completo: (cidadao as any).nome_completo || 'Cidadão', email: (cidadao as any).email, telefone: (cidadao as any).telefone };
                    const nomeStr = cid.nome_completo || 'Cidadão';
                    const primeiroNome = nomeStr.split(' ')[0];
                    await notificarCidadao(cid,
                        '✅ Atendimento concluído!',
                        `✅ ${primeiroNome}, seu atendimento foi *CONCLUÍDO*!\nHorário: *${fim.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}*\nDuração: *${duracaoMinutos} min*\nObrigado por utilizar nossos serviços. 💙`,
                        cfg
                    );
                }
            }
        }

        registrarAuditoria({
            ...extrairDadosUsuario(req),
            acao: 'ATENDIMENTO_FINALIZADO',
            tabela_afetada: 'atendimentos_medicos',
            registro_id: atendimento.id,
            descricao: `Atendimento finalizado (${duracaoMinutos}min)`,
        }).catch(() => { });

        res.json(atendimento);
    } catch (error) {
        console.error('Erro ao finalizar atendimento:', error);
        res.status(500).json({ error: 'Erro ao finalizar atendimento' });
    }
});

// â•â•â• PUT /atendimento/:id/cancelar â•â•â• (médico ou admin)
router.put('/atendimento/:id/cancelar', authenticate, authorizeMedicoOrAdmin, async (req: any, res: Response) => {
    try {
        const atendimento = await AtendimentoMedico.findByPk(req.params.id);
        if (!atendimento) { res.status(404).json({ error: 'Atendimento não encontrado' }); return; }
        await atendimento.update({ status: 'cancelado', hora_fim: new Date() });

        if (atendimento.cidadao_id && atendimento.acao_id) {
            const whereReset: any = {
                status: 'em_atendimento',
                cidadao_id: atendimento.cidadao_id,
                acao_id: atendimento.acao_id,
            };
            if (req.body.inscricao_id) whereReset.inscricao_id = req.body.inscricao_id;
            await FichaAtendimento.update({ status: 'aguardando', hora_atendimento: null as any }, { where: whereReset });
            const io = (req.app as any).get('io');
            if (io) io.to(`acao:${atendimento.acao_id}`).emit('fila_atualizada', { acao_id: atendimento.acao_id });
        }

        res.json(atendimento);
    } catch (error) {
        console.error('Erro ao cancelar atendimento:', error);
        res.status(500).json({ error: 'Erro ao cancelar atendimento' });
    }
});



// --- Mï¿½?DICOS ------------------------------------------------------------------
// GET /medicos ï¿½?" lista apenas funcionários com cargo médico
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
        console.error('Erro ao buscar médicos:', error);
        res.status(500).json({ error: 'Erro ao buscar médicos' });
    }
});

// --- DASHBOARD ---------------------------------------------------------------ï¿½"?
// GET /dashboard ï¿½?" KPIs globais
router.get('/dashboard', authenticate, authorizeAdminOrEstrada, async (_req: Request, res: Response) => {
    try {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const amanha = new Date(hoje);
        amanha.setDate(amanha.getDate() + 1);

        const medicosAtivos = await PontoMedico.count({
            where: { status: { [Op.in]: ['trabalhando', 'intervalo'] } },
        });

        // Total de atendimentos hoje
        const atendimentosHoje = await AtendimentoMedico.count({
            where: {
                hora_inicio: { [Op.between]: [hoje, amanha] },
                status: { [Op.in]: ['concluido', 'em_andamento'] },
            },
        });

        // Atendimentos concluídos hoje
        const atendimentosConcluidos = await AtendimentoMedico.count({
            where: {
                hora_inicio: { [Op.between]: [hoje, amanha] },
                status: 'concluido',
            },
        });

        // Tempo médio de atendimento (em minutos) ï¿½?" apenas concluídos hoje
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

        // Total de médicos cadastrados (ativos)
        const totalMedicos = await Funcionario.count({
            where: { ...cargoMedicoWhere, ativo: true },
        });

        // Top médico do dia (mais atendimentos)
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

        // Alertas: médicos trabalhando sem atendimentos na última 1h
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
        console.error('Erro no dashboard médico:', error);
        res.status(500).json({ error: 'Erro ao gerar dashboard' });
    }
});

// --- PONTO ------------------------------------------------------------------ï¿½"?ï¿½"?
// POST /ponto/entrada
router.post('/ponto/entrada', authenticate, authorizeMedicoOrAdmin, async (req: Request, res: Response) => {
    try {
        const { funcionario_id, acao_id, observacoes, sala } = req.body;
        if (!funcionario_id) {
            res.status(400).json({ error: 'funcionario_id é obrigatório' });
            return;
        }
        if (!acao_id) {
            res.status(400).json({ error: 'acao_id é obrigatória para iniciar turno em uma sala' });
            return;
        }
        if (!sala) {
            res.status(400).json({ error: 'A sala deve ser informada (ex: Sala 1)' });
            return;
        }

        // Verificar se já tem ponto aberto para este médico
        const pontoAberto = await PontoMedico.findOne({
            where: { funcionario_id, status: { [Op.in]: ['trabalhando', 'intervalo'] } },
        });
        if (pontoAberto) {
            res.status(409).json({ error: 'Médico já possui ponto aberto', ponto: pontoAberto });
            return;
        }

        // Verificar se a sala já está ocupada por OUTRO médico nesta mesma ação
        const salaOcupada = await PontoMedico.findOne({
            where: {
                acao_id,
                sala,
                status: { [Op.in]: ['trabalhando', 'intervalo'] }
            }
        });
        if (salaOcupada) {
            res.status(409).json({ error: `A ${sala} já está ocupada por outro profissional no momento.` });
            return;
        }

        const ponto = await PontoMedico.create({
            funcionario_id,
            acao_id,
            data_hora_entrada: new Date(),
            status: 'trabalhando',
            observacoes,
            sala,
        });

        res.status(201).json(ponto);
    } catch (error) {
        console.error('Erro ao registrar entrada:', error);
        res.status(500).json({ error: 'Erro ao registrar entrada' });
    }
});

// GET /ponto/acao/:acao_id/salas-ocupadas (Lista salas atualmente em uso)
router.get('/ponto/acao/:acao_id/salas-ocupadas', authenticate, authorizeMedicoOrAdmin, async (req: Request, res: Response) => {
    try {
        const { acao_id } = req.params;
        const ocupadas = await PontoMedico.findAll({
            where: { acao_id, status: { [Op.in]: ['trabalhando', 'intervalo'] }, sala: { [Op.ne]: null } },
            attributes: ['sala'],
        });
        const salas = ocupadas.map(p => p.sala).filter(Boolean);
        res.json(salas);
    } catch (error) {
        console.error('Erro ao buscar salas ocupadas:', error);
        res.status(500).json({ error: 'Erro ao buscar salas ocupadas' });
    }
});

// PUT /ponto/:id/saida
router.put('/ponto/:id/saida', authenticate, authorizeMedicoOrAdmin, async (req: Request, res: Response) => {
    try {
        const ponto = await PontoMedico.findByPk(req.params.id);
        if (!ponto) {
            res.status(404).json({ error: 'Ponto não encontrado' });
            return;
        }
        if (ponto.status === 'saiu') {
            res.status(409).json({ error: 'Ponto já encerrado' });
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
        console.error('Erro ao registrar saída:', error);
        res.status(500).json({ error: 'Erro ao registrar saída' });
    }
});

// ─── GET /cidadao/:id/perfil-clinico ─── B2: dados completos do cidadão para QR Code clínico
// Acessível por qualquer usuário autenticado (médico, admin, enfermeiro, cidadão)
router.get('/cidadao/:id/perfil-clinico', authenticate, async (req: Request, res: Response) => {
    try {
        // Tenta encontrar pelo cidadao_id direto
        let cidadaoId = req.params.id;
        let cidadao = await Cidadao.findByPk(cidadaoId);

        // Fallback: se não encontrou como cidadão, tenta como ficha_id e resolve o cidadão
        if (!cidadao) {
            const ficha = await FichaAtendimento.findByPk(cidadaoId);
            if (ficha) {
                cidadaoId = (ficha as any).cidadao_id;
                cidadao = await Cidadao.findByPk(cidadaoId);
            }
        }

        if (!cidadao) { res.status(404).json({ error: 'Cidadão não encontrado' }); return; }

        // Buscar últimos atendimentos com ficha clínica
        const atendimentos = await AtendimentoMedico.findAll({
            where: { cidadao_id: cidadaoId, status: 'concluido' },
            order: [['hora_inicio', 'DESC']],
            limit: 5,
            attributes: ['id', 'hora_inicio', 'hora_fim', 'observacoes', 'ficha_clinica', 'nome_paciente'],
        });

        // Extrair dados clínicos agregados dos atendimentos
        const fichasClinicas = atendimentos
            .map((a: any) => a.ficha_clinica)
            .filter(Boolean);

        // Consolidar dados clínicos do último atendimento
        const ultimaFicha = fichasClinicas[0] || {};

        res.json({
            cidadao: {
                id: cidadao.id,
                nome: (cidadao as any).nome_completo,
                cpf: cidadao.cpf,
                data_nascimento: (cidadao as any).data_nascimento,
                telefone: (cidadao as any).telefone,
                email: (cidadao as any).email,
                genero: (cidadao as any).genero,
                raca: (cidadao as any).raca,
                cartao_sus: (cidadao as any).cartao_sus,
                municipio: (cidadao as any).municipio,
                campos_customizados: (cidadao as any).campos_customizados,
            },
            historico_clinico: {
                total_atendimentos: atendimentos.length,
                ultima_consulta: atendimentos[0]?.hora_inicio || null,
                ultima_ficha: ultimaFicha,
                atendimentos: atendimentos.map((a: any) => ({
                    data: a.hora_inicio,
                    observacoes: a.observacoes,
                    ficha: a.ficha_clinica,
                })),
            },
        });
    } catch (error) {
        console.error('Erro ao buscar perfil clínico:', error);
        res.status(500).json({ error: 'Erro ao buscar perfil clínico' });
    }
});

// ─── POST /ponto/:id/almoco/iniciar ─── B5: inicia pausa para almoço
router.post('/ponto/:id/almoco/iniciar', authenticate, authorizeMedicoOrAdmin, async (req: Request, res: Response) => {
    try {
        const ponto = await PontoMedico.findByPk(req.params.id);
        if (!ponto) { res.status(404).json({ error: 'Ponto não encontrado' }); return; }
        if (ponto.status !== 'trabalhando') {
            res.status(400).json({ error: 'Ponto não está ativo para iniciar almoço' });
            return;
        }
        await ponto.update({ status: 'intervalo', inicio_almoco: new Date() });
        res.json(ponto);
    } catch (error) {
        console.error('Erro ao iniciar almoço:', error);
        res.status(500).json({ error: 'Erro ao iniciar almoço' });
    }
});

// ─── POST /ponto/:id/almoco/finalizar ─── B5: finaliza pausa de almoço
router.post('/ponto/:id/almoco/finalizar', authenticate, authorizeMedicoOrAdmin, async (req: Request, res: Response) => {
    try {
        const ponto = await PontoMedico.findByPk(req.params.id);
        if (!ponto) { res.status(404).json({ error: 'Ponto não encontrado' }); return; }
        if (ponto.status !== 'intervalo') {
            res.status(400).json({ error: 'Ponto não está em intervalo' });
            return;
        }
        const duracao = ponto.inicio_almoco
            ? Math.round((Date.now() - new Date(ponto.inicio_almoco).getTime()) / 60000)
            : 0;
        await ponto.update({
            status: 'trabalhando',
            fim_almoco: new Date(),
            duracao_almoco_minutos: (ponto.duracao_almoco_minutos || 0) + duracao,
        });
        res.json(ponto);
    } catch (error) {
        console.error('Erro ao finalizar almoço:', error);
        res.status(500).json({ error: 'Erro ao finalizar almoço' });
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

// --- ATENDIMENTOS ------------------------------------------------------------ï¿½"?
// POST /atendimentos ï¿½?" iniciar atendimento
router.post('/atendimentos', authenticate, authorizeAdminOrEstrada, async (req: Request, res: Response) => {
    try {
        const { funcionario_id, acao_id, cidadao_id, ponto_id, observacoes, nome_paciente } = req.body;
        if (!funcionario_id) {
            res.status(400).json({ error: 'funcionario_id é obrigatório' });
            return;
        }

        // Buscar ponto ativo automaticamente se não informado
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
            status: 'aguardando', // Admin adiciona Ã  fila de espera; médico muda para em_andamento ao chamar
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
            res.status(404).json({ error: 'Atendimento não encontrado' });
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
            res.status(404).json({ error: 'Atendimento não encontrado' });
            return;
        }
        await atendimento.update({ status: 'cancelado', observacoes: req.body.observacoes || atendimento.observacoes });
        res.json(atendimento);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao cancelar atendimento' });
    }
});

// GET /debug-timestamps â€” endpoint temporário para diagnóstico de timezone
// Remove este endpoint após diagnosticar o problema
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
        fimComAjuste.setHours(23 + 3, 59, 59, 999); // Próximo dia 02:59:59 UTC = 23:59 BRT

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
                // new Date('YYYY-MM-DD') = UTC midnight. Para cobrir BRT, precisamos de UTC+3h = início do dia BRT
                const inicio = new Date(data_inicio as string);
                inicio.setTime(inicio.getTime() + 3 * 60 * 60 * 1000); // 00:00 BRT = 03:00 UTC
                where.hora_inicio[Op.gte] = inicio;
            }
            if (data_fim) {
                // Fim do dia BRT (23:59:59) = próximo dia 02:59:59 UTC
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
                // 'nome' é alias de 'nome_completo' para manter compatibilidade com o frontend
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


// --- RELATï¿½"RIO ---------------------------------------------------------------ï¿½"?
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
        console.error('Erro ao gerar relatório geral:', error);
        res.status(500).json({ error: 'Erro ao gerar relatório geral' });
    }
});

// GET /relatorio/:funcionario_id â€” relatório individual (vem DEPOIS de /relatorio/geral)
router.get('/relatorio/:funcionario_id', authenticate, authorizeAdminOrEstrada, async (req: Request, res: Response) => {
    try {
        const { funcionario_id } = req.params;
        const { data_inicio, data_fim, acao_id } = req.query;

        const funcionario = await Funcionario.findByPk(funcionario_id);
        if (!funcionario) {
            res.status(404).json({ error: 'Funcionário não encontrado' });
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

        // Calcular métricas
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
        console.error('Erro ao gerar relatório:', error);
        res.status(500).json({ error: 'Erro ao gerar relatório' });
    }
});


// â•â•â• GET /stats/tempo-real â•â•â• (admin) â€” atendimentos em andamento AGORA + resumo do dia por médico
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

        // Resumo do dia por médico (concluídos, em andamento, aguardando, cancelados)
        const todosHoje = await AtendimentoMedico.findAll({
            where: {
                hora_inicio: { [Op.between]: [hoje, amanha] },
                status: { [Op.ne]: 'aguardando' }, // Fila de espera não conta como atendimento
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
            where: { status: { [Op.in]: ['trabalhando', 'intervalo'] } },
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


// â•â•â• GET /cidadaos/buscar â•â•â• Busca cidadãos cadastrados (com filtro por ação)
// Usado pelo autocomplete do modal "Novo Atendimento" no admin
router.get('/cidadaos/buscar', authenticate, authorizeAdminOrEstrada, async (req: Request, res: Response) => {
    try {
        const { q = '', acao_id } = req.query as { q?: string; acao_id?: string };
        const termo = String(q).trim();

        if (acao_id) {
            // Busca inscritos da ação que ainda não foram atendidos
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
            // Busca geral de cidadãos cadastrados
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
        console.error('Erro ao buscar cidadãos:', error);
        res.status(500).json({ error: 'Erro ao buscar cidadãos' });
    }
});

// â•â•â• GET /fila/:funcionario_id â•â•â• Fila de espera do médico (atendimentos aguardando hoje)
// Usado pelo painel do médico via polling para notificações e lista de espera
router.get('/fila/:funcionario_id', authenticate, authorizeMedicoOrAdmin, async (req: any, res: Response) => {
    try {
        const { funcionario_id } = req.params;

        // Apenas o próprio médico ou admin pode ver a fila
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
        // Filtra por ação se informada (paciente visto só na ação correta)
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

// ─── GET /cidadao/:cidadaoId/historico ─── B1: histórico clínico completo
router.get('/cidadao/:cidadaoId/historico', authenticate, authorizeMedicoOrAdmin, async (req: any, res: Response) => {
    try {
        const { cidadaoId } = req.params;
        const cidadao = await Cidadao.findByPk(cidadaoId, {
            attributes: [
                'id', 'nome_completo', 'cpf', 'data_nascimento',
                'telefone', 'genero', 'cartao_sus', 'campos_customizados',
            ],
        });
        if (!cidadao) { res.status(404).json({ error: 'Cidadão não encontrado' }); return; }

        const historico = await AtendimentoMedico.findAll({
            where: {
                cidadao_id: cidadaoId,
                status: 'concluido',
            },
            include: [
                { model: Funcionario, as: 'funcionario', attributes: ['nome', 'especialidade', 'crm'] },
                { model: Acao, as: 'acao', attributes: ['nome', 'municipio', 'numero_acao'] },
            ],
            order: [['hora_inicio', 'DESC']],
            limit: 20,
        });

        res.json({ cidadao, historico });
    } catch (error) {
        console.error('Erro ao buscar histórico:', error);
        res.status(500).json({ error: 'Erro ao buscar histórico clínico' });
    }
});
// ─── GET /meus-atendimentos ─── B4: cidadão vê seus próprios atendimentos concluídos
// Usa o id do JWT do cidadão autenticado
router.get('/meus-atendimentos', authenticate, async (req: any, res: Response) => {
    try {
        // Aceitar tanto cidadão quanto médico/admin (para fins de debug)
        const cidadao_id = req.user.tipo === 'cidadao' ? req.user.id : req.query.cidadao_id;
        if (!cidadao_id) {
            res.status(400).json({ error: 'cidadao_id obrigatório' });
            return;
        }

        const atendimentos = await AtendimentoMedico.findAll({
            where: {
                cidadao_id,
                status: 'concluido',
            },
            include: [
                {
                    model: Funcionario,
                    as: 'funcionario',
                    attributes: ['id', 'nome', 'especialidade', 'crm'],
                },
                {
                    model: Acao,
                    as: 'acao',
                    attributes: ['id', 'numero_acao', 'nome', 'municipio', 'estado'],
                },
            ],
            order: [['hora_inicio', 'DESC']],
            limit: 30,
        });

        res.json(atendimentos.map((a: any) => ({
            id: a.id,
            hora_inicio: a.hora_inicio,
            hora_fim: a.hora_fim,
            duracao_minutos: a.duracao_minutos,
            observacoes: a.observacoes,
            ficha_clinica: a.ficha_clinica || {},
            medico: a.funcionario ? {
                nome: a.funcionario.nome,
                especialidade: a.funcionario.especialidade,
                crm: a.funcionario.crm,
            } : null,
            acao: a.acao ? {
                numero: a.acao.numero_acao,
                nome: a.acao.nome,
                local: `${a.acao.municipio}/${a.acao.estado}`,
            } : null,
        })));
    } catch (error) {
        console.error('Erro ao buscar atendimentos do cidadão:', error);
        res.status(500).json({ error: 'Erro ao buscar atendimentos' });
    }
});

// ─── GET /historico ─── Histórico Clínico de Atendimentos
router.get('/historico', authenticate, async (req: any, res: Response) => {
    try {
        const { data_inicio, data_fim, busca, acao_id } = req.query;
        let funcId = req.user.id;
        if (req.user.tipo === 'admin' && req.query.funcionario_id) {
            funcId = req.query.funcionario_id;
        }

        const where: any = { status: { [Op.in]: ['concluido', 'cancelado'] } };

        // Filtro Medico Admin
        if (req.user.tipo !== 'admin' || !req.query.verTodos) {
            where.funcionario_id = funcId;
        }

        if (acao_id) where.acao_id = acao_id;
        if (data_inicio && data_fim) {
            where.hora_inicio = { [Op.between]: [new Date(`${data_inicio}T00:00:00Z`), new Date(`${data_fim}T23:59:59Z`)] };
        }

        const includeCidadao: any = { model: Cidadao, as: 'cidadao', attributes: ['nome_completo', 'cpf'] };
        if (busca) includeCidadao.where = { nome_completo: { [Op.iLike]: `%${busca}%` } };

        const historico = await AtendimentoMedico.findAll({
            where,
            include: [
                includeCidadao,
                { model: Acao, as: 'acao', include: [{ model: CursoExame, as: 'cursos' }] }
            ],
            order: [['hora_inicio', 'DESC']],
            limit: 100
        });

        res.json(historico);
    } catch (err) {
        console.error('Erro historico', err);
        res.status(500).json({ error: 'Erro ao buscar historico' });
    }
});

// ─── GET /resultados ─── Lista Cidadãos que precisam de Laudo
router.get('/resultados', authenticate, async (req: any, res: Response) => {
    try {
        const { acao_id } = req.query;
        if (!acao_id) { res.status(400).json({ error: 'acao_id eh obrigatorio' }); return; }

        const fichas = await FichaAtendimento.findAll({
            where: { acao_id, status: { [Op.in]: ['atendido', 'concluido'] } },
            include: [
                { model: Cidadao, as: 'cidadao', attributes: ['nome_completo', 'cpf'] },
                { model: Inscricao, as: 'inscricao', include: [{ model: CursoExame, as: 'curso_exame' }] }
            ],
            order: [['numero_ficha', 'ASC']]
        });

        const resultadosExames = await ResultadoExame.findAll({ where: { acao_id } });
        const resMap = new Map(resultadosExames.map((r: any) => [r.inscricao_id, r.arquivo_resultado_url]));

        const results = fichas.map((f: any) => {
            const json = f.toJSON();
            return {
                ...json,
                resultado_url: resMap.get(f.inscricao_id) || null
            };
        });

        res.json(results);
    } catch (err) { res.status(500).json({ error: 'Erro ao listar.' }); }
});

// ─── POST /resultado/upload ─── Upload do PDF do exame
router.post('/resultado/upload', authenticate, uploadResultado.single('file'), async (req: any, res: Response) => {
    try {
        const { ficha_id } = req.body;
        if (!ficha_id || !req.file) { res.status(400).json({ error: 'Arquivo e ficha_id são obrigatorios.' }); return; }

        const ficha = await FichaAtendimento.findByPk(ficha_id) as any;
        if (!ficha) { res.status(404).json({ error: 'Ficha não encontrada' }); return; }

        const urlPath = `/uploads/resultados/${req.file.filename}`;

        let resultado = await ResultadoExame.findOne({ where: { inscricao_id: ficha.inscricao_id } });
        if (resultado) {
            await resultado.update({ arquivo_resultado_url: urlPath, data_emissao_laudo: new Date() });
        } else {
            // Pode precisar do Exame. Mas CursoExame resolve por enquanto via Inscricao
            resultado = await ResultadoExame.create({
                inscricao_id: ficha.inscricao_id,
                cidadao_id: ficha.cidadao_id,
                acao_id: ficha.acao_id,
                exame_id: '00000000-0000-0000-0000-000000000000', // Placeholder de uuid se for FK required 
                data_realizacao: new Date(),
                arquivo_resultado_url: urlPath,
                data_emissao_laudo: new Date(),
                observacoes: 'Anexado fisicamente',
            } as any) as any;
            // Warning: Se exame_id for estritamente Foreign Key a gente precisará buscar um Exame Genérico. 
            // O Banco aceitará se FK for defered ou podemos dar bypass validando no BD depois.
        }

        res.json({ message: 'Laudo anexado com sucesso', url: urlPath });
    } catch (err) {
        console.error('Erro upload resultado:', err);
        res.status(500).json({ error: 'Erro interno upload' });
    }
});

// ─── GET /resultados/exportar ─── Gerar Planilha Excel 
router.get('/resultados/exportar', authenticate, async (req: any, res: Response) => {
    try {
        const { acao_id } = req.query;
        if (!acao_id) { res.status(400).json({ error: 'acao_id obrigatório' }); return; }

        const acao = await Acao.findByPk(acao_id);

        const fichas = await FichaAtendimento.findAll({
            where: { acao_id, status: { [Op.in]: ['atendido', 'concluido'] } },
            include: [
                { model: Cidadao, as: 'cidadao' },
                { model: Inscricao, as: 'inscricao', include: [{ model: CursoExame, as: 'curso_exame' }] }
            ],
            order: [['numero_ficha', 'ASC']]
        });
        const resultadosExames = await ResultadoExame.findAll({ where: { acao_id } });
        const resMap = new Map(resultadosExames.map((r: any) => [r.inscricao_id, r.arquivo_resultado_url]));

        const workbook = new exceljs.Workbook();
        const sheet = workbook.addWorksheet('Laudos e Resultados');

        sheet.columns = [
            { header: 'Nº Ficha', key: 'ficha', width: 10 },
            { header: 'Paciente', key: 'paciente', width: 35 },
            { header: 'CPF', key: 'cpf', width: 18 },
            { header: 'Exame', key: 'exame', width: 25 },
            { header: 'Status Laudo', key: 'status', width: 15 },
        ];

        // Style the Header
        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF16A34A' } };

        fichas.forEach((f: any) => {
            const json = f.toJSON();
            const temLaudo = resMap.has(f.inscricao_id);
            const row = sheet.addRow({
                ficha: json.numero_ficha,
                paciente: json.cidadao?.nome_completo,
                cpf: json.cidadao?.cpf,
                exame: json.inscricao?.curso_exame?.nome || 'Consulta',
                status: temLaudo ? 'PRONTO' : 'FALTANDO'
            });

            // Colorir linha se faltando
            if (!temLaudo) {
                row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE0B2' } };
            }
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Resultados_${acao?.nome || 'Acao'}.xlsx"`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error('Export erro', err);
        res.status(500).json({ error: 'Falha exportacao excell' });
    }
});

/**
 * POST /api/medico-monitoring/cadastrar-via-cpf
 * Médico digita CPF → sistema busca localmente → DATASUS → cadastra → inscreve → gera ficha
 * Não requer acesso a /api/cidadaos (403 para médico) — fluxo completo aqui
 */
router.post('/cadastrar-via-cpf', authenticate, authorizeMedicoOrAdmin, async (req: any, res: Response) => {
    try {
        const { cpf, cns, acao_id, acao_curso_exame_id } = req.body;

        if ((!cpf && !cns) || !acao_id || !acao_curso_exame_id) {
            res.status(400).json({ error: 'cpf ou cns, acao_id e acao_curso_exame_id são obrigatórios' });
            return;
        }

        // Detectar modo de busca
        const identificador = (cpf || cns || '').replace(/\D/g, '');
        const tipoBusca: 'cpf' | 'cns' = identificador.length === 15 ? 'cns' : 'cpf';

        if (identificador.length !== 11 && identificador.length !== 15) {
            res.status(400).json({ error: 'Informe um CPF (11 dígitos) ou Cartão SUS (15 dígitos) válido' });
            return;
        }

        // 1. Verificar se cidadão já existe localmente
        let cidadao: any = null;
        if (tipoBusca === 'cpf') {
            const cpfFormatado = identificador.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
            cidadao = await Cidadao.findOne({
                where: { cpf: { [Op.or]: [identificador, cpfFormatado] } }
            });
        } else {
            // Busca por cartao_sus
            cidadao = await Cidadao.findOne({ where: { cartao_sus: identificador } });
        }

        // 2. Se não existe, buscar no DATASUS e criar
        if (!cidadao) {
            let dadosDatasus: any = null;
            try {
                dadosDatasus = await consultarCidadaoNoCadsus(tipoBusca, identificador);
            } catch (err) {
                console.warn('[CADSUS] Falha na consulta — prosseguindo sem dados externos:', err);
            }

            const senhaTemp = Math.random().toString(36).slice(-8).toUpperCase();
            const senhaHash = await bcrypt.hash(senhaTemp, 10);

            cidadao = await Cidadao.create({
                cpf: tipoBusca === 'cpf' ? identificador : (dadosDatasus?.cpf || identificador),
                nome_completo: dadosDatasus?.nome_completo || `Paciente ${tipoBusca.toUpperCase()} ${identificador}`,
                nome_mae: dadosDatasus?.nome_mae || null,
                data_nascimento: dadosDatasus?.data_nascimento || null,
                genero: dadosDatasus?.sexo === 'M' ? 'masculino'
                      : dadosDatasus?.sexo === 'F' ? 'feminino' : null,
                raca: dadosDatasus?.raca || null,
                telefone: dadosDatasus?.telefone || null,
                email: dadosDatasus?.email || null,
                cep: dadosDatasus?.cep || null,
                rua: dadosDatasus?.logradouro || null,
                municipio: dadosDatasus?.municipio || null,
                estado: dadosDatasus?.estado || null,
                cartao_sus: tipoBusca === 'cns' ? identificador : (dadosDatasus?.cartao_sus || null),
                senha: senhaHash,
                tipo: 'cidadao',
            } as any);
        }

        // 3. Verificar se o acao_curso_exame_id é válido para esta ação
        const acaoCurso = await AcaoCursoExame.findOne({
            where: { id: acao_curso_exame_id, acao_id },
        });
        if (!acaoCurso) {
            res.status(404).json({ error: 'Exame não encontrado nesta ação' });
            return;
        }

        // 4. Verificar se já está inscrito nesta ação/exame
        const inscricaoExistente = await Inscricao.findOne({
            where: {
                cidadao_id: (cidadao as any).id,
                acao_id,
                curso_exame_id: acaoCurso.curso_exame_id,
                status: 'pendente',
            },
        });

        let inscricao = inscricaoExistente;
        if (!inscricao) {
            inscricao = await Inscricao.create({
                cidadao_id: (cidadao as any).id,
                acao_id,
                curso_exame_id: acaoCurso.curso_exame_id,
                status: 'pendente',
                data_inscricao: new Date(),
                observacoes: 'Cadastro pelo médico via CPF',
            } as any);
        }

        // 5. Criar ficha na fila se não existir
        const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
        const amanha = new Date(hoje); amanha.setDate(amanha.getDate() + 1);

        let ficha = await FichaAtendimento.findOne({
            where: {
                cidadao_id: (cidadao as any).id,
                acao_id,
                inscricao_id: (inscricao as any).id,
                status: { [Op.in]: ['aguardando', 'chamado', 'em_atendimento'] },
            },
        });

        if (!ficha) {
            const maxFicha = await FichaAtendimento.findOne({
                where: { acao_id, hora_entrada: { [Op.gte]: hoje, [Op.lt]: amanha } },
                order: [['numero_ficha', 'DESC']],
            });
            const numero_ficha = maxFicha ? (maxFicha.numero_ficha + 1) : 1;

            ficha = await FichaAtendimento.create({
                cidadao_id: (cidadao as any).id,
                acao_id,
                inscricao_id: (inscricao as any).id,
                numero_ficha,
                status: 'aguardando',
            } as any);
        }

        // 6. Emitir atualização da fila via Socket.IO
        const io = (req.app as any).get('io');
        if (io) {
            io.to(`acao:${acao_id}`).emit('nova_ficha', { ficha, cidadao });
            io.to(`acao:${acao_id}`).emit('fila_atualizada', { acao_id });
        }

        res.status(201).json({
            cidadao: {
                id: (cidadao as any).id,
                nome_completo: (cidadao as any).nome_completo,
                cpf: (cidadao as any).cpf,
                data_nascimento: (cidadao as any).data_nascimento,
                cartao_sus: (cidadao as any).cartao_sus,
            },
            inscricao,
            ficha,
            novo_cadastro: !inscricaoExistente,
        });

    } catch (error: any) {
        console.error('[cadastrar-via-cpf] Erro:', error);
        res.status(500).json({ error: error.message || 'Erro ao cadastrar cidadão' });
    }
});

export default router;
