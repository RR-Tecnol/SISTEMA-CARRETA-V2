import { Router, Request, Response } from 'express';
import { Inscricao } from '../models/Inscricao';
import { AcaoCursoExame } from '../models/AcaoCursoExame';
import { Cidadao } from '../models/Cidadao';
import { CursoExame } from '../models/CursoExame';
import { Acao } from '../models/Acao';
import { authenticate, authorizeAdminOrEstrada } from '../middlewares/auth';
import PDFDocument from 'pdfkit';

const router = Router();

/**
 * GET /api/acoes/:acaoId/export/inscritos?format=pdf|csv
 * Exportar lista de inscritos
 */
router.get('/acoes/:acaoId/export/inscritos', authenticate, authorizeAdminOrEstrada, async (req: Request, res: Response) => {
    try {
        const { acaoId } = req.params;
        const format = (req.query.format as string) || 'pdf';

        const acao = await Acao.findByPk(acaoId);
        if (!acao) {
            res.status(404).json({ error: 'Ação não encontrada' });
            return;
        }

        const inscricoes = await Inscricao.findAll({
            where: { acao_id: acaoId },
            include: [
                { model: CursoExame, as: 'curso_exame' },
                {
                    model: Cidadao,
                    as: 'cidadao',
                    attributes: ['id', 'nome_completo', 'cpf', 'telefone', 'email', 'data_nascimento'],
                },
            ],
            order: [['created_at', 'ASC']],
        });

        const formatCPF = (cpf: string): string => {
            const cleaned = cpf.replace(/\D/g, '');
            if (cleaned.length !== 11) return cpf;
            return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        };
        const formatPhone = (phone: string): string => {
            const cleaned = phone.replace(/\D/g, '');
            if (cleaned.length === 11) return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
            if (cleaned.length === 10) return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
            return phone;
        };

        const inscricoesDecrypted = inscricoes.map(inscricao => {
            const inscricaoJSON = inscricao.toJSON() as any;
            if (inscricaoJSON.cidadao) {
                if (inscricaoJSON.cidadao.cpf) inscricaoJSON.cidadao.cpf = formatCPF(inscricaoJSON.cidadao.cpf);
                if (inscricaoJSON.cidadao.telefone) inscricaoJSON.cidadao.telefone = formatPhone(inscricaoJSON.cidadao.telefone);
            }
            return inscricaoJSON;
        });

        if (format === 'csv') {
            await exportInscritosCSV(acao, inscricoesDecrypted, res);
        } else {
            const inscricoesFiltradas = inscricoesDecrypted.filter((insc: any) => insc.status !== 'faltou');
            await exportInscritosPDF(acao, inscricoesFiltradas, res);
        }
    } catch (error) {
        console.error('Error exporting inscritos:', error);
        res.status(500).json({ error: 'Erro ao exportar inscritos' });
    }
});

/**
 * GET /api/acoes/:acaoId/export/atendidos?format=pdf|csv
 * Exportar lista de atendidos
 */
router.get('/acoes/:acaoId/export/atendidos', authenticate, authorizeAdminOrEstrada, async (req: Request, res: Response) => {
    try {
        const { acaoId } = req.params;
        const format = (req.query.format as string) || 'pdf';

        const acao = await Acao.findByPk(acaoId);
        if (!acao) {
            res.status(404).json({ error: 'Ação não encontrada' });
            return;
        }

        const inscricoes = await Inscricao.findAll({
            where: { acao_id: acaoId, status: 'atendido' },
            include: [
                { model: CursoExame, as: 'curso_exame' },
                {
                    model: Cidadao,
                    as: 'cidadao',
                    attributes: ['id', 'nome_completo', 'cpf', 'telefone', 'email'],
                },
            ],
            order: [['updated_at', 'ASC']],
        });

        if (format === 'csv') {
            await exportAtendidosCSV(acao, inscricoes, res);
        } else {
            await exportAtendidosPDF(acao, inscricoes, res);
        }
    } catch (error) {
        console.error('Error exporting atendidos:', error);
        res.status(500).json({ error: 'Erro ao exportar atendidos' });
    }
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtDate = (date: any): string => {
    if (!date) return 'N/A';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'N/A';
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

// ── A9: exportInscritosPDF — capa de resumo + quebra de página corrigida ──────
async function exportInscritosPDF(acao: any, inscricoes: any[], res: Response) {
    const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=inscritos_acao_${acao.numero_acao}.pdf`);
    doc.pipe(res);

    const azulStr = '#4682b4';
    const pageH = doc.page.height;
    const MARGIN_BOTTOM = 50;
    const ROW_H = 18;

    // Totais por status
    const totalPendente = inscricoes.filter((i: any) => i.status === 'pendente' || !i.status).length;
    const totalAtendido = inscricoes.filter((i: any) => i.status === 'atendido').length;
    const totalCancelado = inscricoes.filter((i: any) => i.status === 'cancelado').length;
    const totalGeral = inscricoes.length;

    // ─── PÁGINA 1: CAPA / RESUMO ───────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 180).fill(azulStr);

    doc.fontSize(22).font('Helvetica-Bold').fillColor('white')
        .text('LISTA DE INSCRITOS', 50, 50, { align: 'center', width: doc.page.width - 100 });
    doc.fontSize(14).font('Helvetica')
        .text(`Ação ${acao.numero_acao} - ${acao.nome}`, 50, 88, { align: 'center', width: doc.page.width - 100 });
    doc.fontSize(11)
        .text(`${(acao.tipo || '').toUpperCase()} • ${acao.municipio || ''}/${acao.estado || ''}`, 50, 114, { align: 'center', width: doc.page.width - 100 });
    doc.fontSize(10)
        .text(`Período: ${fmtDate(acao.data_inicio)} a ${fmtDate(acao.data_fim)}`, 50, 136, { align: 'center', width: doc.page.width - 100 });

    // Caixas de resumo (4 boxes azul/âmbar/verde/vermelho)
    doc.fillColor('#000000');
    const boxY = 200;
    const boxW = 110;
    const boxes = [
        { label: 'TOTAL GERAL', value: String(totalGeral), color: azulStr },
        { label: 'PENDENTES', value: String(totalPendente), color: '#f59e0b' },
        { label: 'ATENDIDOS', value: String(totalAtendido), color: '#10b981' },
        { label: 'CANCELADOS', value: String(totalCancelado), color: '#ef4444' },
    ];
    boxes.forEach((b, i) => {
        const bx = 50 + i * (boxW + 16);
        doc.roundedRect(bx, boxY, boxW, 70, 6).fillAndStroke(b.color, b.color);
        doc.fillColor('white').fontSize(28).font('Helvetica-Bold')
            .text(b.value, bx, boxY + 12, { width: boxW, align: 'center' });
        doc.fontSize(8).font('Helvetica')
            .text(b.label, bx, boxY + 46, { width: boxW, align: 'center' });
    });

    const now = new Date();
    doc.fillColor('#555555').fontSize(9).font('Helvetica')
        .text(`Gerado em: ${fmtDate(now)} às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
            50, boxY + 90, { align: 'center', width: doc.page.width - 100 });

    // Agrupar por curso/exame
    const inscricoesPorCurso: Record<string, any[]> = {};
    inscricoes.forEach((insc: any) => {
        const nome = insc.curso_exame?.nome || 'Sem Curso/Exame';
        if (!inscricoesPorCurso[nome]) inscricoesPorCurso[nome] = [];
        inscricoesPorCurso[nome].push(insc);
    });
    const gruposOrdenados = Object.keys(inscricoesPorCurso).sort();

    // ─── DADOS: começa em nova página ─────────────────────────────────────────
    doc.addPage();

    const drawHeader = (y: number) => {
        doc.fillColor('#f0f4f8').rect(50, y - 2, 495, 15).fill();
        doc.fillColor('#000000').fontSize(9).font('Helvetica-Bold');
        doc.text('Nº', 55, y, { width: 25, align: 'left' });
        doc.text('Nome', 85, y, { width: 150, align: 'left' });
        doc.text('CPF', 240, y, { width: 100, align: 'left' });
        doc.text('Data Nasc.', 345, y, { width: 70, align: 'left' });
        doc.text('Status', 420, y, { width: 125, align: 'left' });
        return y + 15;
    };

    gruposOrdenados.forEach((cursoNome) => {
        const lista = inscricoesPorCurso[cursoNome];

        // A9 FIX 2: só addPage quando não couber cabeçalho do grupo (60px)
        if (doc.y + 60 > pageH - MARGIN_BOTTOM) {
            doc.addPage();
        }

        doc.strokeColor(azulStr).lineWidth(2)
            .moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown(0.5);

        doc.fontSize(12).font('Helvetica-Bold').fillColor(azulStr)
            .text(`${cursoNome.toUpperCase()} (${lista.length} inscritos)`, 50, doc.y);
        doc.fillColor('#000000').moveDown(0.5);

        doc.strokeColor(azulStr).lineWidth(1)
            .moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown(1);

        let tableY = drawHeader(doc.y);
        doc.strokeColor('#cccccc').lineWidth(0.5)
            .moveTo(50, tableY).lineTo(545, tableY).stroke();
        tableY += 5;

        doc.font('Helvetica').fontSize(9);
        lista.forEach((insc: any, index: number) => {
            // A9 FIX 2: nova página somente quando não couber a próxima linha
            if (tableY + ROW_H > pageH - MARGIN_BOTTOM) {
                doc.addPage();
                tableY = drawHeader(50);
                doc.strokeColor('#cccccc').lineWidth(0.5)
                    .moveTo(50, tableY).lineTo(545, tableY).stroke();
                tableY += 5;
                doc.font('Helvetica').fontSize(9);
            }

            if (index % 2 === 0) {
                doc.fillColor('#f8f9fa').rect(50, tableY - 2, 495, ROW_H).fill();
                doc.fillColor('#000000');
            }

            const numero = String(index + 1).padStart(2, '0');
            const nome = (insc.cidadao?.nome_completo || 'N/A').substring(0, 25);
            const cpf = insc.cidadao?.cpf || 'N/A';
            const dataNasc = fmtDate(insc.cidadao?.data_nascimento);
            const statusLabel = insc.status === 'atendido' ? 'Atendido'
                : insc.status === 'cancelado' ? 'Cancelado' : 'Pendente';
            const statusColor = insc.status === 'atendido' ? '#10b981'
                : insc.status === 'cancelado' ? '#ef4444' : '#f59e0b';

            doc.strokeColor('#e5e7eb').lineWidth(0.3);
            [80, 235, 340, 415].forEach(x => {
                doc.moveTo(x, tableY - 2).lineTo(x, tableY + ROW_H - 2).stroke();
            });

            doc.fillColor('#000000');
            doc.text(numero, 55, tableY, { width: 25 });
            doc.text(nome, 85, tableY, { width: 145 });
            doc.text(cpf, 240, tableY, { width: 95 });
            doc.text(dataNasc, 345, tableY, { width: 65 });
            doc.fillColor(statusColor).text(statusLabel, 420, tableY, { width: 125 });
            doc.fillColor('#000000');

            tableY += ROW_H;
        });

        doc.y = tableY + 16;
    });

    // ─── TOTAL GERAL — só addPage se necessário (evita página em branco) ───────
    if (doc.y + 60 > pageH - MARGIN_BOTTOM) {
        doc.addPage();
    }

    doc.strokeColor(azulStr).lineWidth(2)
        .moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    doc.fontSize(13).font('Helvetica-Bold').fillColor(azulStr)
        .text(`TOTAL GERAL: ${totalGeral} inscritos  (${totalAtendido} atendidos · ${totalPendente} pendentes · ${totalCancelado} cancelados)`,
            50, doc.y, { align: 'center', width: 495 });
    doc.fillColor('#000000').moveDown(0.5);
    doc.fontSize(9).font('Helvetica')
        .text(`Gerado em: ${fmtDate(now)} às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
            { align: 'center' });

    // Numeração de páginas
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).font('Helvetica').fillColor('#888888')
            .text(`Gestão Sobre Rodas  |  Página ${i + 1} de ${range.count}`,
                50, pageH - 30, { align: 'center', width: 495 });
    }

    doc.end();
}

async function exportInscritosCSV(acao: any, inscricoes: any[], res: Response) {
    const csvString = [
        'Nome,CPF,Telefone,Email,Curso/Exame,Data Inscricao,Status',
        ...inscricoes.map((i: any) =>
            `"${i.cidadao?.nome_completo}","${i.cidadao?.cpf}","${i.cidadao?.telefone}","${i.cidadao?.email}","${i.curso_exame?.nome}","${i.data_inscricao}","${i.status}"`
        ),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=inscritos_acao_${acao.numero_acao}.csv`);
    res.send(csvString);
}

async function exportAtendidosPDF(acao: any, inscricoes: any[], res: Response) {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=atendidos_acao_${acao.numero_acao}.pdf`);
    doc.pipe(res);

    doc.fontSize(18).font('Helvetica-Bold')
        .text(`Lista de Atendidos — Ação ${acao.numero_acao}`, { align: 'center' });
    doc.fontSize(12).font('Helvetica').text(acao.nome, { align: 'center' });
    doc.moveDown();

    let y = 120;
    doc.font('Helvetica-Bold').fontSize(10);
    doc.text('Nome', 50, y);
    doc.text('Curso/Exame', 250, y);
    doc.text('Data Atendimento', 450, y);
    y += 20;

    doc.font('Helvetica');
    (inscricoes as any[]).forEach((insc: any) => {
        if (y > doc.page.height - 80) {
            doc.addPage();
            y = 50;
        }
        const nome = insc.cidadao?.nome_completo || 'N/A';
        const curso = insc.curso_exame?.nome || 'N/A';
        const data = insc.updated_at ? new Date(insc.updated_at).toLocaleDateString('pt-BR') : 'N/A';
        doc.text(nome, 50, y);
        doc.text(curso, 250, y);
        doc.text(data, 450, y);
        y += 20;
    });
    doc.end();
}

async function exportAtendidosCSV(acao: any, inscricoes: any[], res: Response) {
    const csvString = [
        'Nome,CPF,Curso/Exame,Data Atendimento,Observacoes',
        ...(inscricoes as any[]).map((i: any) =>
            `"${i.cidadao?.nome_completo}","${i.cidadao?.cpf}","${i.curso_exame?.nome}","${i.updated_at}","${i.observacoes || ''}"`
        ),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=atendidos_acao_${acao.numero_acao}.csv`);
    res.send(csvString);
}

export default router;
