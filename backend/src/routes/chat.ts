import { Router, Request, Response } from 'express';
import { authenticate } from '../middlewares/auth';
import { sequelize } from '../config/database';
import { QueryTypes } from 'sequelize';

const router = Router();

// GET /api/chat/unread/cidadao — Conta total de mensagens não lidas para o cidadão logado
router.get('/unread/cidadao', authenticate, async (req: any, res: Response) => {
    try {
        const cidadao_id = req.user.id;
        const [result] = await sequelize.query(
            `SELECT COUNT(*)::int as total FROM chat_mensagens 
             WHERE cidadao_id = :cidadao_id AND de = 'medico' AND lida = FALSE`,
            { replacements: { cidadao_id }, type: QueryTypes.SELECT }
        );
        res.json({ unread: (result as any)?.total || 0 });
    } catch (error) {
        console.error('Erro ao contar unread chat:', error);
        res.json({ unread: 0 });
    }
});

// GET /api/chat/:acao_id/:cidadao_id — histórico das últimas 50 mensagens
router.get('/:acao_id/:cidadao_id', authenticate, async (req: Request, res: Response) => {
    try {
        const { acao_id, cidadao_id } = req.params;
        const mensagens = await sequelize.query(
            `SELECT cm.id, cm.de, cm.mensagem, cm.lida, cm.created_at, cm.funcionario_id,
                    f.nome AS profissional_nome, f.cargo AS profissional_cargo, f.especialidade AS profissional_especialidade
             FROM chat_mensagens cm
             LEFT JOIN funcionarios f ON f.id = cm.funcionario_id
             WHERE cm.acao_id = :acao_id AND cm.cidadao_id = :cidadao_id
             ORDER BY cm.created_at ASC
             LIMIT 50`,
            { replacements: { acao_id, cidadao_id }, type: QueryTypes.SELECT }
        );
        res.json(mensagens);
    } catch (error) {
        console.error('Erro ao buscar chat:', error);
        res.status(500).json({ error: 'Erro ao buscar mensagens' });
    }
});

// POST /api/chat/:acao_id/:cidadao_id — enviar mensagem (salva no banco + emite socket)
router.post('/:acao_id/:cidadao_id', authenticate, async (req: any, res: Response) => {
    try {
        const { acao_id, cidadao_id } = req.params;
        const { mensagem, de } = req.body;
        if (!mensagem?.trim() || !['cidadao', 'medico', 'sistema'].includes(de)) {
            res.status(400).json({ error: 'mensagem e de são obrigatórios' });
            return;
        }
        // funcionario_id vem do token JWT quando é médico/profissional
        const funcionarioId = de === 'medico' && req.user?.id ? req.user.id : null;
        const rows = await sequelize.query(
            `INSERT INTO chat_mensagens (acao_id, cidadao_id, de, mensagem, funcionario_id)
             VALUES (:acao_id, :cidadao_id, :de, :mensagem, :funcionarioId)
             RETURNING id, de, mensagem, lida, created_at, funcionario_id`,
            { replacements: { acao_id, cidadao_id, de, mensagem: mensagem.trim(), funcionarioId }, type: QueryTypes.SELECT }
        );
        const nova = (rows as any[])[0] || rows;
        // Emitir via Socket.IO para o chat room
        const io = (req.app as any).get('io');
        if (io) {
            io.to(`chat:${acao_id}:${cidadao_id}`).emit('chat_msg', { ...nova, acao_id, cidadao_id });
            if (de === 'medico') {
                io.to(`acao:${acao_id}`).emit('chat_nova_msg', { cidadao_id, acao_id });
            }
        }
        res.status(201).json(nova);
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        res.status(500).json({ error: 'Erro ao enviar mensagem' });
    }
});

// PATCH /api/chat/:acao_id/:cidadao_id/lido — marcar mensagens como lidas
router.patch('/:acao_id/:cidadao_id/lido', authenticate, async (req: Request, res: Response) => {
    try {
        const { acao_id, cidadao_id } = req.params;
        const { de } = req.body; // quem está lendo — marca as mensagens do outro lado como lidas
        const outroLado = de === 'medico' ? 'cidadao' : 'medico';
        await sequelize.query(
            `UPDATE chat_mensagens SET lida = TRUE
             WHERE acao_id = :acao_id AND cidadao_id = :cidadao_id
             AND de = :outroLado AND lida = FALSE`,
            { replacements: { acao_id, cidadao_id, outroLado } }
        );
        res.json({ ok: true });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao marcar como lido' });
    }
});

export default router;
