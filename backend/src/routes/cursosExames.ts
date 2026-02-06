import { Router, Request, Response } from 'express';
import { CursoExame } from '../models/CursoExame';
import { authenticate, authorizeAdmin } from '../middlewares/auth';

const router = Router();

/**
 * GET /api/cursos-exames
 * Listar cursos e exames (público)
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const { tipo } = req.query;

        const where: any = {};
        if (tipo) where.tipo = tipo;

        const cursosExames = await CursoExame.findAll({
            where,
            attributes: ['id', 'nome', 'tipo'], // Apenas campos necessários
            order: [['nome', 'ASC']],
        });

        res.json(cursosExames);
    } catch (error) {
        console.error('Error fetching cursos/exames:', error);
        res.status(500).json({ error: 'Erro ao buscar cursos/exames' });
    }
});

/**
 * GET /api/cursos-exames/:id
 * Buscar curso/exame pelo ID (público)
 */
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const cursoExame = await CursoExame.findByPk(id);
        if (!cursoExame) {
            res.status(404).json({ error: 'Curso/Exame não encontrado' });
            return;
        }

        res.json(cursoExame);
    } catch (error) {
        console.error('Error fetching curso/exame:', error);
        res.status(500).json({ error: 'Erro ao buscar curso/exame' });
    }
});

/**
 * POST /api/cursos-exames
 * Criar novo curso/exame (admin only)
 */
router.post('/', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
    try {
        const { nome, tipo } = req.body;

        if (!nome || !tipo) {
            res.status(400).json({ error: 'Nome e tipo são obrigatórios' });
            return;
        }

        if (tipo !== 'curso' && tipo !== 'exame') {
            res.status(400).json({ error: 'Tipo deve ser "curso" ou "exame"' });
            return;
        }

        const cursoExame = await CursoExame.create({
            nome,
            tipo,
        } as any);

        res.status(201).json(cursoExame);
    } catch (error) {
        console.error('Error creating curso/exame:', error);
        res.status(500).json({ error: 'Erro ao criar curso/exame' });
    }
});

/**
 * PUT /api/cursos-exames/:id
 * Atualizar curso/exame (admin only)
 */
router.put('/:id', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { nome, tipo } = req.body;

        const cursoExame = await CursoExame.findByPk(id);
        if (!cursoExame) {
            res.status(404).json({ error: 'Curso/Exame não encontrado' });
            return;
        }

        if (tipo && tipo !== 'curso' && tipo !== 'exame') {
            res.status(400).json({ error: 'Tipo deve ser "curso" ou "exame"' });
            return;
        }

        await cursoExame.update({
            nome: nome || cursoExame.nome,
            tipo: tipo || cursoExame.tipo,
        });

        res.json(cursoExame);
    } catch (error) {
        console.error('Error updating curso/exame:', error);
        res.status(500).json({ error: 'Erro ao atualizar curso/exame' });
    }
});

/**
 * DELETE /api/cursos-exames/:id
 * Deletar curso/exame (admin only)
 */
router.delete('/:id', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const cursoExame = await CursoExame.findByPk(id);
        if (!cursoExame) {
            res.status(404).json({ error: 'Curso/Exame não encontrado' });
            return;
        }

        await cursoExame.destroy();

        res.json({ message: 'Curso/Exame deletado com sucesso' });
    } catch (error) {
        console.error('Error deleting curso/exame:', error);
        res.status(500).json({ error: 'Erro ao deletar curso/exame' });
    }
});

export default router;
