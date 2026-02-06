import { Router, Request, Response } from 'express';
import { Abastecimento } from '../models/Abastecimento';
import { Caminhao } from '../models/Caminhao';
import { authenticate, authorizeAdmin } from '../middlewares/auth';

const router = Router();

// Listar abastecimentos de uma ação
router.get('/acoes/:acaoId/abastecimentos', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
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
router.post('/acoes/:acaoId/abastecimentos', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
    try {
        const { acaoId } = req.params;
        const { caminhao_id, data_abastecimento, litros, valor_total, observacoes } = req.body;

        // Calcular preço por litro
        const preco_por_litro = parseFloat((valor_total / litros).toFixed(3));

        const abastecimento = await Abastecimento.create({
            acao_id: acaoId,
            caminhao_id,
            data_abastecimento: data_abastecimento || new Date(),
            litros: parseFloat(litros),
            valor_total: parseFloat(valor_total),
            preco_por_litro,
            observacoes,
        });

        // Retornar com dados do caminhão
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
        res.status(400).json({ error: error.message });
    }
});

// Deletar abastecimento de uma ação
router.delete('/acoes/:acaoId/abastecimentos/:id', authenticate, authorizeAdmin, async (req: Request, res: Response): Promise<void> => {
    try {
        const { id, acaoId } = req.params;

        const abastecimento = await Abastecimento.findOne({
            where: {
                id,
                acao_id: acaoId
            }
        });

        if (!abastecimento) {
            res.status(404).json({ error: 'Abastecimento não encontrado' });
            return;
        }

        await abastecimento.destroy();
        res.json({ message: 'Abastecimento excluído com sucesso' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});


// Atualizar abastecimento
router.put('/abastecimentos/:id', authenticate, authorizeAdmin, async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { data_abastecimento, litros, valor_total, observacoes } = req.body;

        const abastecimento = await Abastecimento.findByPk(id);
        if (!abastecimento) {
            res.status(404).json({ error: 'Abastecimento não encontrado' });
            return;
        }

        // Recalcular preço por litro se litros ou valor mudaram
        const novosLitros = litros !== undefined ? parseFloat(litros) : abastecimento.litros;
        const novoValor = valor_total !== undefined ? parseFloat(valor_total) : abastecimento.valor_total;
        const preco_por_litro = parseFloat((novoValor / novosLitros).toFixed(3));

        await abastecimento.update({
            data_abastecimento: data_abastecimento || abastecimento.data_abastecimento,
            litros: novosLitros,
            valor_total: novoValor,
            preco_por_litro,
            observacoes: observacoes !== undefined ? observacoes : abastecimento.observacoes,
        });

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
        res.status(400).json({ error: error.message });
    }
});

// Deletar abastecimento
router.delete('/abastecimentos/:id', authenticate, authorizeAdmin, async (req: Request, res: Response): Promise<void> => {
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
router.get('/acoes/:acaoId/custo-teorico', authenticate, authorizeAdmin, async (req: Request, res: Response): Promise<void> => {
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
router.get('/acoes/:acaoId/custo-real', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
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
