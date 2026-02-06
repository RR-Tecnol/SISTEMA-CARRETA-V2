import { Router, Request, Response } from 'express';
import { Noticia } from '../models/Noticia';
import { authenticate, authorizeAdmin } from '../middlewares/auth';

const router = Router();

/**
 * GET /api/noticias
 * Listar notícias (público)
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const { destaque } = req.query;

        const where: any = { ativo: true };
        if (destaque) where.destaque = destaque === 'true';

        const noticias = await Noticia.findAll({
            where,
            order: [['data_publicacao', 'DESC']],
            limit: 20,
        });

        res.json(noticias);
    } catch (error) {
        console.error('Error fetching noticias:', error);
        res.status(500).json({ error: 'Erro ao buscar notícias' });
    }
});

/**
 * POST /api/noticias
 * Criar notícia (admin)
 */
router.post('/', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
    try {
        const noticia = await Noticia.create(req.body);
        res.status(201).json({ message: 'Notícia criada com sucesso', noticia });
    } catch (error) {
        console.error('Error creating noticia:', error);
        res.status(500).json({ error: 'Erro ao criar notícia' });
    }
});

export default router;
