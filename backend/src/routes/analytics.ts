import { Router, Request, Response } from 'express';
import { authenticate } from '../middlewares/auth';
import { ResultadoExame } from '../models/ResultadoExame';
import { Exame } from '../models/Exame';
import { Cidadao } from '../models/Cidadao';
import { Acao } from '../models/Acao';
import { Op } from 'sequelize';
import { sequelize } from '../config/database';

const router = Router();

/**
 * GET /api/analytics/exames-realizados
 * Quantidade de exames realizados com filtros
 */
router.get('/exames-realizados', authenticate, async (req: Request, res: Response) => {
    try {
        const { data_inicio, data_fim, cidade, tipo_exame } = req.query;

        const where: any = {};

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
                where: cidade ? { municipio: cidade } : undefined,
            }
        ];

        const exames = await ResultadoExame.findAll({ where, include });

        res.json({
            total: exames.length,
            exames,
        });
    } catch (error: any) {
        console.error('Erro ao buscar exames:', error);
        res.status(500).json({ error: 'Erro ao buscar exames realizados' });
    }
});

/**
 * GET /api/analytics/exames-por-tipo
 * Distribuição de exames por tipo
 */
router.get('/exames-por-tipo', authenticate, async (req: Request, res: Response) => {
    try {
        const { data_inicio, data_fim } = req.query;

        const where: any = {};
        if (data_inicio && data_fim) {
            where.data_realizacao = {
                [Op.between]: [new Date(data_inicio as string), new Date(data_fim as string)]
            };
        }

        const resultados = await sequelize.query(`
            SELECT 
                e.tipo as tipo_exame,
                e.nome as nome_exame,
                COUNT(re.id) as quantidade
            FROM resultados_exames re
            INNER JOIN exames e ON re.exame_id = e.id
            ${data_inicio && data_fim ? `WHERE re.data_realizacao BETWEEN '${data_inicio}' AND '${data_fim}'` : ''}
            GROUP BY e.tipo, e.nome
            ORDER BY quantidade DESC
        `, { type: 'SELECT' });

        res.json(resultados);
    } catch (error: any) {
        console.error('Erro ao buscar distribuição:', error);
        res.status(500).json({ error: 'Erro ao buscar distribuição de exames' });
    }
});

/**
 * GET /api/analytics/exames-por-cidade
 * Exames por cidade/município
 */
router.get('/exames-por-cidade', authenticate, async (req: Request, res: Response) => {
    try {
        const { data_inicio, data_fim } = req.query;

        const resultados = await sequelize.query(`
            SELECT 
                a.municipio,
                a.estado,
                COUNT(re.id) as quantidade
            FROM resultados_exames re
            INNER JOIN acoes a ON re.acao_id = a.id
            ${data_inicio && data_fim ? `WHERE re.data_realizacao BETWEEN '${data_inicio}' AND '${data_fim}'` : ''}
            GROUP BY a.municipio, a.estado
            ORDER BY quantidade DESC
        `, { type: 'SELECT' });

        res.json(resultados);
    } catch (error: any) {
        console.error('Erro ao buscar por cidade:', error);
        res.status(500).json({ error: 'Erro ao buscar exames por cidade' });
    }
});

/**
 * GET /api/analytics/exames-por-genero
 * Distribuição por gênero
 */
router.get('/exames-por-genero', authenticate, async (req: Request, res: Response) => {
    try {
        const { data_inicio, data_fim } = req.query;

        const resultados = await sequelize.query(`
            SELECT 
                c.genero,
                COUNT(re.id) as quantidade
            FROM resultados_exames re
            INNER JOIN cidadaos c ON re.cidadao_id = c.id
            ${data_inicio && data_fim ? `WHERE re.data_realizacao BETWEEN '${data_inicio}' AND '${data_fim}'` : ''}
            GROUP BY c.genero
            ORDER BY quantidade DESC
        `, { type: 'SELECT' });

        res.json(resultados);
    } catch (error: any) {
        console.error('Erro ao buscar por gênero:', error);
        res.status(500).json({ error: 'Erro ao buscar exames por gênero' });
    }
});

/**
 * GET /api/analytics/exames-por-raca
 * Distribuição por raça
 */
router.get('/exames-por-raca', authenticate, async (req: Request, res: Response) => {
    try {
        const { data_inicio, data_fim } = req.query;

        const resultados = await sequelize.query(`
            SELECT 
                c.raca,
                COUNT(re.id) as quantidade
            FROM resultados_exames re
            INNER JOIN cidadaos c ON re.cidadao_id = c.id
            ${data_inicio && data_fim ? `WHERE re.data_realizacao BETWEEN '${data_inicio}' AND '${data_fim}'` : ''}
            GROUP BY c.raca
            ORDER BY quantidade DESC
        `, { type: 'SELECT' });

        res.json(resultados);
    } catch (error: any) {
        console.error('Erro ao buscar por raça:', error);
        res.status(500).json({ error: 'Erro ao buscar exames por raça' });
    }
});

/**
 * GET /api/analytics/exames-por-idade
 * Distribuição por faixa etária
 */
router.get('/exames-por-idade', authenticate, async (req: Request, res: Response) => {
    try {
        const { data_inicio, data_fim } = req.query;

        const resultados = await sequelize.query(`
            SELECT 
                CASE 
                    WHEN EXTRACT(YEAR FROM AGE(c.data_nascimento)) < 18 THEN '0-17'
                    WHEN EXTRACT(YEAR FROM AGE(c.data_nascimento)) BETWEEN 18 AND 29 THEN '18-29'
                    WHEN EXTRACT(YEAR FROM AGE(c.data_nascimento)) BETWEEN 30 AND 39 THEN '30-39'
                    WHEN EXTRACT(YEAR FROM AGE(c.data_nascimento)) BETWEEN 40 AND 49 THEN '40-49'
                    WHEN EXTRACT(YEAR FROM AGE(c.data_nascimento)) BETWEEN 50 AND 59 THEN '50-59'
                    ELSE '60+'
                END as faixa_etaria,
                COUNT(re.id) as quantidade
            FROM resultados_exames re
            INNER JOIN cidadaos c ON re.cidadao_id = c.id
            ${data_inicio && data_fim ? `WHERE re.data_realizacao BETWEEN '${data_inicio}' AND '${data_fim}'` : ''}
            GROUP BY faixa_etaria
            ORDER BY faixa_etaria
        `, { type: 'SELECT' });

        res.json(resultados);
    } catch (error: any) {
        console.error('Erro ao buscar por idade:', error);
        res.status(500).json({ error: 'Erro ao buscar exames por idade' });
    }
});

/**
 * GET /api/analytics/dashboard
 * Métricas gerais para dashboard
 */
router.get('/dashboard', authenticate, async (req: Request, res: Response) => {
    try {
        const { mes, ano } = req.query;

        const dataInicio = mes && ano
            ? new Date(Number(ano), Number(mes) - 1, 1)
            : new Date(new Date().getFullYear(), new Date().getMonth(), 1);

        const dataFim = mes && ano
            ? new Date(Number(ano), Number(mes), 0, 23, 59, 59)
            : new Date();

        // Total de exames
        const totalExames = await ResultadoExame.count({
            where: {
                data_realizacao: {
                    [Op.between]: [dataInicio, dataFim]
                }
            }
        });

        // Exames este mês
        const examesMes = await ResultadoExame.count({
            where: {
                data_realizacao: {
                    [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                }
            }
        });

        // Cidades atendidas
        const cidadesAtendidas = await sequelize.query(`
            SELECT COUNT(DISTINCT a.municipio) as total
            FROM resultados_exames re
            INNER JOIN acoes a ON re.acao_id = a.id
            WHERE re.data_realizacao BETWEEN '${dataInicio.toISOString()}' AND '${dataFim.toISOString()}'
        `, { type: 'SELECT' });

        res.json({
            totalExames,
            examesMes,
            cidadesAtendidas: (cidadesAtendidas as any)[0]?.total || 0,
            periodo: {
                inicio: dataInicio,
                fim: dataFim,
            }
        });
    } catch (error: any) {
        console.error('Erro ao buscar dashboard:', error);
        res.status(500).json({ error: 'Erro ao buscar métricas do dashboard' });
    }
});

export default router;
