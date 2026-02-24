import PDFDocument from 'pdfkit';
import { Op } from 'sequelize';
import { Insumo } from '../../models/Insumo';
import { EstoqueCaminhao } from '../../models/EstoqueCaminhao';
import { Caminhao } from '../../models/Caminhao';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const COLORS = {
    primary: '#C8102E',
    primaryLight: '#FF6B6B',
    primaryDark: '#8B0000',
    success: '#0277BD',      // azul-teal tranquilo (antes era verde escuro)
    warning: '#E65100',
    danger: '#B71C1C',
    sectionBg: '#455A64',   // azul-ardósia para cabeçalhos de categoria
    gray: '#616161',
    lightGray: '#F5F5F5',
    border: '#E0E0E0',
    white: '#FFFFFF',
    text: '#212121',
    textSecondary: '#757575',
};

const CATEGORIA_LABELS: Record<string, string> = {
    EPI: 'EPI',
    MEDICAMENTO: 'Medicamento',
    MATERIAL_DESCARTAVEL: 'Material Descartável',
    EQUIPAMENTO: 'Equipamento',
    OUTROS: 'Outros',
};

const fmt = (n: number) => `R$ ${Number(n).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
const fmtDate = (d?: Date | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('pt-BR');
};

function getStatus(insumo: Insumo): { label: string; color: string } {
    const pct = insumo.quantidade_minima > 0
        ? (insumo.quantidade_atual / insumo.quantidade_minima) * 100
        : 100;
    if (insumo.quantidade_atual === 0 || pct < 50) return { label: 'CRÍTICO', color: COLORS.danger };
    if (pct <= 100) return { label: 'BAIXO', color: COLORS.warning };
    return { label: 'OK', color: COLORS.success };
}

function getVencimentoStatus(dataValidade?: Date | null): { label: string; color: string } {
    if (!dataValidade) return { label: '—', color: COLORS.gray };
    const hoje = new Date();
    const em30 = new Date(); em30.setDate(hoje.getDate() + 30);
    const d = new Date(dataValidade);
    if (d < hoje) return { label: 'VENCIDO', color: COLORS.danger };
    if (d <= em30) return { label: 'VENCENDO', color: COLORS.warning };
    return { label: 'OK', color: COLORS.success };
}

// ─── Filtro helper (replicando lógica backend) ───────────────────────────────

function applyStatusFilter(insumos: Insumo[], status?: string): Insumo[] {
    if (!status) return insumos;
    return insumos.filter(i => {
        const pct = i.quantidade_minima > 0 ? (i.quantidade_atual / i.quantidade_minima) * 100 : 100;
        if (status === 'CRITICO') return i.quantidade_atual === 0 || pct < 50;
        if (status === 'BAIXO') return pct >= 50 && pct <= 100;
        if (status === 'OK') return pct > 100;
        return true;
    });
}

function applyVencimentoFilter(insumos: Insumo[], vencimento?: string): Insumo[] {
    if (!vencimento) return insumos;
    const hoje = new Date();
    const em30 = new Date(); em30.setDate(hoje.getDate() + 30);
    return insumos.filter(i => {
        if (!i.data_validade) return vencimento === 'OK';
        const d = new Date(i.data_validade);
        if (vencimento === 'VENCIDO') return d < hoje;
        if (vencimento === 'VENCENDO') return d >= hoje && d <= em30;
        if (vencimento === 'OK') return d > em30;
        return true;
    });
}

// ─── PDF Base ─────────────────────────────────────────────────────────────────

class BaseEstoquePDF {
    protected doc: PDFKit.PDFDocument;
    protected pageWidth = 595;
    protected pageHeight = 842;
    protected margin = 40;
    protected currentY = 0;

    constructor() {
        this.doc = new PDFDocument({ size: 'A4', margin: this.margin, bufferPages: true });
    }

    protected get contentWidth() { return this.pageWidth - this.margin * 2; }

    protected addHeader(titulo: string, subtitulo: string) {
        // background vermelho
        this.doc.rect(0, 0, this.pageWidth, 90).fill(COLORS.primary);
        // título
        this.doc.font('Helvetica-Bold').fontSize(20).fillColor(COLORS.white)
            .text(titulo, this.margin, 20, { width: this.contentWidth, align: 'center' });
        this.doc.font('Helvetica').fontSize(11).fillColor('rgba(255,255,255,0.85)')
            .text(subtitulo, this.margin, 46, { width: this.contentWidth, align: 'center' });
        // data geração
        const now = new Date().toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' });
        this.doc.font('Helvetica').fontSize(9).fillColor('rgba(255,255,255,0.7)')
            .text(`Gerado em: ${now}`, this.margin, 68, { width: this.contentWidth, align: 'center' });
        this.currentY = 105;
    }

    protected addSummaryBox(items: { label: string; value: string; color?: string }[]) {
        const boxH = 60;
        this.doc.rect(this.margin, this.currentY, this.contentWidth, boxH)
            .fillAndStroke(COLORS.lightGray, COLORS.border);

        const colW = this.contentWidth / items.length;
        items.forEach((item, i) => {
            const x = this.margin + colW * i;
            this.doc.font('Helvetica').fontSize(9).fillColor(COLORS.textSecondary)
                .text(item.label, x + 8, this.currentY + 10, { width: colW - 16, align: 'center' });
            this.doc.font('Helvetica-Bold').fontSize(16).fillColor(item.color || COLORS.primary)
                .text(item.value, x + 8, this.currentY + 26, { width: colW - 16, align: 'center' });
        });

        this.currentY += boxH + 12;
    }

    protected addTableHeader(cols: { label: string; width: number; align?: 'left' | 'right' | 'center' }[]) {
        const rowH = 22;
        this.doc.rect(this.margin, this.currentY, this.contentWidth, rowH).fill(COLORS.primary);
        let x = this.margin;
        cols.forEach(col => {
            this.doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.white)
                .text(col.label, x + 4, this.currentY + 6, { width: col.width - 8, align: col.align || 'left' });
            x += col.width;
        });
        this.currentY += rowH;
    }

    protected addTableRow(
        cols: { label: string; width: number; align?: 'left' | 'right' | 'center'; color?: string }[],
        odd: boolean
    ) {
        const rowH = 20;
        this.ensureSpace(rowH + 5);
        if (odd) {
            this.doc.rect(this.margin, this.currentY, this.contentWidth, rowH).fill('#FAFAFA');
        }
        let x = this.margin;
        cols.forEach(col => {
            this.doc.font('Helvetica').fontSize(8).fillColor(col.color || COLORS.text)
                .text(col.label, x + 4, this.currentY + 5, { width: col.width - 8, align: col.align || 'left' });
            x += col.width;
        });
        // bottom border
        this.doc.moveTo(this.margin, this.currentY + rowH).lineTo(this.margin + this.contentWidth, this.currentY + rowH)
            .strokeColor(COLORS.border).lineWidth(0.3).stroke();
        this.currentY += rowH;
    }

    protected ensureSpace(needed: number) {
        if (this.currentY + needed > this.pageHeight - this.margin) {
            this.doc.addPage();
            this.currentY = this.margin;
        }
    }

    protected addSectionTitle(text: string, color = COLORS.sectionBg) {
        this.ensureSpace(36);
        this.doc.rect(this.margin, this.currentY, this.contentWidth, 26).fill(color);
        this.doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.white)
            .text(text, this.margin + 10, this.currentY + 8, { width: this.contentWidth - 20 });
        this.currentY += 32;
    }

    protected toBuffer(): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const chunks: Buffer[] = [];
            this.doc.on('data', c => chunks.push(c));
            this.doc.on('end', () => resolve(Buffer.concat(chunks)));
            this.doc.on('error', reject);
            this.doc.end();
        });
    }
}

// ─── Relatório Estoque Geral ──────────────────────────────────────────────────

export class RelatorioEstoqueGeralPDF extends BaseEstoquePDF {
    async gerarPDF(filtros?: {
        categoria?: string;
        status?: string;
        vencimento?: string;
    }): Promise<Buffer> {
        const where: any = {};
        if (filtros?.categoria) where.categoria = filtros.categoria;

        let insumos = await Insumo.findAll({ where, order: [['categoria', 'ASC'], ['nome', 'ASC']] });
        insumos = applyStatusFilter(insumos, filtros?.status);
        insumos = applyVencimentoFilter(insumos, filtros?.vencimento);

        // Summary stats
        const total = insumos.length;
        const critico = insumos.filter(i => getStatus(i).label === 'CRÍTICO').length;
        const baixo = insumos.filter(i => getStatus(i).label === 'BAIXO').length;
        const ok = insumos.filter(i => getStatus(i).label === 'OK').length;
        const valorTotal = insumos.reduce((s, i) => s + (Number(i.preco_unitario || 0) * i.quantidade_atual), 0);

        // Header
        this.addHeader('RELATÓRIO DE ESTOQUE', 'Estoque Central — Todos os Insumos');

        // Filter badge
        if (filtros && Object.values(filtros).some(Boolean)) {
            const tags = [
                filtros.categoria ? `Categoria: ${CATEGORIA_LABELS[filtros.categoria] || filtros.categoria}` : null,
                filtros.status ? `Status: ${filtros.status}` : null,
                filtros.vencimento ? `Vencimento: ${filtros.vencimento}` : null,
            ].filter(Boolean).join('  |  ');
            this.doc.font('Helvetica-Oblique').fontSize(9).fillColor(COLORS.gray)
                .text(`Filtros aplicados: ${tags}`, this.margin, this.currentY, { width: this.contentWidth });
            this.currentY += 16;
        }

        // Resumo
        this.addSummaryBox([
            { label: 'Total de Insumos', value: String(total), color: COLORS.primary },
            { label: 'Crítico', value: String(critico), color: COLORS.danger },
            { label: 'Baixo', value: String(baixo), color: COLORS.warning },
            { label: 'OK', value: String(ok), color: COLORS.success },
            { label: 'Valor Total', value: fmt(valorTotal), color: COLORS.primaryDark },
        ]);

        // Group by category
        const byCategoria: Record<string, Insumo[]> = {};
        insumos.forEach(i => {
            const cat = i.categoria;
            if (!byCategoria[cat]) byCategoria[cat] = [];
            byCategoria[cat].push(i);
        });

        // Soma total = 515 (contentWidth = 595 - 40*2 = 515)
        const colWidths = [130, 80, 65, 65, 70, 50, 55];
        const colNames = ['Nome', 'Categoria', 'Qtd. Atual', 'Qtd. Mín.', 'Vencimento', 'Status', 'Vl. Unit.'];
        const cols = colNames.map((label, i) => ({ label, width: colWidths[i] }));

        Object.entries(byCategoria).forEach(([cat, items]) => {
            this.addSectionTitle(CATEGORIA_LABELS[cat] || cat);
            this.addTableHeader(cols.map((c, i) => ({
                ...c,
                align: i >= 2 ? 'center' : 'left',
            })));
            items.forEach((insumo, idx) => {
                const st = getStatus(insumo);
                const venc = getVencimentoStatus(insumo.data_validade);
                this.addTableRow([
                    { label: insumo.nome, width: colWidths[0] },
                    { label: CATEGORIA_LABELS[insumo.categoria] || insumo.categoria, width: colWidths[1] },
                    { label: `${insumo.quantidade_atual} ${insumo.unidade}`, width: colWidths[2], align: 'center' },
                    { label: `${insumo.quantidade_minima} ${insumo.unidade}`, width: colWidths[3], align: 'center' },
                    { label: fmtDate(insumo.data_validade), width: colWidths[4], align: 'center', color: venc.color },
                    { label: st.label, width: colWidths[5], align: 'center', color: st.color },
                    { label: insumo.preco_unitario ? fmt(Number(insumo.preco_unitario)) : '—', width: colWidths[6], align: 'right' },
                ], idx % 2 === 1);
            });
            this.currentY += 8;
        });

        if (insumos.length === 0) {
            this.doc.font('Helvetica-Oblique').fontSize(11).fillColor(COLORS.gray)
                .text('Nenhum insumo encontrado com os filtros aplicados.', this.margin, this.currentY, {
                    width: this.contentWidth, align: 'center',
                });
        }

        return this.toBuffer();
    }
}

// ─── Relatório Estoque por Caminhão ──────────────────────────────────────────

export class RelatorioEstoqueCaminhaoPDF extends BaseEstoquePDF {
    async gerarPDF(filtros?: {
        categoria?: string;
        status?: string;
        vencimento?: string;
        caminhao_id?: string;
    }): Promise<Buffer> {
        // Busca todos os registros de estoque por caminhão com insumo e caminhão
        const whereEstoque: any = {};
        if (filtros?.caminhao_id) whereEstoque.caminhao_id = filtros.caminhao_id;

        const estoques = await EstoqueCaminhao.findAll({
            where: whereEstoque,
            include: [
                { model: Insumo, as: 'insumo' },
                { model: Caminhao, as: 'caminhao', attributes: ['id', 'placa', 'modelo', 'ano'] },
            ],
            order: [
                [{ model: Caminhao, as: 'caminhao' }, 'placa', 'ASC'],
                [{ model: Insumo, as: 'insumo' }, 'nome', 'ASC'],
            ],
        }) as any[];

        // Agrupar por caminhao
        const byCaminhao: Record<string, { caminhao: any; items: any[] }> = {};
        for (const e of estoques) {
            const cam = e.caminhao;
            if (!cam) continue;
            const insumo: Insumo = e.insumo;
            if (!insumo) continue;

            // Aplicar filtros no insumo
            if (filtros?.categoria && insumo.categoria !== filtros.categoria) continue;
            const st = getStatus(insumo);
            if (filtros?.status && st.label !== filtros.status.toUpperCase() &&
                !(filtros.status === 'CRITICO' && st.label === 'CRÍTICO')) continue;
            const venc = getVencimentoStatus(insumo.data_validade);
            if (filtros?.vencimento && venc.label !== filtros.vencimento) continue;

            if (!byCaminhao[cam.id]) {
                byCaminhao[cam.id] = { caminhao: cam, items: [] };
            }
            byCaminhao[cam.id].items.push({ estoque: e, insumo });
        }

        const caminhoes = Object.values(byCaminhao);

        // Totals
        const totalCaminhoes = caminhoes.length;
        const totalInsumos = caminhoes.reduce((s, c) => s + c.items.length, 0);

        // Subtítulo: nome do caminhão específico ou genérico
        const subtitulo = filtros?.caminhao_id && caminhoes.length > 0
            ? `Caminhão: ${caminhoes[0].caminhao.placa} — ${caminhoes[0].caminhao.modelo || ''}`
            : 'Estoque por Caminhão';
        this.addHeader('RELATÓRIO DE ESTOQUE', subtitulo);

        if (filtros && Object.values(filtros).some(Boolean)) {
            const tags = [
                filtros.caminhao_id ? null : null, // já aparece no subtítulo
                filtros.categoria ? `Categoria: ${CATEGORIA_LABELS[filtros.categoria] || filtros.categoria}` : null,
                filtros.status ? `Status: ${filtros.status}` : null,
                filtros.vencimento ? `Vencimento: ${filtros.vencimento}` : null,
            ].filter(Boolean).join('  |  ');
            if (tags) {
                this.doc.font('Helvetica-Oblique').fontSize(9).fillColor(COLORS.gray)
                    .text(`Filtros aplicados: ${tags}`, this.margin, this.currentY, { width: this.contentWidth });
                this.currentY += 16;
            }
        }

        this.addSummaryBox([
            { label: 'Caminhões c/ Estoque', value: String(totalCaminhoes), color: COLORS.primary },
            { label: 'Total de Itens', value: String(totalInsumos), color: COLORS.primaryDark },
        ]);

        // Soma total = 515
        const colWidths = [150, 90, 75, 80, 60, 60];
        const colHeaders = caminhoes.length > 0
            ? ['Insumo', 'Categoria', 'Qtd. Caminhão', 'Vencimento', 'Status', 'Vl. Total']
            : [];

        caminhoes.forEach(({ caminhao, items }) => {
            const valorCaminhao = items.reduce((s, it) =>
                s + (Number(it.insumo.preco_unitario || 0) * it.estoque.quantidade), 0);

            this.addSectionTitle(
                `${caminhao.placa}  —  ${caminhao.modelo || ''}  (${caminhao.ano || ''})  |  Valor total: ${fmt(valorCaminhao)}`
            );

            this.addTableHeader(colHeaders.map((label, i) => ({
                label,
                width: colWidths[i],
                align: (i >= 2 ? 'center' : 'left') as 'left' | 'center',
            })));

            items.forEach(({ estoque, insumo }, idx) => {
                const st = getStatus(insumo);
                const venc = getVencimentoStatus(insumo.data_validade);
                const valorItem = Number(insumo.preco_unitario || 0) * estoque.quantidade;
                this.addTableRow([
                    { label: insumo.nome, width: colWidths[0] },
                    { label: CATEGORIA_LABELS[insumo.categoria] || insumo.categoria, width: colWidths[1] },
                    { label: `${estoque.quantidade} ${insumo.unidade}`, width: colWidths[2], align: 'center' },
                    { label: fmtDate(insumo.data_validade), width: colWidths[3], align: 'center', color: venc.color },
                    { label: st.label, width: colWidths[4], align: 'center', color: st.color },
                    { label: insumo.preco_unitario ? fmt(valorItem) : '—', width: colWidths[5], align: 'right' },
                ], idx % 2 === 1);
            });
            this.currentY += 8;
        });

        if (caminhoes.length === 0) {
            this.doc.font('Helvetica-Oblique').fontSize(11).fillColor(COLORS.gray)
                .text('Nenhum registro de estoque por caminhão encontrado.', this.margin, this.currentY, {
                    width: this.contentWidth, align: 'center',
                });
        }

        return this.toBuffer();
    }
}
