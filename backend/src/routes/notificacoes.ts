import { Router, Request, Response } from 'express';
import { Notificacao } from '../models/Notificacao';
import { authenticate, authorizeAdmin } from '../middlewares/auth';

const router = Router();

/**
 * GET /api/notificacoes
 * Listar notificações (admin)
 */
router.get('/', authenticate, authorizeAdmin, async (_req: Request, res: Response) => {
    try {
        const notificacoes = await Notificacao.findAll({
            order: [['created_at', 'DESC']],
        });

        res.json(notificacoes);
    } catch (error) {
        console.error('Error fetching notificacoes:', error);
        res.status(500).json({ error: 'Erro ao buscar notificações' });
    }
});

/**
 * POST /api/notificacoes/campanha
 * Criar campanha de notificação (admin)
 */
router.post('/campanha', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
    try {
        const notificacao = await Notificacao.create(req.body);
        res.status(201).json({ message: 'Campanha criada com sucesso', notificacao });
    } catch (error) {
        console.error('Error creating campanha:', error);
        res.status(500).json({ error: 'Erro ao criar campanha' });
    }
});

export default router;
