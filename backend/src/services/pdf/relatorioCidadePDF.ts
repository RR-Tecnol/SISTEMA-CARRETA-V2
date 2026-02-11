import PDFDocument from 'pdfkit';
import { ContaPagar } from '../../models/ContaPagar';
import { Op } from 'sequelize';

interface RelatorioCidade {
    cidade: string;
    total: number;
    contas: ContaPagar[];
    totalPendente: number;
    totalPago: number;
    totalVencido: number;
}

export class RelatorioCidadePDF {
    private doc: PDFKit.PDFDocument;
    private pageWidth: number = 595.28;
    private pageHeight: number = 841.89;
    private margin: number = 50;
    private currentY: number = 50;

    // Table column definitions
    private tableX: number = 50;
    private tableWidth: number = 495;
    private colWidths = {
        descricao: 180,
        tipo: 90,
        vencimento: 75,
        status: 75,
        valor: 75
    };

    constructor() {
        this.doc = new PDFDocument({
            size: 'A4',
            margins: {
                top: this.margin,
                bottom: this.margin,
                left: this.margin,
                right: this.margin
            },
            bufferPages: true
        });
    }

    private addHeader() {
        this.doc
            .rect(0, 0, this.pageWidth, 120)
            .fillAndStroke('#1a237e', '#1a237e');

        this.doc
            .fontSize(24)
            .fillColor('#ffffff')
            .font('Helvetica-Bold')
            .text('RELATORIO DE CUSTOS', this.margin, 30, {
                align: 'center',
                width: this.pageWidth - 2 * this.margin
            });

        this.doc
            .fontSize(16)
            .fillColor('#e3f2fd')
            .font('Helvetica')
            .text('Por Cidade', this.margin, 60, {
                align: 'center',
                width: this.pageWidth - 2 * this.margin
            });

        const dataAtual = new Date().toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        this.doc
            .fontSize(10)
            .fillColor('#bbdefb')
            .text(`Gerado em: ${dataAtual}`, this.margin, 90, {
                align: 'center',
                width: this.pageWidth - 2 * this.margin
            });

        this.currentY = 140;
    }

    private addSummarySection(dados: RelatorioCidade[]) {
        const totalGeral = dados.reduce((sum, d) => sum + d.total, 0);
        const totalCidades = dados.length;
        const totalContas = dados.reduce((sum, d) => sum + d.contas.length, 0);

        this.doc
            .rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 80)
            .fillAndStroke('#e3f2fd', '#1976d2');

        this.currentY += 15;

        this.doc
            .fontSize(14)
            .fillColor('#1565c0')
            .font('Helvetica-Bold')
            .text('RESUMO GERAL', this.margin + 20, this.currentY);

        this.currentY += 25;

        const col1X = this.margin + 20;
        const col2X = this.margin + 200;
        const col3X = this.margin + 350;

        this.doc
            .fontSize(10)
            .fillColor('#424242')
            .font('Helvetica')
            .text('Total de Cidades:', col1X, this.currentY);

        this.doc
            .fontSize(16)
            .fillColor('#1976d2')
            .font('Helvetica-Bold')
            .text(totalCidades.toString(), col1X, this.currentY + 15);

        this.doc
            .fontSize(10)
            .fillColor('#424242')
            .font('Helvetica')
            .text('Total de Contas:', col2X, this.currentY);

        this.doc
            .fontSize(16)
            .fillColor('#1976d2')
            .font('Helvetica-Bold')
            .text(totalContas.toString(), col2X, this.currentY + 15);

        this.doc
            .fontSize(10)
            .fillColor('#424242')
            .font('Helvetica')
            .text('Valor Total:', col3X, this.currentY);

        this.doc
            .fontSize(14)
            .fillColor('#2e7d32')
            .font('Helvetica-Bold')
            .text(`R$ ${totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, col3X, this.currentY + 15);

        this.currentY += 60;
    }

    private addCitySection(cidade: RelatorioCidade, index: number) {
        // Check if we need a new page for the entire section
        // Need space for: header (35) + status boxes (60) + table header (25) + at least 3-4 rows (80) + margins (50) = 250
        if (this.currentY > this.pageHeight - 250) {
            this.doc.addPage();
            this.currentY = this.margin;
        }

        const headerY = this.currentY;
        this.doc
            .rect(this.margin, headerY, this.pageWidth - 2 * this.margin, 35)
            .fillAndStroke(index % 2 === 0 ? '#f5f5f5' : '#fafafa', '#e0e0e0');

        this.doc
            .fontSize(12)
            .fillColor('#1565c0')
            .font('Helvetica-Bold')
            .text(cidade.cidade, this.margin + 15, headerY + 10);

        this.doc
            .fontSize(11)
            .fillColor('#2e7d32')
            .font('Helvetica-Bold')
            .text(
                `R$ ${cidade.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                this.pageWidth - this.margin - 120,
                headerY + 10
            );

        this.currentY += 45;

        const statusY = this.currentY;
        const statusWidth = (this.pageWidth - 2 * this.margin - 40) / 3;

        this.addStatusBox(this.margin + 15, statusY, statusWidth, 'Pendente', cidade.totalPendente, '#ff9800');
        this.addStatusBox(this.margin + 15 + statusWidth + 10, statusY, statusWidth, 'Pago', cidade.totalPago, '#4caf50');
        this.addStatusBox(this.margin + 15 + 2 * (statusWidth + 10), statusY, statusWidth, 'Vencido', cidade.totalVencido, '#f44336');

        this.currentY += 60;

        // Only add table if there are accounts to show
        if (cidade.contas.length > 0) {
            this.addTableHeader();

            cidade.contas.slice(0, 10).forEach((conta, idx) => {
                this.addTableRow(conta, idx);
            });

            if (cidade.contas.length > 10) {
                this.doc
                    .fontSize(9)
                    .fillColor('#757575')
                    .font('Helvetica-Oblique')
                    .text(`... e mais ${cidade.contas.length - 10} conta(s)`, this.margin + 15, this.currentY + 5);
                this.currentY += 20;
            }
        }

        this.currentY += 20;
    }

    private addStatusBox(x: number, y: number, width: number, label: string, value: number, color: string) {
        this.doc
            .rect(x, y, width, 40)
            .fillAndStroke('#ffffff', color);

        this.doc
            .fontSize(8)
            .fillColor('#757575')
            .font('Helvetica')
            .text(label, x, y + 8, { width: width, align: 'center' });

        this.doc
            .fontSize(10)
            .fillColor(color)
            .font('Helvetica-Bold')
            .text(`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, x, y + 22, { width: width, align: 'center' });
    }

    private addTableHeader() {
        const rowHeight = 25;
        let currentX = this.tableX;

        // Draw header background
        this.doc
            .rect(this.tableX, this.currentY, this.tableWidth, rowHeight)
            .fillAndStroke('#1976d2', '#1976d2');

        this.doc
            .fontSize(9)
            .fillColor('#ffffff')
            .font('Helvetica-Bold');

        // Draw each header cell
        this.drawCell(currentX, this.currentY, this.colWidths.descricao, rowHeight, 'Descricao', 'left');
        currentX += this.colWidths.descricao;

        this.drawCell(currentX, this.currentY, this.colWidths.tipo, rowHeight, 'Tipo', 'left');
        currentX += this.colWidths.tipo;

        this.drawCell(currentX, this.currentY, this.colWidths.vencimento, rowHeight, 'Vencimento', 'center');
        currentX += this.colWidths.vencimento;

        this.drawCell(currentX, this.currentY, this.colWidths.status, rowHeight, 'Status', 'center');
        currentX += this.colWidths.status;

        this.drawCell(currentX, this.currentY, this.colWidths.valor, rowHeight, 'Valor', 'right');

        this.currentY += rowHeight;
    }

    private addTableRow(conta: ContaPagar, index: number) {
        if (this.currentY > this.pageHeight - 100) {
            this.doc.addPage();
            this.currentY = this.margin;
            this.addTableHeader();
        }

        const rowHeight = 20;
        let currentX = this.tableX;

        // Draw row background
        if (index % 2 === 0) {
            this.doc
                .rect(this.tableX, this.currentY, this.tableWidth, rowHeight)
                .fillAndStroke('#fafafa', '#e0e0e0');
        } else {
            this.doc
                .rect(this.tableX, this.currentY, this.tableWidth, rowHeight)
                .stroke('#e0e0e0');
        }

        this.doc
            .fontSize(8)
            .fillColor('#424242')
            .font('Helvetica');

        // Description
        const descricao = conta.descricao.length > 30 ? conta.descricao.substring(0, 30) + '...' : conta.descricao;
        this.drawCell(currentX, this.currentY, this.colWidths.descricao, rowHeight, descricao, 'left');
        currentX += this.colWidths.descricao;

        // Type
        const tipoLabel = this.getTipoLabel(conta.tipo_conta);
        const tipo = tipoLabel.length > 15 ? tipoLabel.substring(0, 15) + '.' : tipoLabel;
        this.drawCell(currentX, this.currentY, this.colWidths.tipo, rowHeight, tipo, 'left');
        currentX += this.colWidths.tipo;

        // Due date
        const vencimento = new Date(conta.data_vencimento).toLocaleDateString('pt-BR');
        this.drawCell(currentX, this.currentY, this.colWidths.vencimento, rowHeight, vencimento, 'center');
        currentX += this.colWidths.vencimento;

        // Status
        const statusColor = this.getStatusColor(conta.status);
        this.doc.fillColor(statusColor).font('Helvetica-Bold');
        const statusText = conta.status.charAt(0).toUpperCase() + conta.status.slice(1);
        this.drawCell(currentX, this.currentY, this.colWidths.status, rowHeight, statusText, 'center');
        currentX += this.colWidths.status;

        // Value
        this.doc.fillColor('#2e7d32').font('Helvetica-Bold');
        const valor = `R$ ${Number(conta.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        this.drawCell(currentX, this.currentY, this.colWidths.valor, rowHeight, valor, 'right');

        this.currentY += rowHeight;
    }

    private drawCell(x: number, y: number, width: number, height: number, text: string, align: 'left' | 'center' | 'right') {
        const padding = 5;
        const textY = y + (height / 2) - 3;

        this.doc.text(text, x + padding, textY, {
            width: width - 2 * padding,
            align: align,
            lineBreak: false,
            ellipsis: true
        });
    }

    private getTipoLabel(tipo: string): string {
        const tipos: Record<string, string> = {
            'pneu_furado': 'Pneu Furado',
            'troca_oleo': 'Troca Oleo',
            'abastecimento': 'Abastecimento',
            'manutencao_mecanica': 'Manutencao',
            'reboque': 'Reboque',
            'lavagem': 'Lavagem',
            'pedagio': 'Pedagio',
            'agua': 'Agua',
            'energia': 'Energia',
            'aluguel': 'Aluguel',
            'internet': 'Internet',
            'telefone': 'Telefone',
            'funcionario': 'Funcionario',
            'espontaneo': 'Personalizado',
            'outros': 'Outros'
        };
        return tipos[tipo] || tipo;
    }

    private getStatusColor(status: string): string {
        const colors: Record<string, string> = {
            'pendente': '#ff9800',
            'paga': '#4caf50',
            'vencida': '#f44336',
            'cancelada': '#9e9e9e'
        };
        return colors[status] || '#757575';
    }



    async gerarPDF(): Promise<Buffer> {
        return new Promise(async (resolve, reject) => {
            try {
                const contas = await ContaPagar.findAll({
                    where: { cidade: { [Op.ne]: null } },
                    order: [['cidade', 'ASC'], ['data_vencimento', 'DESC']],
                });

                const relatorio: Record<string, RelatorioCidade> = {};
                contas.forEach(conta => {
                    const cidadeNome = conta.cidade || 'Sem Cidade';
                    if (!relatorio[cidadeNome]) {
                        relatorio[cidadeNome] = {
                            cidade: cidadeNome,
                            total: 0,
                            contas: [],
                            totalPendente: 0,
                            totalPago: 0,
                            totalVencido: 0
                        };
                    }
                    relatorio[cidadeNome].total += Number(conta.valor);
                    relatorio[cidadeNome].contas.push(conta);

                    if (conta.status === 'pendente') {
                        relatorio[cidadeNome].totalPendente += Number(conta.valor);
                    } else if (conta.status === 'paga') {
                        relatorio[cidadeNome].totalPago += Number(conta.valor);
                    } else if (conta.status === 'vencida') {
                        relatorio[cidadeNome].totalVencido += Number(conta.valor);
                    }
                });

                const dados = Object.values(relatorio).sort((a, b) => b.total - a.total);

                this.addHeader();
                this.addSummarySection(dados);

                dados.forEach((cidade, index) => {
                    this.addCitySection(cidade, index);
                });

                const chunks: Buffer[] = [];
                this.doc.on('data', (chunk) => chunks.push(chunk));
                this.doc.on('end', () => resolve(Buffer.concat(chunks)));
                this.doc.on('error', reject);

                this.doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }
}
