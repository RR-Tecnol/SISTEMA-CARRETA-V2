import { Router, Request, Response } from 'express';
import { Funcionario } from '../models/Funcionario';
import { authenticate, authorizeAdmin } from '../middlewares/auth';
import Joi from 'joi';
import { validate } from '../middlewares/validation';

const router = Router();

const funcionarioSchema = Joi.object({
    nome: Joi.string().required(),
    cargo: Joi.string().required(),
    especialidade: Joi.string().allow(null, ''),
    custo_diario: Joi.number().precision(2).min(0).required(),
    status: Joi.string().valid('ativo', 'inativo').optional(),
});

// Schema para atualização - campos opcionais
const updateFuncionarioSchema = Joi.object({
    nome: Joi.string().optional(),
    cargo: Joi.string().optional(),
    especialidade: Joi.string().allow(null, '').optional(),
    custo_diario: Joi.number().precision(2).min(0).optional(),
    status: Joi.string().valid('ativo', 'inativo').optional(),
});

router.get('/', authenticate, authorizeAdmin, async (_req: Request, res: Response) => {
    try {
        const funcionarios = await Funcionario.findAll({ order: [['nome', 'ASC']] });
        res.json(funcionarios);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar funcionários' });
    }
});

router.post('/', authenticate, authorizeAdmin, validate(funcionarioSchema), async (req: Request, res: Response) => {
    try {
        const funcionario = await Funcionario.create(req.body);
        res.status(201).json(funcionario);
    } catch (error) {
        console.error('Erro detalhado ao criar funcionário:', error);
        res.status(500).json({ error: 'Erro ao criar funcionário' });
    }
});

router.put('/:id', authenticate, authorizeAdmin, validate(updateFuncionarioSchema), async (req: Request, res: Response) => {
    try {
        const funcionario = await Funcionario.findByPk(req.params.id);
        if (!funcionario) {
            res.status(404).json({ error: 'Funcionário não encontrado' });
            return;
        }
        await funcionario.update(req.body);
        res.json(funcionario);
    } catch (error) {
        console.error('Erro detalhado ao atualizar funcionário:', error);
        res.status(500).json({ error: 'Erro ao atualizar funcionário' });
    }
});

router.delete('/:id', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
    try {
        const funcionario = await Funcionario.findByPk(req.params.id);
        if (!funcionario) {
            res.status(404).json({ error: 'Funcionário não encontrado' });
            return;
        }
        await funcionario.destroy();
        res.json({ message: 'Funcionário excluído com sucesso' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao excluir funcionário' });
    }
});

export default router;
