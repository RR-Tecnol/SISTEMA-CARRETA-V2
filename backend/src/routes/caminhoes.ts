import { Router, Request, Response } from 'express';
import { Caminhao } from '../models/Caminhao';
import { ManutencaoCaminhao } from '../models/ManutencaoCaminhao';
import { ContaPagar } from '../models/ContaPagar';
import { AcaoCaminhao } from '../models/AcaoCaminhao';
import { Acao } from '../models/Acao';
import { authenticate, authorizeAdmin, authorizeAdminOrEstrada } from '../middlewares/auth';
import Joi from 'joi';
import { validate } from '../middlewares/validation';
import { Op } from 'sequelize';

const router = Router();

const caminhaoSchema = Joi.object({
    placa: Joi.string().max(10).required(),
    modelo: Joi.string().required(),
    ano: Joi.number().integer().min(1900).max(new Date().getFullYear() + 1).required(),
    autonomia_km_litro: Joi.number().precision(2).min(0).required(),
    capacidade_litros: Joi.number().integer().min(0).required(),
    status: Joi.string().valid('disponivel', 'em_manutencao', 'em_acao').optional(),
});

const updateCaminhaoSchema = Joi.object({
    placa: Joi.string().max(10).optional(),
    modelo: Joi.string().optional(),
    ano: Joi.number().integer().min(1900).max(new Date().getFullYear() + 1).optional(),
    autonomia_km_litro: Joi.number().precision(2).min(0).optional(),
    capacidade_litros: Joi.number().integer().min(0).optional(),
    status: Joi.string().valid('disponivel', 'em_manutencao', 'em_acao').optional(),
});

const manutencaoSchema = Joi.object({
    tipo: Joi.string().valid('preventiva', 'corretiva', 'revisao', 'pneu', 'eletrica', 'outro').required(),
    titulo: Joi.string().max(200).required(),
    descricao: Joi.string().allow('', null).optional(),
    status: Joi.string().valid('agendada', 'em_andamento', 'concluida', 'cancelada').optional(),
    prioridade: Joi.string().valid('baixa', 'media', 'alta', 'critica').optional(),
    km_atual: Joi.number().integer().min(0).allow(null).optional(),
    km_proximo: Joi.number().integer().min(0).allow(null).optional(),
    data_agendada: Joi.string().isoDate().allow(null, '').optional(),
    data_conclusao: Joi.string().isoDate().allow(null, '').optional(),
    custo_real: Joi.number().precision(2).min(0).allow(null).optional(),
    status_pagamento: Joi.string().valid('pendente', 'paga').allow(null).optional(),
    fornecedor: Joi.string().max(200).allow('', null).optional(),
    responsavel: Joi.string().max(200).allow('', null).optional(),
    observacoes: Joi.string().allow('', null).optional(),
});

// ── Helpers ──────────────────────────────────────────────────────────────────

const parseLocalDate = (dateString: string): Date => {
    if (!dateString) return new Date();
    if (dateString.includes('T')) return new Date(dateString);
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0, 0);
};

/**
 * Sincroniza a ContaPagar vinculada a uma manutenção.
 * Cria se não existe, atualiza se existe.
 * Remove se custo foi zerado.
 */
async function syncContaPagar(manutencao: ManutencaoCaminhao) {
    const descricao = `Manutenção: ${manutencao.titulo}`;
    const vencimento = manutencao.data_agendada || manutencao.data_conclusao || new Date().toISOString();

    // Busca conta já vinculada (usa titulo como referência via descricao)
    const existente = await ContaPagar.findOne({
        where: {
            caminhao_id: manutencao.caminhao_id,
            descricao,
        },
    });

    // Se não tem custo real, remove conta vinculada se existir
    if (!manutencao.custo_real) {
        if (existente) await existente.destroy();
        return;
    }

    const statusConta = (manutencao as any).status_pagamento === 'paga' ? 'paga' : 'pendente';
    const dataPagamento = statusConta === 'paga' ? new Date() : undefined;

    if (existente) {
        await existente.update({
            valor: Number(manutencao.custo_real),
            status: statusConta,
            data_pagamento: dataPagamento,
            data_vencimento: parseLocalDate(vencimento as string),
            fornecedor: manutencao.fornecedor || undefined,
            observacoes: manutencao.observacoes || undefined,
        } as any);
    } else {
        await ContaPagar.create({
            tipo_conta: 'manutencao',
            descricao,
            valor: Number(manutencao.custo_real),
            data_vencimento: parseLocalDate(vencimento as string),
            data_pagamento: dataPagamento,
            status: statusConta,
            recorrente: false,
            caminhao_id: manutencao.caminhao_id,
            observacoes: manutencao.observacoes || undefined,
        } as any);
    }
}

// ── Caminhões CRUD ──────────────────────────────────────────────────────────

router.get('/', authenticate, authorizeAdminOrEstrada, async (_req: Request, res: Response) => {
    try {
        const caminhoes = await Caminhao.findAll({ order: [['modelo', 'ASC']] });
        res.json(caminhoes);
    } catch (error: any) {
        console.error('❌ ERRO GET CAMINHOES:', error);
        res.status(500).json({ error: 'Erro ao buscar caminhões' });
    }
});

router.post('/', authenticate, authorizeAdminOrEstrada, validate(caminhaoSchema), async (req: Request, res: Response) => {
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

router.put('/:id', authenticate, authorizeAdminOrEstrada, validate(updateCaminhaoSchema), async (req: Request, res: Response) => {
    try {
        const caminhao = await Caminhao.findByPk(req.params.id);
        if (!caminhao) { res.status(404).json({ error: 'Caminhão não encontrado' }); return; }
        await caminhao.update(req.body);
        res.json(caminhao);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar caminhão' });
    }
});

router.delete('/:id', authenticate, authorizeAdminOrEstrada, async (req: Request, res: Response) => {
    try {
        const caminhao = await Caminhao.findByPk(req.params.id);
        if (!caminhao) { res.status(404).json({ error: 'Caminhão não encontrado' }); return; }
        await caminhao.destroy();
        res.json({ message: 'Caminhão excluído com sucesso' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao excluir caminhão' });
    }
});

// ── Manutenções sub-routes ──────────────────────────────────────────────────

router.get('/:id/manutencoes/stats', authenticate, authorizeAdminOrEstrada, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const manutencoes = await ManutencaoCaminhao.findAll({ where: { caminhao_id: id } });

        const totalGasto = manutencoes
            .filter(m => m.custo_real != null)
            .reduce((acc, m) => acc + Number(m.custo_real ?? 0), 0);

        const emAndamento = manutencoes.filter(m => m.status === 'em_andamento').length;
        const concluidas = manutencoes.filter(m => m.status === 'concluida').length;
        const agendadas = manutencoes.filter(m => m.status === 'agendada').length;

        const proxima = manutencoes
            .filter(m => m.status === 'agendada' && m.data_agendada)
            .sort((a, b) => new Date(a.data_agendada!).getTime() - new Date(b.data_agendada!).getTime())[0] || null;

        const hoje = new Date();
        const custosPorMes: { mes: string; custo: number }[] = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
            const mesLabel = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
            const custo = manutencoes
                .filter(m => {
                    if (!m.data_conclusao) return false;
                    const dc = new Date(m.data_conclusao);
                    return dc.getFullYear() === d.getFullYear() && dc.getMonth() === d.getMonth();
                })
                .reduce((acc, m) => acc + Number(m.custo_real ?? 0), 0);
            custosPorMes.push({ mes: mesLabel, custo });
        }

        res.json({ totalGasto, emAndamento, concluidas, agendadas, proxima, custosPorMes });
    } catch (error) {
        console.error('Erro ao buscar stats:', error);
        res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
});

router.get('/:id/manutencoes', authenticate, authorizeAdminOrEstrada, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status, tipo, prioridade } = req.query;
        const where: any = { caminhao_id: id };
        if (status) where.status = status;
        if (tipo) where.tipo = tipo;
        if (prioridade) where.prioridade = prioridade;
        const manutencoes = await ManutencaoCaminhao.findAll({ where, order: [['created_at', 'DESC']] });
        res.json(manutencoes);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar manutenções' });
    }
});

router.post('/:id/manutencoes', authenticate, authorizeAdminOrEstrada, validate(manutencaoSchema), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const caminhao = await Caminhao.findByPk(id);
        if (!caminhao) { res.status(404).json({ error: 'Caminhão não encontrado' }); return; }

        const manutencao = await ManutencaoCaminhao.create({ ...req.body, caminhao_id: id });

        // Setar em_manutencao para qualquer manutenção ativa (agendada ou em_andamento)
        const statusManutencao: string = req.body.status || 'agendada';
        if (['agendada', 'em_andamento'].includes(statusManutencao)) {
            await caminhao.update({ status: 'em_manutencao' });
        }

        // Sincroniza conta a pagar
        await syncContaPagar(manutencao);

        res.status(201).json(manutencao);
    } catch (error) {
        console.error('Erro ao criar manutenção:', error);
        res.status(500).json({ error: 'Erro ao registrar manutenção' });
    }
});

router.put('/:id/manutencoes/:mid', authenticate, authorizeAdminOrEstrada, validate(manutencaoSchema), async (req: Request, res: Response) => {
    try {
        const { id, mid } = req.params;
        const manutencao = await ManutencaoCaminhao.findOne({ where: { id: mid, caminhao_id: id } });
        if (!manutencao) { res.status(404).json({ error: 'Manutenção não encontrada' }); return; }

        await manutencao.update(req.body);

        // Atualiza status do caminhão
        const caminhao = await Caminhao.findByPk(id);
        if (caminhao) {
            const novoStatusManutencao: string = req.body.status || manutencao.status;
            if (['agendada', 'em_andamento'].includes(novoStatusManutencao)) {
                await caminhao.update({ status: 'em_manutencao' });
            } else if (['concluida', 'cancelada'].includes(novoStatusManutencao)) {
                // Verificar se ainda há manutenções ativas
                const aindaEmManutencao = await ManutencaoCaminhao.count({
                    where: { caminhao_id: id, status: { [Op.in]: ['agendada', 'em_andamento'] }, id: { [Op.ne]: mid } },
                });
                if (aindaEmManutencao === 0) {
                    // Não tem mais manutenções ativas — verificar se está em ação ativa
                    const emAcaoAtiva = await AcaoCaminhao.count({
                        where: { caminhao_id: id },
                        include: [{ model: Acao, as: 'acao', where: { status: 'ativa' }, required: true }] as any,
                    });
                    await caminhao.update({ status: emAcaoAtiva > 0 ? 'em_acao' : 'disponivel' });
                }
            }
        }

        // Sincroniza conta a pagar
        await syncContaPagar(manutencao);

        res.json(manutencao);
    } catch (error) {
        console.error('Erro ao atualizar manutenção:', error);
        res.status(500).json({ error: 'Erro ao atualizar manutenção' });
    }
});

router.delete('/:id/manutencoes/:mid', authenticate, authorizeAdminOrEstrada, async (req: Request, res: Response) => {
    try {
        const { id, mid } = req.params;
        const manutencao = await ManutencaoCaminhao.findOne({ where: { id: mid, caminhao_id: id } });
        if (!manutencao) { res.status(404).json({ error: 'Manutenção não encontrada' }); return; }

        // Remove conta vinculada se existir
        const descricao = `Manutenção: ${manutencao.titulo}`;
        await ContaPagar.destroy({ where: { caminhao_id: id, descricao } });

        await manutencao.destroy();
        res.json({ message: 'Manutenção removida com sucesso' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao remover manutenção' });
    }
});

export default router;
