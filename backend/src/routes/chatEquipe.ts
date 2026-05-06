import { Router, Response } from 'express';
import { authenticate } from '../middlewares/auth';
import { sequelize } from '../config/database';
import { QueryTypes } from 'sequelize';

const router = Router();

// ─── GET /api/chat-equipe/profissionais ─── Lista profissionais disponíveis para chat
// Query: ?acao_id=X (filtrar por ação) ou sem filtro (global)
router.get('/profissionais', authenticate, async (req: any, res: Response) => {
    try {
        const { acao_id } = req.query;
        const meuId = req.user?.id;

        let profissionais;
        if (acao_id) {
            // Profissionais vinculados à ação específica + Admins globais
            profissionais = await sequelize.query(
                `SELECT f.id, f.nome, f.cargo, f.especialidade, f.is_medico, f.crm
                 FROM funcionarios f
                 JOIN acao_funcionarios af ON af.funcionario_id = f.id
                 WHERE af.acao_id = :acao_id AND f.ativo = TRUE AND f.id != :meuId
                 
                 UNION
                 
                 SELECT id, nome_completo AS nome, 'Administrador' AS cargo, NULL AS especialidade, false AS is_medico, NULL AS crm
                 FROM cidadaos
                 WHERE tipo = 'admin' AND id != :meuId
                 
                 ORDER BY cargo, nome`,
                { replacements: { acao_id, meuId }, type: QueryTypes.SELECT }
            );
        } else {
            // Todos os profissionais ativos (global) + Admins
            profissionais = await sequelize.query(
                `SELECT id, nome, cargo, especialidade, is_medico, crm
                 FROM funcionarios
                 WHERE ativo = TRUE AND id != :meuId
                 
                 UNION
                 
                 SELECT id, nome_completo AS nome, 'Administrador' AS cargo, NULL AS especialidade, false AS is_medico, NULL AS crm
                 FROM cidadaos
                 WHERE tipo = 'admin' AND id != :meuId
                 
                 ORDER BY cargo, nome`,
                { replacements: { meuId }, type: QueryTypes.SELECT }
            );
        }

        // Contar mensagens não lidas de cada profissional
        for (const prof of profissionais as any[]) {
            const [countRow] = await sequelize.query(
                `SELECT COUNT(*) as nao_lidas FROM chat_equipe
                 WHERE remetente_id = :profId AND destinatario_id = :meuId AND lida = FALSE`,
                { replacements: { profId: prof.id, meuId }, type: QueryTypes.SELECT }
            ) as any[];
            prof.nao_lidas = parseInt(countRow?.nao_lidas || '0');
        }

        res.json(profissionais);
    } catch (error) {
        console.error('Erro ao listar profissionais:', error);
        res.status(500).json({ error: 'Erro ao listar profissionais' });
    }
});

// ─── GET /api/chat-equipe/conversas ─── Conversas recentes do profissional logado
router.get('/conversas', authenticate, async (req: any, res: Response) => {
    try {
        const meuId = req.user?.id;

        const conversas = await sequelize.query(
            `SELECT DISTINCT ON (parceiro_id) parceiro_id, parceiro_nome, parceiro_cargo, parceiro_especialidade,
                    ultima_msg, ultima_data, nao_lidas, acao_id
             FROM (
                SELECT
                    CASE WHEN remetente_id = :meuId THEN destinatario_id ELSE remetente_id END AS parceiro_id,
                    COALESCE(f.nome, c.nome_completo) AS parceiro_nome,
                    COALESCE(f.cargo, 'Administrador') AS parceiro_cargo,
                    f.especialidade AS parceiro_especialidade,
                    ce.mensagem AS ultima_msg,
                    ce.created_at AS ultima_data,
                    ce.acao_id,
                    CASE WHEN ce.destinatario_id = :meuId AND ce.lida = FALSE THEN 1 ELSE 0 END AS nao_lidas
                FROM chat_equipe ce
                LEFT JOIN funcionarios f ON f.id = CASE WHEN ce.remetente_id = :meuId THEN ce.destinatario_id ELSE ce.remetente_id END
                LEFT JOIN cidadaos c ON c.id = CASE WHEN ce.remetente_id = :meuId THEN ce.destinatario_id ELSE ce.remetente_id END AND c.tipo = 'admin'
                WHERE ce.remetente_id = :meuId OR ce.destinatario_id = :meuId
                ORDER BY ce.created_at DESC
             ) sub
             ORDER BY parceiro_id, ultima_data DESC`,
            { replacements: { meuId }, type: QueryTypes.SELECT }
        );

        res.json(conversas);
    } catch (error) {
        console.error('Erro ao buscar conversas:', error);
        res.status(500).json({ error: 'Erro ao buscar conversas' });
    }
});

// ─── GET /api/chat-equipe/nao-lidas/count ─── Total de mensagens não lidas
router.get('/nao-lidas/count', authenticate, async (req: any, res: Response) => {
    try {
        const meuId = req.user?.id;
        const [row] = await sequelize.query(
            `SELECT COUNT(*) as total FROM chat_equipe WHERE destinatario_id = :meuId AND lida = FALSE`,
            { replacements: { meuId }, type: QueryTypes.SELECT }
        ) as any[];
        res.json({ total: parseInt(row?.total || '0') });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao contar mensagens' });
    }
});

// ─── GET /api/chat-equipe/:funcionarioId ─── Histórico de mensagens com um colega
router.get('/:funcionarioId', authenticate, async (req: any, res: Response) => {
    try {
        const meuId = req.user?.id;
        const { funcionarioId } = req.params;
        const { acao_id } = req.query;

        let whereAcao = '';
        const replacements: any = { meuId, funcionarioId };

        if (acao_id) {
            whereAcao = 'AND (acao_id = :acao_id OR acao_id IS NULL)';
            replacements.acao_id = acao_id;
        }

        const mensagens = await sequelize.query(
            `SELECT id, remetente_id, destinatario_id, mensagem, lida, acao_id, created_at
             FROM chat_equipe
             WHERE ((remetente_id = :meuId AND destinatario_id = :funcionarioId)
                OR (remetente_id = :funcionarioId AND destinatario_id = :meuId))
             ${whereAcao}
             ORDER BY created_at ASC
             LIMIT 100`,
            { replacements, type: QueryTypes.SELECT }
        );

        // Marcar como lidas as mensagens recebidas
        await sequelize.query(
            `UPDATE chat_equipe SET lida = TRUE
             WHERE remetente_id = :funcionarioId AND destinatario_id = :meuId AND lida = FALSE ${whereAcao}`,
            { replacements }
        );

        res.json(mensagens);
    } catch (error) {
        console.error('Erro ao buscar chat equipe:', error);
        res.status(500).json({ error: 'Erro ao buscar mensagens' });
    }
});

// ─── POST /api/chat-equipe/:funcionarioId ─── Enviar mensagem para colega
router.post('/:funcionarioId', authenticate, async (req: any, res: Response) => {
    try {
        const meuId = req.user?.id;
        const { funcionarioId } = req.params;
        const { mensagem, acao_id } = req.body;

        if (!mensagem?.trim()) {
            res.status(400).json({ error: 'mensagem é obrigatória' });
            return;
        }

        let finalAcaoId = acao_id;
        if (!finalAcaoId || finalAcaoId === 'null' || finalAcaoId === 'undefined' || finalAcaoId === '') {
            finalAcaoId = null;
        }

        const rows = await sequelize.query(
            `INSERT INTO chat_equipe (remetente_id, destinatario_id, acao_id, mensagem)
             VALUES (:meuId::UUID, :funcionarioId::UUID, CAST(:acao_id AS UUID), :mensagem)
             RETURNING id, remetente_id, destinatario_id, mensagem, lida, acao_id, created_at`,
            {
                replacements: { meuId, funcionarioId, acao_id: finalAcaoId, mensagem: mensagem.trim() },
                type: QueryTypes.SELECT,
            }
        );
        const nova = (rows as any[])[0] || rows;

        // Socket.IO: emitir para o destinatário
        const io = (req.app as any).get('io');
        if (io) {
            const roomKey = [meuId, funcionarioId].sort().join(':');
            io.to(`equipe:${roomKey}`).emit('chat_equipe_msg', nova);
            // Avisar globalmente que tem mensagem nova (para atualizar badge)
            io.emit('chat_equipe_nova', { de: meuId, para: funcionarioId });
        }

        res.status(201).json(nova);
    } catch (error) {
        console.error('Erro ao enviar mensagem equipe:', error);
        res.status(500).json({ error: 'Erro ao enviar mensagem' });
    }
});

export default router;
