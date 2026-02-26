import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import './PrestacaoContas.css';

interface Medico { id: string; nome: string; crm?: string; especialidade?: string; }
interface AcaoOpcao { id: string; nome: string; municipio: string; estado: string; data_inicio: string; data_fim: string; }
interface AcaoPeriodo {
    id: string; nome: string; municipio: string; estado: string;
    data_inicio: string; data_fim: string;
    numero_processo?: string; numero_cnes?: string; lote_regiao?: string;
    meta_mensal_total?: number; intercorrencias?: string;
    instituicao?: { razao_social: string; cnpj: string; };
}
interface PorProcedimento { codigo_sus: string; procedimento: string; quantidade: number; valor_unitario: number; valor_total: number; }
interface RelacaoNominal { nome_paciente: string; cns: string; data_procedimento: string; tipo_procedimento: string; municipio: string; numero_prontuario: string; }
interface RelatorioData {
    identificacao: {
        municipios_atendidos: string;
        periodo_execucao: { competencia: string; inicio: string; fim: string; };
        acoes_no_periodo: AcaoPeriodo[];
    };
    producao: { total_exames: number; meta_mensal: number; percentual_meta: number; dias_operacionais: number; disponibilidade_operacional: number; };
    por_procedimento: PorProcedimento[];
    valor_variavel_total: number;
    relacao_nominal: RelacaoNominal[];
    indicadores_sla: { disponibilidade_operacional: number; prazo_medio_laudo: number; indice_repeticao: number; };
    medicos_disponiveis: Medico[];
}

const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const anoAtual = new Date().getFullYear();
const anos = Array.from({ length: 5 }, (_, i) => anoAtual - i);

function fmt(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
function fmtDate(d: string) { if (!d) return '—'; return new Date(d).toLocaleDateString('pt-BR'); }

function slaClass(indicador: string, valor: number) {
    if (indicador === 'disponibilidade') return valor >= 90 ? 'pc-sla-ok' : valor >= 70 ? 'pc-sla-warn' : 'pc-sla-bad';
    if (indicador === 'prazo') return valor <= 7 ? 'pc-sla-ok' : valor <= 14 ? 'pc-sla-warn' : 'pc-sla-bad';
    if (indicador === 'repeticao') return valor <= 3 ? 'pc-sla-ok' : valor <= 8 ? 'pc-sla-warn' : 'pc-sla-bad';
    return 'pc-sla-ok';
}

export default function PrestacaoContas() {
    const [mes, setMes] = useState(new Date().getMonth() + 1);
    const [ano, setAno] = useState(anoAtual);
    const [acaoId, setAcaoId] = useState('');
    const [medicoId, setMedicoId] = useState('');
    const [dados, setDados] = useState<RelatorioData | null>(null);
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState('');
    const [acoes, setAcoes] = useState<AcaoOpcao[]>([]);
    const documentoRef = useRef<HTMLDivElement>(null);

    // Campos manuais
    const [empresaCredenciada, setEmpresaCredenciada] = useState('');
    const [cnpj, setCnpj] = useState('');
    const [loteRegiao, setLoteRegiao] = useState('');
    const [unidadeFederativa, setUnidadeFederativa] = useState('');
    const [cnesUnidade, setCnesUnidade] = useState('');
    const [localData, setLocalData] = useState('');
    const [intercorrencias, setIntercorrencias] = useState('');
    const [numeroContrato, setNumeroContrato] = useState('');
    const [numeroProcesso, setNumeroProcesso] = useState('');

    // Estado separado para médicos (carrega ao montar, independente do relatório)
    const [medicos, setMedicos] = useState<Medico[]>([]);

    useEffect(() => {
        // Carrega ações
        api.get('/acoes').then(r => setAcoes(r.data?.acoes || r.data || [])).catch(() => { });
        // Carrega médicos cadastrados com flag is_medico (independente do relatório)
        api.get('/funcionarios').then(r => {
            const lista: any[] = Array.isArray(r.data) ? r.data : (r.data?.funcionarios || r.data?.data || []);
            setMedicos(lista.filter(f => f.is_medico).map(f => ({ id: f.id, nome: f.nome, crm: f.crm, especialidade: f.especialidade })));
        }).catch(() => { });
    }, []);

    async function gerarRelatorio() {
        setLoading(true);
        setErro('');
        try {
            const params: any = { mes, ano };
            if (acaoId) params.acao_id = acaoId;
            const { data } = await api.get('/relatorios/prestacao-contas', { params });
            setDados(data);
            // Auto-preencher campos
            if (data.identificacao?.acoes_no_periodo?.length > 0) {
                const a = data.identificacao.acoes_no_periodo[0];
                if (a.lote_regiao) setLoteRegiao(a.lote_regiao);
                if (a.numero_cnes) setCnesUnidade(a.numero_cnes);
                if (a.estado) setUnidadeFederativa(a.estado);
                if (a.instituicao?.razao_social) setEmpresaCredenciada(a.instituicao.razao_social);
                if (a.instituicao?.cnpj) setCnpj(a.instituicao.cnpj);
                if (a.intercorrencias) setIntercorrencias(a.intercorrencias);
                if (a.numero_processo) setNumeroProcesso(a.numero_processo);
            }
        } catch (e: any) {
            setErro(e?.response?.data?.error || 'Erro ao gerar relatório');
        }
        setLoading(false);
    }

    // Médico selecionado — prioriza o estado local (medicos), fallback nos dados do relatório
    function gerarPDF() {
        if (!documentoRef.current) return;

        // Coleta todo o CSS carregado na página (estilos inline e folhas de estilo)
        const cssTexts = Array.from(document.styleSheets)
            .flatMap(sheet => {
                try { return Array.from(sheet.cssRules).map(r => r.cssText); }
                catch { return []; }
            })
            .join('\n');

        const docHtml = documentoRef.current.outerHTML;
        const titulo = `PrestaçãoDeContas_${String(mes).padStart(2, '0')}_${ano}`;

        const janela = window.open('', '_blank');
        if (!janela) { alert('Permita popups para gerar o PDF.'); return; }

        janela.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <title>${titulo}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet"/>
  <style>
    /* ── Todos os estilos da aplicação ── */
    ${cssTexts}

    /* ── Overrides: documento preenche a folha A4 sem bordas brancas ── */
    *, *::before, *::after {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      box-sizing: border-box;
    }

    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      background: #fff;
      font-family: 'Inter', sans-serif;
    }

    /* Documento sem margens extras — ocupa 100% da folha */
    .pc-documento {
      width: 100% !important;
      max-width: 100% !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      border: none !important;
      overflow: visible !important;
    }

    .pc-documento-wrapper {
      padding: 0 !important;
      margin: 0 !important;
      width: 100% !important;
    }

    .pc-kpi-grid {
      grid-template-columns: repeat(4, 1fr) !important;
    }

    .pc-table { width: 100% !important; }

    /* SEM margens de página — o próprio documento tem seu espaçamento interno */
    @page {
      size: A4 portrait;
      margin: 0;
    }

    @media print {
      *, *::before, *::after {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      html, body { width: 100% !important; margin: 0 !important; padding: 0 !important; }
      .pc-id-row input, .pc-local-date-row input {
        border: none !important;
        border-bottom: 1px solid #555 !important;
        background: transparent !important;
      }
      .pc-textarea-fancy { border: 1px solid #ccc !important; background: transparent !important; }
      .pc-section { break-inside: avoid; page-break-inside: avoid; }
      .pc-kpi-card { break-inside: avoid; }
      .pc-table-wrapper { break-inside: avoid; }
      .pc-doc-footer { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="pc-documento-wrapper">
    ${docHtml}
  </div>
  <script>
    // Escala o documento para preencher 100% da largura da janela antes de imprimir
    function ajustarZoom() {
      var wrapper = document.querySelector('.pc-documento-wrapper');
      var doc = document.querySelector('.pc-documento');
      if (!doc || !wrapper) return;
      var winW = window.innerWidth || document.documentElement.clientWidth;
      var docW = doc.scrollWidth;
      if (docW > 0 && winW > 0) {
        var scale = winW / docW;
        doc.style.transformOrigin = 'top left';
        doc.style.transform = 'scale(' + scale + ')';
        wrapper.style.height = (doc.scrollHeight * scale) + 'px';
      }
    }
    document.fonts.ready.then(function() {
      ajustarZoom();
      setTimeout(function() { window.print(); }, 500);
    });
  </script>
</body>
</html>`);
        janela.document.close();
    }



    // Médico selecionado — prioriza o estado local (medicos), fallback nos dados do relatório
    const medicoSelecionado =
        medicos.find(m => m.id === medicoId) ||
        dados?.medicos_disponiveis?.find(m => m.id === medicoId);
    const periodoExecucao = dados?.identificacao?.periodo_execucao;
    const competencia = periodoExecucao?.competencia || `${String(mes).padStart(2, '0')}/${ano}`;
    const primeiraAcao = dados?.identificacao?.acoes_no_periodo?.[0];
    const municipiosAtendidos = dados?.identificacao?.municipios_atendidos || '—';

    return (
        <div className="prestacao-contas-page">

            {/* ════ HERO BANNER ════ */}
            <motion.div
                className="pc-hero no-print"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
            >
                <div className="pc-hero-content">
                    <div className="pc-hero-badge">
                        <span className="dot" />
                        Sistema de Gestão em Saúde
                    </div>
                    <h1 className="pc-hero-title">
                        Prestação de <span>Contas Mensal</span>
                    </h1>
                    <p className="pc-hero-sub">Relatório Executivo · Unidade Móvel de Atenção Especializada – Tipologia 1</p>
                </div>
            </motion.div>

            {/* ════ PAINEL DE CONTROLE ════ */}
            <motion.div
                className="pc-controls-wrapper no-print"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4 }}
            >
                <div className="pc-controls-card">
                    <div className="pc-field-group">
                        <label>📅 Mês de Competência</label>
                        <select className="pc-select" value={mes} onChange={e => setMes(+e.target.value)}>
                            {meses.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                        </select>
                    </div>

                    <div className="pc-field-group" style={{ maxWidth: 120 }}>
                        <label>📆 Ano</label>
                        <select className="pc-select" value={ano} onChange={e => setAno(+e.target.value)}>
                            {anos.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                    </div>

                    <div className="pc-field-group">
                        <label>⚡ Filtrar por Ação</label>
                        <select className="pc-select" value={acaoId} onChange={e => setAcaoId(e.target.value)}>
                            <option value="">— Todas as Ações do Período —</option>
                            {acoes.map(a => <option key={a.id} value={a.id}>{a.nome} · {a.municipio}/{a.estado}</option>)}
                        </select>
                    </div>

                    <div className="pc-field-group">
                        <label>👨‍⚕️ Responsável Técnico</label>
                        <select className="pc-select" value={medicoId} onChange={e => setMedicoId(e.target.value)}>
                            <option value="">— Selecionar Médico —</option>
                            {/* Médicos da listagem local (carregados no mount) */}
                            {medicos.map(m => (
                                <option key={m.id} value={m.id}>{m.nome}{m.crm ? ` · CRM ${m.crm}` : ''}</option>
                            ))}
                            {/* Médicos extras retornados pelo relatório mas que não estejam na lista */}
                            {(dados?.medicos_disponiveis || []).filter(m => !medicos.find(ml => ml.id === m.id)).map(m => (
                                <option key={m.id} value={m.id}>{m.nome}{m.crm ? ` · CRM ${m.crm}` : ''}</option>
                            ))}
                        </select>
                    </div>

                    <div className="pc-actions-group">
                        <button className="pc-btn-primary" onClick={gerarRelatorio} disabled={loading}>
                            {loading ? <><span className="pc-spinner" /> Gerando...</> : <>🔄 Gerar Relatório</>}
                        </button>
                        {dados && (
                            <button
                                className="pc-btn-pdf"
                                onClick={gerarPDF}
                                title="Abre o diálogo de impressão/PDF do navegador"
                            >
                                📄 Gerar PDF
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Erro */}
            {erro && (
                <div className="pc-error-bar no-print">
                    ⚠️ {erro}
                </div>
            )}

            {/* Estado vazio */}
            {!dados && !loading && !erro && (
                <motion.div
                    className="pc-empty-state no-print"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="pc-empty-icon">📋</div>
                    <h3>Selecione o período e gere o relatório</h3>
                    <p>Escolha o mês, ano e ação (opcional) no painel acima e clique em <strong>Gerar Relatório</strong></p>
                </motion.div>
            )}

            {/* ════════════════════════════════════════
                DOCUMENTO EXECUTIVO
                ════════════════════════════════════════ */}
            <AnimatePresence>
                {dados && (
                    <motion.div
                        className="pc-documento-wrapper"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                    >
                        <div className="pc-documento" ref={documentoRef}>

                            {/* ── Cabeçalho ── */}
                            <div className="pc-doc-header">
                                <div className="pc-doc-header-content">
                                    <div className="pc-doc-badge">Documento Oficial</div>
                                    <h1 className="pc-doc-title">Relatório Executivo de Prestação de Contas</h1>
                                    <p className="pc-doc-subtitle">Unidade Móvel de Atenção Especializada – Tipologia 1</p>
                                    <span className="pc-doc-competencia">
                                        📅 Competência: {competencia}
                                        {primeiraAcao?.numero_processo && <>&nbsp;·&nbsp;Processo nº {primeiraAcao.numero_processo}</>}
                                    </span>
                                </div>
                            </div>

                            <div className="pc-doc-body">

                                {/* ── Seção 1: Identificação ── */}
                                <motion.div className="pc-section" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                                    <div className="pc-section-header">
                                        <div className="pc-section-icon">🏢</div>
                                        <div>
                                            <div className="pc-section-num">Seção 01</div>
                                            <div className="pc-section-title">Identificação da Unidade</div>
                                        </div>
                                    </div>
                                    <div className="pc-id-grid">
                                        {/* Contrato e Processo — primeira linha destaque */}
                                        <div className="pc-id-row">
                                            <strong>Contrato nº</strong>
                                            <input value={numeroContrato} onChange={e => setNumeroContrato(e.target.value)} placeholder="Número do contrato..." />
                                        </div>
                                        <div className="pc-id-row">
                                            <strong>Processo nº</strong>
                                            <input value={numeroProcesso} onChange={e => setNumeroProcesso(e.target.value)} placeholder="Ex: AGS05.002888/2025-81" />
                                        </div>
                                        <div className="pc-id-row">
                                            <strong>Empresa Credenciada</strong>
                                            <input value={empresaCredenciada} onChange={e => setEmpresaCredenciada(e.target.value)} placeholder="Nome da empresa..." />
                                        </div>
                                        <div className="pc-id-row">
                                            <strong>CNPJ</strong>
                                            <input value={cnpj} onChange={e => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" />
                                        </div>
                                        <div className="pc-id-row">
                                            <strong>Lote / Região</strong>
                                            <input value={loteRegiao} onChange={e => setLoteRegiao(e.target.value)} placeholder="Ex: Lote 01 – Região Norte" />
                                        </div>
                                        <div className="pc-id-row">
                                            <strong>Unidade Federativa</strong>
                                            <input value={unidadeFederativa} onChange={e => setUnidadeFederativa(e.target.value)} placeholder="Ex: MA" />
                                        </div>
                                        <div className="pc-id-row pc-id-row-full">
                                            <strong>Município(s) Atendido(s)</strong>
                                            <span>{municipiosAtendidos}</span>
                                        </div>
                                        <div className="pc-id-row">
                                            <strong>Período de Execução</strong>
                                            <span>{periodoExecucao ? `${fmtDate(periodoExecucao.inicio)} a ${fmtDate(periodoExecucao.fim)}` : '—'}</span>
                                        </div>
                                        <div className="pc-id-row">
                                            <strong>Responsável Técnico (RT)</strong>
                                            <span>{medicoSelecionado?.nome || '— Selecione o médico no painel acima —'}</span>
                                        </div>
                                        <div className="pc-id-row">
                                            <strong>CRM / RQE</strong>
                                            <span>{medicoSelecionado?.crm || '—'}</span>
                                        </div>
                                        <div className="pc-id-row">
                                            <strong>CNES da Unidade Móvel</strong>
                                            <input value={cnesUnidade} onChange={e => setCnesUnidade(e.target.value)} placeholder="0000000" />
                                        </div>
                                    </div>
                                </motion.div>

                                {/* ── Seção 2: Resumo Executivo ── */}
                                <motion.div className="pc-section" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
                                    <div className="pc-section-header">
                                        <div className="pc-section-icon">📊</div>
                                        <div>
                                            <div className="pc-section-num">Seção 02</div>
                                            <div className="pc-section-title">Resumo Executivo da Produção</div>
                                        </div>
                                    </div>
                                    <p className="pc-meta-text">
                                        Meta contratual mensal: <strong>{dados.producao.meta_mensal.toLocaleString('pt-BR')} atendimentos</strong>.
                                        O alcance mínimo de 50% da meta mensal é condição obrigatória para liberação financeira.
                                    </p>
                                    <div className="pc-kpi-grid">
                                        <motion.div className="pc-kpi-card" whileHover={{ scale: 1.02 }}>
                                            <div className="pc-kpi-value">{dados.producao.total_exames}</div>
                                            <div className="pc-kpi-label">Exames Realizados</div>
                                            <div className="pc-kpi-icon">🔬</div>
                                        </motion.div>
                                        <motion.div className="pc-kpi-card" whileHover={{ scale: 1.02 }}>
                                            <div className="pc-kpi-value">{dados.producao.percentual_meta}%</div>
                                            <div className="pc-kpi-label">Meta Atingida</div>
                                            <div className="pc-kpi-icon">🎯</div>
                                        </motion.div>
                                        <motion.div className="pc-kpi-card" whileHover={{ scale: 1.02 }}>
                                            <div className="pc-kpi-value">{dados.producao.dias_operacionais}</div>
                                            <div className="pc-kpi-label">Dias Operacionais</div>
                                            <div className="pc-kpi-icon">📅</div>
                                        </motion.div>
                                        <motion.div className="pc-kpi-card" whileHover={{ scale: 1.02 }}>
                                            <div className="pc-kpi-value">{dados.producao.disponibilidade_operacional}%</div>
                                            <div className="pc-kpi-label">Disponibilidade</div>
                                            <div className="pc-kpi-icon">⚡</div>
                                        </motion.div>
                                    </div>
                                </motion.div>

                                {/* ── Seção 3: Produção por Procedimento ── */}
                                <motion.div className="pc-section" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                                    <div className="pc-section-header">
                                        <div className="pc-section-icon">🧬</div>
                                        <div>
                                            <div className="pc-section-num">Seção 03</div>
                                            <div className="pc-section-title">Produção Consolidada por Procedimento (SIGTAP)</div>
                                        </div>
                                    </div>
                                    {dados.por_procedimento.length === 0 ? (
                                        <p style={{ color: '#94A3B8', fontStyle: 'italic', fontSize: '0.85rem', padding: '16px', background: '#F8FAFC', borderRadius: 10, textAlign: 'center' }}>
                                            Nenhum procedimento registrado no período selecionado.
                                        </p>
                                    ) : (
                                        <div className="pc-table-wrapper">
                                            <table className="pc-table">
                                                <thead>
                                                    <tr>
                                                        <th>Código SUS</th>
                                                        <th>Procedimento</th>
                                                        <th style={{ textAlign: 'center' }}>Qtd.</th>
                                                        <th style={{ textAlign: 'right' }}>Valor Unit.</th>
                                                        <th style={{ textAlign: 'right' }}>Valor Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {dados.por_procedimento.map((p, i) => (
                                                        <tr key={i}>
                                                            <td><span className="pc-code-badge">{p.codigo_sus}</span></td>
                                                            <td>{p.procedimento}</td>
                                                            <td style={{ textAlign: 'center', fontWeight: 700 }}>{p.quantidade}</td>
                                                            <td style={{ textAlign: 'right' }}>{fmt(p.valor_unitario)}</td>
                                                            <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmt(p.valor_total)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                <tfoot>
                                                    <tr>
                                                        <td colSpan={4} style={{ textAlign: 'right' }}>Valor variável apurado no período:</td>
                                                        <td style={{ textAlign: 'right' }}>{fmt(dados.valor_variavel_total)}</td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    )}
                                </motion.div>

                                {/* ── Seção 4: SIA/SUS ── */}
                                <motion.div className="pc-section" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
                                    <div className="pc-section-header">
                                        <div className="pc-section-icon">🏥</div>
                                        <div>
                                            <div className="pc-section-num">Seção 04</div>
                                            <div className="pc-section-title">Envio ao Sistema SIA/SUS</div>
                                        </div>
                                    </div>
                                    <p className="pc-formal-text">
                                        Declara-se que a produção foi registrada em sistema eletrônico compatível com as bases federais do SUS,
                                        processada via <strong>CMD Coleta</strong> e enviada ao <strong>Sistema de Informações Ambulatoriais do SUS (SIA/SUS)</strong>.
                                    </p>
                                    <ul className="pc-bullet-list">
                                        <li>Protocolo de envio CMD Coleta</li>
                                        <li>Relatório de exportação SIA/SUS</li>
                                        <li>Arquivo de produção por competência</li>
                                    </ul>
                                </motion.div>

                                {/* ── Seção 5: Conformidade ── */}
                                <motion.div className="pc-section" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                                    <div className="pc-section-header">
                                        <div className="pc-section-icon">📁</div>
                                        <div>
                                            <div className="pc-section-num">Seção 05</div>
                                            <div className="pc-section-title">Conformidade do Prontuário Eletrônico</div>
                                        </div>
                                    </div>
                                    <p className="pc-formal-text">
                                        Todos os atendimentos foram registrados em <strong>Prontuário Eletrônico do Paciente (PEP)</strong>,
                                        contendo anamnese, exame físico, prescrição, solicitação e resultado de exames,
                                        bem como encaminhamentos. O sistema assegura armazenamento seguro, rastreabilidade
                                        e conformidade com a <strong>LGPD</strong>.
                                    </p>
                                </motion.div>

                                {/* ── Seção 6: SLA ── */}
                                <motion.div className="pc-section" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
                                    <div className="pc-section-header">
                                        <div className="pc-section-icon">📈</div>
                                        <div>
                                            <div className="pc-section-num">Seção 06</div>
                                            <div className="pc-section-title">Indicadores de SLA</div>
                                        </div>
                                    </div>
                                    <div className="pc-table-wrapper">
                                        <table className="pc-table pc-sla-table">
                                            <thead>
                                                <tr>
                                                    <th>Indicador</th>
                                                    <th>Meta Contratual</th>
                                                    <th>Resultado do Período</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td><strong>Disponibilidade Operacional</strong></td>
                                                    <td>≥ 90%</td>
                                                    <td><strong>{dados.indicadores_sla.disponibilidade_operacional}%</strong></td>
                                                    <td><span className={`pc-sla-badge ${slaClass('disponibilidade', dados.indicadores_sla.disponibilidade_operacional)}`}>{dados.indicadores_sla.disponibilidade_operacional >= 90 ? '✓ Atingida' : '⚠ Abaixo'}</span></td>
                                                </tr>
                                                <tr>
                                                    <td><strong>Prazo Médio de Emissão de Laudo</strong></td>
                                                    <td>≤ 7 dias úteis</td>
                                                    <td><strong>{dados.indicadores_sla.prazo_medio_laudo} dias</strong></td>
                                                    <td><span className={`pc-sla-badge ${slaClass('prazo', dados.indicadores_sla.prazo_medio_laudo)}`}>{dados.indicadores_sla.prazo_medio_laudo <= 7 ? '✓ No Prazo' : '⚠ Excedido'}</span></td>
                                                </tr>
                                                <tr>
                                                    <td><strong>Índice de Repetição Técnica</strong></td>
                                                    <td>≤ 3%</td>
                                                    <td><strong>{dados.indicadores_sla.indice_repeticao}%</strong></td>
                                                    <td><span className={`pc-sla-badge ${slaClass('repeticao', dados.indicadores_sla.indice_repeticao)}`}>{dados.indicadores_sla.indice_repeticao <= 3 ? '✓ Dentro' : '⚠ Excedido'}</span></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </motion.div>

                                {/* ── Seção 7: Intercorrências ── */}
                                <motion.div className="pc-section" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                                    <div className="pc-section-header">
                                        <div className="pc-section-icon">⚠️</div>
                                        <div>
                                            <div className="pc-section-num">Seção 07</div>
                                            <div className="pc-section-title">Intercorrências e Ações Corretivas</div>
                                        </div>
                                    </div>
                                    <p className="pc-formal-text">
                                        Descrever, se aplicável, eventos adversos, recaptação de exames ou ajustes operacionais realizados no período.
                                    </p>
                                    <textarea
                                        className="pc-textarea-fancy"
                                        value={intercorrencias}
                                        onChange={e => setIntercorrencias(e.target.value)}
                                        placeholder="Descreva aqui eventuais intercorrências ocorridas no período... (ou deixe em branco caso não haja)"
                                        rows={4}
                                    />
                                </motion.div>

                                {/* ── Seção 8: Declaração ── */}
                                <motion.div className="pc-section" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.45 }}>
                                    <div className="pc-section-header">
                                        <div className="pc-section-icon">✍️</div>
                                        <div>
                                            <div className="pc-section-num">Seção 08</div>
                                            <div className="pc-section-title">Declaração Formal</div>
                                        </div>
                                    </div>
                                    <div className="pc-declaration-box">
                                        <p className="pc-formal-text" style={{ marginBottom: 0 }}>
                                            Declaramos, sob responsabilidade técnica e administrativa, que as informações apresentadas
                                            refletem fielmente a produção assistencial realizada, estando em conformidade com o
                                            <strong> Termo de Referência</strong> e demais normativas aplicáveis.
                                        </p>
                                    </div>

                                    <div className="pc-local-date-row">
                                        <span>Local e Data:</span>
                                        <input value={localData} onChange={e => setLocalData(e.target.value)} placeholder="Cidade/UF, DD/MM/AAAA" />
                                    </div>

                                    <div className="pc-signatures">
                                        <div className="pc-sig-block">
                                            <div className="pc-sig-line" />
                                            <div className="pc-sig-name">Responsável Técnico</div>
                                            {medicoSelecionado &&
                                                <div className="pc-sig-detail">{medicoSelecionado.nome}{medicoSelecionado.crm ? ` · CRM ${medicoSelecionado.crm}` : ''}</div>
                                            }
                                            {medicoSelecionado?.especialidade &&
                                                <div className="pc-sig-detail">{medicoSelecionado.especialidade}</div>
                                            }
                                        </div>
                                        <div className="pc-sig-block">
                                            <div className="pc-sig-line" />
                                            <div className="pc-sig-name">Representante Legal</div>
                                            {empresaCredenciada && <div className="pc-sig-detail">{empresaCredenciada}</div>}
                                            {cnpj && <div className="pc-sig-detail">CNPJ: {cnpj}</div>}
                                        </div>
                                    </div>
                                </motion.div>

                            </div>{/* fim pc-doc-body */}

                            {/* Rodapé do documento */}
                            <div className="pc-doc-footer">
                                <div className="pc-doc-footer-text">
                                    Sistema de Gestão em Saúde · Gerado em {new Date().toLocaleString('pt-BR')}
                                </div>
                                <div className="pc-page-num">Competência {competencia}</div>
                            </div>

                        </div>{/* fim pc-documento */}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
