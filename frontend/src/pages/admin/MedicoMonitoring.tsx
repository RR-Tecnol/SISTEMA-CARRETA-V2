import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box, Container, Typography, Grid, Button, IconButton, Dialog,
    DialogTitle, DialogContent, DialogActions, TextField, CircularProgress,
    Chip, Tooltip, MenuItem, Select, FormControl, InputLabel, Divider,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Alert, Collapse,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity, Clock, UserCheck, AlertTriangle, BarChart2,
    LogIn, LogOut, Plus, FileText, ChevronDown, ChevronUp,
    Timer, Stethoscope, TrendingUp, Award, Search, RefreshCw,
    Download, Radio, Trophy, Globe,
} from 'lucide-react';
import { useSnackbar } from 'notistack';
import { expressoTheme } from '../../theme/expressoTheme';
import { medicoMonitoringService } from '../../services/medicoMonitoring';
import api from '../../services/api';

// --"?--"?--"? Types --"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?
interface Medico { id: string; nome: string; cargo: string; especialidade?: string; custo_diaria: number; ativo: boolean; }
interface Ponto { id: string; funcionario_id: string; acao_id?: string; data_hora_entrada: string; data_hora_saida?: string; horas_trabalhadas?: number; status: 'trabalhando' | 'saiu'; observacoes?: string; funcionario?: Medico; acao?: { id: string; numero_acao: string; nome: string }; atendimentos?: Atendimento[]; }
interface Atendimento { id: string; funcionario_id: string; acao_id?: string; cidadao_id?: string; ponto_id?: string | null; hora_inicio: string; hora_fim?: string; duracao_minutos?: number; status: 'em_andamento' | 'concluido' | 'cancelado'; observacoes?: string; nome_paciente?: string; cidadao?: { id: string; nome: string }; funcionario?: Medico; acao?: { id: string; numero_acao: string; nome: string }; }
interface Dashboard { medicosAtivos: number; atendimentosHoje: number; atendimentosConcluidos: number; tempoMedioMinutos: number; totalMedicos: number; topMedico: { nome: string; total: number } | null; alertas: { medico_nome: string; entrada: string; ponto_id: string }[]; }
interface Acao { id: string; numero_acao: string; nome: string; status: string; }
interface Relatorio { funcionario: Medico & { custo_diaria: number }; metricas: { totalDiasTrabalhados: number; totalHorasTrabalhadas: number; totalAtendidos: number; atendimentosCancelados: number; atendimentosEmAndamento: number; tempoMedioMinutos: number; custoTotal: number; }; pontos: Ponto[]; atendimentos: Atendimento[]; }
interface AtendimentoLive extends Atendimento { tempo_decorrido_segundos: number; nome_paciente_display: string; }
interface RelatorioGeral { periodo: { data_inicio: string | null; data_fim: string | null }; totais: { totalAtendidos: number; totalMedicos: number; tempoMedioMinutos: number; custoTotalGeral: number; }; medicos: Array<{ medico: Medico & { custo_diaria: number }; metricas: { totalAtendidos: number; totalAtendimentos: number; atendimentosCancelados: number; tempoMedioMinutos: number; totalHorasTrabalhadas: number; totalDiasTrabalhados: number; custoTotal: number; }; atendimentos: Atendimento[]; }>; gerado_em: string; }

// --"?--"?--"? Utilities --"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?
const formatHora = (d: string) => new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
const formatData = (d: string) => new Date(d).toLocaleDateString('pt-BR');
const formatDuracao = (min?: number) => { if (!min) return '--'; const h = Math.floor(min / 60); const m = min % 60; return h > 0 ? `${h}h ${m}min` : `${m}min`; };
const calcMinutosDesde = (d: string) => Math.floor((Date.now() - new Date(d).getTime()) / 60000);

// --"?--"?--"? Sub-components --"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?
const PulsingDot: React.FC<{ color: string }> = ({ color }) => (
    <Box sx={{ position: 'relative', display: 'inline-flex', width: 12, height: 12 }}>
        <Box sx={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', bgcolor: color, animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite', opacity: 0.75 }} />
        <Box sx={{ position: 'relative', width: '100%', height: '100%', borderRadius: '50%', bgcolor: color }} />
        <style>{`@keyframes ping { 75%,to { transform: scale(2); opacity: 0 } }`}</style>
    </Box>
);

const KpiCard: React.FC<{ icon: React.ReactNode; title: string; value: string | number; sub?: string; color: string; idx: number }> = ({ icon, title, value, sub, color, idx }) => (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1, type: 'spring', stiffness: 200 }}>
        <Box sx={{ background: expressoTheme.colors.cardBackground, borderRadius: expressoTheme.borderRadius.large, border: `1px solid ${expressoTheme.colors.border}`, p: 3, boxShadow: expressoTheme.shadows.card, position: 'relative', overflow: 'hidden', transition: 'all .3s', '&:hover': { transform: 'translateY(-4px)', boxShadow: expressoTheme.shadows.cardHover } }}>
            <Box sx={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: color, opacity: 0.08 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ p: 1.5, borderRadius: expressoTheme.borderRadius.medium, background: color, color: 'white', display: 'flex' }}>{icon}</Box>
                <Box>
                    <Typography sx={{ fontSize: '0.75rem', color: expressoTheme.colors.textSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>{title}</Typography>
                    <Typography sx={{ fontSize: '2rem', fontWeight: 800, color: expressoTheme.colors.primaryDark, lineHeight: 1 }}>{value}</Typography>
                    {sub && <Typography sx={{ fontSize: '0.75rem', color: expressoTheme.colors.textSecondary, mt: 0.5 }}>{sub}</Typography>}
                </Box>
            </Box>
        </Box>
    </motion.div>
);

// --"?--"?--"? Main Component --"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?
// ── CSV Export ──
const exportarCSV = (dados: any[], nomeArquivo: string) => {
    if (!dados.length) return;
    const headers = Object.keys(dados[0]);
    const rows = dados.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = nomeArquivo; a.click();
    URL.revokeObjectURL(url);
};

// ── PDF Export (Relatório Individual) ──
const exportarRelatorioPDF = (relatorio: Relatorio) => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { jsPDF } = require('jspdf');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { autoTable } = require('jspdf-autotable');

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const azul: [number, number, number] = [30, 90, 180];
    const azulClaro: [number, number, number] = [240, 246, 255];

    // Header
    doc.setFillColor(...azul);
    doc.rect(0, 0, pageW, 28, 'F');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório Médico — Sistema Carretas', 14, 12);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Médico: ${relatorio.funcionario.nome}  |  Especialidade: ${relatorio.funcionario.especialidade || relatorio.funcionario.cargo}`, 14, 20);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageW - 60, 20);

    // Métricas
    let y = 36;
    doc.setFontSize(11);
    doc.setTextColor(30, 60, 120);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo do Período', 14, y);
    y += 6;

    const metricas = [
        ['Dias Trabalhados', String(relatorio.metricas.totalDiasTrabalhados)],
        ['Horas Totais', `${relatorio.metricas.totalHorasTrabalhadas}h`],
        ['Pacientes Atendidos', String(relatorio.metricas.totalAtendidos)],
        ['Tempo Médio', relatorio.metricas.tempoMedioMinutos ? `${relatorio.metricas.tempoMedioMinutos}min` : '--'],
        ['Cancelados', String(relatorio.metricas.atendimentosCancelados)],
        ['Custo Total', `R$ ${relatorio.metricas.custoTotal.toFixed(2)}`],
    ];

    autoTable(doc, {
        startY: y,
        head: [['Métrica', 'Valor']],
        body: metricas,
        theme: 'grid',
        tableWidth: 100,
        headStyles: { fillColor: azul, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: azulClaro },
        margin: { left: 14 },
    });

    // Tabela de Atendimentos
    const finalY1 = (doc as any).lastAutoTable?.finalY ?? y + 50;
    y = finalY1 + 10;

    doc.setFontSize(11);
    doc.setTextColor(30, 60, 120);
    doc.setFont('helvetica', 'bold');
    doc.text('Histórico de Atendimentos', 14, y);
    y += 4;

    autoTable(doc, {
        startY: y,
        head: [['Data', 'Paciente', 'Ação', 'Início', 'Fim', 'Duração', 'Status']],
        body: relatorio.atendimentos.map(a => [
            new Date(a.hora_inicio).toLocaleDateString('pt-BR'),
            a.nome_paciente || (a as any).cidadao?.nome || '--',
            (a as any).acao?.nome || '--',
            new Date(a.hora_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            a.hora_fim ? new Date(a.hora_fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--',
            a.duracao_minutos ? `${a.duracao_minutos}min` : '--',
            a.status === 'concluido' ? 'Concluído' : a.status === 'cancelado' ? 'Cancelado' : 'Em Andamento',
        ]),
        theme: 'striped',
        headStyles: { fillColor: azul, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 8.5 },
        alternateRowStyles: { fillColor: azulClaro },
        margin: { left: 14, right: 14 },
        didDrawPage: (_data: any) => {
            const pg = doc.internal.getCurrentPageInfo().pageNumber;
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(`Página ${pg}  |  Sistema Carretas`, pageW / 2, doc.internal.pageSize.getHeight() - 6, { align: 'center' });
        },
    });

    doc.save(`relatorio_${relatorio.funcionario.nome.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
};

// ── PDF Export (Relatório Geral) ──
const exportarRelatorioGeralPDF = (relatorioGeral: RelatorioGeral) => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { jsPDF } = require('jspdf');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { autoTable } = require('jspdf-autotable');

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const azul: [number, number, number] = [30, 90, 180];
    const azulClaro: [number, number, number] = [240, 246, 255];
    const amarelo: [number, number, number] = [255, 251, 235];

    // Header
    doc.setFillColor(...azul);
    doc.rect(0, 0, pageW, 28, 'F');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório Geral — Todos os Médicos', 14, 12);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const periodo = relatorioGeral.periodo.data_inicio && relatorioGeral.periodo.data_fim
        ? `Período: ${new Date(relatorioGeral.periodo.data_inicio).toLocaleDateString('pt-BR')} a ${new Date(relatorioGeral.periodo.data_fim).toLocaleDateString('pt-BR')}`
        : 'Período: todos os registros';
    doc.text(periodo, 14, 20);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageW - 60, 20);

    // Totais
    let y = 36;
    doc.setFontSize(11);
    doc.setTextColor(30, 60, 120);
    doc.setFont('helvetica', 'bold');
    doc.text('Totais Gerais', 14, y);
    y += 6;

    autoTable(doc, {
        startY: y,
        head: [['Total Atendidos', 'Total Médicos', 'Tempo Médio Geral', 'Custo Total Geral']],
        body: [[
            String(relatorioGeral.totais.totalAtendidos),
            String(relatorioGeral.totais.totalMedicos),
            relatorioGeral.totais.tempoMedioMinutos ? `${relatorioGeral.totais.tempoMedioMinutos}min` : '--',
            `R$ ${relatorioGeral.totais.custoTotalGeral.toFixed(2)}`,
        ]],
        theme: 'grid',
        headStyles: { fillColor: azul, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 10, fontStyle: 'bold', halign: 'center' },
        margin: { left: 14, right: 14 },
    });

    // Ranking de Médicos
    const finalY2 = (doc as any).lastAutoTable?.finalY ?? y + 30;
    y = finalY2 + 10;

    doc.setFontSize(11);
    doc.setTextColor(30, 60, 120);
    doc.setFont('helvetica', 'bold');
    doc.text('Ranking de Médicos', 14, y);
    y += 4;

    const rankingOrdenado = [...relatorioGeral.medicos].sort((a, b) => b.metricas.totalAtendidos - a.metricas.totalAtendidos);

    autoTable(doc, {
        startY: y,
        head: [['#', 'Médico', 'Especialidade', 'Atendidos', 'Tempo Médio', 'Horas Trab.', 'Cancelados', 'Custo']],
        body: rankingOrdenado.map((m, i) => [
            i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`,
            m.medico.nome,
            m.medico.especialidade || m.medico.cargo,
            String(m.metricas.totalAtendidos),
            m.metricas.tempoMedioMinutos ? `${m.metricas.tempoMedioMinutos}min` : '--',
            `${m.metricas.totalHorasTrabalhadas}h`,
            String(m.metricas.atendimentosCancelados),
            `R$ ${m.metricas.custoTotal.toFixed(2)}`,
        ]),
        theme: 'striped',
        headStyles: { fillColor: azul, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 8.5 },
        alternateRowStyles: { fillColor: azulClaro },
        didParseCell: (data: any) => {
            if (data.section === 'body' && data.row.index === 0) {
                data.cell.styles.fillColor = amarelo;
                data.cell.styles.fontStyle = 'bold';
            }
        },
        margin: { left: 14, right: 14 },
        didDrawPage: (_data: any) => {
            const pg = doc.internal.getCurrentPageInfo().pageNumber;
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(`Página ${pg}  |  Sistema Carretas`, pageW / 2, doc.internal.pageSize.getHeight() - 6, { align: 'center' });
        },
    });

    doc.save(`relatorio_geral_${new Date().toISOString().split('T')[0]}.pdf`);
};


const formatTimer = (s: number) => {
    const m = Math.floor(s / 60); const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
};

const MedicoMonitoring: React.FC = () => {
    const { enqueueSnackbar } = useSnackbar();
    const [medicos, setMedicos] = useState<Medico[]>([]);
    const [pontos, setPontos] = useState<Ponto[]>([]);
    const [dashboard, setDashboard] = useState<Dashboard | null>(null);
    const [acoes, setAcoes] = useState<Acao[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [alertasOpen, setAlertasOpen] = useState(true);

    // Atendimentos de hoje (direto, sem depender de pontos)
    const [atendimentosHoje, setAtendimentosHoje] = useState<Atendimento[]>([]);

    // Live attendances state
    const [liveAtendimentos, setLiveAtendimentos] = useState<AtendimentoLive[]>([]);
    const [liveTickets, setLiveTickets] = useState<Record<string, number>>({});
    const liveTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Ranking / Relatório Geral
    const [relatorioGeralModal, setRelatorioGeralModal] = useState(false);
    const [relGeralFiltros, setRelGeralFiltros] = useState({ data_inicio: '', data_fim: '', acao_id: '' });
    const [relatorioGeral, setRelatorioGeral] = useState<RelatorioGeral | null>(null);
    const [loadingRelGeral, setLoadingRelGeral] = useState(false);

    // Modal states
    const [pontoModal, setPontoModal] = useState<{ open: boolean; tipo: 'entrada' | 'saida'; ponto?: Ponto }>({ open: false, tipo: 'entrada' });
    const [atendimentoModal, setAtendimentoModal] = useState<{ open: boolean; medico?: Medico; ponto?: Ponto }>({ open: false });
    const [detalheModal, setDetalheModal] = useState<{ open: boolean; medico?: Medico }>({ open: false });
    const [relatorioModal, setRelatorioModal] = useState<{ open: boolean; medico?: Medico }>({ open: false });

    // Form states
    const [pontoForm, setPontoForm] = useState({ funcionario_id: '', acao_id: '', observacoes: '' });
    const [atendForm, setAtendForm] = useState({ nome_paciente: '', observacoes: '' });
    const [relFiltros, setRelFiltros] = useState({ data_inicio: '', data_fim: '', acao_id: '' });
    const [relatorio, setRelatorio] = useState<Relatorio | null>(null);
    const [loadingRel, setLoadingRel] = useState(false);

    // Detalhe pontos
    const [medicoDetalhe, setMedicoDetalhe] = useState<Ponto[]>([]);
    const [medicoDetalheAtendimentos, setMedicoDetalheAtendimentos] = useState<Atendimento[]>([]);
    const [loadingDetalhe, setLoadingDetalhe] = useState(false);

    const hoje = new Date().toISOString().split('T')[0];

    const fetchAll = useCallback(async (silent = false) => {
        if (!silent) setLoading(true); else setRefreshing(true);
        try {
            // allSettled: erro em uma chamada não zera as demais
            const [mRes, pRes, dRes, aRes, atdRes] = await Promise.allSettled([
                medicoMonitoringService.getMedicos(),
                medicoMonitoringService.getPontos({ data_inicio: hoje, data_fim: hoje }),
                medicoMonitoringService.getDashboard(),
                api.get('/acoes', { params: { limit: 200 } }),
                api.get('/medico-monitoring/atendimentos', { params: { data_inicio: hoje, data_fim: hoje, limit: 500 } }),
            ]);

            if (mRes.status === 'fulfilled') setMedicos(mRes.value.data || []);
            if (pRes.status === 'fulfilled') setPontos(Array.isArray(pRes.value.data) ? pRes.value.data : []);
            if (dRes.status === 'fulfilled') setDashboard(dRes.value.data);
            if (aRes.status === 'fulfilled') {
                const acoesData = aRes.value.data?.data || aRes.value.data?.acoes || aRes.value.data || [];
                setAcoes(Array.isArray(acoesData) ? acoesData : []);
            }
            if (atdRes.status === 'fulfilled') {
                const atdData = Array.isArray(atdRes.value.data) ? atdRes.value.data : (atdRes.value.data?.atendimentos || []);
                setAtendimentosHoje(atdData);
            } else {
                console.warn('⚠️ /atendimentos falhou:', (atdRes as any).reason?.message);
            }

            // Só exibe erro se as chamadas críticas falharem
            const criticas = [mRes, dRes];
            if (criticas.some(r => r.status === 'rejected')) {
                enqueueSnackbar('Erro ao carregar dados principais', { variant: 'error' });
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [hoje, enqueueSnackbar]);

    // Buscar atendimentos ao vivo
    const fetchLive = useCallback(async () => {
        try {
            const res = await api.get('/medico-monitoring/stats/tempo-real');
            const atds: AtendimentoLive[] = res.data.atendimentos || [];
            setLiveAtendimentos(atds);
            // Seed do ticker com os segundos atuais
            const map: Record<string, number> = {};
            atds.forEach(a => { map[a.id] = a.tempo_decorrido_segundos; });
            setLiveTickets(map);
        } catch { /* silencioso */ }
    }, []);

    useEffect(() => { fetchAll(); fetchLive(); }, [fetchAll, fetchLive]);
    // Auto-refresh a cada 30s (dados), live a cada 10s
    useEffect(() => { const t = setInterval(() => fetchAll(true), 30000); return () => clearInterval(t); }, [fetchAll]);
    useEffect(() => { const t = setInterval(fetchLive, 10000); return () => clearInterval(t); }, [fetchLive]);

    // Ticker local: incrementa 1s por segundo nos atendimentos ao vivo
    useEffect(() => {
        if (liveTimerRef.current) clearInterval(liveTimerRef.current);
        liveTimerRef.current = setInterval(() => {
            setLiveTickets(prev => {
                const next = { ...prev };
                Object.keys(next).forEach(k => { next[k] = (next[k] || 0) + 1; });
                return next;
            });
        }, 1000);
        return () => { if (liveTimerRef.current) clearInterval(liveTimerRef.current); };
    }, [liveAtendimentos]);

    const getPontoAtivo = (medicoId: string) => pontos.find(p => p.funcionario_id === medicoId && p.status === 'trabalhando');

    const handleEntrada = async () => {
        try {
            await medicoMonitoringService.registrarEntrada({ funcionario_id: pontoForm.funcionario_id, acao_id: pontoForm.acao_id || undefined, observacoes: pontoForm.observacoes || undefined });
            enqueueSnackbar('Entrada registrada!', { variant: 'success' });
            setPontoModal({ open: false, tipo: 'entrada' });
            setPontoForm({ funcionario_id: '', acao_id: '', observacoes: '' });
            fetchAll(true);
        } catch (err: any) { enqueueSnackbar(err.response?.data?.error || 'Erro ao registrar entrada', { variant: 'error' }); }
    };

    const handleSaida = async () => {
        if (!pontoModal.ponto) return;
        try {
            await medicoMonitoringService.registrarSaida(pontoModal.ponto.id, { observacoes: pontoForm.observacoes || undefined });
            enqueueSnackbar('Saída registrada!', { variant: 'success' });
            setPontoModal({ open: false, tipo: 'saida' });
            setPontoForm({ funcionario_id: '', acao_id: '', observacoes: '' });
            fetchAll(true);
        } catch (err: any) { enqueueSnackbar(err.response?.data?.error || 'Erro ao registrar saída', { variant: 'error' }); }
    };

    const handleAtendimento = async () => {
        if (!atendimentoModal.medico) return;
        try {
            await medicoMonitoringService.iniciarAtendimento({ funcionario_id: atendimentoModal.medico.id, ponto_id: atendimentoModal.ponto?.id, nome_paciente: atendForm.nome_paciente || undefined, observacoes: atendForm.observacoes || undefined });
            enqueueSnackbar('Atendimento iniciado!', { variant: 'success' });
            setAtendimentoModal({ open: false });
            setAtendForm({ nome_paciente: '', observacoes: '' });
            fetchAll(true);
        } catch (err: any) { enqueueSnackbar(err.response?.data?.error || 'Erro ao iniciar atendimento', { variant: 'error' }); }
    };

    const handleFinalizarAtendimento = async (atdId: string) => {
        try {
            await medicoMonitoringService.finalizarAtendimento(atdId);
            enqueueSnackbar('Atendimento finalizado!', { variant: 'success' });
            if (detalheModal.medico) abrirDetalhe(detalheModal.medico);
            fetchAll(true);
        } catch (err: any) { enqueueSnackbar('Erro ao finalizar atendimento', { variant: 'error' }); }
    };

    const abrirDetalhe = async (medico: Medico) => {
        setDetalheModal({ open: true, medico });
        setMedicoDetalhe([]);
        setMedicoDetalheAtendimentos([]);
        setLoadingDetalhe(true);
        try {
            const [pontosRes, atdRes] = await Promise.allSettled([
                medicoMonitoringService.getPontos({ funcionario_id: medico.id, data_inicio: hoje, data_fim: hoje }),
                medicoMonitoringService.getAtendimentos({ funcionario_id: medico.id, data_inicio: hoje, data_fim: hoje }),
            ]);
            if (pontosRes.status === 'fulfilled') setMedicoDetalhe(Array.isArray(pontosRes.value.data) ? pontosRes.value.data : []);
            if (atdRes.status === 'fulfilled') {
                const atdData = Array.isArray(atdRes.value.data) ? atdRes.value.data : (atdRes.value.data?.atendimentos || []);
                setMedicoDetalheAtendimentos(atdData);
            }
        } catch { setMedicoDetalhe([]); } finally { setLoadingDetalhe(false); }
    };

    const gerarRelatorio = async (filtros?: { data_inicio?: string; data_fim?: string; acao_id?: string }) => {
        if (!relatorioModal.medico) return;
        setLoadingRel(true);
        const f = filtros || relFiltros;
        try {
            const res = await medicoMonitoringService.getRelatorio(relatorioModal.medico.id, { data_inicio: f.data_inicio || undefined, data_fim: f.data_fim || undefined, acao_id: f.acao_id || undefined });
            setRelatorio(res.data);
        } catch { enqueueSnackbar('Erro ao gerar relatório', { variant: 'error' }); } finally { setLoadingRel(false); }
    };

    const gerarRelatorioGeral = async () => {
        setLoadingRelGeral(true);
        try {
            const params: any = {};
            if (relGeralFiltros.data_inicio) params.data_inicio = relGeralFiltros.data_inicio;
            if (relGeralFiltros.data_fim) params.data_fim = relGeralFiltros.data_fim;
            if (relGeralFiltros.acao_id) params.acao_id = relGeralFiltros.acao_id;
            const res = await api.get('/medico-monitoring/relatorio/geral', { params });
            setRelatorioGeral(res.data);
        } catch { enqueueSnackbar('Erro ao gerar relatório geral', { variant: 'error' }); }
        finally { setLoadingRelGeral(false); }
    };

    const exportarRelatorioGeralCSV = () => {
        if (!relatorioGeral) return;
        const linhas = relatorioGeral.medicos.flatMap(m =>
            m.atendimentos.map((a: any) => ({
                medico: m.medico.nome,
                especialidade: m.medico.especialidade || m.medico.cargo,
                data: new Date(a.hora_inicio).toLocaleDateString('pt-BR'),
                hora_inicio: new Date(a.hora_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                hora_fim: a.hora_fim ? new Date(a.hora_fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '',
                duracao_minutos: a.duracao_minutos ?? '',
                paciente: a.nome_paciente || a.cidadao?.nome || '',
                acao: a.acao?.nome || '',
                status: a.status,
            }))
        );
        exportarCSV(linhas, `relatorio-medicos-${new Date().toISOString().split('T')[0]}.csv`);
        enqueueSnackbar('CSV exportado com sucesso!', { variant: 'success' });
    };

    const filteredMedicos = medicos.filter(m => m.nome.toLowerCase().includes(searchTerm.toLowerCase()) || (m.especialidade || '').toLowerCase().includes(searchTerm.toLowerCase()));

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: expressoTheme.colors.background, flexDirection: 'column', gap: 2 }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
                <Stethoscope size={48} color={expressoTheme.colors.primary} />
            </motion.div>
            <Typography sx={{ color: expressoTheme.colors.primaryDark, fontWeight: 600 }}>Carregando Módulo Médico...</Typography>
        </Box>
    );

    const alertas = dashboard?.alertas || [];

    return (
        <Box sx={{ minHeight: '100vh', background: expressoTheme.colors.background, pb: 6 }}>
            {/* HERO HEADER */}
            <Box sx={{ background: expressoTheme.gradients.primary, py: 5, px: 4, position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', top: -60, right: -60, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
                <Box sx={{ position: 'absolute', bottom: -40, left: '40%', width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
                <Container maxWidth="xl">
                    <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{ p: 2, background: 'rgba(255,255,255,0.15)', borderRadius: expressoTheme.borderRadius.large, backdropFilter: 'blur(10px)' }}>
                                    <Stethoscope size={36} color="white" />
                                </Box>
                                <Box>
                                    <Typography variant="h4" sx={{ color: 'white', fontWeight: 800, letterSpacing: -0.5 }}>Acompanhamento de Médicos</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                        <PulsingDot color={dashboard?.medicosAtivos ? '#4ade80' : '#94a3b8'} />
                                        <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem' }}>
                                            {dashboard?.medicosAtivos || 0} médico(s) trabalhando agora
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1.5 }}>
                                <Tooltip title="Atualizar dados">
                                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                        <IconButton onClick={() => fetchAll(true)} sx={{ background: 'rgba(255,255,255,0.15)', color: 'white', '&:hover': { background: 'rgba(255,255,255,0.25)' } }}>
                                            <motion.div animate={refreshing ? { rotate: 360 } : {}} transition={{ duration: 1, repeat: refreshing ? Infinity : 0, ease: 'linear' }}>
                                                <RefreshCw size={20} />
                                            </motion.div>
                                        </IconButton>
                                    </motion.div>
                                </Tooltip>
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Button variant="contained" startIcon={<LogIn size={18} />} onClick={() => { setPontoForm({ funcionario_id: '', acao_id: '', observacoes: '' }); setPontoModal({ open: true, tipo: 'entrada' }); }}
                                        sx={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', textTransform: 'none', fontWeight: 700, borderRadius: expressoTheme.borderRadius.medium, '&:hover': { background: 'rgba(255,255,255,0.3)' } }}>
                                        Registrar Entrada
                                    </Button>
                                </motion.div>
                            </Box>
                        </Box>
                    </motion.div>
                </Container>
            </Box>

            <Container maxWidth="xl" sx={{ mt: 3, position: 'relative', zIndex: 1 }}>
                {/* ALERTAS */}
                <AnimatePresence>
                    {alertas.length > 0 && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ marginBottom: 16 }}>
                            <Box sx={{ background: '#FFF3CD', borderRadius: expressoTheme.borderRadius.medium, border: '1px solid #FFC107', p: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setAlertasOpen(v => !v)}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <PulsingDot color="#f59e0b" />
                                        <Typography sx={{ fontWeight: 700, color: '#92400e' }}>
                                            --s--️ {alertas.length} médico(s) trabalhando sem atendimentos há mais de 1 hora
                                        </Typography>
                                    </Box>
                                    {alertasOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                </Box>
                                <Collapse in={alertasOpen}>
                                    <Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        {alertas.map((a, i) => (
                                            <Chip key={i} icon={<AlertTriangle size={14} />} label={`${a.medico_nome} -- entrada ${formatHora(a.entrada)}`} size="small" sx={{ background: '#FDE68A', color: '#92400e', fontWeight: 600 }} />
                                        ))}
                                    </Box>
                                </Collapse>
                            </Box>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* KPI CARDS */}
                <Grid container spacing={2.5} sx={{ mb: 3 }}>
                    {[
                        { icon: <Activity size={22} />, title: 'Ativos Agora', value: dashboard?.medicosAtivos || 0, sub: `de ${dashboard?.totalMedicos || 0} médicos`, color: expressoTheme.colors.primary },
                        { icon: <UserCheck size={22} />, title: 'Atendimentos Hoje', value: dashboard?.atendimentosHoje || 0, sub: `${dashboard?.atendimentosConcluidos || 0} concluídos`, color: expressoTheme.colors.success },
                        { icon: <Timer size={22} />, title: 'Tempo Médio', value: dashboard?.tempoMedioMinutos ? `${dashboard.tempoMedioMinutos}min` : '--', sub: 'por atendimento', color: expressoTheme.colors.info },
                        { icon: <Award size={22} />, title: 'Top Médico Hoje', value: dashboard?.topMedico?.total || 0, sub: dashboard?.topMedico?.nome || 'Nenhum atendimento', color: '#8b5cf6' },
                        { icon: <Radio size={22} />, title: 'Em Atendimento', value: liveAtendimentos.length, sub: 'agora mesmo', color: '#ef4444' },
                    ].map((kpi, i) => (
                        <Grid item xs={12} sm={6} lg={true} key={i}>
                            <KpiCard {...kpi} idx={i} />
                        </Grid>
                    ))}
                </Grid>

                {/* ── LIVE: EM ATENDIMENTO AGORA ── */}
                <AnimatePresence>
                    {liveAtendimentos.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ marginBottom: 24 }}>
                            <Box sx={{ background: expressoTheme.colors.cardBackground, borderRadius: expressoTheme.borderRadius.large, border: `2px solid #ef4444`, boxShadow: '0 4px 20px rgba(239,68,68,0.12)', overflow: 'hidden' }}>
                                <Box sx={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', px: 3, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <PulsingDot color="#fca5a5" />
                                    <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '0.95rem' }}>
                                        🔴 Em Atendimento Agora — {liveAtendimentos.length} consulta(s) ativa(s)
                                    </Typography>
                                </Box>
                                <Box sx={{ overflowX: 'auto' }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                {['Médico', 'Paciente', 'Ação', 'Início', 'Tempo Decorrido'].map(h => (
                                                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.75rem', background: '#fff5f5', color: '#991b1b' }}>{h}</TableCell>
                                                ))}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {liveAtendimentos.map(atd => (
                                                <TableRow key={atd.id} hover>
                                                    <TableCell sx={{ fontSize: '0.82rem', fontWeight: 600 }}>{(atd as any).funcionario?.nome || '—'}</TableCell>
                                                    <TableCell sx={{ fontSize: '0.82rem' }}>{atd.nome_paciente_display}</TableCell>
                                                    <TableCell sx={{ fontSize: '0.78rem', color: expressoTheme.colors.textSecondary }}>{(atd as any).acao?.nome || '—'}</TableCell>
                                                    <TableCell sx={{ fontSize: '0.78rem' }}>{formatHora(atd.hora_inicio)}</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={formatTimer(liveTickets[atd.id] || atd.tempo_decorrido_segundos)}
                                                            size="small"
                                                            icon={<Timer size={12} />}
                                                            sx={{
                                                                background: (liveTickets[atd.id] || 0) > 1800 ? '#FDE68A' : '#dcfce7',
                                                                color: (liveTickets[atd.id] || 0) > 1800 ? '#92400e' : '#166534',
                                                                fontWeight: 800, fontFamily: 'monospace', fontSize: '0.8rem',
                                                                '& .MuiChip-icon': { color: 'inherit' },
                                                            }}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </Box>
                            </Box>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* SEARCH + GRADE DE MÉDICOS */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: 1, minWidth: 200, background: expressoTheme.colors.cardBackground, borderRadius: expressoTheme.borderRadius.medium, border: `1px solid ${expressoTheme.colors.border}`, display: 'flex', alignItems: 'center', px: 2, py: 1 }}>
                            <Search size={18} color={expressoTheme.colors.textSecondary} style={{ marginRight: 8 }} />
                            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar médico..." style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.95rem', width: '100%', color: expressoTheme.colors.text }} />
                        </Box>
                        <Typography sx={{ color: expressoTheme.colors.textSecondary, fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                            {filteredMedicos.length} médico(s)
                        </Typography>
                        <Tooltip title="Relatório Geral de todos os médicos">
                            <Button variant="outlined" startIcon={<Globe size={16} />}
                                onClick={() => { setRelGeralFiltros({ data_inicio: '', data_fim: '', acao_id: '' }); setRelatorioGeral(null); setRelatorioGeralModal(true); }}
                                sx={{ textTransform: 'none', fontWeight: 700, borderColor: expressoTheme.colors.primary, color: expressoTheme.colors.primary, '&:hover': { background: expressoTheme.colors.cardHover, borderColor: expressoTheme.colors.primaryDark }, borderRadius: expressoTheme.borderRadius.medium, whiteSpace: 'nowrap' }}>
                                Relatório Geral
                            </Button>
                        </Tooltip>
                    </Box>

                    <Grid container spacing={3}>
                        <AnimatePresence>
                            {filteredMedicos.map((medico, idx) => {
                                const pontoAtivo = getPontoAtivo(medico.id);
                                // Busca atendimentos direto do AtendimentoMedico de hoje (não depende de ponto)
                                const atdsMedico = atendimentosHoje.filter((a: any) => {
                                    const fid = a.funcionario_id ?? a.funcionario?.id;
                                    return String(fid) === String(medico.id);
                                });
                                const totalAtd = atdsMedico.filter((a: any) => a.status === 'concluido').length;
                                const emAndamento = atdsMedico.filter((a: any) => a.status === 'em_andamento').length;

                                // Horas hoje = soma de pontos finalizados + ponto ativo atual
                                const pontosDoMedico = pontos.filter(p => String(p.funcionario_id) === String(medico.id));
                                const horasFinalizadas = pontosDoMedico
                                    .filter(p => p.status === 'saiu' && p.horas_trabalhadas)
                                    .reduce((acc, p) => acc + (Number(p.horas_trabalhadas) || 0), 0);
                                const minutosAtivo = pontoAtivo ? calcMinutosDesde(pontoAtivo.data_hora_entrada) : 0;
                                const totalMinutosHoje = Math.round(horasFinalizadas * 60) + minutosAtivo;
                                const isAtivo = !!pontoAtivo;
                                const horasDisplay = totalMinutosHoje > 0
                                    ? `${Math.floor(totalMinutosHoje / 60)}h${(totalMinutosHoje % 60).toString().padStart(2, '0')}min`
                                    : '--';

                                return (
                                    <Grid item xs={12} sm={6} lg={4} key={medico.id}>
                                        <motion.div
                                            initial={{ opacity: 0, y: 30, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            transition={{ delay: idx * 0.06, type: 'spring', stiffness: 180 }}
                                            whileHover={{ y: -6 }}
                                        >
                                            <Box sx={{
                                                background: expressoTheme.colors.cardBackground,
                                                borderRadius: expressoTheme.borderRadius.large,
                                                border: `2px solid ${isAtivo ? expressoTheme.colors.success : expressoTheme.colors.border}`,
                                                p: 3, boxShadow: isAtivo ? '0 4px 20px rgba(40,167,69,0.15)' : expressoTheme.shadows.card,
                                                transition: 'all .3s',
                                                '&:hover': { boxShadow: expressoTheme.shadows.cardHover }
                                            }}>
                                                {/* Card Header */}
                                                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                        <Box sx={{ width: 48, height: 48, borderRadius: '50%', background: expressoTheme.gradients.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: expressoTheme.shadows.button, flexShrink: 0 }}>
                                                            <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '1.1rem' }}>{medico.nome.charAt(0)}</Typography>
                                                        </Box>
                                                        <Box>
                                                            <Typography sx={{ fontWeight: 700, color: expressoTheme.colors.text, fontSize: '1rem', lineHeight: 1.2 }}>{medico.nome}</Typography>
                                                            <Typography sx={{ fontSize: '0.78rem', color: expressoTheme.colors.textSecondary }}>{medico.especialidade || medico.cargo}</Typography>
                                                        </Box>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        <PulsingDot color={isAtivo ? expressoTheme.colors.success : '#94a3b8'} />
                                                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: isAtivo ? expressoTheme.colors.success : expressoTheme.colors.textLight }}>
                                                            {isAtivo ? 'ATIVO' : 'FORA'}
                                                        </Typography>
                                                    </Box>
                                                </Box>

                                                {/* Stats row */}
                                                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                                    {[
                                                        { label: 'Atendidos', value: totalAtd, color: expressoTheme.colors.success },
                                                        { label: 'Em andamento', value: emAndamento, color: expressoTheme.colors.warning },
                                                        { label: 'Horas hoje', value: horasDisplay, color: expressoTheme.colors.primary },
                                                    ].map((s, si) => (
                                                        <Box key={si} sx={{ flex: 1, background: expressoTheme.colors.background, borderRadius: expressoTheme.borderRadius.small, p: 1, textAlign: 'center' }}>
                                                            <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: s.color }}>{s.value}</Typography>
                                                            <Typography sx={{ fontSize: '0.65rem', color: expressoTheme.colors.textSecondary, lineHeight: 1.2 }}>{s.label}</Typography>
                                                        </Box>
                                                    ))}
                                                </Box>

                                                {isAtivo && pontoAtivo && (
                                                    <Box sx={{ background: '#f0fdf4', borderRadius: expressoTheme.borderRadius.small, p: 1.5, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Clock size={14} color={expressoTheme.colors.success} />
                                                        <Typography sx={{ fontSize: '0.8rem', color: '#166534', fontWeight: 600 }}>
                                                            Entrada: {formatHora(pontoAtivo.data_hora_entrada)}
                                                            {pontoAtivo.acao && ` · ${pontoAtivo.acao.nome}`}
                                                        </Typography>
                                                    </Box>
                                                )}

                                                {/* Action buttons */}
                                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                    {!isAtivo ? (
                                                        <Button size="small" variant="contained" startIcon={<LogIn size={14} />}
                                                            onClick={() => { setPontoForm({ funcionario_id: medico.id, acao_id: '', observacoes: '' }); setPontoModal({ open: true, tipo: 'entrada' }); }}
                                                            sx={{ flex: 1, background: expressoTheme.gradients.primary, color: 'white', textTransform: 'none', fontWeight: 600, borderRadius: expressoTheme.borderRadius.small, fontSize: '0.8rem' }}>
                                                            Entrada
                                                        </Button>
                                                    ) : (
                                                        <>
                                                            <Button size="small" variant="outlined" startIcon={<LogOut size={14} />}
                                                                onClick={() => { setPontoForm({ funcionario_id: medico.id, acao_id: '', observacoes: '' }); setPontoModal({ open: true, tipo: 'saida', ponto: pontoAtivo }); }}
                                                                sx={{ flex: 1, borderColor: expressoTheme.colors.danger, color: expressoTheme.colors.danger, textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', borderRadius: expressoTheme.borderRadius.small, '&:hover': { background: '#fff5f5', borderColor: expressoTheme.colors.danger } }}>
                                                                Saída
                                                            </Button>
                                                            <Button size="small" variant="contained" startIcon={<Plus size={14} />}
                                                                onClick={() => { setAtendForm({ nome_paciente: '', observacoes: '' }); setAtendimentoModal({ open: true, medico, ponto: pontoAtivo }); }}
                                                                sx={{ flex: 1, background: '#22c55e', color: 'white', textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', borderRadius: expressoTheme.borderRadius.small, '&:hover': { background: '#16a34a' } }}>
                                                                Atendimento
                                                            </Button>
                                                        </>
                                                    )}
                                                    <Tooltip title="Ver detalhes">
                                                        <IconButton size="small" onClick={() => abrirDetalhe(medico)} sx={{ border: `1px solid ${expressoTheme.colors.border}`, borderRadius: expressoTheme.borderRadius.small, color: expressoTheme.colors.primary, '&:hover': { background: expressoTheme.colors.cardHover } }}>
                                                            <BarChart2 size={16} />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Gerar relatório">
                                                        <IconButton size="small" onClick={() => { setRelFiltros({ data_inicio: '', data_fim: '', acao_id: '' }); setRelatorio(null); setRelatorioModal({ open: true, medico }); }} sx={{ border: `1px solid ${expressoTheme.colors.border}`, borderRadius: expressoTheme.borderRadius.small, color: '#8b5cf6', '&:hover': { background: '#f5f3ff' } }}>
                                                            <FileText size={16} />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            </Box>
                                        </motion.div>
                                    </Grid>
                                );
                            })}
                        </AnimatePresence>
                        {filteredMedicos.length === 0 && (
                            <Grid item xs={12}>
                                <Box sx={{ textAlign: 'center', py: 8, color: expressoTheme.colors.textSecondary }}>
                                    <Stethoscope size={48} style={{ opacity: 0.3 }} />
                                    <Typography sx={{ mt: 2, fontWeight: 600 }}>Nenhum médico encontrado</Typography>
                                    <Typography sx={{ fontSize: '0.85rem', mt: 0.5 }}>Cadastre funcionários com cargo "Médico" na seção Funcionários</Typography>
                                </Box>
                            </Grid>
                        )}
                    </Grid>
                </motion.div>
            </Container>

            {/* MODAL PONTO ENTRADA/SAÍDA */}
            <Dialog open={pontoModal.open} onClose={() => setPontoModal({ open: false, tipo: 'entrada' })} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: expressoTheme.borderRadius.large } }}>
                <DialogTitle sx={{ background: pontoModal.tipo === 'entrada' ? expressoTheme.gradients.primary : 'linear-gradient(135deg,#dc3545,#c82333)', color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {pontoModal.tipo === 'entrada' ? <LogIn size={22} /> : <LogOut size={22} />}
                    {pontoModal.tipo === 'entrada' ? 'Registrar Entrada' : 'Registrar Saída'}
                </DialogTitle>
                <DialogContent sx={{ pt: 3, pb: 2, px: 3, overflow: 'visible' }}>
                    <Grid container spacing={2}>
                        {pontoModal.tipo === 'entrada' && (
                            <>
                                <Grid item xs={12} sx={{ mt: 1.5 }}>
                                    <FormControl fullWidth>
                                        <InputLabel>Médico *</InputLabel>
                                        <Select value={pontoForm.funcionario_id} label="Médico *" onChange={e => setPontoForm(f => ({ ...f, funcionario_id: e.target.value }))}>
                                            {medicos.map(m => <MenuItem key={m.id} value={m.id}>{m.nome} {getPontoAtivo(m.id) ? '--YY--' : ''}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12}>
                                    <FormControl fullWidth>
                                        <InputLabel>Ação Vinculada (opcional)</InputLabel>
                                        <Select value={pontoForm.acao_id} label="Ação Vinculada (opcional)" onChange={e => setPontoForm(f => ({ ...f, acao_id: e.target.value }))}>
                                            <MenuItem value="">Nenhuma</MenuItem>
                                            {acoes.map(a => <MenuItem key={a.id} value={a.id}>{a.numero_acao} -- {a.nome}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </>
                        )}
                        {pontoModal.tipo === 'saida' && pontoModal.ponto && (
                            <Grid item xs={12}>
                                <Alert severity="info" sx={{ borderRadius: expressoTheme.borderRadius.medium }}>
                                    <strong>{pontoModal.ponto.funcionario?.nome}</strong> -- Entrada às {formatHora(pontoModal.ponto.data_hora_entrada)} · {calcMinutosDesde(pontoModal.ponto.data_hora_entrada)} min trabalhados
                                </Alert>
                            </Grid>
                        )}
                        <Grid item xs={12}>
                            <TextField fullWidth multiline rows={2} label="Observações (opcional)" value={pontoForm.observacoes} onChange={e => setPontoForm(f => ({ ...f, observacoes: e.target.value }))} />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 3, gap: 1 }}>
                    <Button onClick={() => setPontoModal({ open: false, tipo: 'entrada' })} sx={{ color: expressoTheme.colors.textSecondary }}>Cancelar</Button>
                    <Button variant="contained" onClick={pontoModal.tipo === 'entrada' ? handleEntrada : handleSaida}
                        disabled={pontoModal.tipo === 'entrada' && !pontoForm.funcionario_id}
                        sx={{ background: pontoModal.tipo === 'entrada' ? expressoTheme.gradients.primary : 'linear-gradient(135deg,#dc3545,#c82333)', color: '#fff !important', fontWeight: 700, px: 3, textTransform: 'none', borderRadius: expressoTheme.borderRadius.medium, '& .MuiButton-root': { color: '#fff' } }}>
                        {pontoModal.tipo === 'entrada' ? 'Confirmar Entrada' : 'Confirmar Saída'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* MODAL ATENDIMENTO */}
            <Dialog open={atendimentoModal.open} onClose={() => setAtendimentoModal({ open: false })} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: expressoTheme.borderRadius.large } }}>
                <DialogTitle sx={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Plus size={22} /> Novo Atendimento -- {atendimentoModal.medico?.nome}
                </DialogTitle>
                <DialogContent sx={{ pt: 3, pb: 2, px: 3 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField fullWidth label="Nome do Paciente (opcional)" value={atendForm.nome_paciente} onChange={e => setAtendForm(f => ({ ...f, nome_paciente: e.target.value }))} helperText="Deixe em branco se não souber o nome" />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField fullWidth multiline rows={2} label="Observações (opcional)" value={atendForm.observacoes} onChange={e => setAtendForm(f => ({ ...f, observacoes: e.target.value }))} />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 3, gap: 1 }}>
                    <Button onClick={() => setAtendimentoModal({ open: false })} sx={{ color: expressoTheme.colors.textSecondary }}>Cancelar</Button>
                    <Button variant="contained" onClick={handleAtendimento} sx={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: 'white', fontWeight: 700, px: 3, textTransform: 'none', borderRadius: expressoTheme.borderRadius.medium }}>
                        Iniciar Atendimento
                    </Button>
                </DialogActions>
            </Dialog>

            {/* MODAL DETALHE */}
            <Dialog open={detalheModal.open} onClose={() => setDetalheModal({ open: false })} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: expressoTheme.borderRadius.large } }}>
                <DialogTitle sx={{ background: expressoTheme.gradients.primary, color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <TrendingUp size={22} /> Detalhes -- {detalheModal.medico?.nome}
                </DialogTitle>
                <DialogContent sx={{ pt: '24px !important', px: 3, pb: 2 }}>
                    {loadingDetalhe ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box> : (() => {
                        // Atendimentos sem ponto associado (ou ponto_id nulo)
                        const pontoIds = medicoDetalhe.map(p => p.id);
                        const atdSemPonto = medicoDetalheAtendimentos.filter(
                            a => !a.ponto_id || !pontoIds.includes(a.ponto_id)
                        );

                        if (medicoDetalhe.length === 0 && atdSemPonto.length === 0) {
                            return (
                                <Box sx={{ textAlign: 'center', py: 6, color: expressoTheme.colors.textSecondary }}>
                                    <Clock size={40} style={{ opacity: 0.3 }} />
                                    <Typography sx={{ mt: 2 }}>Nenhum registro encontrado hoje</Typography>
                                    <Typography sx={{ fontSize: '0.82rem', mt: 0.5, opacity: 0.7 }}>Verifique se há atendimentos ou pontos cadastrados para hoje</Typography>
                                </Box>
                            );
                        }

                        return (
                            <>
                                {/* Pontos com seus atendimentos vinculados */}
                                {medicoDetalhe.map(ponto => (
                                    <Box key={ponto.id} sx={{ mb: 3 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, p: 2, background: ponto.status === 'trabalhando' ? '#f0fdf4' : expressoTheme.colors.background, borderRadius: expressoTheme.borderRadius.medium, border: `1px solid ${ponto.status === 'trabalhando' ? '#86efac' : expressoTheme.colors.border}` }}>
                                            <Clock size={18} color={ponto.status === 'trabalhando' ? expressoTheme.colors.success : expressoTheme.colors.textSecondary} />
                                            <Box sx={{ flex: 1 }}>
                                                <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                                                    Entrada: {formatHora(ponto.data_hora_entrada)}{ponto.data_hora_saida ? ` → Saída: ${formatHora(ponto.data_hora_saida)}` : ' • Em andamento'}
                                                </Typography>
                                                {ponto.acao && <Typography sx={{ fontSize: '0.78rem', color: expressoTheme.colors.textSecondary }}>Ação: {ponto.acao.nome}</Typography>}
                                            </Box>
                                            {ponto.horas_trabalhadas && <Chip label={`${ponto.horas_trabalhadas}h`} size="small" sx={{ background: expressoTheme.colors.primary, color: 'white', fontWeight: 700 }} />}
                                        </Box>

                                        {(ponto.atendimentos || []).length > 0 && (
                                            <Box sx={{ pl: 2, borderLeft: `3px solid ${expressoTheme.colors.primary}`, ml: 1 }}>
                                                {(ponto.atendimentos || []).map((atd, i) => (
                                                    <Box key={atd.id} sx={{ mb: 1.5, position: 'relative' }}>
                                                        <Box sx={{ position: 'absolute', left: -15, top: 8, width: 10, height: 10, borderRadius: '50%', background: atd.status === 'concluido' ? expressoTheme.colors.success : atd.status === 'em_andamento' ? expressoTheme.colors.warning : expressoTheme.colors.danger }} />
                                                        <Box sx={{ background: expressoTheme.colors.cardBackground, borderRadius: expressoTheme.borderRadius.small, p: 1.5, border: `1px solid ${expressoTheme.colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                            <Box>
                                                                <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>
                                                                    {atd.nome_paciente || (atd as any).cidadao?.nome || `Paciente ${i + 1}`}
                                                                </Typography>
                                                                <Typography sx={{ fontSize: '0.72rem', color: expressoTheme.colors.textSecondary }}>
                                                                    {formatHora(atd.hora_inicio)}{atd.hora_fim ? ` → ${formatHora(atd.hora_fim)}` : ' • em andamento'} {atd.duracao_minutos ? `(${atd.duracao_minutos}min)` : ''}
                                                                </Typography>
                                                            </Box>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <Chip label={atd.status} size="small" sx={{ fontSize: '0.7rem', fontWeight: 700, background: atd.status === 'concluido' ? '#dcfce7' : atd.status === 'em_andamento' ? '#fef9c3' : '#fee2e2', color: atd.status === 'concluido' ? '#166534' : atd.status === 'em_andamento' ? '#854d0e' : '#991b1b' }} />
                                                                {atd.status === 'em_andamento' && (
                                                                    <Tooltip title="Finalizar atendimento">
                                                                        <IconButton size="small" onClick={() => handleFinalizarAtendimento(atd.id)} sx={{ color: expressoTheme.colors.success }}>
                                                                            <UserCheck size={16} />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                )}
                                                            </Box>
                                                        </Box>
                                                    </Box>
                                                ))}
                                            </Box>
                                        )}
                                    </Box>
                                ))}

                                {/* Atendimentos sem ponto vinculado */}
                                {atdSemPonto.length > 0 && (
                                    <Box sx={{ mb: 3 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, p: 2, background: '#fffbeb', borderRadius: expressoTheme.borderRadius.medium, border: '1px solid #fcd34d' }}>
                                            <Activity size={18} color="#d97706" />
                                            <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#92400e' }}>
                                                Atendimentos do dia ({atdSemPonto.length})
                                            </Typography>
                                        </Box>
                                        <Box sx={{ pl: 2, borderLeft: `3px solid #f59e0b`, ml: 1 }}>
                                            {atdSemPonto.map((atd, i) => (
                                                <Box key={atd.id} sx={{ mb: 1.5, position: 'relative' }}>
                                                    <Box sx={{ position: 'absolute', left: -15, top: 8, width: 10, height: 10, borderRadius: '50%', background: atd.status === 'concluido' ? expressoTheme.colors.success : atd.status === 'em_andamento' ? expressoTheme.colors.warning : expressoTheme.colors.danger }} />
                                                    <Box sx={{ background: expressoTheme.colors.cardBackground, borderRadius: expressoTheme.borderRadius.small, p: 1.5, border: `1px solid ${expressoTheme.colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                        <Box>
                                                            <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>
                                                                {atd.nome_paciente || (atd as any).cidadao?.nome || `Paciente ${i + 1}`}
                                                            </Typography>
                                                            <Typography sx={{ fontSize: '0.72rem', color: expressoTheme.colors.textSecondary }}>
                                                                {formatHora(atd.hora_inicio)}{atd.hora_fim ? ` → ${formatHora(atd.hora_fim)}` : ' • em andamento'} {atd.duracao_minutos ? `(${atd.duracao_minutos}min)` : ''}
                                                                {(atd as any).acao?.nome && ` · ${(atd as any).acao.nome}`}
                                                            </Typography>
                                                        </Box>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Chip label={atd.status} size="small" sx={{ fontSize: '0.7rem', fontWeight: 700, background: atd.status === 'concluido' ? '#dcfce7' : atd.status === 'em_andamento' ? '#fef9c3' : '#fee2e2', color: atd.status === 'concluido' ? '#166534' : atd.status === 'em_andamento' ? '#854d0e' : '#991b1b' }} />
                                                            {atd.status === 'em_andamento' && (
                                                                <Tooltip title="Finalizar atendimento">
                                                                    <IconButton size="small" onClick={() => handleFinalizarAtendimento(atd.id)} sx={{ color: expressoTheme.colors.success }}>
                                                                        <UserCheck size={16} />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            )}
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            ))}
                                        </Box>
                                    </Box>
                                )}
                            </>
                        );
                    })()}
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setDetalheModal({ open: false })} sx={{ color: expressoTheme.colors.textSecondary }}>Fechar</Button>
                    <Button variant="outlined" startIcon={<FileText size={16} />} onClick={() => {
                        setDetalheModal({ open: false });
                        const filtrosHoje = { data_inicio: hoje, data_fim: hoje, acao_id: '' };
                        setRelFiltros(filtrosHoje);
                        setRelatorio(null);
                        setRelatorioModal({ open: true, medico: detalheModal.medico });
                        // Aguarda o modal abrir antes de chamar gerarRelatorio
                        setTimeout(() => {
                            if (detalheModal.medico) {
                                medicoMonitoringService.getRelatorio(detalheModal.medico.id, { data_inicio: hoje, data_fim: hoje })
                                    .then(res => setRelatorio(res.data))
                                    .catch(() => { });
                            }
                        }, 100);
                    }}
                        sx={{ color: '#8b5cf6', borderColor: '#8b5cf6', textTransform: 'none', fontWeight: 600 }}>
                        Gerar Relatório
                    </Button>
                </DialogActions>
            </Dialog>

            {/* MODAL RELAT--"RIO */}
            <Dialog open={relatorioModal.open} onClose={() => setRelatorioModal({ open: false })} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: expressoTheme.borderRadius.large } }}>
                <DialogTitle sx={{ background: expressoTheme.gradients.primary, color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <FileText size={22} /> Relatório -- {relatorioModal.medico?.nome}
                </DialogTitle>
                <DialogContent sx={{ pt: 3, px: 3, pb: 2, overflow: 'visible' }}>
                    {/* Filtros */}
                    <Grid container spacing={2} sx={{ mb: 3, mt: 1.5 }}>
                        <Grid item xs={12} sm={4}>
                            <TextField fullWidth type="date" label="Data Início" InputLabelProps={{ shrink: true }} value={relFiltros.data_inicio} onChange={e => setRelFiltros(f => ({ ...f, data_inicio: e.target.value }))} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField fullWidth type="date" label="Data Fim" InputLabelProps={{ shrink: true }} value={relFiltros.data_fim} onChange={e => setRelFiltros(f => ({ ...f, data_fim: e.target.value }))} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <FormControl fullWidth>
                                <InputLabel>Filtrar por Ação</InputLabel>
                                <Select value={relFiltros.acao_id} label="Filtrar por Ação" onChange={e => setRelFiltros(f => ({ ...f, acao_id: e.target.value }))}>
                                    <MenuItem value="">Todas</MenuItem>
                                    {acoes.map(a => <MenuItem key={a.id} value={a.id}>{a.numero_acao} -- {a.nome}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                    <Button variant="contained" onClick={() => gerarRelatorio()} disabled={loadingRel} startIcon={loadingRel ? <CircularProgress size={16} /> : <BarChart2 size={16} />} sx={{ background: expressoTheme.gradients.primary, color: 'white', textTransform: 'none', fontWeight: 700, mb: 3, borderRadius: expressoTheme.borderRadius.medium, boxShadow: expressoTheme.shadows.button }}>
                        {loadingRel ? 'Gerando...' : 'Gerar Relatório'}
                    </Button>

                    {relatorio && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            {/* Métricas */}
                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                {[
                                    { label: 'Dias Trabalhados', value: relatorio.metricas.totalDiasTrabalhados, color: expressoTheme.colors.primary },
                                    { label: 'Horas Totais', value: `${relatorio.metricas.totalHorasTrabalhadas}h`, color: expressoTheme.colors.info },
                                    { label: 'Pacientes Atendidos', value: relatorio.metricas.totalAtendidos, color: expressoTheme.colors.success },
                                    { label: 'Tempo Médio', value: formatDuracao(relatorio.metricas.tempoMedioMinutos), color: '#f59e0b' },
                                    { label: 'Cancelados', value: relatorio.metricas.atendimentosCancelados, color: expressoTheme.colors.danger },
                                    { label: 'Custo Total', value: `R$ ${relatorio.metricas.custoTotal.toFixed(2)}`, color: '#8b5cf6' },
                                ].map((m, i) => (
                                    <Grid item xs={6} sm={4} md={2} key={i}>
                                        <Box sx={{ background: expressoTheme.colors.background, borderRadius: expressoTheme.borderRadius.medium, p: 2, textAlign: 'center', border: `1px solid ${expressoTheme.colors.border}` }}>
                                            <Typography sx={{ fontSize: '1.3rem', fontWeight: 800, color: m.color }}>{m.value}</Typography>
                                            <Typography sx={{ fontSize: '0.7rem', color: expressoTheme.colors.textSecondary, lineHeight: 1.3 }}>{m.label}</Typography>
                                        </Box>
                                    </Grid>
                                ))}
                            </Grid>
                            <Divider sx={{ mb: 2 }} />
                            {/* Tabela de atendimentos */}
                            <Typography sx={{ fontWeight: 700, mb: 1.5, color: expressoTheme.colors.primaryDark }}>Histórico de Atendimentos</Typography>
                            <TableContainer component={Paper} sx={{ borderRadius: expressoTheme.borderRadius.medium, border: `1px solid ${expressoTheme.colors.border}`, maxHeight: 300 }}>
                                <Table size="small" stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            {['Data', 'Paciente', 'Ação', 'Início', 'Fim', 'Duração', 'Status'].map(h => (
                                                <TableCell key={h} sx={{ fontWeight: 700, background: expressoTheme.colors.background, fontSize: '0.75rem' }}>{h}</TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {relatorio.atendimentos.map(atd => (
                                            <TableRow key={atd.id} hover>
                                                <TableCell sx={{ fontSize: '0.78rem' }}>{formatData(atd.hora_inicio)}</TableCell>
                                                <TableCell sx={{ fontSize: '0.78rem' }}>{atd.nome_paciente || atd.cidadao?.nome || '--'}</TableCell>
                                                <TableCell sx={{ fontSize: '0.78rem' }}>{atd.acao?.nome || '--'}</TableCell>
                                                <TableCell sx={{ fontSize: '0.78rem' }}>{formatHora(atd.hora_inicio)}</TableCell>
                                                <TableCell sx={{ fontSize: '0.78rem' }}>{atd.hora_fim ? formatHora(atd.hora_fim) : '--'}</TableCell>
                                                <TableCell sx={{ fontSize: '0.78rem' }}>{formatDuracao(atd.duracao_minutos)}</TableCell>
                                                <TableCell><Chip label={atd.status} size="small" sx={{ fontSize: '0.68rem', fontWeight: 700, background: atd.status === 'concluido' ? '#dcfce7' : atd.status === 'em_andamento' ? '#fef9c3' : '#fee2e2', color: atd.status === 'concluido' ? '#166534' : atd.status === 'em_andamento' ? '#854d0e' : '#991b1b' }} /></TableCell>
                                            </TableRow>
                                        ))}
                                        {relatorio.atendimentos.length === 0 && (
                                            <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3, color: expressoTheme.colors.textSecondary }}>Nenhum atendimento no período</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </motion.div>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
                    <Button onClick={() => setRelatorioModal({ open: false })} sx={{ color: expressoTheme.colors.textSecondary }}>Fechar</Button>
                    {relatorio && (
                        <Box sx={{ display: 'flex', gap: 1.5 }}>
                            <Button variant="outlined" startIcon={<Download size={16} />}
                                onClick={() => exportarCSV(
                                    relatorio.atendimentos.map((a: any) => ({
                                        data: new Date(a.hora_inicio).toLocaleDateString('pt-BR'),
                                        hora_inicio: new Date(a.hora_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                                        hora_fim: a.hora_fim ? new Date(a.hora_fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '',
                                        duracao_minutos: a.duracao_minutos ?? '',
                                        paciente: a.nome_paciente || a.cidadao?.nome || '',
                                        acao: a.acao?.nome || '',
                                        status: a.status,
                                    })),
                                    `relatorio-${relatorio.funcionario.nome.replace(/\s/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`
                                )}
                                sx={{ textTransform: 'none', fontWeight: 700, borderColor: expressoTheme.colors.success, color: expressoTheme.colors.success, '&:hover': { background: '#f0fdf4' } }}>
                                Exportar CSV
                            </Button>
                            <Button variant="contained" startIcon={<FileText size={16} />}
                                onClick={() => exportarRelatorioPDF(relatorio)}
                                sx={{ background: expressoTheme.gradients.primary, color: 'white', textTransform: 'none', fontWeight: 700, borderRadius: expressoTheme.borderRadius.medium, boxShadow: expressoTheme.shadows.button }}>
                                Exportar PDF
                            </Button>
                        </Box>
                    )}
                </DialogActions>
            </Dialog>

            {/* ══ MODAL RELATÓRIO GERAL ══ */}
            <Dialog open={relatorioGeralModal} onClose={() => setRelatorioGeralModal(false)} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: expressoTheme.borderRadius.large } }}>
                <DialogTitle sx={{ background: expressoTheme.gradients.primary, color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Globe size={22} /> Relatório Geral — Todos os Médicos
                </DialogTitle>
                <DialogContent sx={{ pt: 3, px: 3, pb: 2, overflow: 'visible' }}>
                    <Grid container spacing={2} sx={{ mb: 2, mt: 1.5 }}>
                        <Grid item xs={12} sm={4}>
                            <TextField fullWidth type="date" label="Data Início" InputLabelProps={{ shrink: true }} value={relGeralFiltros.data_inicio} onChange={e => setRelGeralFiltros(f => ({ ...f, data_inicio: e.target.value }))} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField fullWidth type="date" label="Data Fim" InputLabelProps={{ shrink: true }} value={relGeralFiltros.data_fim} onChange={e => setRelGeralFiltros(f => ({ ...f, data_fim: e.target.value }))} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <FormControl fullWidth>
                                <InputLabel>Filtrar por Ação</InputLabel>
                                <Select value={relGeralFiltros.acao_id} label="Filtrar por Ação" onChange={e => setRelGeralFiltros(f => ({ ...f, acao_id: e.target.value }))}>
                                    <MenuItem value="">Todas</MenuItem>
                                    {acoes.map(a => <MenuItem key={a.id} value={a.id}>{a.numero_acao} — {a.nome}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                    <Button variant="contained" onClick={gerarRelatorioGeral} disabled={loadingRelGeral} startIcon={loadingRelGeral ? <CircularProgress size={16} /> : <BarChart2 size={16} />}
                        sx={{ background: expressoTheme.gradients.primary, color: 'white', textTransform: 'none', fontWeight: 700, mb: 3, borderRadius: expressoTheme.borderRadius.medium, boxShadow: expressoTheme.shadows.button }}>
                        {loadingRelGeral ? 'Gerando...' : 'Gerar Relatório Geral'}
                    </Button>

                    {relatorioGeral && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            {/* Totais */}
                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                {[
                                    { label: 'Total Atendidos', value: relatorioGeral.totais.totalAtendidos, color: expressoTheme.colors.success },
                                    { label: 'Médicos', value: relatorioGeral.totais.totalMedicos, color: expressoTheme.colors.primary },
                                    { label: 'Tempo Médio', value: formatDuracao(relatorioGeral.totais.tempoMedioMinutos), color: '#f59e0b' },
                                    { label: 'Custo Total', value: `R$ ${relatorioGeral.totais.custoTotalGeral.toFixed(2)}`, color: '#8b5cf6' },
                                ].map((t, i) => (
                                    <Grid item xs={6} sm={3} key={i}>
                                        <Box sx={{ background: expressoTheme.colors.background, borderRadius: expressoTheme.borderRadius.medium, p: 2, textAlign: 'center', border: `1px solid ${expressoTheme.colors.border}` }}>
                                            <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: t.color }}>{t.value}</Typography>
                                            <Typography sx={{ fontSize: '0.72rem', color: expressoTheme.colors.textSecondary }}>{t.label}</Typography>
                                        </Box>
                                    </Grid>
                                ))}
                            </Grid>
                            <Divider sx={{ mb: 2 }} />
                            {/* Ranking de Médicos */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                <Trophy size={18} color="#f59e0b" />
                                <Typography sx={{ fontWeight: 700, color: expressoTheme.colors.primaryDark }}>Ranking de Médicos</Typography>
                            </Box>
                            <TableContainer component={Paper} sx={{ borderRadius: expressoTheme.borderRadius.medium, border: `1px solid ${expressoTheme.colors.border}`, maxHeight: 320 }}>
                                <Table size="small" stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            {['#', 'Médico', 'Especialidade', 'Atendidos', 'Tempo Médio', 'Horas Trabalhadas', 'Cancelados', 'Custo'].map(h => (
                                                <TableCell key={h} sx={{ fontWeight: 700, background: expressoTheme.colors.background, fontSize: '0.73rem' }}>{h}</TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {[...relatorioGeral.medicos]
                                            .sort((a, b) => b.metricas.totalAtendidos - a.metricas.totalAtendidos)
                                            .map((m, i) => (
                                                <TableRow key={m.medico.id} hover sx={{ background: i === 0 ? '#fffbeb' : 'inherit' }}>
                                                    <TableCell sx={{ fontWeight: 800, color: i === 0 ? '#d97706' : i === 1 ? '#6b7280' : i === 2 ? '#b45309' : expressoTheme.colors.textSecondary }}>
                                                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: 600, fontSize: '0.82rem' }}>{m.medico.nome}</TableCell>
                                                    <TableCell sx={{ fontSize: '0.78rem', color: expressoTheme.colors.textSecondary }}>{m.medico.especialidade || m.medico.cargo}</TableCell>
                                                    <TableCell sx={{ fontWeight: 700, color: expressoTheme.colors.success }}>{m.metricas.totalAtendidos}</TableCell>
                                                    <TableCell sx={{ fontSize: '0.78rem' }}>{formatDuracao(m.metricas.tempoMedioMinutos)}</TableCell>
                                                    <TableCell sx={{ fontSize: '0.78rem' }}>{m.metricas.totalHorasTrabalhadas}h</TableCell>
                                                    <TableCell><Chip label={m.metricas.atendimentosCancelados} size="small" sx={{ background: m.metricas.atendimentosCancelados > 0 ? '#fee2e2' : '#f1f5f9', color: m.metricas.atendimentosCancelados > 0 ? '#991b1b' : expressoTheme.colors.textSecondary, fontWeight: 700, fontSize: '0.72rem' }} /></TableCell>
                                                    <TableCell sx={{ fontSize: '0.78rem', color: expressoTheme.colors.primary, fontWeight: 600 }}>R$ {m.metricas.custoTotal.toFixed(2)}</TableCell>
                                                </TableRow>
                                            ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </motion.div>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
                    <Button onClick={() => setRelatorioGeralModal(false)} sx={{ color: expressoTheme.colors.textSecondary }}>Fechar</Button>
                    {relatorioGeral && (
                        <Box sx={{ display: 'flex', gap: 1.5 }}>
                            <Button variant="outlined" startIcon={<Download size={16} />} onClick={exportarRelatorioGeralCSV}
                                sx={{ textTransform: 'none', fontWeight: 700, borderColor: expressoTheme.colors.success, color: expressoTheme.colors.success, '&:hover': { background: '#f0fdf4' } }}>
                                Exportar CSV Completo
                            </Button>
                            <Button variant="contained" startIcon={<FileText size={16} />}
                                onClick={() => exportarRelatorioGeralPDF(relatorioGeral)}
                                sx={{ background: expressoTheme.gradients.primary, color: 'white', textTransform: 'none', fontWeight: 700, borderRadius: expressoTheme.borderRadius.medium, boxShadow: expressoTheme.shadows.button }}>
                                Exportar PDF
                            </Button>
                        </Box>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default MedicoMonitoring;


