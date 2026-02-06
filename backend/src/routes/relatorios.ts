import { Router, Request, Response } from 'express';
import { authenticate } from '../middlewares/auth';
import { RelatoriosCustosService } from '../services/relatorios/custosAcao';

const router = Router();

/**
 * GET /api/relatorios/custos/:acaoId
 * Obter dados do relatório de custos
 */
router.get('/custos/:acaoId', authenticate, async (req: Request, res: Response) => {
    try {
        const { acaoId } = req.params;
        const dados = await RelatoriosCustosService.gerarDadosRelatorio(acaoId);
        res.json(dados);
    } catch (error: any) {
        console.error('Erro ao gerar relatório:', error);
        res.status(500).json({ error: error.message || 'Erro ao gerar relatório de custos' });
    }
});

/**
 * GET /api/relatorios/custos/:acaoId/pdf
 * Baixar relatório de custos em PDF
 */
router.get('/custos/:acaoId/pdf', authenticate, async (req: Request, res: Response) => {
    try {
        const { acaoId } = req.params;
        const pdf = await RelatoriosCustosService.gerarPDF(acaoId);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=relatorio-custos-${acaoId}.pdf`);
        res.send(pdf);
    } catch (error: any) {
        console.error('Erro ao gerar PDF:', error);
        res.status(500).json({ error: error.message || 'Erro ao gerar PDF' });
    }
});

/**
 * GET /api/relatorios/custos/:acaoId/csv
 * Baixar relatório de custos em CSV
 */
router.get('/custos/:acaoId/csv', authenticate, async (req: Request, res: Response) => {
    try {
        const { acaoId } = req.params;
        const csv = await RelatoriosCustosService.gerarCSV(acaoId);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=relatorio-custos-${acaoId}.csv`);
        res.send(csv);
    } catch (error: any) {
        console.error('Erro ao gerar CSV:', error);
        res.status(500).json({ error: error.message || 'Erro ao gerar CSV' });
    }
});

export default router;
