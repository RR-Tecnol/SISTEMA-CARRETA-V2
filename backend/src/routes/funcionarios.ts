import { Router, Request, Response } from 'express';
import { Funcionario } from '../models/Funcionario';
import { FuncionarioAnotacao } from '../models/FuncionarioAnotacao';
import { authenticate, authorizeAdmin } from '../middlewares/auth';
import Joi from 'joi';
import { validate } from '../middlewares/validation';
import bcrypt from 'bcrypt';

const router = Router();

const funcionarioSchema = Joi.object({
    nome: Joi.string().required(),
    cargo: Joi.string().required(),
    cpf: Joi.string().allow(null, '').optional(),
    telefone: Joi.string().allow(null, '').optional(),
    email: Joi.string().email().allow(null, '').optional(),
    especialidade: Joi.string().allow(null, '').optional(),
    crm: Joi.string().allow(null, '').optional(),
    custo_diaria: Joi.number().precision(2).min(0).required(),
    ativo: Joi.boolean().optional(),
    is_medico: Joi.boolean().optional(),
    login_cpf: Joi.string().allow(null, '').optional(),
    senha: Joi.string().min(6).allow(null, '').optional(),
});

// Schema para atualização - campos opcionais
const updateFuncionarioSchema = Joi.object({
    nome: Joi.string().optional(),
    cargo: Joi.string().optional(),
    cpf: Joi.string().allow(null, '').optional(),
    telefone: Joi.string().allow(null, '').optional(),
    email: Joi.string().email().allow(null, '').optional(),
    especialidade: Joi.string().allow(null, '').optional(),
    crm: Joi.string().allow(null, '').optional(),
    custo_diaria: Joi.number().precision(2).min(0).optional(),
    ativo: Joi.boolean().optional(),
    is_medico: Joi.boolean().optional(),
    login_cpf: Joi.string().allow(null, '').optional(),
    senha: Joi.string().min(6).allow(null, '').optional(),
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
        const data = { ...req.body };
        // Hash da senha do médico
        if (data.is_medico && data.senha) {
            data.senha = await bcrypt.hash(data.senha, 10);
        } else if (!data.is_medico) {
            data.senha = null;
            data.login_cpf = null;
        }
        const funcionario = await Funcionario.create(data);
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
        const data = { ...req.body };
        // Hash da nova senha se fornecida
        if (data.is_medico && data.senha && data.senha.length > 0) {
            data.senha = await bcrypt.hash(data.senha, 10);
        } else if (data.senha === '' || data.senha === null) {
            // Manter senha existente se não informada na atualização
            delete data.senha;
        }
        if (!data.is_medico) {
            data.senha = null;
            data.login_cpf = null;
        }
        await funcionario.update(data);
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

// PATCH /api/funcionarios/:id/toggle-ativo — ativa ou desativa o funcionário
// Se for médico, também desativa/restaura o acesso ao login
router.patch('/:id/toggle-ativo', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
    try {
        const funcionario = await Funcionario.findByPk(req.params.id);
        if (!funcionario) {
            res.status(404).json({ error: 'Funcionário não encontrado' });
            return;
        }

        const novoAtivo = !(funcionario as any).ativo;
        const updateData: any = { ativo: novoAtivo };

        // Se for médico e estiver sendo desativado, suspende o login
        // Se estiver sendo reativado, restaura o login_cpf (mantém como estava antes)
        if ((funcionario as any).is_medico) {
            if (!novoAtivo) {
                // Desativando: guarda o login_cpf no campo e zera o acesso
                updateData.login_habilitado = false;
            } else {
                // Reativando: restaura o acesso
                updateData.login_habilitado = true;
            }
        }

        await funcionario.update(updateData);

        const status = novoAtivo ? 'ativado' : 'desativado';
        res.json({
            message: `Funcionário ${status} com sucesso`,
            ativo: novoAtivo,
            funcionario,
        });
    } catch (error) {
        console.error('Erro ao alternar status do funcionário:', error);
        res.status(500).json({ error: 'Erro ao alterar status do funcionário' });
    }
});

// ==================== ANOTAÇÕES ====================

// GET /api/funcionarios/:id/anotacoes
router.get('/:id/anotacoes', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
    try {
        const anotacoes = await FuncionarioAnotacao.findAll({
            where: { funcionario_id: req.params.id },
            order: [
                ['pinned', 'DESC'],
                ['created_at', 'DESC'],
            ],
        });
        res.json(anotacoes);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar anotações' });
    }
});

// POST /api/funcionarios/:id/anotacoes
router.post('/:id/anotacoes', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
    try {
        const { titulo, conteudo, cor, pinned } = req.body;
        if (!titulo || !conteudo) {
            res.status(400).json({ error: 'Título e conteúdo são obrigatórios' });
            return;
        }
        const anotacao = await FuncionarioAnotacao.create({
            funcionario_id: req.params.id,
            titulo,
            conteudo,
            cor: cor || '#4682b4',
            pinned: pinned || false,
        });
        res.status(201).json(anotacao);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao criar anotação' });
    }
});

// PUT /api/funcionarios/:id/anotacoes/:anotacaoId
router.put('/:id/anotacoes/:anotacaoId', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
    try {
        const anotacao = await FuncionarioAnotacao.findOne({
            where: { id: req.params.anotacaoId, funcionario_id: req.params.id },
        });
        if (!anotacao) {
            res.status(404).json({ error: 'Anotação não encontrada' });
            return;
        }
        const { titulo, conteudo, cor, pinned } = req.body;
        await anotacao.update({
            ...(titulo !== undefined && { titulo }),
            ...(conteudo !== undefined && { conteudo }),
            ...(cor !== undefined && { cor }),
            ...(pinned !== undefined && { pinned }),
        });
        res.json(anotacao);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar anotação' });
    }
});

// DELETE /api/funcionarios/:id/anotacoes/:anotacaoId
router.delete('/:id/anotacoes/:anotacaoId', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
    try {
        const anotacao = await FuncionarioAnotacao.findOne({
            where: { id: req.params.anotacaoId, funcionario_id: req.params.id },
        });
        if (!anotacao) {
            res.status(404).json({ error: 'Anotação não encontrada' });
            return;
        }
        await anotacao.destroy();
        res.json({ message: 'Anotação excluída com sucesso' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao excluir anotação' });
    }
});

export default router;
