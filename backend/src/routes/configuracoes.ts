import { Router, Request, Response } from 'express';
import { ConfiguracaoCampo } from '../models/ConfiguracaoCampo';
import { authenticate, authorizeAdmin } from '../middlewares/auth';

const router = Router();

/**
 * GET /api/configuracoes/campos
 * Listar campos configurados (público)
 */
router.get('/campos', async (req: Request, res: Response) => {
    try {
        const { entidade } = req.query;

        const where: any = { ativo: true };
        if (entidade) where.entidade = entidade;

        const campos = await ConfiguracaoCampo.findAll({
            where,
            order: [['ordem_exibicao', 'ASC']],
        });

        res.json(campos);
    } catch (error) {
        console.error('Error fetching campos:', error);
        res.status(500).json({ error: 'Erro ao buscar campos' });
    }
});

/**
 * POST /api/configuracoes/campos
 * Criar campo customizado (admin)
 */
router.post('/campos', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
    try {
        const campo = await ConfiguracaoCampo.create(req.body);
        res.status(201).json({ message: 'Campo criado com sucesso', campo });
    } catch (error) {
        console.error('Error creating campo:', error);
        res.status(500).json({ error: 'Erro ao criar campo' });
    }
});

export default router;
