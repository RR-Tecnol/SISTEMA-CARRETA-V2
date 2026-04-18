import { Router, Request, Response } from 'express';
import { authenticate, authorizeAdmin } from '../middlewares/auth';
import { sequelize } from '../config/database';
import { QueryTypes } from 'sequelize';

const router = Router();

// GET /api/auditoria — listar logs com filtros (admin only)
router.get('/', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
    try {
        const {
            usuario_tipo, acao, data_inicio, data_fim,
            page = '1', limit = '50'
        } = req.query as any;

        const conditions: string[] = [];
        const replacements: any = {};

        if (usuario_tipo) {
            conditions.push('usuario_tipo = :usuario_tipo');
            replacements.usuario_tipo = usuario_tipo;
        }
        if (acao) {
            conditions.push('acao ILIKE :acao');
            replacements.acao = `%${acao}%`;
        }
        if (data_inicio) {
            conditions.push('created_at >= :data_inicio');
            replacements.data_inicio = new Date(data_inicio);
        }
        if (data_fim) {
            const fim = new Date(data_fim);
            fim.setHours(23, 59, 59, 999);
            conditions.push('created_at <= :data_fim');
            replacements.data_fim = fim;
        }

        const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const offset = (Number(page) - 1) * Number(limit);

        const [logs, countResult] = await Promise.all([
            sequelize.query(
                `SELECT id, usuario_id, usuario_tipo, usuario_nome, acao,
                        tabela_afetada, registro_id, descricao, ip_address, created_at
                 FROM logs_auditoria ${where}
                 ORDER BY created_at DESC
                 LIMIT :limit OFFSET :offset`,
                { replacements: { ...replacements, limit: Number(limit), offset }, type: QueryTypes.SELECT }
            ),
            sequelize.query(
                `SELECT COUNT(*) as total FROM logs_auditoria ${where}`,
                { replacements, type: QueryTypes.SELECT }
            ),
        ]);

        const total = parseInt((countResult[0] as any).total, 10);

        res.json({
            logs,
            total,
            page: Number(page),
            totalPages: Math.ceil(total / Number(limit)),
        });
    } catch (error) {
        console.error('Erro ao buscar auditoria:', error);
        res.status(500).json({ error: 'Erro ao buscar logs' });
    }
});

export default router;
