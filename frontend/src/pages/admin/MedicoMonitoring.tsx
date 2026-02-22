import React, { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import { useSnackbar } from 'notistack';
import { expressoTheme } from '../../theme/expressoTheme';
import { medicoMonitoringService } from '../../services/medicoMonitoring';
import api from '../../services/api';

// --"?--"?--"? Types --"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?--"?
interface Medico { id: string; nome: string; cargo: string; especialidade?: string; custo_diaria: number; ativo: boolean; }
interface Ponto { id: string; funcionario_id: string; acao_id?: string; data_hora_entrada: string; data_hora_saida?: string; horas_trabalhadas?: number; status: 'trabalhando' | 'saiu'; observacoes?: string; funcionario?: Medico; acao?: { id: string; numero_acao: string; nome: string }; atendimentos?: Atendimento[]; }
interface Atendimento { id: string; funcionario_id: string; acao_id?: string; cidadao_id?: string; ponto_id?: string; hora_inicio: string; hora_fim?: string; duracao_minutos?: number; status: 'em_andamento' | 'concluido' | 'cancelado'; observacoes?: string; nome_paciente?: string; cidadao?: { id: string; nome: string }; funcionario?: Medico; acao?: { id: string; numero_acao: string; nome: string }; }
interface Dashboard { medicosAtivos: number; atendimentosHoje: number; atendimentosConcluidos: number; tempoMedioMinutos: number; totalMedicos: number; topMedico: { nome: string; total: number } | null; alertas: { medico_nome: string; entrada: string; ponto_id: string }[]; }
interface Acao { id: string; numero_acao: string; nome: string; status: string; }
interface Relatorio { funcionario: Medico & { custo_diaria: number }; metricas: { totalDiasTrabalhados: number; totalHorasTrabalhadas: number; totalAtendidos: number; atendimentosCancelados: number; atendimentosEmAndamento: number; tempoMedioMinutos: number; custoTotal: number; }; pontos: Ponto[]; atendimentos: Atendimento[]; }

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
    const [loadingDetalhe, setLoadingDetalhe] = useState(false);

    const hoje = new Date().toISOString().split('T')[0];

    const fetchAll = useCallback(async (silent = false) => {
        if (!silent) setLoading(true); else setRefreshing(true);
        try {
            const [mRes, pRes, dRes, aRes] = await Promise.all([
                medicoMonitoringService.getMedicos(),
                medicoMonitoringService.getPontos({ data_inicio: hoje, data_fim: hoje }),
                medicoMonitoringService.getDashboard(),
                api.get('/acoes', { params: { status: 'ativa', limit: 100 } }),
            ]);
            setMedicos(mRes.data);
            setPontos(Array.isArray(pRes.data) ? pRes.data : []);
            setDashboard(dRes.data);
            const acoesData = aRes.data?.data || aRes.data?.acoes || aRes.data || [];
            setAcoes(Array.isArray(acoesData) ? acoesData : []);
        } catch (err: any) {
            enqueueSnackbar('Erro ao carregar dados', { variant: 'error' });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [hoje, enqueueSnackbar]);

    useEffect(() => { fetchAll(); }, [fetchAll]);
    // Auto-refresh a cada 30s
    useEffect(() => { const t = setInterval(() => fetchAll(true), 30000); return () => clearInterval(t); }, [fetchAll]);

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
        setLoadingDetalhe(true);
        try {
            const res = await medicoMonitoringService.getPontos({ funcionario_id: medico.id, data_inicio: hoje, data_fim: hoje });
            setMedicoDetalhe(Array.isArray(res.data) ? res.data : []);
        } catch { setMedicoDetalhe([]); } finally { setLoadingDetalhe(false); }
    };

    const gerarRelatorio = async () => {
        if (!relatorioModal.medico) return;
        setLoadingRel(true);
        try {
            const res = await medicoMonitoringService.getRelatorio(relatorioModal.medico.id, { data_inicio: relFiltros.data_inicio || undefined, data_fim: relFiltros.data_fim || undefined, acao_id: relFiltros.acao_id || undefined });
            setRelatorio(res.data);
        } catch { enqueueSnackbar('Erro ao gerar relatório', { variant: 'error' }); } finally { setLoadingRel(false); }
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
                <Grid container spacing={2.5} sx={{ mb: 4 }}>
                    {[
                        { icon: <Activity size={22} />, title: 'Ativos Agora', value: dashboard?.medicosAtivos || 0, sub: `de ${dashboard?.totalMedicos || 0} médicos`, color: expressoTheme.colors.primary },
                        { icon: <UserCheck size={22} />, title: 'Atendimentos Hoje', value: dashboard?.atendimentosHoje || 0, sub: `${dashboard?.atendimentosConcluidos || 0} concluídos`, color: expressoTheme.colors.success },
                        { icon: <Timer size={22} />, title: 'Tempo Médio', value: dashboard?.tempoMedioMinutos ? `${dashboard.tempoMedioMinutos}min` : '--', sub: 'por atendimento', color: expressoTheme.colors.info },
                        { icon: <Award size={22} />, title: 'Top Médico Hoje', value: dashboard?.topMedico?.total || 0, sub: dashboard?.topMedico?.nome || 'Nenhum atendimento', color: '#8b5cf6' },
                    ].map((kpi, i) => (
                        <Grid item xs={12} sm={6} lg={3} key={i}>
                            <KpiCard {...kpi} idx={i} />
                        </Grid>
                    ))}
                </Grid>

                {/* SEARCH + GRADE DE M--?DICOS */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                        <Box sx={{ flex: 1, background: expressoTheme.colors.cardBackground, borderRadius: expressoTheme.borderRadius.medium, border: `1px solid ${expressoTheme.colors.border}`, display: 'flex', alignItems: 'center', px: 2, py: 1 }}>
                            <Search size={18} color={expressoTheme.colors.textSecondary} style={{ marginRight: 8 }} />
                            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar médico..." style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.95rem', width: '100%', color: expressoTheme.colors.text }} />
                        </Box>
                        <Typography sx={{ color: expressoTheme.colors.textSecondary, fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                            {filteredMedicos.length} médico(s)
                        </Typography>
                    </Box>

                    <Grid container spacing={3}>
                        <AnimatePresence>
                            {filteredMedicos.map((medico, idx) => {
                                const pontoAtivo = getPontoAtivo(medico.id);
                                const atdsHoje = pontos.filter(p => p.funcionario_id === medico.id).flatMap(p => p.atendimentos || []);
                                const totalAtd = atdsHoje.filter(a => a.status === 'concluido').length;
                                const emAndamento = atdsHoje.filter(a => a.status === 'em_andamento').length;
                                const minutosAtivo = pontoAtivo ? calcMinutosDesde(pontoAtivo.data_hora_entrada) : 0;
                                const isAtivo = !!pontoAtivo;

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
                                                        { label: 'Horas hoje', value: isAtivo ? `${Math.floor(minutosAtivo / 60)}h${minutosAtivo % 60}min` : '--', color: expressoTheme.colors.primary },
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
                        sx={{ background: pontoModal.tipo === 'entrada' ? expressoTheme.gradients.primary : 'linear-gradient(135deg,#dc3545,#c82333)', color: 'white', fontWeight: 700, px: 3, textTransform: 'none', borderRadius: expressoTheme.borderRadius.medium }}>
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
                <DialogContent sx={{ pt: 3, px: 3, pb: 2 }}>
                    {loadingDetalhe ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box> : (
                        medicoDetalhe.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 6, color: expressoTheme.colors.textSecondary }}>
                                <Clock size={40} style={{ opacity: 0.3 }} />
                                <Typography sx={{ mt: 2 }}>Nenhum ponto registrado hoje</Typography>
                            </Box>
                        ) : (
                            medicoDetalhe.map(ponto => (
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

                                    {/* Timeline de atendimentos */}
                                    {(ponto.atendimentos || []).length > 0 && (
                                        <Box sx={{ pl: 2, borderLeft: `3px solid ${expressoTheme.colors.primary}`, ml: 1 }}>
                                            {(ponto.atendimentos || []).map((atd, i) => (
                                                <Box key={atd.id} sx={{ mb: 1.5, position: 'relative' }}>
                                                    <Box sx={{ position: 'absolute', left: -15, top: 8, width: 10, height: 10, borderRadius: '50%', background: atd.status === 'concluido' ? expressoTheme.colors.success : atd.status === 'em_andamento' ? expressoTheme.colors.warning : expressoTheme.colors.danger }} />
                                                    <Box sx={{ background: expressoTheme.colors.cardBackground, borderRadius: expressoTheme.borderRadius.small, p: 1.5, border: `1px solid ${expressoTheme.colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                        <Box>
                                                            <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>
                                                                {atd.nome_paciente || atd.cidadao?.nome || `Paciente ${i + 1}`}
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
                            ))
                        )
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setDetalheModal({ open: false })} sx={{ color: expressoTheme.colors.textSecondary }}>Fechar</Button>
                    <Button variant="outlined" startIcon={<FileText size={16} />} onClick={() => { setDetalheModal({ open: false }); setRelFiltros({ data_inicio: '', data_fim: '', acao_id: '' }); setRelatorio(null); setRelatorioModal({ open: true, medico: detalheModal.medico }); }}
                        sx={{ color: '#8b5cf6', borderColor: '#8b5cf6', textTransform: 'none', fontWeight: 600 }}>
                        Gerar Relatório
                    </Button>
                </DialogActions>
            </Dialog>

            {/* MODAL RELAT--"RIO */}
            <Dialog open={relatorioModal.open} onClose={() => setRelatorioModal({ open: false })} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: expressoTheme.borderRadius.large } }}>
                <DialogTitle sx={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1.5 }}>
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
                    <Button variant="contained" onClick={gerarRelatorio} disabled={loadingRel} startIcon={loadingRel ? <CircularProgress size={16} /> : <BarChart2 size={16} />} sx={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: 'white', textTransform: 'none', fontWeight: 700, mb: 3, borderRadius: expressoTheme.borderRadius.medium }}>
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
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setRelatorioModal({ open: false })} sx={{ color: expressoTheme.colors.textSecondary }}>Fechar</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default MedicoMonitoring;


