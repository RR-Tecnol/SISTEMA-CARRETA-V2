import { Router, Response } from 'express';
import { Op } from 'sequelize';
import { EstacaoExame } from '../models/EstacaoExame';
import { FichaAtendimento } from '../models/FichaAtendimento';
import { ConfiguracaoFilaAcao } from '../models/ConfiguracaoFilaAcao';
import { Cidadao } from '../models/Cidadao';
import { Inscricao } from '../models/Inscricao';
import { CursoExame } from '../models/CursoExame';
import { authenticate, authorizeAdminOrEstrada } from '../middlewares/auth';
import { notificarRetornoEstacao } from '../utils/notificacoes';

const router = Router();

// ── GET /api/estacoes/acao/:acao_id ──────────────────────────────────────────
router.get('/acao/:acao_id', authenticate, async (req: any, res: Response) => {
    try {
        const estacoes = await EstacaoExame.findAll({
            where: { acao_id: req.params.acao_id },
            include: [{ model: CursoExame, as: 'curso_exame', attributes: ['id', 'nome', 'tipo'], required: false }],
            order: [['created_at', 'ASC']],
        });
        res.json(estacoes);
    } catch (err) {
        console.error('Erro ao buscar estações:', err);
        res.status(500).json({ error: 'Erro ao buscar estações' });
    }
});

// ── POST /api/estacoes ───────────────────────────────────────────────────────
router.post('/', authenticate, authorizeAdminOrEstrada, async (req: any, res: Response) => {
    try {
        const { acao_id, curso_exame_id, nome } = req.body;
        if (!acao_id || !nome) {
            res.status(400).json({ error: 'acao_id e nome são obrigatórios' });
            return;
        }
        const estacao = await EstacaoExame.create({ acao_id, curso_exame_id: curso_exame_id || null, nome });
        res.status(201).json(estacao);
    } catch (err) {
        console.error('Erro ao criar estação:', err);
        res.status(500).json({ error: 'Erro ao criar estação' });
    }
});

// ── PUT /api/estacoes/:id/status ─────────────────────────────────────────────
router.put('/:id/status', authenticate, authorizeAdminOrEstrada, async (req: any, res: Response) => {
    try {
        const { status, motivo_pausa } = req.body;
        if (!['ativa', 'pausada', 'manutencao'].includes(status)) {
            res.status(400).json({ error: 'Status inválido. Use: ativa | pausada | manutencao' });
            return;
        }

        const estacao = await EstacaoExame.findByPk(req.params.id, {
            include: [{ model: CursoExame, as: 'curso_exame', attributes: ['id', 'nome'], required: false }],
        });
        if (!estacao) { res.status(404).json({ error: 'Estação não encontrada' }); return; }

        const eraAtiva = estacao.status === 'ativa';
        const voltandoAtiva = status === 'ativa' && estacao.status !== 'ativa';

        await estacao.update({
            status,
            motivo_pausa: status !== 'ativa' ? (motivo_pausa || null) : null,
            pausada_em: status !== 'ativa' && eraAtiva ? new Date() : estacao.pausada_em,
            retomada_em: voltandoAtiva ? new Date() : estacao.retomada_em,
        });

        // Se voltou a ser ativa → notificar todos que aguardam nessa estação
        let notificados = 0;
        if (voltandoAtiva) {
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            const amanha = new Date(hoje);
            amanha.setDate(amanha.getDate() + 1);

            const fichasPendentes = await FichaAtendimento.findAll({
                where: {
                    estacao_id: estacao.id,
                    status: 'aguardando',
                    hora_entrada: { [Op.gte]: hoje, [Op.lt]: amanha },
                },
                include: [{
                    model: Cidadao, as: 'cidadao',
                    attributes: ['nome_completo', 'email', 'telefone'],
                }],
            });

            if (fichasPendentes.length > 0) {
                // Buscar configuração de notificações da ação
                const config = await ConfiguracaoFilaAcao.findOne({ where: { acao_id: estacao.acao_id } });
                const notifConfig = {
                    notif_email: config?.notif_email ?? true,
                    notif_sms: config?.notif_sms ?? false,
                    notif_whatsapp: config?.notif_whatsapp ?? false,
                };

                if (config?.notif_retorno_estacao !== false) {
                    const nomeExame = (estacao as any).curso_exame?.nome || estacao.nome;
                    const lista = fichasPendentes.map((f: any) => ({
                        cidadao: f.cidadao,
                        numeroFicha: f.numero_ficha,
                    }));
                    notificados = await notificarRetornoEstacao(lista, estacao.nome, nomeExame, notifConfig);
                }
            }
        }

        res.json({
            estacao,
            notificados,
            mensagem: voltandoAtiva
                ? `Estação ativa. ${notificados} cidadão(s) notificado(s).`
                : `Estação marcada como ${status}.`,
        });
    } catch (err) {
        console.error('Erro ao atualizar status da estação:', err);
        res.status(500).json({ error: 'Erro ao atualizar estação' });
    }
});

// ── DELETE /api/estacoes/:id ─────────────────────────────────────────────────
router.delete('/:id', authenticate, authorizeAdminOrEstrada, async (req: any, res: Response) => {
    try {
        const estacao = await EstacaoExame.findByPk(req.params.id);
        if (!estacao) { res.status(404).json({ error: 'Estação não encontrada' }); return; }
        await estacao.destroy();
        res.json({ mensagem: 'Estação removida com sucesso' });
    } catch (err) {
        console.error('Erro ao deletar estação:', err);
        res.status(500).json({ error: 'Erro ao deletar estação' });
    }
});

export default router;
