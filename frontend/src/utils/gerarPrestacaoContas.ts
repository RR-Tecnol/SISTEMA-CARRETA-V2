import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DadosRelatorioExecutivo } from '../services/relatorioExecutivo';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(date: any): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'N/A';
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function fmtBRL(value: number): string {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDateLong(date: Date): string {
    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function calcIdade(dataNasc: any): number {
    if (!dataNasc) return 0;
    const hoje = new Date();
    const nasc = new Date(dataNasc);
    let idade = hoje.getFullYear() - nasc.getFullYear();
    if (hoje.getMonth() < nasc.getMonth() || (hoje.getMonth() === nasc.getMonth() && hoje.getDate() < nasc.getDate())) {
        idade--;
    }
    return idade;
}

const AZUL: [number, number, number] = [30, 58, 138];
const AZUL_MEDIO: [number, number, number] = [59, 130, 246];
const VERDE: [number, number, number] = [16, 185, 129];
const AMARELO: [number, number, number] = [245, 158, 11];
const ROXO: [number, number, number] = [139, 92, 246];
const CINZA: [number, number, number] = [229, 231, 235];

// Rodapé — usa doc.internal.pages.length para total de páginas
// NOTA: O total correto é atualizado no loop final após geração
let _totalPgsRef = 999;

function addFooter(doc: jsPDF, currentPage: number): void {
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const total = _totalPgsRef;
    doc.setFontSize(7).setTextColor(150, 150, 150).setFont('helvetica', 'normal');
    doc.text(
        `Sistema Gestão Sobre Rodas | gestaosobrerodas.com.br | Página ${currentPage} de ${total}`,
        pageW / 2, pageH - 5, { align: 'center' }
    );
}

// ── PÁGINA 1 — Capa ───────────────────────────────────────────────────────────
function buildCapa(
    doc: jsPDF,
    dados: DadosRelatorioExecutivo,
    opcoes: { dataInicio: string; dataFim: string; numeroProcesso?: string; loteRegiao?: string }
): void {
    const { acao, inscricoes, responsavelTecnico } = dados;
    const pageW = doc.internal.pageSize.getWidth();

    // Fundo azul escuro
    doc.setFillColor(...AZUL);
    doc.rect(0, 0, pageW, 88, 'F');

    // Título
    doc.setTextColor(255, 255, 255).setFont('helvetica', 'bold').setFontSize(18);
    doc.text('RELATÓRIO DE PRODUÇÃO AMBULATORIAL', pageW / 2, 28, { align: 'center' });

    doc.setFontSize(12).setFont('helvetica', 'normal');
    doc.text('SISTEMA GESTÃO SOBRE RODAS', pageW / 2, 40, { align: 'center' });

    // Linha separadora
    doc.setDrawColor(255, 255, 255).setLineWidth(0.6);
    doc.line(20, 47, pageW - 20, 47);

    // 3 colunas
    const col2 = pageW / 2;
    const col3 = pageW - 14;
    doc.setFontSize(8).setFont('helvetica', 'bold');
    doc.text(`Ação: ${acao?.numero_acao || 'N/A'} — ${(acao?.nome || '').substring(0, 28)}`, 14, 56);
    doc.text(`Período: ${fmtDate(opcoes.dataInicio)} a ${fmtDate(opcoes.dataFim)}`, col2, 56, { align: 'center' });
    doc.text(`CNES: ${acao?.numero_cnes || 'N/A'}`, col3, 56, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.text(`Município: ${acao?.municipio || 'N/A'}/${acao?.estado || 'N/A'}`, 14, 64);
    doc.text(`Processo: ${opcoes.numeroProcesso || acao?.numero_processo || 'N/A'}`, col2, 64, { align: 'center' });
    doc.text(`Lote: ${opcoes.loteRegiao || acao?.lote_regiao || 'N/A'}`, col3, 64, { align: 'right' });

    // KPI boxes
    doc.setTextColor(0, 0, 0);
    const totalAtendidos = inscricoes.filter((i: any) => i.status === 'atendido').length;
    const metaMensal = acao?.meta_mensal_total || 0;
    const pctMeta = metaMensal > 0 ? (totalAtendidos / metaMensal) * 100 : 0;
    const totalProc = inscricoes.length;

    let diasOp = 0;
    if (acao?.data_inicio && acao?.data_fim) {
        const diff = new Date(acao.data_fim).getTime() - new Date(acao.data_inicio).getTime();
        diasOp = Math.max(1, Math.round(diff / 86400000));
    }

    const kpis = [
        { label: 'ATENDIDOS', value: String(totalAtendidos), cor: VERDE },
        { label: 'META MENSAL', value: metaMensal ? String(metaMensal) : '—', cor: AZUL_MEDIO },
        { label: '% DA META', value: `${pctMeta.toFixed(0)}%`, cor: pctMeta >= 100 ? VERDE : AMARELO },
        { label: 'DIAS OPER.', value: String(diasOp), cor: ROXO },
        { label: 'TOTAL INSC.', value: String(totalProc), cor: AZUL },
    ];

    const kpiW = (pageW - 28) / kpis.length;
    const kpiY = 96;
    kpis.forEach((k, i) => {
        const kx = 14 + i * kpiW;
        doc.setFillColor(...k.cor);
        doc.roundedRect(kx, kpiY, kpiW - 3, 26, 3, 3, 'F');
        doc.setTextColor(255, 255, 255).setFont('helvetica', 'bold').setFontSize(15);
        doc.text(k.value, kx + (kpiW - 3) / 2, kpiY + 12, { align: 'center' });
        doc.setFontSize(6.5).setFont('helvetica', 'normal');
        doc.text(k.label, kx + (kpiW - 3) / 2, kpiY + 20, { align: 'center' });
    });

    // Barra de progresso
    const barY = 130;
    const barW = pageW - 28;
    doc.setTextColor(0, 0, 0).setFont('helvetica', 'bold').setFontSize(8);
    doc.text('Progresso da Meta:', 14, barY - 2);
    doc.setFillColor(...CINZA);
    doc.roundedRect(14, barY, barW, 9, 2, 2, 'F');
    if (metaMensal > 0) {
        const fill = Math.min(1, totalAtendidos / metaMensal);
        doc.setFillColor(...(pctMeta >= 100 ? VERDE : AZUL_MEDIO));
        doc.roundedRect(14, barY, barW * fill, 9, 2, 2, 'F');
    }
    doc.setTextColor(255, 255, 255).setFont('helvetica', 'bold').setFontSize(7);
    doc.text(`${pctMeta.toFixed(1)}%`, 14 + barW / 2, barY + 6, { align: 'center' });

    // Responsável Técnico
    doc.setTextColor(50, 50, 50).setFont('helvetica', 'normal').setFontSize(8.5);
    const rtNome = responsavelTecnico?.nome || 'Não informado';
    const rtCrm = responsavelTecnico?.crm || '';
    const rtEsp = responsavelTecnico?.especialidade || '';
    doc.text(
        `Responsável Técnico: ${rtNome}${rtCrm ? ` — CRM ${rtCrm}` : ''}${rtEsp ? ` — ${rtEsp}` : ''}`,
        14, 148
    );

    doc.setFontSize(7.5).setTextColor(120, 120, 120);
    doc.text(`Gerado em: ${fmtDate(new Date())} | gestaosobrerodas.com.br`, pageW / 2, 156, { align: 'center' });

    addFooter(doc, 1);
}

// ── PÁGINA 2 — BPA ────────────────────────────────────────────────────────────
function buildBPA(
    doc: jsPDF,
    dados: DadosRelatorioExecutivo,
    opcoes: { dataInicio: string; dataFim: string; numeroProcesso?: string },
    pageNum: number
): void {
    const { acao, inscricoes, medicos } = dados;
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    doc.setFillColor(...AZUL);
    doc.rect(0, 0, pageW, 26, 'F');
    doc.setTextColor(255, 255, 255).setFont('helvetica', 'bold').setFontSize(12);
    doc.text('BOLETIM DE PRODUÇÃO AMBULATORIAL — INDIVIDUAL (BPA-I)', pageW / 2, 12, { align: 'center' });
    doc.setFont('helvetica', 'normal').setFontSize(8);
    doc.text(`Emissão: ${fmtDate(new Date())} | Processo: ${opcoes.numeroProcesso || acao?.numero_processo || 'N/A'}`, pageW / 2, 21, { align: 'center' });

    const procedimentos: any[] = acao?.cursos_exames || [];
    const procRows: any[] = [];
    let totalQtd = 0;
    let totalValor = 0;

    procedimentos.forEach((p: any) => {
        const exame = p.curso_exame || p;
        const qtdAtd = inscricoes.filter((i: any) =>
            i.status === 'atendido' && (i.curso_exame_id === exame.id || i.curso_exame?.id === exame.id)
        ).length;
        const valUnit = parseFloat(exame.valor_unitario || '0') || 0;
        const valTotal = qtdAtd * valUnit;
        totalQtd += qtdAtd;
        totalValor += valTotal;
        procRows.push([exame.codigo_sus || '—', exame.nome || 'N/A', String(qtdAtd), `R$ ${fmtBRL(valUnit)}`, `R$ ${fmtBRL(valTotal)}`]);
    });

    if (procRows.length === 0) {
        const totalAtd = inscricoes.filter((i: any) => i.status === 'atendido').length;
        procRows.push(['—', acao?.tipo || 'Procedimentos Gerais', String(totalAtd), 'R$ 0,00', 'R$ 0,00']);
        totalQtd = totalAtd;
    }

    procRows.push([
        { content: 'TOTAL', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [241, 245, 249] as any } },
        { content: String(totalQtd), styles: { fontStyle: 'bold', fillColor: [241, 245, 249] as any } },
        { content: '', styles: { fillColor: [241, 245, 249] as any } },
        { content: `R$ ${fmtBRL(totalValor)}`, styles: { fontStyle: 'bold', fillColor: [241, 245, 249] as any } },
    ]);

    let currentPg = pageNum;
    autoTable(doc, {
        startY: 30,
        head: [['Cód. SUS', 'Procedimento', 'Qtd. Realizada', 'Valor Unit. (R$)', 'Valor Total (R$)']],
        body: procRows,
        headStyles: { fillColor: AZUL, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 8 },
        alternateRowStyles: { fillColor: [248, 249, 250] },
        columnStyles: { 0: { cellWidth: 22 }, 2: { halign: 'center' }, 3: { halign: 'right' }, 4: { halign: 'right' } },
        didDrawPage: () => { addFooter(doc, currentPg++); },
        margin: { left: 14, right: 14 },
    });

    if (medicos.length === 0) { addFooter(doc, currentPg); return; }

    const finalY = (doc as any).lastAutoTable?.finalY ?? 130;
    if (finalY + 60 > pageH - 20) { doc.addPage(); currentPg++; }

    doc.setFont('helvetica', 'bold').setFontSize(10).setTextColor(...AZUL);
    doc.text('PRODUÇÃO POR MÉDICO', 14, ((doc as any).lastAutoTable?.finalY ?? finalY) + 12);

    const medicoRows = medicos.map((m: any) => [
        m.nome || m.funcionario?.nome || 'N/A',
        m.crm || m.funcionario?.crm || '—',
        m.especialidade || m.funcionario?.especialidade || '—',
        String(m.total_atendimentos || 0),
        `${parseFloat(m.total_horas || '0').toFixed(1)}h`,
        m.total_atendimentos > 0
            ? `${(parseFloat(m.total_horas || '0') * 60 / m.total_atendimentos).toFixed(0)} min`
            : '—',
    ]);

    autoTable(doc, {
        startY: ((doc as any).lastAutoTable?.finalY ?? finalY) + 16,
        head: [['Médico', 'CRM', 'Especialidade', 'Atendimentos', 'Horas Trab.', 'Tempo Médio']],
        body: medicoRows,
        headStyles: { fillColor: AZUL, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 8 },
        alternateRowStyles: { fillColor: [248, 249, 250] },
        didDrawPage: () => { addFooter(doc, currentPg++); },
        margin: { left: 14, right: 14 },
    });
}

// ── PÁGINA 3 — Análise Demográfica ────────────────────────────────────────────
function buildDemografia(doc: jsPDF, inscricoes: any[], pageNum: number): void {
    const pageW = doc.internal.pageSize.getWidth();

    doc.setFillColor(...AZUL);
    doc.rect(0, 0, pageW, 26, 'F');
    doc.setTextColor(255, 255, 255).setFont('helvetica', 'bold').setFontSize(13);
    doc.text('PERFIL DOS BENEFICIÁRIOS', pageW / 2, 16, { align: 'center' });

    // Gênero
    const generoMap: Record<string, number> = {};
    inscricoes.forEach((i: any) => {
        const g = i.cidadao?.genero || i.genero || 'Não inf.';
        generoMap[g] = (generoMap[g] || 0) + 1;
    });
    const generos = Object.entries(generoMap).map(([genero, qtd]) => ({ genero, qtd }));

    doc.setTextColor(...AZUL).setFont('helvetica', 'bold').setFontSize(10);
    doc.text('Distribuição por Gênero', 14, 34);

    const coresBarra: [number, number, number][] = [AZUL_MEDIO, AMARELO, VERDE, ROXO, [239, 68, 68]];
    const totalI = inscricoes.length;

    if (generos.length > 0) {
        const maxVal = Math.max(...generos.map(g => g.qtd));
        const maxBarH = 55;
        const baseY = 98;
        generos.forEach((g, i) => {
            const barH = (g.qtd / maxVal) * maxBarH;
            const bx = 24 + i * 64;
            const by = baseY - barH;
            doc.setFillColor(...coresBarra[i % coresBarra.length]);
            doc.rect(bx, by, 46, barH, 'F');
            doc.setTextColor(0, 0, 0).setFont('helvetica', 'bold').setFontSize(8.5);
            doc.text(String(g.qtd), bx + 23, by - 2, { align: 'center' });
            doc.setFont('helvetica', 'normal').setFontSize(7.5);
            doc.text(g.genero.substring(0, 10), bx + 23, baseY + 7, { align: 'center' });
            doc.setTextColor(100, 100, 100).setFontSize(7);
            doc.text(`${totalI > 0 ? ((g.qtd / totalI) * 100).toFixed(1) : '0'}%`, bx + 23, baseY + 13, { align: 'center' });
        });
    } else {
        doc.setTextColor(100, 100, 100).setFontSize(9).setFont('helvetica', 'normal');
        doc.text('Dados de gênero não disponíveis neste conjunto.', 14, 80);
    }

    // Faixa etária
    const faixaMap: Record<string, number> = { '0-17': 0, '18-29': 0, '30-39': 0, '40-49': 0, '50-59': 0, '60+': 0 };
    inscricoes.forEach((i: any) => {
        const dn = i.cidadao?.data_nascimento || i.data_nascimento;
        if (!dn) return;
        const idade = calcIdade(dn);
        if (idade < 18) faixaMap['0-17']++;
        else if (idade <= 29) faixaMap['18-29']++;
        else if (idade <= 39) faixaMap['30-39']++;
        else if (idade <= 49) faixaMap['40-49']++;
        else if (idade <= 59) faixaMap['50-59']++;
        else faixaMap['60+']++;
    });
    const faixas = Object.entries(faixaMap).map(([faixa, qtd]) => ({ faixa, qtd })).filter(f => f.qtd > 0);

    doc.setTextColor(...AZUL).setFont('helvetica', 'bold').setFontSize(10);
    doc.text('Distribuição por Faixa Etária', 14, 120);

    if (faixas.length > 0) {
        const maxVal2 = Math.max(...faixas.map(f => f.qtd));
        const maxBarH2 = 50;
        const baseY2 = 182;
        faixas.forEach((f, i) => {
            const barH = (f.qtd / maxVal2) * maxBarH2;
            const bx = 14 + i * 33;
            const by = baseY2 - barH;
            doc.setFillColor(...AZUL);
            doc.rect(bx, by, 26, barH, 'F');
            doc.setTextColor(0, 0, 0).setFont('helvetica', 'bold').setFontSize(8);
            doc.text(String(f.qtd), bx + 13, by - 2, { align: 'center' });
            doc.setFont('helvetica', 'normal').setFontSize(7);
            doc.text(f.faixa, bx + 13, baseY2 + 6, { align: 'center' });
        });
    }

    // Tabelas
    const generoRows = generos.map(g => [g.genero, String(g.qtd), `${totalI > 0 ? ((g.qtd / totalI) * 100).toFixed(1) : '0'}%`]);
    const faixaRows = faixas.map(f => [f.faixa, String(f.qtd), `${totalI > 0 ? ((f.qtd / totalI) * 100).toFixed(1) : '0'}%`]);

    let pg = pageNum;
    autoTable(doc, {
        startY: 200,
        head: [['Gênero', 'Qtd.', '%']],
        body: generoRows.length > 0 ? generoRows : [['N/D', '—', '—']],
        headStyles: { fillColor: AZUL, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 8 },
        tableWidth: 85,
        margin: { left: 14 },
        didDrawPage: () => { addFooter(doc, pg++); },
    });

    autoTable(doc, {
        startY: 200,
        head: [['Faixa Etária', 'Qtd.', '%']],
        body: faixaRows.length > 0 ? faixaRows : [['N/D', '—', '—']],
        headStyles: { fillColor: AZUL_MEDIO, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 8 },
        tableWidth: 85,
        margin: { left: 108 },
        didDrawPage: () => { addFooter(doc, pg++); },
    });
}

// ── PÁGINA 4 — Financeiro ─────────────────────────────────────────────────────
function buildFinanceiro(doc: jsPDF, dados: DadosRelatorioExecutivo, pageNum: number): void {
    const { custos, inscricoes } = dados;
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    doc.setFillColor(...AZUL);
    doc.rect(0, 0, pageW, 26, 'F');
    doc.setTextColor(255, 255, 255).setFont('helvetica', 'bold').setFontSize(13);
    doc.text('DEMONSTRATIVO DE CUSTOS OPERACIONAIS', pageW / 2, 16, { align: 'center' });

    const categMap: Record<string, number> = { 'Funcionários': 0, 'Combustível': 0, 'Manutenção': 0, 'Outros': 0 };
    const categCount: Record<string, number> = { 'Funcionários': 0, 'Combustível': 0, 'Manutenção': 0, 'Outros': 0 };
    custos.forEach((c: any) => {
        const tipo = (c.tipo || c.categoria || 'outros').toLowerCase();
        const valor = parseFloat(c.valor || c.valor_total || '0') || 0;
        if (tipo.includes('funcionario') || tipo.includes('salario') || tipo.includes('diaria')) {
            categMap['Funcionários'] += valor; categCount['Funcionários']++;
        } else if (tipo.includes('combustivel') || tipo.includes('combustível')) {
            categMap['Combustível'] += valor; categCount['Combustível']++;
        } else if (tipo.includes('manutencao') || tipo.includes('manutenção')) {
            categMap['Manutenção'] += valor; categCount['Manutenção']++;
        } else {
            categMap['Outros'] += valor; categCount['Outros']++;
        }
    });

    const totalCusto = Object.values(categMap).reduce((a, b) => a + b, 0);
    const categorias = Object.entries(categMap)
        .map(([nome, total]) => ({ nome, total, qtd: categCount[nome] }))
        .filter(c => c.total > 0);

    const custosRows: any[] = categorias.map(c => [
        c.nome, String(c.qtd), `R$ ${fmtBRL(c.total)}`,
        `${totalCusto > 0 ? ((c.total / totalCusto) * 100).toFixed(1) : '0'}%`,
    ]);
    custosRows.push([
        { content: 'TOTAL GERAL', styles: { fontStyle: 'bold' } },
        { content: String(custos.length), styles: { fontStyle: 'bold' } },
        { content: `R$ ${fmtBRL(totalCusto)}`, styles: { fontStyle: 'bold' } },
        { content: '100%', styles: { fontStyle: 'bold' } },
    ]);

    let pg = pageNum;
    autoTable(doc, {
        startY: 32,
        head: [['Categoria', 'Qtd. Lançamentos', 'Valor Total (R$)', '% do Total']],
        body: custosRows.length > 1 ? custosRows : [['Sem dados financeiros', '0', 'R$ 0,00', '—'], custosRows[custosRows.length - 1]],
        headStyles: { fillColor: AZUL, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 8 },
        alternateRowStyles: { fillColor: [248, 249, 250] },
        didDrawPage: () => { addFooter(doc, pg++); },
        margin: { left: 14, right: 14 },
    });

    const yG = ((doc as any).lastAutoTable?.finalY ?? 110) + 14;
    const maxCusto = Math.max(...categorias.map(c => c.total), 1);
    const coresBar: [number, number, number][] = [AZUL_MEDIO, VERDE, AMARELO, ROXO];

    if (yG + categorias.length * 22 + 30 < pageH - 20) {
        doc.setFont('helvetica', 'bold').setFontSize(10).setTextColor(...AZUL);
        doc.text('Distribuição de Custos por Categoria', 14, yG);

        categorias.forEach((cat, i) => {
            const barW = (cat.total / maxCusto) * 140;
            const ly = yG + 10 + i * 20;
            doc.setFillColor(...coresBar[i % coresBar.length]);
            doc.rect(65, ly, barW, 11, 'F');
            doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(0, 0, 0);
            doc.text(cat.nome, 62, ly + 8, { align: 'right' });
            doc.setFont('helvetica', 'bold');
            doc.text(`R$ ${fmtBRL(cat.total)}`, 65 + barW + 3, ly + 8);
        });

        const totalAtd = inscricoes.filter((i: any) => i.status === 'atendido').length;
        const custoPorPessoa = totalAtd > 0 ? totalCusto / totalAtd : 0;
        const yKpi = yG + 10 + categorias.length * 20 + 12;

        if (yKpi + 20 < pageH - 20) {
            doc.setFillColor(...AZUL);
            doc.roundedRect(14, yKpi, pageW - 28, 16, 3, 3, 'F');
            doc.setTextColor(255, 255, 255).setFont('helvetica', 'bold').setFontSize(10);
            doc.text(`Custo Médio por Pessoa Atendida: R$ ${fmtBRL(custoPorPessoa)}`, pageW / 2, yKpi + 11, { align: 'center' });
        }
    }

    addFooter(doc, pg);
}

// ── PÁGINA 5 — Relação Nominal ────────────────────────────────────────────────
function buildRelacaoNominal(doc: jsPDF, inscricoes: any[], pageNum: number): void {
    const pageW = doc.internal.pageSize.getWidth();
    const atendidos = inscricoes.filter((i: any) => i.status === 'atendido');

    doc.setFillColor(...AZUL);
    doc.rect(0, 0, pageW, 26, 'F');
    doc.setTextColor(255, 255, 255).setFont('helvetica', 'bold').setFontSize(13);
    doc.text('RELAÇÃO NOMINAL DE BENEFICIÁRIOS ATENDIDOS', pageW / 2, 14, { align: 'center' });
    doc.setFont('helvetica', 'normal').setFontSize(9);
    doc.text(`Total: ${atendidos.length} beneficiários`, pageW / 2, 22, { align: 'center' });

    const rows = atendidos.map((i: any, idx: number) => [
        String(idx + 1).padStart(3, '0'),
        (i.cidadao?.nome_completo || i.nome_completo || 'N/A').substring(0, 30),
        i.cidadao?.cpf || i.cpf || '—',
        i.cidadao?.cns || '—',
        (i.curso_exame?.nome || '—').substring(0, 18),
        fmtDate(i.updated_at || i.created_at),
    ]);

    let pg = pageNum;
    autoTable(doc, {
        startY: 30,
        head: [['Nº', 'Nome Completo', 'CPF', 'CNS', 'Procedimento', 'Data']],
        body: rows.length > 0 ? rows : [['—', 'Nenhum beneficiário atendido', '', '', '', '']],
        headStyles: { fillColor: AZUL, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 7.5 },
        alternateRowStyles: { fillColor: [248, 249, 250] },
        columnStyles: { 0: { cellWidth: 12 }, 2: { cellWidth: 28 }, 3: { cellWidth: 20 }, 5: { cellWidth: 20 } },
        didDrawPage: () => { addFooter(doc, pg++); },
        margin: { left: 14, right: 14 },
    });
}

// ── PÁGINA FINAL — Encerramento ───────────────────────────────────────────────
function buildEncerramento(doc: jsPDF, dados: DadosRelatorioExecutivo, opcoes: { numeroProcesso?: string }, pageNum: number): void {
    const { responsavelTecnico, acao } = dados;
    const pageW = doc.internal.pageSize.getWidth();

    doc.setFillColor(...AZUL);
    doc.rect(0, 0, pageW, 26, 'F');
    doc.setTextColor(255, 255, 255).setFont('helvetica', 'bold').setFontSize(13);
    doc.text('ENCERRAMENTO E DECLARAÇÃO', pageW / 2, 16, { align: 'center' });

    doc.setTextColor(0, 0, 0).setFont('helvetica', 'normal').setFontSize(10);
    const declaracao = `Declaramos que as informações prestadas neste relatório são verídicas e correspondem às atividades realizadas conforme contrato/processo nº ${opcoes.numeroProcesso || acao?.numero_processo || 'N/A'}, durante o período de execução das atividades ambulatoriais da Unidade Móvel de Saúde — Sistema Gestão Sobre Rodas.`;
    const linhas = doc.splitTextToSize(declaracao, pageW - 28);
    doc.text(linhas, 14, 40);

    if (acao?.intercorrencias) {
        doc.setFont('helvetica', 'bold').setFontSize(10).setTextColor(...AZUL);
        doc.text('Intercorrências Registradas:', 14, 88);
        doc.setFont('helvetica', 'normal').setTextColor(0, 0, 0).setFontSize(9);
        const li = doc.splitTextToSize(String(acao.intercorrencias), pageW - 28);
        doc.text(li, 14, 98);
    }

    // Quadro de assinatura
    const sigY = 148;
    const sigX = pageW / 2 - 55;
    doc.setDrawColor(...AZUL).setLineWidth(0.5);
    doc.rect(sigX, sigY, 110, 48);
    doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(0, 0, 0);
    doc.text('_'.repeat(38), sigX + 55, sigY + 26, { align: 'center' });

    const rtNome = responsavelTecnico?.nome || 'Responsável Técnico';
    const rtCrm = responsavelTecnico?.crm || '';
    const rtEsp = responsavelTecnico?.especialidade || '';
    doc.setFont('helvetica', 'bold').setFontSize(8);
    doc.text(rtNome.substring(0, 35), sigX + 55, sigY + 34, { align: 'center' });
    doc.setFont('helvetica', 'normal').setFontSize(7);
    if (rtCrm) doc.text(`CRM: ${rtCrm}${rtEsp ? ' | ' + rtEsp : ''}`, sigX + 55, sigY + 40, { align: 'center' });
    doc.text('Responsável Técnico', sigX + 55, sigY + 46, { align: 'center' });

    doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(60, 60, 60);
    doc.text(`São Luís/MA, ${fmtDateLong(new Date())}`, 14, sigY + 62);

    addFooter(doc, pageNum);
}

// ── EXPORT PRINCIPAL ──────────────────────────────────────────────────────────
export async function gerarPrestacaoContasPDF(
    dados: DadosRelatorioExecutivo,
    opcoes: {
        dataInicio: string;
        dataFim: string;
        numeroProcesso?: string;
        loteRegiao?: string;
        intercorrencias?: string;
    }
): Promise<void> {
    try {
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

        // Contador manual de páginas
        let pageCounter = 1;

        // P1: Capa
        buildCapa(doc, dados, opcoes);

        // P2: BPA
        doc.addPage(); pageCounter++;
        buildBPA(doc, dados, opcoes, pageCounter);
        pageCounter = doc.getNumberOfPages();

        // P3: Demográfico
        doc.addPage(); pageCounter++;
        buildDemografia(doc, dados.inscricoes, pageCounter);
        pageCounter = doc.getNumberOfPages();

        // P4: Financeiro
        doc.addPage(); pageCounter++;
        buildFinanceiro(doc, dados, pageCounter);
        pageCounter = doc.getNumberOfPages();

        // P5+: Relação Nominal
        doc.addPage(); pageCounter++;
        buildRelacaoNominal(doc, dados.inscricoes, pageCounter);
        pageCounter = doc.getNumberOfPages();

        // Última: Encerramento
        doc.addPage(); pageCounter++;
        buildEncerramento(doc, dados, opcoes, pageCounter);

        // Atualizar total de páginas nos rodapés
        const totalPgs = doc.getNumberOfPages();
        _totalPgsRef = totalPgs;

        for (let i = 1; i <= totalPgs; i++) {
            doc.setPage(i);
            const pageW = doc.internal.pageSize.getWidth();
            const pageH = doc.internal.pageSize.getHeight();
            // Cobrir rodapé antigo
            doc.setFillColor(255, 255, 255).rect(0, pageH - 10, pageW, 10, 'F');
            doc.setFontSize(7).setTextColor(150, 150, 150).setFont('helvetica', 'normal');
            doc.text(
                `Sistema Gestão Sobre Rodas | gestaosobrerodas.com.br | Página ${i} de ${totalPgs}`,
                pageW / 2, pageH - 3, { align: 'center' }
            );
        }

        // Salvar
        const acao = dados.acao;
        const nomeArq = `prestacao_contas_${acao?.numero_acao || 'acao'}_${acao?.municipio || ''}_${opcoes.dataInicio}_${opcoes.dataFim}`
            .replace(/\s+/g, '_')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
        doc.save(`${nomeArq}.pdf`);
    } catch (err: any) {
        console.error('❌ Erro ao gerar PDF de Prestação de Contas:', err);
        throw new Error(
            err?.message?.includes('Cannot read') || err?.message?.includes('undefined')
                ? 'Erro ao gerar PDF: dados da ação incompletos. Verifique se a ação possui inscrições e dados financeiros.'
                : `Erro ao gerar PDF: ${err?.message || 'Tente novamente ou entre em contato com o suporte.'}`
        );
    }
}
