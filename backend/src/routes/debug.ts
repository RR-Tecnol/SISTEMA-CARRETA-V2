import { Router, Request, Response } from 'express';
import { authenticate, authorizeAdmin } from '../middlewares/auth';
import { sequelize } from '../config/database';
import { ResultadoExame } from '../models/ResultadoExame';
import { Exame } from '../models/Exame';
import { Acao } from '../models/Acao';
import { Cidadao } from '../models/Cidadao';

const router = Router();

/**
 * GET /api/debug/check-data
 * Endpoint temporário para verificar dados no banco
 */
router.get('/check-data', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
    try {
        const queries = [
            { name: 'Exames', query: 'SELECT COUNT(*) as total FROM exames' },
            { name: 'Ações', query: 'SELECT COUNT(*) as total FROM acoes' },
            { name: 'Cidadãos', query: 'SELECT COUNT(*) as total FROM cidadaos' },
            { name: 'Resultados de Exames', query: 'SELECT COUNT(*) as total FROM resultados_exames' },
            { name: 'Inscrições', query: 'SELECT COUNT(*) as total FROM inscricoes' },
        ];

        const counts: any = {};
        for (const { name, query } of queries) {
            const [results] = await sequelize.query(query);
            counts[name] = (results as any)[0].total;
        }

        // Amostra de resultados_exames
        const sampleResultados = await ResultadoExame.findAll({
            limit: 3,
            include: [
                { model: Exame, as: 'exame' },
                { model: Acao, as: 'acao' },
                { model: Cidadao, as: 'cidadao' },
            ]
        });

        res.json({
            counts,
            sampleResultados,
            message: 'Dados verificados com sucesso'
        });
    } catch (error: any) {
        console.error('Erro ao verificar dados:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
