import { Router, Request, Response } from 'express';
import { Caminhao } from '../models/Caminhao';
import { authenticate, authorizeAdmin } from '../middlewares/auth';
import Joi from 'joi';
import { validate } from '../middlewares/validation';

const router = Router();

const caminhaoSchema = Joi.object({
    placa: Joi.string().max(10).required(),
    modelo: Joi.string().required(),
    ano: Joi.number().integer().min(1900).max(new Date().getFullYear() + 1).required(),
    autonomia_km_litro: Joi.number().precision(2).min(0).required(),
    status: Joi.string().valid('disponivel', 'em_manutencao', 'em_acao').optional(),
});

// Schema para atualização - todos os campos opcionais
const updateCaminhaoSchema = Joi.object({
    placa: Joi.string().max(10).optional(),
    modelo: Joi.string().optional(),
    ano: Joi.number().integer().min(1900).max(new Date().getFullYear() + 1).optional(),
    autonomia_km_litro: Joi.number().precision(2).min(0).optional(),
    status: Joi.string().valid('disponivel', 'em_manutencao', 'em_acao').optional(),
});

router.get('/', authenticate, authorizeAdmin, async (_req: Request, res: Response) => {
    try {
        const caminhoes = await Caminhao.findAll({ order: [['modelo', 'ASC']] });
        res.json(caminhoes);
    } catch (error: any) {
        console.error('❌ ERRO GET CAMINHOES:', error);
        res.status(500).json({ error: 'Erro ao buscar caminhões' });
    }
});

router.post('/', authenticate, authorizeAdmin, validate(caminhaoSchema), async (req: Request, res: Response) => {
    try {
        const caminhao = await Caminhao.create(req.body);
        res.status(201).json(caminhao);
    } catch (error: any) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            res.status(400).json({ error: 'Placa já cadastrada' });
            return;
        }
        res.status(500).json({ error: 'Erro ao criar caminhão' });
    }
});

router.put('/:id', authenticate, authorizeAdmin, validate(updateCaminhaoSchema), async (req: Request, res: Response) => {
    try {
        const caminhao = await Caminhao.findByPk(req.params.id);
        if (!caminhao) {
            res.status(404).json({ error: 'Caminhão não encontrado' });
            return;
        }
        await caminhao.update(req.body);
        res.json(caminhao);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar caminhão' });
    }
});

router.delete('/:id', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
    try {
        const caminhao = await Caminhao.findByPk(req.params.id);
        if (!caminhao) {
            res.status(404).json({ error: 'Caminhão não encontrado' });
            return;
        }
        await caminhao.destroy();
        res.json({ message: 'Caminhão excluído com sucesso' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao excluir caminhão' });
    }
});

export default router;
