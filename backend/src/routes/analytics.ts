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

        const baseSql = `
            SELECT 
                e.tipo as tipo_exame,
                e.nome as nome_exame,
                COUNT(re.id) as quantidade
            FROM resultados_exames re
            INNER JOIN exames e ON re.exame_id = e.id
            ${data_inicio && data_fim ? 'WHERE re.data_realizacao BETWEEN :dataInicio AND :dataFim' : ''}
            GROUP BY e.tipo, e.nome
            ORDER BY quantidade DESC
        `;
        const resultados = await sequelize.query(baseSql, {
            type: 'SELECT',
            replacements: data_inicio && data_fim ? { dataInicio: data_inicio, dataFim: data_fim } : {},
        });

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

        const baseSql = `
            SELECT 
                a.municipio,
                a.estado,
                COUNT(re.id) as quantidade
            FROM resultados_exames re
            INNER JOIN acoes a ON re.acao_id = a.id
            ${data_inicio && data_fim ? 'WHERE re.data_realizacao BETWEEN :dataInicio AND :dataFim' : ''}
            GROUP BY a.municipio, a.estado
            ORDER BY quantidade DESC
        `;
        const resultados = await sequelize.query(baseSql, {
            type: 'SELECT',
            replacements: data_inicio && data_fim ? { dataInicio: data_inicio, dataFim: data_fim } : {},
        });

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

        // B2 — COALESCE garante que genero NULL seja agrupado como 'nao_declarado'
        const baseSql = `
            SELECT 
                COALESCE(c.genero, 'nao_declarado') as genero,
                COUNT(re.id) as quantidade
            FROM resultados_exames re
            INNER JOIN cidadaos c ON re.cidadao_id = c.id
            ${data_inicio && data_fim ? 'WHERE re.data_realizacao BETWEEN :dataInicio AND :dataFim' : ''}
            GROUP BY COALESCE(c.genero, 'nao_declarado')
            ORDER BY quantidade DESC
        `;
        const resultados = await sequelize.query(baseSql, {
            type: 'SELECT',
            replacements: data_inicio && data_fim ? { dataInicio: data_inicio, dataFim: data_fim } : {},
        });

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

        const baseSql = `
            SELECT 
                c.raca,
                COUNT(re.id) as quantidade
            FROM resultados_exames re
            INNER JOIN cidadaos c ON re.cidadao_id = c.id
            ${data_inicio && data_fim ? 'WHERE re.data_realizacao BETWEEN :dataInicio AND :dataFim' : ''}
            GROUP BY c.raca
            ORDER BY quantidade DESC
        `;
        const resultados = await sequelize.query(baseSql, {
            type: 'SELECT',
            replacements: data_inicio && data_fim ? { dataInicio: data_inicio, dataFim: data_fim } : {},
        });

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

        const baseSql = `
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
            ${data_inicio && data_fim ? 'WHERE re.data_realizacao BETWEEN :dataInicio AND :dataFim' : ''}
            GROUP BY faixa_etaria
            ORDER BY faixa_etaria
        `;
        const resultados = await sequelize.query(baseSql, {
            type: 'SELECT',
            replacements: data_inicio && data_fim ? { dataInicio: data_inicio, dataFim: data_fim } : {},
        });

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
            WHERE re.data_realizacao BETWEEN :dataInicio AND :dataFim
        `, { type: 'SELECT', replacements: { dataInicio: dataInicio.toISOString(), dataFim: dataFim.toISOString() } });

        // L2-46: Comparativo Financeiro SUS vs Custo Real
        const sqlEconomia = `
            SELECT SUM(ce.valor_unitario) as total_sus
            FROM inscricoes i
            INNER JOIN cursos_exames ce ON i.curso_exame_id = ce.id
            WHERE i.status = 'atendido'
              AND i.created_at BETWEEN :dataInicio AND :dataFim
        `;
        const resultEconomia = await sequelize.query(sqlEconomia, { type: 'SELECT', replacements: { dataInicio: dataInicio.toISOString(), dataFim: dataFim.toISOString() } });
        const totalSusEstimado = Number((resultEconomia as any)[0]?.total_sus || 0);

        const sqlCusto = `
            SELECT SUM(a.custo_total) as total_custo
            FROM acoes a
            WHERE a.data_inicio BETWEEN :dataInicio AND :dataFim
        `;
        const resultCusto = await sequelize.query(sqlCusto, { type: 'SELECT', replacements: { dataInicio: dataInicio.toISOString(), dataFim: dataFim.toISOString() } });
        const totalCustoReal = Number((resultCusto as any)[0]?.total_custo || 0);

        res.json({
            totalExames,
            examesMes,
            cidadesAtendidas: (cidadesAtendidas as any)[0]?.total || 0,
            economiaEstimada: totalSusEstimado - totalCustoReal,
            totalSusEstimado,
            totalCustoReal,
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

/**
 * GET /api/analytics/custo-por-pessoa
 * B5 — Custo médio por pessoa atendida por ação
 */
router.get('/custo-por-pessoa', authenticate, async (req: Request, res: Response) => {
    try {
        const { mes, ano } = req.query;

        const dataInicio = mes && ano
            ? new Date(Number(ano), Number(mes) - 1, 1)
            : new Date(new Date().getFullYear(), 0, 1);

        const dataFim = mes && ano
            ? new Date(Number(ano), Number(mes), 0, 23, 59, 59)
            : new Date();

        // Custo médio por pessoa: total de gastos da ação / número de inscritos atendidos
        const sql = `
            SELECT
                a.id,
                a.nome as nome_acao,
                a.numero_acao,
                a.municipio,
                a.custo_total,
                COUNT(DISTINCT i.cidadao_id) FILTER (WHERE i.status = 'atendido') as total_atendidos,
                CASE
                    WHEN COUNT(DISTINCT i.cidadao_id) FILTER (WHERE i.status = 'atendido') > 0
                    THEN ROUND(a.custo_total / COUNT(DISTINCT i.cidadao_id) FILTER (WHERE i.status = 'atendido'), 2)
                    ELSE 0
                END as custo_por_pessoa
            FROM acoes a
            LEFT JOIN inscricoes i ON i.acao_id = a.id
            WHERE a.data_inicio BETWEEN :dataInicio AND :dataFim
              AND a.custo_total IS NOT NULL
              AND a.custo_total > 0
            GROUP BY a.id, a.nome, a.numero_acao, a.municipio, a.custo_total
            ORDER BY custo_por_pessoa DESC
            LIMIT 20
        `;

        const resultados = await sequelize.query(sql, {
            type: 'SELECT',
            replacements: { dataInicio: dataInicio.toISOString(), dataFim: dataFim.toISOString() },
        });

        // Média geral
        const mediaGeral = (resultados as any[]).reduce((acc, r) => acc + Number(r.custo_por_pessoa || 0), 0)
            / (resultados.length || 1);

        res.json({
            acoes: resultados,
            media_geral: Math.round(mediaGeral * 100) / 100,
            total_acoes: resultados.length,
        });
    } catch (error: any) {
        console.error('Erro ao calcular custo por pessoa:', error);
        res.status(500).json({ error: 'Erro ao calcular custo por pessoa' });
    }
});

export default router;
