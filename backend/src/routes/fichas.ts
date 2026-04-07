import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import { FichaAtendimento } from '../models/FichaAtendimento';
import { Cidadao } from '../models/Cidadao';
import { Inscricao } from '../models/Inscricao';
import { CursoExame } from '../models/CursoExame';
import { EstacaoExame } from '../models/EstacaoExame';
import { Acao } from '../models/Acao';
import { ConfiguracaoFilaAcao } from '../models/ConfiguracaoFilaAcao';
import { authenticate, authorizeAdmin, authorizeAdminOrEstrada } from '../middlewares/auth';
import { notificarChamado, notificarFichaGerada } from '../utils/notificacoes';
import type { ConfigNotif, CidadaoNotif } from '../utils/notificacoes';

const router = Router();



// ─── Helper: busca fila ativa de hoje para uma ação ──────────────────────────
async function getFila(acao_id: string): Promise<FichaAtendimento[]> {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    return FichaAtendimento.findAll({
        where: {
            acao_id,
            hora_entrada: { [Op.gte]: hoje, [Op.lt]: amanha },
            status: { [Op.in]: ['aguardando', 'chamado', 'em_atendimento'] },
        },
        include: [
            {
                model: Cidadao,
                as: 'cidadao',
                attributes: ['id', 'nome_completo', 'cpf', 'telefone', 'cartao_sus'],
            },
            {
                model: Inscricao,
                as: 'inscricao',
                required: false,
                include: [{ model: CursoExame, as: 'curso_exame', attributes: ['id', 'nome', 'tipo'] }],
            },
        ],
        order: [['hora_entrada', 'ASC']],
    });
}

/**
 * GET /api/fichas/acao/:acao_id/fila
 * Retorna a fila de atendimento atual do dia para a ação
 */
router.get('/acao/:acao_id/fila', authenticate, authorizeAdminOrEstrada, async (req: Request, res: Response) => {
    try {
        const { acao_id } = req.params;
        const fila = await getFila(acao_id);
        res.json(fila);
    } catch (error) {
        console.error('Erro ao buscar fila:', error);
        res.status(500).json({ error: 'Erro ao buscar fila de atendimento' });
    }
});

/**
 * GET /api/fichas/acao/:acao_id/historico
 * Retorna o histórico completo de fichas do dia incluindo concluídas e canceladas
 */
router.get('/acao/:acao_id/historico', authenticate, authorizeAdminOrEstrada, async (req: Request, res: Response) => {
    try {
        const { acao_id } = req.params;
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const amanha = new Date(hoje);
        amanha.setDate(amanha.getDate() + 1);

        const fichas = await FichaAtendimento.findAll({
            where: {
                acao_id,
                hora_entrada: { [Op.gte]: hoje, [Op.lt]: amanha },
            },
            include: [
                {
                    model: Cidadao,
                    as: 'cidadao',
                    attributes: ['id', 'nome_completo', 'cpf', 'telefone'],
                },
                {
                    model: Inscricao,
                    as: 'inscricao',
                    required: false,
                    include: [{ model: CursoExame, as: 'curso_exame', attributes: ['id', 'nome', 'tipo'] }],
                },
            ],
            order: [['hora_entrada', 'ASC']],
        });

        const stats = {
            total: fichas.length,
            aguardando: fichas.filter(f => f.status === 'aguardando').length,
            chamado: fichas.filter(f => f.status === 'chamado').length,
            em_atendimento: fichas.filter(f => f.status === 'em_atendimento').length,
            concluido: fichas.filter(f => f.status === 'concluido').length,
            cancelado: fichas.filter(f => f.status === 'cancelado').length,
        };

        res.json({ fichas, stats });
    } catch (error) {
        console.error('Erro ao buscar histórico de fichas:', error);
        res.status(500).json({ error: 'Erro ao buscar histórico de fichas' });
    }
});

/**
 * POST /api/fichas
 * Cria uma nova ficha (entrada na fila) — emite Socket.IO via req.app
 */
router.post('/', authenticate, async (req: Request, res: Response) => {
    try {
        const { cidadao_id, inscricao_id, acao_id, guiche, observacoes } = req.body;

        if (!cidadao_id || !acao_id) {
            res.status(400).json({ error: 'cidadao_id e acao_id são obrigatórios' });
            return;
        }

        // Verificar se o cidadão já está na fila hoje para essa ação
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const amanha = new Date(hoje);
        amanha.setDate(amanha.getDate() + 1);

        const jaNaFila = await FichaAtendimento.findOne({
            where: {
                cidadao_id,
                acao_id,
                hora_entrada: { [Op.gte]: hoje, [Op.lt]: amanha },
                status: { [Op.in]: ['aguardando', 'chamado', 'em_atendimento'] },
            },
        });

        if (jaNaFila) {
            res.status(409).json({
                error: 'Cidadão já está na fila',
                ficha: jaNaFila,
                numero_ficha: jaNaFila.numero_ficha,
            });
            return;
        }

        const ficha = await FichaAtendimento.create({
            cidadao_id,
            inscricao_id: inscricao_id || null,
            acao_id,
            guiche: guiche || null,
            observacoes: observacoes || null,
            status: 'aguardando',
        });

        // Buscar ficha com includes para emitir via socket
        const fichaCompleta = await FichaAtendimento.findByPk(ficha.id, {
            include: [
                { model: Cidadao, as: 'cidadao', attributes: ['id', 'nome_completo', 'cpf', 'telefone', 'cartao_sus'] },
                {
                    model: Inscricao, as: 'inscricao', required: false,
                    include: [{ model: CursoExame, as: 'curso_exame', attributes: ['id', 'nome', 'tipo'] }],
                },
            ],
        });

        // Emitir evento Socket.IO (io é injetado no app via req.app)
        const io = (req.app as any).get('io');
        if (io) {
            const filaAtualizada = await getFila(acao_id);
            io.to(`acao:${acao_id}`).emit('fila_atualizada', { acao_id, fila: filaAtualizada });
            io.to(`acao:${acao_id}`).emit('nova_ficha', fichaCompleta);
        }

        res.status(201).json({
            message: 'Ficha criada com sucesso',
            ficha: fichaCompleta,
            numero_ficha: ficha.numero_ficha,
        });
    } catch (error) {
        console.error('Erro ao criar ficha:', error);
        res.status(500).json({ error: 'Erro ao criar ficha de atendimento' });
    }
});

/**
 * PATCH /api/fichas/:id/chamar
 * Chama o próximo da fila (status: aguardando → chamado)
 */
router.patch('/:id/chamar', authenticate, authorizeAdminOrEstrada, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { guiche } = req.body;

        const ficha = await FichaAtendimento.findByPk(id, {
            include: [
                { model: Cidadao, as: 'cidadao', attributes: ['id', 'nome_completo', 'cpf', 'email', 'telefone'] },
                {
                    model: Inscricao, as: 'inscricao', required: false,
                    include: [{ model: CursoExame, as: 'curso_exame', attributes: ['nome'] }],
                },
                { model: EstacaoExame, as: 'estacao', attributes: ['nome'], required: false },
            ],
        });

        if (!ficha) {
            res.status(404).json({ error: 'Ficha não encontrada' });
            return;
        }

        await ficha.update({
            status: 'chamado',
            hora_chamada: new Date(),
            guiche: guiche || ficha.guiche,
        });

        const io = (req.app as any).get('io');
        if (io) {
            const filaAtualizada = await getFila(ficha.acao_id);
            io.to(`acao:${ficha.acao_id}`).emit('fila_atualizada', { acao_id: ficha.acao_id, fila: filaAtualizada });
            io.to(`acao:${ficha.acao_id}`).emit('paciente_chamado', {
                ficha,
                cidadao: (ficha as any).cidadao,
                guiche: guiche || ficha.guiche,
            });
        }

        // 📲 Notificar cidadão: ficha chamada
        const cidadaoData = (ficha as any).cidadao;
        if (cidadaoData) {
            const config = await ConfiguracaoFilaAcao.findOne({ where: { acao_id: ficha.acao_id } });
            const cfg: ConfigNotif = {
                notif_email: config?.notif_email ?? false,
                notif_sms: config?.notif_sms ?? false,
                notif_whatsapp: config?.notif_whatsapp ?? true,
            };
            const cid: CidadaoNotif = {
                nome_completo: cidadaoData.nome_completo,
                email: cidadaoData.email,
                telefone: cidadaoData.telefone,
            };
            const nomeExame = (ficha as any).inscricao?.curso_exame?.nome || 'Exame';
            const nomeEstacao = (ficha as any).estacao?.nome || 'Local de atendimento';
            await notificarChamado(cid, ficha.numero_ficha, nomeExame, nomeEstacao, guiche || null, cfg).catch(() => null);
        }

        res.json({ message: 'Paciente chamado', ficha });
    } catch (error) {
        console.error('Erro ao chamar ficha:', error);
        res.status(500).json({ error: 'Erro ao chamar paciente' });
    }
});


/**
 * PATCH /api/fichas/:id/iniciar-atendimento
 * Inicia o atendimento (chamado → em_atendimento)
 */
router.patch('/:id/iniciar-atendimento', authenticate, authorizeAdminOrEstrada, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const ficha = await FichaAtendimento.findByPk(id);

        if (!ficha) {
            res.status(404).json({ error: 'Ficha não encontrada' });
            return;
        }

        await ficha.update({ status: 'em_atendimento', hora_atendimento: new Date() });

        const io = (req.app as any).get('io');
        if (io) {
            const filaAtualizada = await getFila(ficha.acao_id);
            io.to(`acao:${ficha.acao_id}`).emit('fila_atualizada', { acao_id: ficha.acao_id, fila: filaAtualizada });
        }

        res.json({ message: 'Atendimento iniciado', ficha });
    } catch (error) {
        console.error('Erro ao iniciar atendimento:', error);
        res.status(500).json({ error: 'Erro ao iniciar atendimento' });
    }
});

/**
 * PATCH /api/fichas/:id/concluir
 * Conclui o atendimento (em_atendimento → concluido)
 */
router.patch('/:id/concluir', authenticate, authorizeAdminOrEstrada, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { observacoes } = req.body;
        const ficha = await FichaAtendimento.findByPk(id);

        if (!ficha) {
            res.status(404).json({ error: 'Ficha não encontrada' });
            return;
        }

        await ficha.update({
            status: 'concluido',
            hora_conclusao: new Date(),
            observacoes: observacoes || ficha.observacoes,
        });

        const io = (req.app as any).get('io');
        if (io) {
            const filaAtualizada = await getFila(ficha.acao_id);
            io.to(`acao:${ficha.acao_id}`).emit('fila_atualizada', { acao_id: ficha.acao_id, fila: filaAtualizada });
            io.to(`acao:${ficha.acao_id}`).emit('atendimento_concluido', { ficha_id: id });
        }

        res.json({ message: 'Atendimento concluído', ficha });
    } catch (error) {
        console.error('Erro ao concluir atendimento:', error);
        res.status(500).json({ error: 'Erro ao concluir atendimento' });
    }
});

/**
 * PATCH /api/fichas/:id/cancelar
 * Cancela uma ficha
 */
router.patch('/:id/cancelar', authenticate, authorizeAdminOrEstrada, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { motivo } = req.body;
        const ficha = await FichaAtendimento.findByPk(id);

        if (!ficha) {
            res.status(404).json({ error: 'Ficha não encontrada' });
            return;
        }

        await ficha.update({ status: 'cancelado', observacoes: motivo || 'Cancelado pelo operador' });

        const io = (req.app as any).get('io');
        if (io) {
            const filaAtualizada = await getFila(ficha.acao_id);
            io.to(`acao:${ficha.acao_id}`).emit('fila_atualizada', { acao_id: ficha.acao_id, fila: filaAtualizada });
        }

        res.json({ message: 'Ficha cancelada', ficha });
    } catch (error) {
        console.error('Erro ao cancelar ficha:', error);
        res.status(500).json({ error: 'Erro ao cancelar ficha' });
    }
});

/**
 * POST /api/fichas/acao/:acao_id/chamar-proximo
 * Chama 1 ficha por vez de uma fila específica (sala/exame).
 * Cada sala opera de forma INDEPENDENTE.
 * A senha (numero_ficha) é a mesma para todos os exames do cidadão,
 * mas cada exame é chamado separadamente pelo profissional responsável.
 *
 * Body: { guiche?, estacao_id?, curso_exame_id? }
 */
router.post('/acao/:acao_id/chamar-proximo', authenticate, authorizeAdminOrEstrada, async (req: Request, res: Response) => {
    try {
        const { acao_id } = req.params;
        const { guiche, estacao_id, curso_exame_id } = req.body;

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const amanha = new Date(hoje);
        amanha.setDate(amanha.getDate() + 1);

        // Filtro base
        const whereFicha: any = {
            acao_id,
            status: 'aguardando',
            hora_entrada: { [Op.gte]: hoje, [Op.lt]: amanha },
        };
        if (estacao_id) whereFicha.estacao_id = estacao_id;

        // Includes padrão
        const includes: any[] = [
            { model: Cidadao, as: 'cidadao', attributes: ['id', 'nome_completo', 'cpf', 'email', 'telefone'] },
            { model: EstacaoExame, as: 'estacao', attributes: ['id', 'nome'], required: false },
        ];

        if (curso_exame_id && !estacao_id) {
            includes.push({
                model: Inscricao, as: 'inscricao', required: true,
                where: { curso_exame_id },
                include: [{ model: CursoExame, as: 'curso_exame', attributes: ['id', 'nome', 'tipo'] }],
            });
        } else {
            includes.push({
                model: Inscricao, as: 'inscricao', required: false,
                include: [{ model: CursoExame, as: 'curso_exame', attributes: ['id', 'nome', 'tipo'] }],
            });
        }

        // Menor senha aguardando nesta fila
        const proxima = await FichaAtendimento.findOne({
            where: whereFicha,
            include: includes,
            order: [['numero_ficha', 'ASC'], ['hora_entrada', 'ASC']],
        });

        if (!proxima) {
            const nomeFila = estacao_id ? 'desta sala' : curso_exame_id ? 'deste exame' : 'geral';
            res.json({ message: `Fila ${nomeFila} vazia`, ficha: null });
            return;
        }

        // Chamar APENAS esta ficha (não afeta outros exames do mesmo cidadão)
        await proxima.update({ status: 'chamado', hora_chamada: new Date(), guiche: guiche || null });

        // Notificar cidadão
        const cidadaoData = (proxima as any).cidadao;
        if (cidadaoData) {
            const config = await ConfiguracaoFilaAcao.findOne({ where: { acao_id } });
            const cfg: ConfigNotif = {
                notif_email: config?.notif_email ?? false,
                notif_sms: config?.notif_sms ?? false,
                notif_whatsapp: config?.notif_whatsapp ?? true,
            };
            const cid: CidadaoNotif = {
                nome_completo: cidadaoData.nome_completo,
                email: cidadaoData.email,
                telefone: cidadaoData.telefone,
            };
            const nomeExame = (proxima as any).inscricao?.curso_exame?.nome || 'Exame';
            const nomeEstacao = (proxima as any).estacao?.nome || guiche || 'Local de atendimento';
            await notificarChamado(cid, proxima.numero_ficha, nomeExame, nomeEstacao, guiche || null, cfg).catch(() => null);
        }

        // Socket.IO
        const io = (req.app as any).get('io');
        if (io) {
            const filaAtualizada = await getFila(acao_id);
            io.to(`acao:${acao_id}`).emit('fila_atualizada', { acao_id, fila: filaAtualizada });
            io.to(`acao:${acao_id}`).emit('paciente_chamado', {
                ficha: proxima,
                cidadao: cidadaoData,
                guiche: guiche || null,
                nomeExame: (proxima as any).inscricao?.curso_exame?.nome,
            });
        }

        res.json({
            message: `Senha ${String(proxima.numero_ficha).padStart(3, '0')} — ${cidadaoData?.nome_completo || 'Paciente'}`,
            ficha: proxima,
            cidadao: cidadaoData,
        });
    } catch (error) {
        console.error('Erro ao chamar próximo:', error);
        res.status(500).json({ error: 'Erro ao chamar próximo da fila' });
    }
});



/**
 * GET /api/fichas/painel/:acao_id  — PÚBLICO (sem autenticação para o painel de TV)
 * Retorna dados consolidados para o painel de TV
 */
router.get('/painel/:acao_id', async (req: Request, res: Response) => {
    try {
        const { acao_id } = req.params;
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const amanha = new Date(hoje);
        amanha.setDate(amanha.getDate() + 1);

        const include = [
            { model: Cidadao, as: 'cidadao', attributes: ['nome_completo'] },
            {
                model: Inscricao, as: 'inscricao', required: false,
                include: [{ model: CursoExame, as: 'curso_exame', attributes: ['nome'] }],
            },
            { model: EstacaoExame, as: 'estacao', attributes: ['id', 'nome', 'status'], required: false },
        ];

        const todas = await FichaAtendimento.findAll({
            where: { acao_id, hora_entrada: { [Op.gte]: hoje, [Op.lt]: amanha } },
            include: include as any,
            order: [['numero_ficha', 'ASC']],
        });

        const ultimaChamada = todas
            .filter(f => f.status === 'chamado' || f.status === 'em_atendimento')
            .sort((a, b) => (b.hora_chamada?.getTime() ?? 0) - (a.hora_chamada?.getTime() ?? 0))[0] || null;

        const aguardando = todas.filter(f => f.status === 'aguardando');
        const concluidos = todas.filter(f => f.status === 'concluido').length;

        // Histórico: fichas chamadas/em_atendimento/concluídas, ordem decrescente por hora_chamada
        const chamadas = todas
            .filter(f => ['chamado', 'em_atendimento', 'concluido'].includes(f.status) && f.hora_chamada)
            .sort((a, b) => (b.hora_chamada?.getTime() ?? 0) - (a.hora_chamada?.getTime() ?? 0))
            .slice(0, 12);

        const estacoes = await EstacaoExame.findAll({
            where: { acao_id },
            include: [{ model: CursoExame, as: 'curso_exame', attributes: ['nome'], required: false }],
            attributes: ['id', 'nome', 'status', 'motivo_pausa'],
        });

        const acao = await Acao.findByPk(acao_id, { attributes: ['nome'] });

        res.json({
            ultimaChamada,
            aguardando,
            chamadas,
            estacoes,
            totalHoje: todas.length,
            concluidos,
            nomeAcao: (acao as any)?.nome || 'Ação em andamento',
        });

    } catch (err) {
        console.error('Erro ao buscar painel:', err);
        res.status(500).json({ error: 'Erro ao buscar dados do painel' });
    }
});

/**
 * POST /api/fichas/acao/:acao_id/sincronizar-inscricoes
 * Busca todos os inscritos daquela ação no dia de hoje e cria fichas para quem não tem.
 * Isso resolve o problema de inscrições que já existiam antes da ativação do módulo de fila.
 */
router.post('/acao/:acao_id/sincronizar-inscricoes', authenticate, authorizeAdminOrEstrada, async (req: Request, res: Response) => {
    try {
        const { acao_id } = req.params;
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const amanha = new Date(hoje);
        amanha.setDate(amanha.getDate() + 1);

        // 1. Buscar todas as inscrições desta ação hoje
        const inscricoes = await Inscricao.findAll({
            where: {
                acao_id,
                data_inscricao: { [Op.gte]: hoje, [Op.lt]: amanha }
            }
        });

        if (inscricoes.length === 0) {
            res.json({ message: 'Nenhuma inscrição encontrada para hoje.', criadas: 0 });
            return;
        }

        // 2. Verificar quais já possuem ficha
        const fichasExistentes = await FichaAtendimento.findAll({
            where: {
                acao_id,
                hora_entrada: { [Op.gte]: hoje, [Op.lt]: amanha }
            },
            attributes: ['cidadao_id']
        });
        const idsComFicha = new Set(fichasExistentes.map(f => f.cidadao_id));

        // 3. Criar fichas para os que faltam
        let criadas = 0;
        for (const ins of inscricoes) {
            if (!idsComFicha.has(ins.cidadao_id)) {
                await FichaAtendimento.create({
                    cidadao_id: ins.cidadao_id,
                    inscricao_id: ins.id,
                    acao_id,
                    status: 'aguardando'
                });
                criadas++;
                idsComFicha.add(ins.cidadao_id); // Evitar duplicar no mesmo loop
            }
        }

        // 4. Emitir atualização via Socket se houver mudanças
        if (criadas > 0) {
            const io = (req.app as any).get('io');
            if (io) {
                const filaAtualizada = await getFila(acao_id);
                io.to(`acao:${acao_id}`).emit('fila_atualizada', { acao_id, fila: filaAtualizada });
            }
        }

        res.json({ message: 'Sincronização concluída', criadas });
    } catch (error) {
        console.error('Erro ao sincronizar inscrições:', error);
        res.status(500).json({ error: 'Erro ao sincronizar inscrições com a fila' });
    }
});

export { getFila };
export default router;

