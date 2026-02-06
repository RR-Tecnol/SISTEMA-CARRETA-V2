import { Router, Request, Response } from 'express';
import { authenticate } from '../middlewares/auth';
import { ResultadoExame } from '../models/ResultadoExame';
import { Exame } from '../models/Exame';
import { Acao } from '../models/Acao';
import { Op } from 'sequelize';

const router = Router();

/**
 * GET /api/cidadaos/:cidadaoId/exames
 * Listar exames realizados por um cidadão
 */
router.get('/:cidadaoId/exames', authenticate, async (req: Request, res: Response) => {
    try {
        const { cidadaoId } = req.params;
        const { tipo_exame, data_inicio, data_fim, page = 1, limit = 20 } = req.query;

        const where: any = { cidadao_id: cidadaoId };

        if (data_inicio && data_fim) {
            where.data_realizacao = {
                [Op.between]: [new Date(data_inicio as string), new Date(data_fim as string)]
            };
        }

        const include: any[] = [
            {
                model: Exame,
                as: 'exame',
                where: tipo_exame ? { tipo: tipo_exame } : undefined,
            },
            {
                model: Acao,
                as: 'acao',
                attributes: ['id', 'numero_acao', 'municipio', 'estado', 'data_inicio', 'data_fim'],
            }
        ];

        const offset = (Number(page) - 1) * Number(limit);

        const { rows: exames, count } = await ResultadoExame.findAndCountAll({
            where,
            include,
            limit: Number(limit),
            offset,
            order: [['data_realizacao', 'DESC']],
        });

        res.json({
            exames,
            total: count,
            page: Number(page),
            totalPages: Math.ceil(count / Number(limit)),
        });
    } catch (error: any) {
        console.error('Erro ao buscar exames do cidadão:', error);
        res.status(500).json({ error: 'Erro ao buscar exames' });
    }
});

/**
 * GET /api/cidadaos/:cidadaoId/exames/:exameId
 * Buscar resultado específico de exame
 */
router.get('/:cidadaoId/exames/:exameId', authenticate, async (req: Request, res: Response) => {
    try {
        const { cidadaoId, exameId } = req.params;

        const resultado = await ResultadoExame.findOne({
            where: {
                id: exameId,
                cidadao_id: cidadaoId,
            },
            include: [
                {
                    model: Exame,
                    as: 'exame',
                },
                {
                    model: Acao,
                    as: 'acao',
                }
            ],
        });

        if (!resultado) {
            res.status(404).json({ error: 'Exame não encontrado' });
            return;
        }

        res.json(resultado);
    } catch (error: any) {
        console.error('Erro ao buscar exame:', error);
        res.status(500).json({ error: 'Erro ao buscar exame' });
    }
});

export default router;
