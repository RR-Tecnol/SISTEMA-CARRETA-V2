import { Router, Request, Response } from 'express';
import { Instituicao } from '../models/Instituicao';
import { authenticate, authorizeAdmin, authorizeAdminOrEstrada } from '../middlewares/auth';

const router = Router();

/**
 * GET /api/instituicoes
 * Listar instituições (admin)
 */
router.get('/', authenticate, authorizeAdminOrEstrada, async (_req: Request, res: Response) => {
    try {
        const instituicoes = await Instituicao.findAll({
            where: { ativo: true },
            order: [['razao_social', 'ASC']],
        });

        // Mapear campos para o formato esperado pelo frontend
        const instituicoesFormatadas = instituicoes.map(inst => ({
            id: inst.id,
            razao_social: inst.razao_social,
            cnpj: inst.cnpj,
            responsavel: inst.responsavel_nome,
            telefone: inst.responsavel_tel,
            email: inst.responsavel_email,
            endereco: inst.endereco_completo,
            // Extrair cidade e estado do endereço completo (formato: "Rua X, Cidade/UF")
            cidade: inst.endereco_completo?.split(',').pop()?.split('/')[0]?.trim() || '',
            estado: inst.endereco_completo?.split('/').pop()?.trim() || '',
        }));

        res.json(instituicoesFormatadas);
    } catch (error) {
        console.error('Error fetching instituicoes:', error);
        res.status(500).json({ error: 'Erro ao buscar instituições' });
    }
});

/**
 * POST /api/instituicoes
 * Criar instituição (admin)
 */
router.post('/', authenticate, authorizeAdminOrEstrada, async (req: Request, res: Response) => {
    try {
        const instituicao = await Instituicao.create(req.body);
        res.status(201).json({ message: 'Instituição criada com sucesso', instituicao });
    } catch (error) {
        console.error('Error creating instituicao:', error);
        res.status(500).json({ error: 'Erro ao criar instituição' });
    }
});

/**
 * GET /api/instituicoes/:id
 * Buscar instituição por ID (admin)
 */
router.get('/:id', authenticate, authorizeAdminOrEstrada, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const instituicao = await Instituicao.findByPk(id);

        if (!instituicao) {
            res.status(404).json({ error: 'Instituição não encontrada' });
            return;
        }

        res.json(instituicao);
    } catch (error) {
        console.error('Error fetching instituicao:', error);
        res.status(500).json({ error: 'Erro ao buscar instituição' });
    }
});

/**
 * PUT /api/instituicoes/:id
 * Atualizar instituição (admin)
 */
router.put('/:id', authenticate, authorizeAdminOrEstrada, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const instituicao = await Instituicao.findByPk(id);

        if (!instituicao) {
            res.status(404).json({ error: 'Instituição não encontrada' });
            return;
        }

        await instituicao.update(req.body);
        res.json({ message: 'Instituição atualizada com sucesso', instituicao });
    } catch (error) {
        console.error('Error updating instituicao:', error);
        res.status(500).json({ error: 'Erro ao atualizar instituição' });
    }
});

export default router;
