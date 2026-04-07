import { Router, Response } from 'express';
import { ConfiguracaoFilaAcao } from '../models/ConfiguracaoFilaAcao';
import { authenticate, authorizeAdminOrEstrada } from '../middlewares/auth';

const router = Router();

// ── GET /api/configuracao-fila/:acao_id ──────────────────────────────────────
router.get('/:acao_id', authenticate, async (req: any, res: Response) => {
    try {
        let config = await ConfiguracaoFilaAcao.findOne({ where: { acao_id: req.params.acao_id } });

        // Se não existir, retornar configuração padrão sem salvar
        if (!config) {
            res.json({
                acao_id: req.params.acao_id,
                usar_ficha_digital: true,
                permitir_impressao: true,
                usar_painel_tv: true,
                notif_email: true,
                notif_sms: false,
                notif_whatsapp: false,
                notif_ao_gerar_ficha: true,
                notif_chegando: true,
                notif_quantidade_aviso: 5,
                notif_chamado: true,
                notif_retorno_estacao: true,
                sms_provider: 'brevo',
                whatsapp_provider: 'zapi',
                _default: true,
            });
            return;
        }

        res.json(config);
    } catch (err) {
        console.error('Erro ao buscar configuração da fila:', err);
        res.status(500).json({ error: 'Erro ao buscar configuração' });
    }
});

// ── PUT /api/configuracao-fila/:acao_id ──────────────────────────────────────
router.put('/:acao_id', authenticate, authorizeAdminOrEstrada, async (req: any, res: Response) => {
    try {
        const { acao_id } = req.params;
        const dados = req.body;

        const [config, created] = await ConfiguracaoFilaAcao.upsert({
            acao_id,
            ...dados,
        });

        res.json({ config, created });
    } catch (err) {
        console.error('Erro ao salvar configuração da fila:', err);
        res.status(500).json({ error: 'Erro ao salvar configuração' });
    }
});

export default router;
