import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Typography, Grid, CircularProgress, IconButton, Button,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    Select, MenuItem, FormControl, InputLabel, InputAdornment, Tooltip,
    Chip, Divider, Container, ToggleButtonGroup, ToggleButton
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Plus, Wrench, CheckCircle2, Clock, TrendingUp,
    Pencil, Trash2, Calendar, DollarSign, Gauge,
    Building2, X, Search
} from 'lucide-react';
import { useSnackbar } from 'notistack';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip,
    ResponsiveContainer, Cell
} from 'recharts';
import api from '../../services/api';
import { expressoTheme } from '../../theme/expressoTheme';
import './ManutencaoCaminhao.css';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Caminhao {
    id: string;
    placa: string;
    modelo: string;
    ano: number;
    status: string;
    autonomia_km_litro: number;
    capacidade_litros: number;
}

interface Manutencao {
    id: string;
    caminhao_id: string;
    tipo: string;
    titulo: string;
    descricao?: string;
    status: 'agendada' | 'em_andamento' | 'concluida' | 'cancelada';
    prioridade: 'baixa' | 'media' | 'alta' | 'critica';
    km_atual?: number;
    km_proximo?: number;
    data_agendada?: string;
    data_conclusao?: string;
    custo_estimado?: number;
    custo_real?: number;
    fornecedor?: string;
    responsavel?: string;
    observacoes?: string;
    created_at: string;
}

interface Stats {
    totalGasto: number;
    emAndamento: number;
    concluidas: number;
    agendadas: number;
    proxima: Manutencao | null;
    custosPorMes: { mes: string; custo: number }[];
}

const emptyForm = {
    tipo: 'preventiva', titulo: '', descricao: '', status: 'agendada', prioridade: 'media',
    km_atual: '', km_proximo: '', data_agendada: '', data_conclusao: '',
    custo_real: '', status_pagamento: 'pendente', fornecedor: '', responsavel: '', observacoes: '',
};

// ─── Config Maps ─────────────────────────────────────────────────────────────

const TIPOS = [
    { value: 'preventiva', label: 'Preventiva', icon: '🛡️', desc: 'Programada' },
    { value: 'corretiva', label: 'Corretiva', icon: '🔧', desc: 'Defeito' },
    { value: 'revisao', label: 'Revisão', icon: '🔍', desc: 'Geral' },
    { value: 'pneu', label: 'Pneus', icon: '⭕', desc: 'Troca' },
    { value: 'eletrica', label: 'Elétrica', icon: '⚡', desc: 'Elétrico' },
    { value: 'outro', label: 'Personalizada', icon: '✏️', desc: 'Livre' },
];

const PRIORIDADE_CONFIG: Record<string, { label: string; color: string; stripe: string; bg: string }> = {
    critica: { label: '🔴 Crítica', color: '#DC3545', stripe: '#DC3545', bg: '#F8D7DA' },
    alta: { label: '🟠 Alta', color: '#E67E22', stripe: '#E67E22', bg: '#FDEBD0' },
    media: { label: '🟡 Média', color: '#F39C12', stripe: '#F39C12', bg: '#FEF9E7' },
    baixa: { label: '🟢 Baixa', color: '#28A745', stripe: '#28A745', bg: '#D4EDDA' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    agendada: { label: '📅 Agendada', color: '#1B4F72' },
    em_andamento: { label: '⚙️ Em Andamento', color: '#856404' },
    concluida: { label: '✅ Concluída', color: '#155724' },
    cancelada: { label: '❌ Cancelada', color: '#721C24' },
};

const fmt = (n?: number) => n != null ? `R$ ${Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—';

// ─── Component ───────────────────────────────────────────────────────────────

const ManutencaoCaminhao: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();

    const [caminhao, setCaminhao] = useState<Caminhao | null>(null);
    const [manutencoes, setManutencoes] = useState<Manutencao[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [editing, setEditing] = useState<Manutencao | null>(null);
    const [form, setForm] = useState<typeof emptyForm>(emptyForm);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterTipo, setFilterTipo] = useState('');
    const [filterPrioridade, setFilterPrioridade] = useState('');

    const fetchData = useCallback(async () => {
        if (!id) return;
        try {
            const [camRes, manRes, statsRes] = await Promise.all([
                api.get(`/caminhoes`),
                api.get(`/caminhoes/${id}/manutencoes`),
                api.get(`/caminhoes/${id}/manutencoes/stats`),
            ]);
            const camData = Array.isArray(camRes.data) ? camRes.data : camRes.data.caminhoes || [];
            setCaminhao(camData.find((c: Caminhao) => c.id === id) || null);
            setManutencoes(Array.isArray(manRes.data) ? manRes.data : []);
            setStats(statsRes.data);
        } catch {
            enqueueSnackbar('Erro ao carregar dados', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    }, [id, enqueueSnackbar]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleOpen = (m?: Manutencao) => {
        if (m) {
            setEditing(m);
            setForm({
                tipo: m.tipo, titulo: m.titulo, descricao: m.descricao || '',
                status: m.status, prioridade: m.prioridade,
                km_atual: m.km_atual?.toString() || '', km_proximo: m.km_proximo?.toString() || '',
                data_agendada: m.data_agendada || '', data_conclusao: m.data_conclusao || '',
                custo_real: m.custo_real?.toString() || '',
                status_pagamento: (m as any).status_pagamento || 'pendente',
                fornecedor: m.fornecedor || '', responsavel: m.responsavel || '', observacoes: m.observacoes || '',
            });
        } else {
            setEditing(null);
            setForm(emptyForm);
        }
        setOpenDialog(true);
    };

    const handleSave = async () => {
        if (!form.titulo.trim()) { enqueueSnackbar('Título é obrigatório', { variant: 'warning' }); return; }
        setSaving(true);
        try {
            const payload: any = {
                tipo: form.tipo, titulo: form.titulo, descricao: form.descricao || null,
                status: form.status, prioridade: form.prioridade,
                km_atual: form.km_atual ? Number(form.km_atual) : null,
                km_proximo: form.km_proximo ? Number(form.km_proximo) : null,
                data_agendada: form.data_agendada || null, data_conclusao: form.data_conclusao || null,
                custo_real: form.custo_real ? Number(form.custo_real) : null,
                status_pagamento: form.status_pagamento || 'pendente',
                fornecedor: form.fornecedor || null, responsavel: form.responsavel || null,
                observacoes: form.observacoes || null,
            };
            if (editing) {
                await api.put(`/caminhoes/${id}/manutencoes/${editing.id}`, payload);
                enqueueSnackbar('Manutenção atualizada!', { variant: 'success' });
            } else {
                await api.post(`/caminhoes/${id}/manutencoes`, payload);
                enqueueSnackbar('Manutenção registrada!', { variant: 'success' });
            }
            setOpenDialog(false);
            fetchData();
        } catch (e: any) {
            enqueueSnackbar(e.response?.data?.error || 'Erro ao salvar', { variant: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (m: Manutencao) => {
        if (!window.confirm(`Remover "${m.titulo}"?`)) return;
        try {
            await api.delete(`/caminhoes/${id}/manutencoes/${m.id}`);
            enqueueSnackbar('Removida!', { variant: 'success' });
            fetchData();
        } catch { enqueueSnackbar('Erro ao remover', { variant: 'error' }); }
    };

    const handleConcluir = async (m: Manutencao) => {
        try {
            await api.put(`/caminhoes/${id}/manutencoes/${m.id}`, {
                tipo: m.tipo, titulo: m.titulo, status: 'concluida', prioridade: m.prioridade,
            });
            enqueueSnackbar('Manutenção concluída!', { variant: 'success' });
            fetchData();
        } catch { enqueueSnackbar('Erro', { variant: 'error' }); }
    };

    const filtered = manutencoes.filter(m => {
        const searchMatch = !search || m.titulo.toLowerCase().includes(search.toLowerCase()) || m.descricao?.toLowerCase().includes(search.toLowerCase());
        return searchMatch && (!filterStatus || m.status === filterStatus) && (!filterTipo || m.tipo === filterTipo) && (!filterPrioridade || m.prioridade === filterPrioridade);
    });

    const inputSx = {
        '& .MuiOutlinedInput-root': {
            '&:hover fieldset': { borderColor: expressoTheme.colors.primary },
            '&.Mui-focused fieldset': { borderColor: expressoTheme.colors.primary },
        },
        '& .MuiInputLabel-root.Mui-focused': { color: expressoTheme.colors.primary },
    };

    if (loading) return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: expressoTheme.colors.background }}>
            <CircularProgress sx={{ color: expressoTheme.colors.primary }} size={50} />
        </Box>
    );

    return (
        <Box sx={{ minHeight: '100vh', background: expressoTheme.colors.background, py: 3 }}>
            <Container maxWidth="xl">

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <Box sx={{
                        display: 'flex',
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        flexWrap: 'wrap',
                        gap: 2,
                        mb: 3,
                    }}>
                        <IconButton onClick={() => navigate('/admin/caminhoes')}
                            sx={{ color: expressoTheme.colors.primary, border: `1px solid ${expressoTheme.colors.border}`, '&:hover': { background: expressoTheme.colors.cardHover } }}>
                            <ArrowLeft size={20} />
                        </IconButton>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ fontSize: '0.7rem', color: expressoTheme.colors.textSecondary, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>
                                Controle de Manutenção
                            </Typography>
                            <Typography variant="h5" sx={{ fontWeight: 700, color: expressoTheme.colors.primaryDark, lineHeight: 1.2, fontSize: { xs: '1.1rem', sm: '1.5rem' } }}>
                                {caminhao ? `${caminhao.placa} — ${caminhao.modelo}` : 'Caminhão'}
                            </Typography>
                        </Box>
                        <Box sx={{ ml: { xs: 0, sm: 'auto' } }}>
                            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                                <Button
                                    variant="contained"
                                    startIcon={<Plus size={17} />}
                                    onClick={() => handleOpen()}
                                    sx={{
                                        background: expressoTheme.gradients.primary, color: 'white',
                                        fontWeight: 600, px: 2.5, py: 1, borderRadius: expressoTheme.borderRadius.medium,
                                        textTransform: 'none', boxShadow: expressoTheme.shadows.button,
                                        '&:hover': { background: expressoTheme.colors.primaryDark }
                                    }}>
                                    Nova Manutenção
                                </Button>
                            </motion.div>
                        </Box>
                    </Box>
                </motion.div>

                {/* KPI Cards — compactos, todos em linha */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    {[
                        { label: 'Total Gasto', value: fmt(stats?.totalGasto), icon: DollarSign, color: expressoTheme.colors.primary, bg: '#E1F0FF', delay: 0 },
                        { label: 'Em Andamento', value: stats?.emAndamento ?? 0, icon: Wrench, color: '#856404', bg: '#FFF3CD', delay: 0.05 },
                        { label: 'Concluídas', value: stats?.concluidas ?? 0, icon: CheckCircle2, color: '#155724', bg: '#D4EDDA', delay: 0.1 },
                        { label: 'Agendadas', value: stats?.agendadas ?? 0, icon: Clock, color: expressoTheme.colors.primaryDark, bg: '#E8F4F8', delay: 0.15 },
                    ].map((kpi) => {
                        const Icon = kpi.icon;
                        return (
                            <Grid item xs={6} sm={3} key={kpi.label}>
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: kpi.delay }}>
                                    <Box className="kpi-card">
                                        <Box className="kpi-icon" sx={{ background: kpi.bg }}>
                                            <Icon size={20} color={kpi.color} />
                                        </Box>
                                        <Box>
                                            <Box className="kpi-value">{kpi.value}</Box>
                                            <Box className="kpi-label">{kpi.label}</Box>
                                        </Box>
                                    </Box>
                                </motion.div>
                            </Grid>
                        );
                    })}
                </Grid>

                <Grid container spacing={3}>
                    {/* Timeline */}
                    <Grid item xs={12} md={8}>
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                            <Box className="timeline-container">
                                {/* Filtros */}
                                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 2 }}>
                                    <TextField size="small" placeholder="Buscar manutenção..."
                                        value={search} onChange={e => setSearch(e.target.value)}
                                        sx={{ flexGrow: 1, minWidth: 170, ...inputSx }}
                                        InputProps={{ startAdornment: <InputAdornment position="start"><Search size={15} color={expressoTheme.colors.textSecondary} /></InputAdornment> }} />
                                    {[
                                        { val: filterStatus, set: setFilterStatus, opts: Object.entries(STATUS_CONFIG), ph: 'Status' },
                                        { val: filterTipo, set: setFilterTipo, opts: TIPOS.map(t => [t.value, { label: t.label }] as [string, { label: string }]), ph: 'Tipo' },
                                        { val: filterPrioridade, set: setFilterPrioridade, opts: Object.entries(PRIORIDADE_CONFIG).map(([v, c]) => [v, { label: c.label }] as [string, { label: string }]), ph: 'Prioridade' },
                                    ].map(({ val, set, opts, ph }) => (
                                        <Select key={ph} size="small" value={val} onChange={e => set(e.target.value)} displayEmpty
                                            sx={{
                                                minWidth: 120, borderRadius: expressoTheme.borderRadius.small, fontSize: '0.84rem',
                                                '& .MuiOutlinedInput-notchedOutline': { borderColor: expressoTheme.colors.border },
                                                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: expressoTheme.colors.primary }
                                            }}>
                                            <MenuItem value=""><em style={{ color: expressoTheme.colors.textLight }}>{ph}</em></MenuItem>
                                            {opts.map(([v, c]) => <MenuItem key={String(v)} value={String(v)}>{(c as any).label}</MenuItem>)}
                                        </Select>
                                    ))}
                                    {(search || filterStatus || filterTipo || filterPrioridade) && (
                                        <IconButton size="small" onClick={() => { setSearch(''); setFilterStatus(''); setFilterTipo(''); setFilterPrioridade(''); }}
                                            sx={{ color: expressoTheme.colors.textSecondary }}>
                                            <X size={16} />
                                        </IconButton>
                                    )}
                                </Box>

                                {/* Lista */}
                                <AnimatePresence>
                                    {filtered.length === 0 ? (
                                        <Box sx={{ textAlign: 'center', py: 5, color: expressoTheme.colors.textSecondary }}>
                                            <Wrench size={40} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.3, color: expressoTheme.colors.textLight }} />
                                            <Typography sx={{ color: expressoTheme.colors.textSecondary, fontSize: '0.9rem' }}>Nenhuma manutenção encontrada</Typography>
                                        </Box>
                                    ) : (
                                        filtered.map((m, i) => {
                                            const prio = PRIORIDADE_CONFIG[m.prioridade];
                                            const stat = STATUS_CONFIG[m.status];
                                            const tipo = TIPOS.find(t => t.value === m.tipo);
                                            return (
                                                <motion.div key={m.id}
                                                    initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: 16 }} transition={{ delay: i * 0.04 }}>
                                                    <Box className="timeline-item">
                                                        <Box className="timeline-stripe" sx={{ background: prio.stripe }} />
                                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                                                                <Box>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                                                                        <Typography sx={{ fontSize: '0.82rem' }}>{tipo?.icon}</Typography>
                                                                        <Typography sx={{ fontWeight: 700, color: expressoTheme.colors.text, fontSize: '0.9rem' }}>{m.titulo}</Typography>
                                                                    </Box>
                                                                    <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 0.5 }}>
                                                                        <Box component="span" className={`status-badge ${m.status}`}>{stat.label}</Box>
                                                                        <Chip label={prio.label} size="small"
                                                                            sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600, background: prio.bg, color: prio.color, border: `1px solid ${prio.color}44` }} />
                                                                    </Box>
                                                                    {m.descricao && (
                                                                        <Typography sx={{ fontSize: '0.8rem', color: expressoTheme.colors.textSecondary, mb: 0.5, lineHeight: 1.4 }}>
                                                                            {m.descricao}
                                                                        </Typography>
                                                                    )}
                                                                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', fontSize: '0.74rem', color: expressoTheme.colors.textLight }}>
                                                                        {m.data_agendada && <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Calendar size={11} />{new Date(m.data_agendada + 'T12:00:00').toLocaleDateString('pt-BR')}</Box>}
                                                                        {m.km_atual && <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Gauge size={11} />{m.km_atual.toLocaleString()} km</Box>}
                                                                        {m.custo_real && <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><DollarSign size={11} />{fmt(m.custo_real)}</Box>}
                                                                        {m.fornecedor && <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Building2 size={11} />{m.fornecedor}</Box>}
                                                                    </Box>
                                                                </Box>
                                                                <Box sx={{ display: 'flex', gap: 0.25, flexShrink: 0 }}>
                                                                    {m.status !== 'concluida' && m.status !== 'cancelada' && (
                                                                        <Tooltip title="Concluir">
                                                                            <IconButton size="small" onClick={() => handleConcluir(m)}
                                                                                sx={{ color: expressoTheme.colors.success, '&:hover': { background: '#D4EDDA' } }}>
                                                                                <CheckCircle2 size={16} />
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                    )}
                                                                    <Tooltip title="Editar">
                                                                        <IconButton size="small" onClick={() => handleOpen(m)}
                                                                            sx={{ color: expressoTheme.colors.primary, '&:hover': { background: expressoTheme.colors.cardHover } }}>
                                                                            <Pencil size={16} />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                    <Tooltip title="Excluir">
                                                                        <IconButton size="small" onClick={() => handleDelete(m)}
                                                                            sx={{ color: expressoTheme.colors.danger, '&:hover': { background: '#F8D7DA' } }}>
                                                                            <Trash2 size={16} />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                </Box>
                                                            </Box>
                                                        </Box>
                                                    </Box>
                                                </motion.div>
                                            );
                                        })
                                    )}
                                </AnimatePresence>
                            </Box>
                        </motion.div>
                    </Grid>

                    {/* Painel Lateral */}
                    <Grid item xs={12} md={4}>
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
                            <Box className="side-panel">
                                {caminhao && (
                                    <>
                                        <Box sx={{ textAlign: 'center', mb: 2.5 }}>
                                            <Box sx={{
                                                width: 64, height: 64, borderRadius: '16px', margin: '0 auto 12px',
                                                background: expressoTheme.gradients.primary,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                boxShadow: expressoTheme.shadows.button, fontSize: '1.8rem'
                                            }}>🚛</Box>
                                            <Typography sx={{ fontWeight: 800, color: expressoTheme.colors.primaryDark, fontSize: '1.15rem' }}>{caminhao.placa}</Typography>
                                            <Typography sx={{ color: expressoTheme.colors.textSecondary, fontSize: '0.82rem' }}>{caminhao.modelo} · {caminhao.ano}</Typography>
                                            <Chip
                                                label={caminhao.status === 'disponivel' ? '✅ Disponível' : caminhao.status === 'em_manutencao' ? '🔧 Em Manutenção' : '🚛 Em Ação'}
                                                size="small"
                                                sx={{
                                                    mt: 0.75, fontWeight: 600, fontSize: '0.7rem',
                                                    background: caminhao.status === 'disponivel' ? '#D4EDDA' : caminhao.status === 'em_manutencao' ? '#FFF3CD' : '#E1F0FF',
                                                    color: caminhao.status === 'disponivel' ? '#155724' : caminhao.status === 'em_manutencao' ? '#856404' : '#1B4F72'
                                                }} />
                                        </Box>
                                        <Divider sx={{ mb: 2 }} />
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mb: 2.5 }}>
                                            {[
                                                { label: 'Autonomia', value: `${caminhao.autonomia_km_litro} km/L` },
                                                { label: 'Tanque', value: `${caminhao.capacidade_litros} L` },
                                            ].map(item => (
                                                <Box key={item.label} sx={{
                                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                    padding: '7px 10px', borderRadius: '8px', background: expressoTheme.colors.background
                                                }}>
                                                    <Typography sx={{ fontSize: '0.78rem', color: expressoTheme.colors.textSecondary }}>{item.label}</Typography>
                                                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: expressoTheme.colors.text }}>{item.value}</Typography>
                                                </Box>
                                            ))}
                                        </Box>
                                        <Divider sx={{ mb: 2 }} />
                                    </>
                                )}

                                {/* Gráfico */}
                                <Typography sx={{ fontSize: '0.72rem', color: expressoTheme.colors.textSecondary, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', mb: 1.5 }}>
                                    Custos por Mês
                                </Typography>
                                {stats?.custosPorMes && stats.custosPorMes.some(m => m.custo > 0) ? (
                                    <ResponsiveContainer width="100%" height={140}>
                                        <BarChart data={stats.custosPorMes} margin={{ top: 0, right: 0, left: -22, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={expressoTheme.colors.borderLight} />
                                            <XAxis dataKey="mes" tick={{ fill: expressoTheme.colors.textSecondary, fontSize: 10 }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fill: expressoTheme.colors.textSecondary, fontSize: 10 }} axisLine={false} tickLine={false} />
                                            <RechartTooltip
                                                contentStyle={{ background: '#fff', border: `1px solid ${expressoTheme.colors.border}`, borderRadius: 8, fontSize: 12 }}
                                                formatter={(v: number) => [`R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Custo']}
                                            />
                                            <Bar dataKey="custo" radius={[5, 5, 0, 0]}>
                                                {stats.custosPorMes.map((_, i) => (
                                                    <Cell key={i} fill={expressoTheme.colors.primary} opacity={0.5 + (i / stats.custosPorMes.length) * 0.5} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <Box sx={{ textAlign: 'center', py: 3, color: expressoTheme.colors.textLight, fontSize: '0.82rem' }}>
                                        <TrendingUp size={28} style={{ marginBottom: 6, display: 'block', margin: '0 auto 6px', color: expressoTheme.colors.textLight }} />
                                        Sem custos registrados
                                    </Box>
                                )}

                                {/* Próxima */}
                                {stats?.proxima && (
                                    <>
                                        <Divider sx={{ my: 2 }} />
                                        <Typography sx={{ fontSize: '0.72rem', color: expressoTheme.colors.textSecondary, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', mb: 1 }}>
                                            Próxima Manutenção
                                        </Typography>
                                        <Box sx={{ padding: '10px 12px', borderRadius: '10px', background: '#E1F0FF', border: `1px solid #BDE0F5` }}>
                                            <Typography sx={{ fontWeight: 700, color: expressoTheme.colors.primaryDark, fontSize: '0.88rem', mb: 0.25 }}>{stats.proxima.titulo}</Typography>
                                            {stats.proxima.data_agendada && (
                                                <Typography sx={{ fontSize: '0.76rem', color: expressoTheme.colors.primary, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <Calendar size={11} /> {new Date(stats.proxima.data_agendada + 'T12:00:00').toLocaleDateString('pt-BR')}
                                                </Typography>
                                            )}
                                        </Box>
                                    </>
                                )}
                            </Box>
                        </motion.div>
                    </Grid>
                </Grid>
            </Container>

            {/* Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ background: expressoTheme.gradients.primary, color: 'white', fontWeight: 700, fontSize: '1rem' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Wrench size={18} />
                        {editing ? 'Editar Manutenção' : 'Nova Manutenção'}
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ pt: '20px !important' }}>
                    <Grid container spacing={2}>
                        {/* Tipo */}
                        <Grid item xs={12}>
                            <Typography sx={{ fontSize: '0.75rem', color: expressoTheme.colors.textSecondary, mb: 1.25, fontWeight: 600, letterSpacing: '0.5px' }}>TIPO DE MANUTENÇÃO</Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(3, 1fr)', sm: 'repeat(6, 1fr)' }, gap: 1 }}>
                                {TIPOS.map(t => (
                                    <Box key={t.value}
                                        className={`tipo-card ${form.tipo === t.value ? 'selected' : ''}`}
                                        onClick={() => setForm({ ...form, tipo: t.value })}>
                                        <Typography sx={{ fontSize: '1.3rem', lineHeight: 1 }}>{t.icon}</Typography>
                                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700 }}>{t.label}</Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Grid>

                        {/* Título */}
                        <Grid item xs={12}>
                            <TextField fullWidth size="small"
                                label={form.tipo === 'outro' ? 'Título da manutenção personalizada *' : 'Título *'}
                                value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })}
                                placeholder={form.tipo === 'outro' ? 'Ex: Revisão de freios traseiros' : 'Ex: Troca de óleo'}
                                sx={inputSx} />
                        </Grid>

                        {/* Descrição */}
                        <Grid item xs={12}>
                            <TextField fullWidth multiline rows={form.tipo === 'outro' ? 3 : 2} size="small"
                                label={form.tipo === 'outro' ? 'Descrição detalhada (manutenção personalizada)' : 'Descrição'}
                                value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })}
                                placeholder={form.tipo === 'outro' ? 'Descreva o que precisa ser feito, peças, instruções...' : 'Detalhes adicionais...'}
                                sx={{ ...inputSx, '& .MuiOutlinedInput-notchedOutline': { borderColor: form.tipo === 'outro' ? expressoTheme.colors.primary : undefined } }} />
                            {form.tipo === 'outro' && (
                                <Typography sx={{ fontSize: '0.72rem', color: expressoTheme.colors.primary, mt: 0.5 }}>
                                    ✏️ Manutenção personalizada — descreva livremente
                                </Typography>
                            )}
                        </Grid>

                        {/* Status + Prioridade */}
                        <Grid item xs={6}>
                            <FormControl fullWidth size="small" sx={inputSx}>
                                <InputLabel>Status</InputLabel>
                                <Select value={form.status} label="Status" onChange={e => setForm({ ...form, status: e.target.value })}>
                                    {Object.entries(STATUS_CONFIG).map(([v, c]) => <MenuItem key={v} value={v}>{c.label}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth size="small" sx={inputSx}>
                                <InputLabel>Prioridade</InputLabel>
                                <Select value={form.prioridade} label="Prioridade" onChange={e => setForm({ ...form, prioridade: e.target.value })}>
                                    {Object.entries(PRIORIDADE_CONFIG).map(([v, c]) => <MenuItem key={v} value={v}>{c.label}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Datas */}
                        <Grid item xs={6}>
                            <TextField fullWidth size="small" type="date" label="Data Agendada"
                                value={form.data_agendada} onChange={e => setForm({ ...form, data_agendada: e.target.value })}
                                InputLabelProps={{ shrink: true }} sx={inputSx} />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField fullWidth size="small" type="date" label="Data de Conclusão"
                                value={form.data_conclusao} onChange={e => setForm({ ...form, data_conclusao: e.target.value })}
                                InputLabelProps={{ shrink: true }} sx={inputSx} />
                        </Grid>

                        {/* KMs */}
                        <Grid item xs={6}>
                            <TextField fullWidth size="small" type="number" label="KM Atual"
                                value={form.km_atual} onChange={e => setForm({ ...form, km_atual: e.target.value })}
                                InputProps={{ endAdornment: <InputAdornment position="end">km</InputAdornment> }} sx={inputSx} />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField fullWidth size="small" type="number" label="KM Próxima"
                                value={form.km_proximo} onChange={e => setForm({ ...form, km_proximo: e.target.value })}
                                InputProps={{ endAdornment: <InputAdornment position="end">km</InputAdornment> }} sx={inputSx} />
                        </Grid>

                        {/* Custo + Status de Pagamento */}
                        <Grid item xs={6}>
                            <TextField fullWidth size="small" type="number" label="Custo (R$)"
                                value={form.custo_real} onChange={e => setForm({ ...form, custo_real: e.target.value })}
                                InputProps={{ startAdornment: <InputAdornment position="start">R$</InputAdornment> }} sx={inputSx} />
                        </Grid>
                        <Grid item xs={6}>
                            <Box>
                                <Typography sx={{ fontSize: '0.72rem', color: '#6C757D', mb: 0.75, fontWeight: 600, letterSpacing: '0.4px' }}>STATUS DO PAGAMENTO</Typography>
                                <ToggleButtonGroup
                                    exclusive size="small" fullWidth
                                    value={form.status_pagamento}
                                    onChange={(_, v) => { if (v) setForm({ ...form, status_pagamento: v }); }}
                                    sx={{ height: 38 }}>
                                    <ToggleButton value="pendente"
                                        sx={{
                                            textTransform: 'none', fontWeight: 600, fontSize: '0.8rem',
                                            '&.Mui-selected': { background: '#FFF3CD', color: '#856404', borderColor: '#FFC107' },
                                            flex: 1
                                        }}>
                                        💰 Pendente
                                    </ToggleButton>
                                    <ToggleButton value="paga"
                                        sx={{
                                            textTransform: 'none', fontWeight: 600, fontSize: '0.8rem',
                                            '&.Mui-selected': { background: '#D4EDDA', color: '#155724', borderColor: '#28A745' },
                                            flex: 1
                                        }}>
                                        ✅ Pago
                                    </ToggleButton>
                                </ToggleButtonGroup>
                            </Box>
                        </Grid>

                        {/* Fornecedor + Responsável */}
                        <Grid item xs={6}>
                            <TextField fullWidth size="small" label="Fornecedor / Oficina"
                                value={form.fornecedor} onChange={e => setForm({ ...form, fornecedor: e.target.value })} sx={inputSx} />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField fullWidth size="small" label="Responsável"
                                value={form.responsavel} onChange={e => setForm({ ...form, responsavel: e.target.value })} sx={inputSx} />
                        </Grid>

                        {/* Observações */}
                        <Grid item xs={12}>
                            <TextField fullWidth size="small" multiline rows={2} label="Observações"
                                value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} sx={inputSx} />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button onClick={() => setOpenDialog(false)} sx={{ color: expressoTheme.colors.textSecondary, textTransform: 'none' }}>Cancelar</Button>
                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                        <Button variant="contained" onClick={handleSave} disabled={saving}
                            sx={{
                                background: expressoTheme.gradients.primary, color: 'white', fontWeight: 600,
                                px: 3, py: 1, borderRadius: expressoTheme.borderRadius.medium, textTransform: 'none',
                                boxShadow: expressoTheme.shadows.button, '&:hover': { background: expressoTheme.colors.primaryDark }
                            }}>
                            {saving ? <CircularProgress size={18} sx={{ color: 'white' }} /> : (editing ? 'Atualizar' : 'Registrar')}
                        </Button>
                    </motion.div>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ManutencaoCaminhao;
