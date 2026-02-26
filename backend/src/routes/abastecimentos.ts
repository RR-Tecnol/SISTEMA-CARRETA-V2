import { Router, Request, Response } from 'express';
import { Abastecimento } from '../models/Abastecimento';
import { Caminhao } from '../models/Caminhao';
import { ContaPagar } from '../models/ContaPagar';
import { authenticate, authorizeAdmin, authorizeAdminOrEstrada } from '../middlewares/auth';
import { sequelize } from '../config/database';

const router = Router();

// Listar abastecimentos de uma ação
router.get('/acoes/:acaoId/abastecimentos', authenticate, authorizeAdminOrEstrada, async (req: Request, res: Response) => {
    try {
        const { acaoId } = req.params;

        const abastecimentos = await Abastecimento.findAll({
            where: { acao_id: acaoId },
            include: [
                {
                    model: Caminhao,
                    as: 'caminhao',
                    attributes: ['id', 'placa', 'modelo'],
                },
            ],
            order: [['data_abastecimento', 'DESC']],
        });

        res.json(abastecimentos);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Registrar novo abastecimento
router.post('/acoes/:acaoId/abastecimentos', authenticate, authorizeAdminOrEstrada, async (req: Request, res: Response) => {
    const t = await sequelize.transaction();

    try {
        const { acaoId } = req.params;
        const { caminhao_id, data_abastecimento, litros, valor_total, observacoes } = req.body;

        // Calcular preço por litro
        const preco_por_litro = parseFloat((valor_total / litros).toFixed(3));

        // 1. Criar abastecimento
        const abastecimento = await Abastecimento.create({
            acao_id: acaoId,
            caminhao_id,
            data_abastecimento: data_abastecimento || new Date(),
            litros: parseFloat(litros),
            valor_total: parseFloat(valor_total),
            preco_por_litro,
            observacoes,
        }, { transaction: t });

        // 2. Buscar dados do caminhão
        const caminhao = await Caminhao.findByPk(caminhao_id);

        // 3. Criar conta a pagar automaticamente
        await ContaPagar.create({
            tipo_conta: 'abastecimento',
            descricao: `Abastecimento ${caminhao?.placa || 'N/A'} - ${parseFloat(litros).toFixed(2)}L`,
            valor: parseFloat(valor_total),
            data_vencimento: data_abastecimento || new Date(),
            data_pagamento: data_abastecimento || new Date(),
            status: 'paga',
            recorrente: false,
            observacoes: observacoes || null,
            acao_id: acaoId,
            caminhao_id: caminhao_id,
            cidade: null,
        }, { transaction: t });

        await t.commit();

        // 4. Retornar com dados do caminhão
        const abastecimentoCompleto = await Abastecimento.findByPk(abastecimento.id, {
            include: [
                {
                    model: Caminhao,
                    as: 'caminhao',
                    attributes: ['id', 'placa', 'modelo'],
                },
            ],
        });

        res.status(201).json(abastecimentoCompleto);
    } catch (error: any) {
        await t.rollback();
        res.status(400).json({ error: error.message });
    }
});

// Deletar abastecimento de uma ação
router.delete('/acoes/:acaoId/abastecimentos/:id', authenticate, authorizeAdminOrEstrada, async (req: Request, res: Response): Promise<void> => {
    const t = await sequelize.transaction();

    try {
        const { id, acaoId } = req.params;

        const abastecimento = await Abastecimento.findOne({
            where: {
                id,
                acao_id: acaoId
            }
        });

        if (!abastecimento) {
            await t.rollback();
            res.status(404).json({ error: 'Abastecimento não encontrado' });
            return;
        }

        // 1. Buscar conta a pagar vinculada
        const contaPagar = await ContaPagar.findOne({
            where: {
                acao_id: abastecimento.acao_id,
                caminhao_id: abastecimento.caminhao_id,
                tipo_conta: 'abastecimento',
                status: 'paga',
            },
            order: [['created_at', 'DESC']],
            transaction: t,
        });

        // 2. Cancelar conta a pagar se existir
        if (contaPagar) {
            await contaPagar.update({
                status: 'cancelada',
            }, { transaction: t });
        }

        // 3. Deletar abastecimento
        await abastecimento.destroy({ transaction: t });

        await t.commit();
        res.json({ message: 'Abastecimento excluído com sucesso' });
    } catch (error: any) {
        await t.rollback();
        res.status(500).json({ error: error.message });
    }
});


// Atualizar abastecimento
router.put('/abastecimentos/:id', authenticate, authorizeAdminOrEstrada, async (req: Request, res: Response): Promise<void> => {
    const t = await sequelize.transaction();

    try {
        const { id } = req.params;
        const { data_abastecimento, litros, valor_total, observacoes } = req.body;

        const abastecimento = await Abastecimento.findByPk(id);
        if (!abastecimento) {
            await t.rollback();
            res.status(404).json({ error: 'Abastecimento não encontrado' });
            return;
        }

        // Recalcular preço por litro se litros ou valor mudaram
        const novosLitros = litros !== undefined ? parseFloat(litros) : abastecimento.litros;
        const novoValor = valor_total !== undefined ? parseFloat(valor_total) : abastecimento.valor_total;
        const preco_por_litro = parseFloat((novoValor / novosLitros).toFixed(3));

        // 1. Atualizar abastecimento
        await abastecimento.update({
            data_abastecimento: data_abastecimento || abastecimento.data_abastecimento,
            litros: novosLitros,
            valor_total: novoValor,
            preco_por_litro,
            observacoes: observacoes !== undefined ? observacoes : abastecimento.observacoes,
        }, { transaction: t });

        // 2. Buscar conta a pagar vinculada
        const contaPagar = await ContaPagar.findOne({
            where: {
                acao_id: abastecimento.acao_id,
                caminhao_id: abastecimento.caminhao_id,
                tipo_conta: 'abastecimento',
                status: 'paga', // Apenas contas pagas (não canceladas)
            },
            order: [['created_at', 'DESC']],
            transaction: t,
        });

        // 3. Atualizar conta a pagar se existir
        if (contaPagar) {
            const caminhao = await Caminhao.findByPk(abastecimento.caminhao_id);

            await contaPagar.update({
                descricao: `Abastecimento ${caminhao?.placa || 'N/A'} - ${novosLitros.toFixed(2)}L`,
                valor: novoValor,
                data_vencimento: data_abastecimento || abastecimento.data_abastecimento,
                data_pagamento: data_abastecimento || abastecimento.data_abastecimento,
                observacoes: observacoes !== undefined ? observacoes : abastecimento.observacoes,
            }, { transaction: t });
        }

        await t.commit();

        const abastecimentoAtualizado = await Abastecimento.findByPk(id, {
            include: [
                {
                    model: Caminhao,
                    as: 'caminhao',
                    attributes: ['id', 'placa', 'modelo'],
                },
            ],
        });

        res.json(abastecimentoAtualizado);
    } catch (error: any) {
        await t.rollback();
        res.status(400).json({ error: error.message });
    }
});

// Deletar abastecimento
router.delete('/abastecimentos/:id', authenticate, authorizeAdminOrEstrada, async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const abastecimento = await Abastecimento.findByPk(id);
        if (!abastecimento) {
            res.status(404).json({ error: 'Abastecimento não encontrado' });
            return;
        }

        await abastecimento.destroy();
        res.json({ message: 'Abastecimento deletado com sucesso' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Calcular custo teórico de uma ação
router.get('/acoes/:acaoId/custo-teorico', authenticate, authorizeAdminOrEstrada, async (req: Request, res: Response): Promise<void> => {
    try {
        const { acaoId } = req.params;
        const { Acao } = require('../models');

        const acao = await Acao.findByPk(acaoId, {
            include: [
                {
                    model: Caminhao,
                    as: 'caminhoes',
                    through: { attributes: [] },
                },
            ],
        });

        if (!acao) {
            res.status(404).json({ error: 'Ação não encontrada' });
            return;
        }

        if (!acao.distancia_km || !acao.preco_combustivel_referencia) {
            res.json({
                custo_total: 0,
                detalhes: [],
                mensagem: 'Distância ou preço de referência não cadastrados',
            });
            return;
        }

        const detalhes = acao.caminhoes.map((caminhao: any) => {
            const litrosNecessarios = acao.distancia_km / (caminhao.autonomia_km_litro || 1);
            const custo = litrosNecessarios * acao.preco_combustivel_referencia;

            return {
                caminhao_id: caminhao.id,
                placa: caminhao.placa,
                modelo: caminhao.modelo,
                autonomia: caminhao.autonomia_km_litro,
                litros_necessarios: parseFloat(litrosNecessarios.toFixed(2)),
                custo: parseFloat(custo.toFixed(2)),
            };
        });

        const custo_total = detalhes.reduce((sum: number, d: any) => sum + d.custo, 0);

        res.json({
            custo_total: parseFloat(custo_total.toFixed(2)),
            distancia_km: acao.distancia_km,
            preco_referencia: acao.preco_combustivel_referencia,
            detalhes,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Calcular custo real de uma ação (soma dos abastecimentos)
router.get('/acoes/:acaoId/custo-real', authenticate, authorizeAdminOrEstrada, async (req: Request, res: Response) => {
    try {
        const { acaoId } = req.params;

        const abastecimentos = await Abastecimento.findAll({
            where: { acao_id: acaoId },
            include: [
                {
                    model: Caminhao,
                    as: 'caminhao',
                    attributes: ['id', 'placa', 'modelo'],
                },
            ],
        });

        const custo_total = abastecimentos.reduce((sum, a) => sum + parseFloat(a.valor_total.toString()), 0);
        const litros_total = abastecimentos.reduce((sum, a) => sum + parseFloat(a.litros.toString()), 0);
        const preco_medio = litros_total > 0 ? custo_total / litros_total : 0;

        res.json({
            custo_total: parseFloat(custo_total.toFixed(2)),
            litros_total: parseFloat(litros_total.toFixed(2)),
            preco_medio_por_litro: parseFloat(preco_medio.toFixed(3)),
            quantidade_abastecimentos: abastecimentos.length,
            abastecimentos: abastecimentos.map(a => ({
                id: a.id,
                caminhao: a.caminhao,
                data: a.data_abastecimento,
                litros: a.litros,
                valor: a.valor_total,
                preco_por_litro: a.preco_por_litro,
            })),
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
