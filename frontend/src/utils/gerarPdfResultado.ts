import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Atendimento {
    id: string;
    hora_inicio: string;
    hora_fim?: string;
    observacoes?: string;
    ficha_clinica?: Record<string, any>;
    acao?: { nome?: string; municipio?: string; local_execucao?: string };
    funcionario?: { nome?: string; especialidade?: string; crm?: string };
}

interface Paciente {
    nome_completo: string;
    cpf: string;
    data_nascimento?: string;
    cartao_sus?: string;
    genero?: string;
    municipio?: string;
    estado?: string;
}

const BRAND_PRIMARY = '#0ea5e9';
const BRAND_DARK = '#0c4a6e';
const GRAY_DARK = '#1e293b';
const GRAY_MID = '#475569';
const GRAY_LIGHT = '#f1f5f9';
const LINE_COLOR: [number, number, number] = [226, 232, 240];

const hexToRgb = (hex: string): [number, number, number] => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
};

const dataBR = (iso: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-BR');
};

const timeBR = (iso: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

const calcIMC = (peso?: string, altura?: string) => {
    if (!peso || !altura) return null;
    const imc = Number(peso) / Math.pow(Number(altura) / 100, 2);
    if (isNaN(imc)) return null;
    const val = imc.toFixed(1);
    let class_ = '';
    if (imc < 18.5) class_ = 'Abaixo do peso';
    else if (imc < 25) class_ = 'Peso normal';
    else if (imc < 30) class_ = 'Sobrepeso';
    else class_ = 'Obesidade';
    return `${val} (${class_})`;
};

const addHeader = (doc: jsPDF, paciente: Paciente, pageWidth: number) => {
    // Cabeçalho colorido
    doc.setFillColor(...hexToRgb(BRAND_DARK));
    doc.rect(0, 0, pageWidth, 32, 'F');

    // Linha de acento
    doc.setFillColor(...hexToRgb(BRAND_PRIMARY));
    doc.rect(0, 30, pageWidth, 2.5, 'F');

    // Nome do Sistema
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('GESTÃO SOBRE RODAS', 14, 13);

    // Subtítulo
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(186, 230, 253);
    doc.text('Relatório Médico Individual · Sistema de Saúde Itinerante', 14, 20);

    // Data de emissão no canto direito
    const hoje = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'long', year: 'numeric'
    });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(186, 230, 253);
    doc.text(`Emitido em: ${hoje}`, pageWidth - 14, 13, { align: 'right' });

    // Dados do paciente
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 32.5, pageWidth, 22, 'F');

    doc.setTextColor(...hexToRgb(GRAY_DARK));
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(paciente.nome_completo || '—', 14, 41);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...hexToRgb(GRAY_MID));

    const infoArr = [
        paciente.cpf ? `CPF: ${paciente.cpf}` : null,
        paciente.data_nascimento ? `Nascimento: ${dataBR(paciente.data_nascimento)}` : null,
        paciente.cartao_sus ? `CNS: ${paciente.cartao_sus}` : null,
        paciente.municipio ? `${paciente.municipio}/${paciente.estado || ''}` : null,
    ].filter(Boolean) as string[];

    doc.text(infoArr.join('   ·   '), 14, 48);

    // Linha separadora
    doc.setDrawColor(...LINE_COLOR);
    doc.setLineWidth(0.5);
    doc.line(0, 54.5, pageWidth, 54.5);
};

const addFooter = (doc: jsPDF, pageNum: number, totalPages: number) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFillColor(248, 250, 252);
    doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');

    doc.setDrawColor(...LINE_COLOR);
    doc.setLineWidth(0.3);
    doc.line(0, pageHeight - 12, pageWidth, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...hexToRgb(GRAY_MID));
    doc.text('Documento gerado eletronicamente · Gestão Sobre Rodas · Uso exclusivamente médico', 14, pageHeight - 4.5);
    doc.text(`Página ${pageNum} de ${totalPages}`, pageWidth - 14, pageHeight - 4.5, { align: 'right' });
};

const addSectionTitle = (doc: jsPDF, title: string, y: number, pageWidth: number) => {
    doc.setFillColor(...hexToRgb(BRAND_PRIMARY));
    doc.rect(14, y, 3, 5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...hexToRgb(BRAND_DARK));
    doc.text(title, 20, y + 4);

    doc.setDrawColor(...LINE_COLOR);
    doc.setLineWidth(0.3);
    doc.line(14, y + 7, pageWidth - 14, y + 7);

    return y + 11;
};

const addKeyValue = (
    doc: jsPDF,
    key: string,
    value: string | null | undefined,
    x: number,
    y: number,
    maxWidth: number
) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...hexToRgb(GRAY_MID));
    doc.text(key.toUpperCase(), x, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...hexToRgb(GRAY_DARK));
    const val = value || '—';
    doc.text(val, x, y + 4.5, { maxWidth });
    const lines = doc.splitTextToSize(val, maxWidth);
    return y + 4.5 + (lines.length - 1) * 4 + 6;
};

/**
 * Gera um PDF profissional de resultado médico.
 * @param atendimentos - lista de atendimentos (1 para individual, N para "todos")
 * @param paciente - dados do paciente
 * @param nomeArquivo - nome sugerido do arquivo para download
 */
export function gerarPdfResultado(
    atendimentos: Atendimento[],
    paciente: Paciente,
    nomeArquivo = 'resultado-medico.pdf'
) {
    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginL = 14;
    const marginR = pageWidth - 14;
    const contentWidth = marginR - marginL;

    const HEADER_HEIGHT = 56;
    const FOOTER_HEIGHT = 14;

    let pageIndex = 0;

    const startPage = () => {
        if (pageIndex > 0) doc.addPage();
        pageIndex++;
        addHeader(doc, paciente, pageWidth);
        return HEADER_HEIGHT + 6;
    };

    const checkNewPage = (y: number, needed: number): number => {
        const pageHeight = doc.internal.pageSize.getHeight();
        if (y + needed > pageHeight - FOOTER_HEIGHT - 6) {
            return startPage();
        }
        return y;
    };

    // ─── Gerar cada atendimento ───────────────────────────────────────────────
    atendimentos.forEach((atd, idx) => {
        let y = startPage();

        const f = atd.ficha_clinica || {};
        const acao = atd.acao;
        const med = atd.funcionario;

        // Badge do número do atendimento (se múltiplos)
        if (atendimentos.length > 1) {
            doc.setFillColor(...hexToRgb(GRAY_LIGHT));
            doc.roundedRect(marginL, y, contentWidth, 8, 1.5, 1.5, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(...hexToRgb(GRAY_MID));
            doc.text(
                `ATENDIMENTO ${idx + 1} DE ${atendimentos.length}`,
                pageWidth / 2, y + 5.5, { align: 'center' }
            );
            y += 12;
        }

        // ── SEÇÃO: Identificação do Atendimento ─────────────────────────
        y = addSectionTitle(doc, 'Identificação do Atendimento', y, pageWidth);

        autoTable(doc, {
            startY: y,
            margin: { left: marginL, right: 14 },
            theme: 'plain',
            styles: { fontSize: 8.5, cellPadding: { top: 2, bottom: 2, left: 3, right: 3 } },
            headStyles: {
                fillColor: hexToRgb(GRAY_LIGHT), textColor: hexToRgb(GRAY_MID),
                fontStyle: 'bold', fontSize: 7
            },
            columnStyles: { 0: { cellWidth: 48 }, 1: { cellWidth: 48 }, 2: { cellWidth: 50 }, 3: { cellWidth: 45 } },
            head: [['Ação / Local', 'Data de Atendimento', 'Médico Responsável', 'Horário']],
            body: [[
                acao?.nome || '—',
                dataBR(atd.hora_inicio),
                med?.nome || '—',
                `${timeBR(atd.hora_inicio)}${atd.hora_fim ? ' - ' + timeBR(atd.hora_fim) : ''}`,
            ]],
        });

        y = (doc as any).lastAutoTable.finalY + 4;

        if (med?.especialidade || med?.crm) {
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(7.5);
            doc.setTextColor(...hexToRgb(GRAY_MID));
            const infoMed = [
                med.especialidade ? `Especialidade: ${med.especialidade}` : null,
                med.crm ? `CRM: ${med.crm}` : null,
            ].filter(Boolean).join('   ·   ');
            doc.text(infoMed, marginL + 3, y);
            y += 7;
        }

        // ── SEÇÃO: Diagnóstico e Conduta ────────────────────────────────
        y = checkNewPage(y, 45);
        y = addSectionTitle(doc, 'Diagnóstico e Conduta', y, pageWidth);

        const diagCols = contentWidth / 2 - 3;
        let diagY = y;

        diagY = addKeyValue(doc, 'Diagnóstico', f.diagnostico, marginL, diagY, diagCols);
        const rightX = marginL + contentWidth / 2 + 3;
        addKeyValue(doc, 'CID-10', f.cid, rightX, y, diagCols);

        y = diagY + 2;
        y = checkNewPage(y, 20);
        y = addKeyValue(doc, 'Prescrição / Medicamentos', f.prescricao, marginL, y, contentWidth);
        y = checkNewPage(y, 20);
        y = addKeyValue(doc, 'Conduta Médica', f.conduta, marginL, y, contentWidth);
        y = checkNewPage(y, 20);
        y = addKeyValue(doc, 'Orientações de Retorno', f.retorno, marginL, y, contentWidth);

        // ── SEÇÃO: Sinais Vitais (se preenchido) ────────────────────────
        const temVitais = f.pressao_arterial || f.fc || f.t || f.peso || f.altura;
        if (temVitais) {
            y = checkNewPage(y, 35);
            y = addSectionTitle(doc, 'Sinais Vitais e Antropometria', y, pageWidth);

            const vitais: string[][] = [];
            if (f.pressao_arterial) vitais.push(['Pressão Arterial', f.pressao_arterial + ' mmHg']);
            if (f.fc) vitais.push(['Frequência Cardíaca', f.fc + ' bpm']);
            if (f.t) vitais.push(['Temperatura', f.t + ' °C']);
            if (f.peso) vitais.push(['Peso', f.peso + ' kg']);
            if (f.altura) vitais.push(['Altura', f.altura + ' cm']);
            const imc = calcIMC(f.peso, f.altura);
            if (imc) vitais.push(['IMC', imc]);

            autoTable(doc, {
                startY: y,
                margin: { left: marginL, right: 14 },
                theme: 'striped',
                styles: { fontSize: 8.5, cellPadding: { top: 2.5, bottom: 2.5, left: 5, right: 5 } },
                headStyles: {
                    fillColor: hexToRgb(BRAND_DARK), textColor: [255, 255, 255],
                    fontStyle: 'bold', fontSize: 7.5
                },
                alternateRowStyles: { fillColor: hexToRgb(GRAY_LIGHT) },
                columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } },
                head: [['Parâmetro', 'Valor']],
                body: vitais,
            });

            y = (doc as any).lastAutoTable.finalY + 4;
        }

        // ── SEÇÃO: Anamnese ─────────────────────────────────────────────
        const temAnamnese = f.queixa_principal || f.hda || f.alergias_str || f.medicamentos_str || f.doencas_cronicas;
        if (temAnamnese) {
            y = checkNewPage(y, 35);
            y = addSectionTitle(doc, 'Anamnese', y, pageWidth);

            if (f.queixa_principal) { y = addKeyValue(doc, 'Queixa Principal', f.queixa_principal, marginL, y, contentWidth); }
            if (f.hda) { y = checkNewPage(y, 18); y = addKeyValue(doc, 'HDA', f.hda, marginL, y, contentWidth); }
            if (f.alergias_str) { y = checkNewPage(y, 18); y = addKeyValue(doc, 'Alergias', f.alergias_str, marginL, y, contentWidth); }
            if (f.doencas_cronicas) { y = checkNewPage(y, 18); y = addKeyValue(doc, 'Doenças Crônicas', f.doencas_cronicas, marginL, y, contentWidth); }
            if (f.medicamentos_str) { y = checkNewPage(y, 18); y = addKeyValue(doc, 'Medicamentos em Uso', f.medicamentos_str, marginL, y, contentWidth); }
        }

        // ── SEÇÃO: Observações ──────────────────────────────────────────
        const obs = atd.observacoes || f.observacoes;
        if (obs) {
            y = checkNewPage(y, 25);
            y = addSectionTitle(doc, 'Observações do Médico', y, pageWidth);
            y = addKeyValue(doc, '', obs, marginL, y - 4, contentWidth);
        }

        // ── Assinatura ──────────────────────────────────────────────────
        const pageHeight = doc.internal.pageSize.getHeight();
        const assinaturaY = pageHeight - FOOTER_HEIGHT - 32;
        if (y < assinaturaY) {
            y = assinaturaY;
        } else {
            y = checkNewPage(y, 30);
        }

        doc.setDrawColor(...LINE_COLOR);
        doc.setLineWidth(0.4);
        const lineStart = pageWidth / 2 - 40;
        const lineEnd = pageWidth / 2 + 40;
        doc.line(lineStart, y, lineEnd, y);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...hexToRgb(GRAY_MID));
        doc.text(med?.nome || 'Médico Responsável', pageWidth / 2, y + 4.5, { align: 'center' });
        if (med?.crm) {
            doc.setFontSize(7.5);
            doc.text(`CRM: ${med.crm}`, pageWidth / 2, y + 9, { align: 'center' });
        }
    });

    // ── Adicionar rodapé em TODAS as páginas ─────────────────────────────────
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        addFooter(doc, i, totalPages);
    }

    doc.save(nomeArquivo);
}
