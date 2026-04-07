/**
 * routes/equipamentos.ts
 * F9 — CRUD de equipamentos eletrônicos por carreta
 *
 * Rotas:
 *   GET    /api/caminhoes/:id/equipamentos         — listar equipamentos
 *   POST   /api/caminhoes/:id/equipamentos         — criar equipamento
 *   PUT    /api/caminhoes/:id/equipamentos/:eqId   — atualizar equipamento
 *   DELETE /api/caminhoes/:id/equipamentos/:eqId   — remover equipamento
 */

import { Router, Request, Response } from 'express';
import { EquipamentoCaminhao } from '../models/EquipamentoCaminhao';
import { Caminhao } from '../models/Caminhao';
import { authenticate } from '../middlewares/auth';

const router = Router({ mergeParams: true }); // mergeParams: herda :id do parent

// ─── GET /api/caminhoes/:id/equipamentos ─────────────────────────────────────
router.get('/', authenticate, async (req: Request, res: Response) => {
    try {
        const { id: caminhao_id } = req.params;

        // Verifica se o caminhão existe
        const caminhao = await Caminhao.findByPk(caminhao_id);
        if (!caminhao) {
            return res.status(404).json({ error: 'Caminhão não encontrado' });
        }

        const equipamentos = await EquipamentoCaminhao.findAll({
            where: { caminhao_id },
            order: [['created_at', 'ASC']],
        });

        return res.json(equipamentos);
    } catch (err) {
        console.error('Erro ao listar equipamentos:', err);
        return res.status(500).json({ error: 'Erro interno ao listar equipamentos' });
    }
});

// ─── POST /api/caminhoes/:id/equipamentos ────────────────────────────────────
router.post('/', authenticate, async (req: Request, res: Response) => {
    try {
        const { id: caminhao_id } = req.params;
        const {
            nome, tipo, modelo, fabricante,
            numero_serie, numero_patrimonio,
            data_aquisicao, data_ultima_manutencao, data_proxima_manutencao,
            valor_aquisicao, status, observacoes,
        } = req.body;

        if (!nome || !nome.trim()) {
            return res.status(400).json({ error: 'O nome do equipamento é obrigatório' });
        }

        // Verifica se o caminhão existe
        const caminhao = await Caminhao.findByPk(caminhao_id);
        if (!caminhao) {
            return res.status(404).json({ error: 'Caminhão não encontrado' });
        }

        const equipamento = await EquipamentoCaminhao.create({
            caminhao_id,
            nome: nome.trim(),
            tipo: tipo || 'outro',
            modelo: modelo?.trim() || null,
            fabricante: fabricante?.trim() || null,
            numero_serie: numero_serie?.trim() || null,
            numero_patrimonio: numero_patrimonio?.trim() || null,
            data_aquisicao: data_aquisicao || null,
            data_ultima_manutencao: data_ultima_manutencao || null,
            data_proxima_manutencao: data_proxima_manutencao || null,
            valor_aquisicao: valor_aquisicao != null ? Number(valor_aquisicao) : null,
            status: status || 'ativo',
            observacoes: observacoes?.trim() || null,
        });

        return res.status(201).json(equipamento);
    } catch (err) {
        console.error('Erro ao criar equipamento:', err);
        return res.status(500).json({ error: 'Erro interno ao criar equipamento' });
    }
});

// ─── PUT /api/caminhoes/:id/equipamentos/:eqId ───────────────────────────────
router.put('/:eqId', authenticate, async (req: Request, res: Response) => {
    try {
        const { id: caminhao_id, eqId } = req.params;
        const {
            nome, tipo, modelo, fabricante,
            numero_serie, numero_patrimonio,
            data_aquisicao, data_ultima_manutencao, data_proxima_manutencao,
            valor_aquisicao, status, observacoes,
        } = req.body;

        const equipamento = await EquipamentoCaminhao.findOne({
            where: { id: eqId, caminhao_id },
        });

        if (!equipamento) {
            return res.status(404).json({ error: 'Equipamento não encontrado' });
        }

        await equipamento.update({
            nome: nome?.trim() ?? equipamento.nome,
            tipo: tipo ?? equipamento.tipo,
            modelo: modelo?.trim() ?? equipamento.modelo,
            fabricante: fabricante?.trim() ?? equipamento.fabricante,
            numero_serie: numero_serie?.trim() ?? equipamento.numero_serie,
            numero_patrimonio: numero_patrimonio?.trim() ?? equipamento.numero_patrimonio,
            data_aquisicao: data_aquisicao ?? equipamento.data_aquisicao,
            data_ultima_manutencao: data_ultima_manutencao ?? equipamento.data_ultima_manutencao,
            data_proxima_manutencao: data_proxima_manutencao ?? equipamento.data_proxima_manutencao,
            valor_aquisicao: valor_aquisicao != null ? Number(valor_aquisicao) : equipamento.valor_aquisicao,
            status: status ?? equipamento.status,
            observacoes: observacoes?.trim() ?? equipamento.observacoes,
        });

        return res.json(equipamento);
    } catch (err) {
        console.error('Erro ao atualizar equipamento:', err);
        return res.status(500).json({ error: 'Erro interno ao atualizar equipamento' });
    }
});

// ─── DELETE /api/caminhoes/:id/equipamentos/:eqId ────────────────────────────
router.delete('/:eqId', authenticate, async (req: Request, res: Response) => {
    try {
        const { id: caminhao_id, eqId } = req.params;

        const equipamento = await EquipamentoCaminhao.findOne({
            where: { id: eqId, caminhao_id },
        });

        if (!equipamento) {
            return res.status(404).json({ error: 'Equipamento não encontrado' });
        }

        await equipamento.destroy();
        return res.json({ message: 'Equipamento removido com sucesso' });
    } catch (err) {
        console.error('Erro ao remover equipamento:', err);
        return res.status(500).json({ error: 'Erro interno ao remover equipamento' });
    }
});

export default router;
