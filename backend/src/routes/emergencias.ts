import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import { Emergencia } from '../models/Emergencia';
import { Cidadao } from '../models';
import { authenticate } from '../middlewares/auth';

const router = Router();

// ─── GET /api/emergencias ─── Lista emergências (filtro por ação e status)
router.get('/', authenticate, async (req: Request, res: Response) => {
    try {
        const { acao_id, status, cidadao_id, limit = '50', page = '1' } = req.query as any;
        const offset = (Number(page) - 1) * Number(limit);

        const where: any = {};
        if (acao_id) where.acao_id = acao_id;
        if (cidadao_id) where.cidadao_id = cidadao_id;
        if (status && status !== 'todos') where.status = status;

        // LGPD: só mostrar últimos 30 dias
        where.created_at = { [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };

        const { rows: emergencias, count } = await Emergencia.findAndCountAll({
            where,
            order: [['created_at', 'DESC']],
            limit: Number(limit),
            offset,
        });

        res.json({ emergencias, total: count, page: Number(page), pages: Math.ceil(count / Number(limit)) });
    } catch (error) {
        console.error('Erro ao buscar emergências:', error);
        res.status(500).json({ error: 'Erro ao buscar emergências' });
    }
});

// ─── GET /api/emergencias/nao-lidas ─── Contagem de alertas novos (para o badge do sino)
router.get('/nao-lidas', authenticate, async (req: Request, res: Response) => {
    try {
        const { acao_id } = req.query as any;
        const where: any = { status: { [Op.in]: ['novo', 'visto'] } };
        if (acao_id) where.acao_id = acao_id;

        // LGPD: só últimos 30 dias
        where.created_at = { [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };

        const count = await Emergencia.count({ where });
        const novas = await Emergencia.count({ where: { ...where, status: 'novo' } });

        res.json({ total_ativas: count, novas });
    } catch (error) {
        console.error('Erro ao contar emergências:', error);
        res.status(500).json({ error: 'Erro ao contar emergências' });
    }
});

// ─── PUT /api/emergencias/:id/status ─── Atualiza status da emergência
router.put('/:id/status', authenticate, async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const { status, observacoes } = req.body;

        const emergencia = await Emergencia.findByPk(id);
        if (!emergencia) { res.status(404).json({ error: 'Emergência não encontrada' }); return; }

        const updates: any = { status };
        if (observacoes !== undefined) updates.observacoes = observacoes;

        // Se está atendendo, registrar quem
        if (status === 'em_atendimento' && req.user?.id) {
            updates.atendido_por = req.user.id;
        }
        // Se resolveu, registrar quando
        if (status === 'resolvido') {
            updates.resolvido_em = new Date();
            if (req.user?.id && !emergencia.atendido_por) {
                updates.atendido_por = req.user.id;
            }
        }

        await emergencia.update(updates);

        res.json(emergencia);
    } catch (error) {
        console.error('Erro ao atualizar emergência:', error);
        res.status(500).json({ error: 'Erro ao atualizar emergência' });
    }
});

// ─── POST /api/emergencias ─── Criar emergência (usado pelo Socket.IO backup ou chamada direta)
router.post('/', authenticate, async (req: Request, res: Response) => {
    try {
        const { acao_id, cidadao_id, nome_cidadao } = req.body;

        if (!acao_id || !cidadao_id) {
            res.status(400).json({ error: 'acao_id e cidadao_id são obrigatórios' });
            return;
        }

        // Verificar se já existe emergência ativa muito recente (< 2 min) deste cidadão
        const recente = await Emergencia.findOne({
            where: {
                acao_id,
                cidadao_id,
                status: { [Op.in]: ['novo', 'visto', 'em_atendimento'] },
                created_at: { [Op.gte]: new Date(Date.now() - 2 * 60 * 1000) },
            },
        });

        if (recente) {
            res.json({ emergencia: recente, duplicada: true });
            return;
        }

        // Buscar nome se não fornecido
        let nome = nome_cidadao;
        if (!nome) {
            const cidadao = await Cidadao.findByPk(cidadao_id);
            nome = (cidadao as any)?.nome_completo || 'Cidadão';
        }

        const emergencia = await Emergencia.create({
            id: require('crypto').randomUUID(),
            acao_id,
            cidadao_id,
            nome_cidadao: nome,
        });

        res.status(201).json({ emergencia });
    } catch (error) {
        console.error('Erro ao criar emergência:', error);
        res.status(500).json({ error: 'Erro ao criar emergência' });
    }
});

// ─── LGPD: Limpeza automática de emergências > 30 dias ───
// Chamado periodicamente pelo servidor ou como cron
router.delete('/limpeza-lgpd', authenticate, async (_req: Request, res: Response) => {
    try {
        const deleted = await Emergencia.destroy({
            where: {
                created_at: { [Op.lt]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            },
        });
        res.json({ deletados: deleted, message: `${deleted} registros removidos (LGPD — >30 dias)` });
    } catch (error) {
        console.error('Erro na limpeza LGPD:', error);
        res.status(500).json({ error: 'Erro na limpeza' });
    }
});

export default router;
