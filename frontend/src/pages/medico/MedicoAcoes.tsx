import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Box, Typography, Container, Grid, Button, Chip,
    CircularProgress, TextField, InputAdornment, IconButton,
} from '@mui/material';
import {
    MapPin, Calendar, Users, ChevronRight,
    Search, X, Stethoscope, AlertCircle, RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useSnackbar } from 'notistack';
import api from '../../services/api';
import { expressoTheme } from '../../theme/expressoTheme';

interface AcaoMedico {
    id: string;
    numero_acao?: number;
    nome: string;
    tipo: 'curso' | 'saude';
    municipio: string;
    estado: string;
    data_inicio: string;
    data_fim: string;
    status: 'planejada' | 'ativa' | 'concluida';
    descricao?: string;
    local_execucao: string;
    totalInscritos: number;
    pendentes: number;
    atendidos: number;
}

const statusLabel: Record<string, string> = { ativa: 'Ativa', planejada: 'Planejada', concluida: 'Concluída' };
const statusColor: Record<string, string> = { ativa: expressoTheme.colors.success, planejada: expressoTheme.colors.warning, concluida: expressoTheme.colors.textSecondary };
const tipoLabel: Record<string, string> = { curso: 'Curso', saude: 'Saúde' };

const MedicoAcoes: React.FC = () => {
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const user = useSelector((state: any) => state.auth?.user);

    const [acoes, setAcoes] = useState<AcaoMedico[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const id = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(id);
    }, []);

    const fetchAcoes = useCallback(async () => {
        try {
            const r = await api.get('/medico-monitoring/minhas-acoes');
            setAcoes(Array.isArray(r.data) ? r.data : []);
        } catch (e: any) {
            enqueueSnackbar(e.response?.data?.error || 'Erro ao carregar ações', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    }, [enqueueSnackbar]);

    useEffect(() => { fetchAcoes(); }, [fetchAcoes]);

    const filtered = acoes.filter((a) =>
        a.nome.toLowerCase().includes(search.toLowerCase()) ||
        a.municipio.toLowerCase().includes(search.toLowerCase()) ||
        a.local_execucao.toLowerCase().includes(search.toLowerCase()) ||
        String(a.numero_acao || '').includes(search)
    );

    const nomeMedico = user?.nome || 'Médico';

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <CircularProgress sx={{ color: expressoTheme.colors.primary }} size={52} />
        </Box>
    );

    return (
        <Box sx={{ minHeight: '100vh', background: expressoTheme.colors.background, py: 4 }}>
            <Container maxWidth="xl">

                {/* ── HEADER ── */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, flexWrap: 'wrap', gap: 2 }}>
                        <Box>
                            <Typography sx={{ color: expressoTheme.colors.textSecondary, fontSize: '0.78rem', letterSpacing: 1, textTransform: 'uppercase', mb: 0.5 }}>
                                {currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 800, color: expressoTheme.colors.primaryDark, mb: 0.25 }}>
                                Olá, Dr(a). {nomeMedico.split(' ')[0]} 👋
                            </Typography>
                            <Typography sx={{ color: expressoTheme.colors.textSecondary }}>
                                Selecione uma ação para iniciar os atendimentos
                            </Typography>
                        </Box>
                        <Box sx={{
                            background: expressoTheme.gradients.primary,
                            borderRadius: expressoTheme.borderRadius.large,
                            px: 3, py: 1.5, textAlign: 'center',
                            boxShadow: expressoTheme.shadows.button,
                        }}>
                            <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.7rem', letterSpacing: 2, textTransform: 'uppercase' }}>
                                Hora Atual
                            </Typography>
                            <Typography sx={{ fontFamily: 'monospace', fontSize: '1.8rem', fontWeight: 900, color: '#fff', letterSpacing: -1, lineHeight: 1.1 }}>
                                {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </Typography>
                        </Box>
                    </Box>
                </motion.div>

                {/* ── RESUMO ── */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        {[
                            { label: 'Ações Vinculadas', value: acoes.length, color: expressoTheme.colors.primary, bg: expressoTheme.colors.cardHover },
                            { label: 'Total Inscritos', value: acoes.reduce((s, a) => s + a.totalInscritos, 0), color: expressoTheme.colors.primaryDark, bg: '#EBF5FB' },
                            { label: 'Pendentes', value: acoes.reduce((s, a) => s + a.pendentes, 0), color: expressoTheme.colors.warning, bg: '#FFFBEB' },
                            { label: 'Atendidos Hoje', value: acoes.reduce((s, a) => s + a.atendidos, 0), color: expressoTheme.colors.success, bg: '#F0FDF4' },
                        ].map((kpi, i) => (
                            <Grid item xs={6} sm={3} key={i}>
                                <motion.div whileHover={{ y: -4, scale: 1.02 }}>
                                    <Box sx={{
                                        background: expressoTheme.colors.cardBackground,
                                        borderRadius: expressoTheme.borderRadius.large,
                                        border: `1px solid ${expressoTheme.colors.border}`,
                                        p: 2, textAlign: 'center',
                                        boxShadow: expressoTheme.shadows.card,
                                        transition: 'all 0.3s ease',
                                        '&:hover': { borderColor: kpi.color, boxShadow: expressoTheme.shadows.cardHover },
                                    }}>
                                        <Typography sx={{ color: expressoTheme.colors.textSecondary, fontSize: '0.75rem', mb: 0.5 }}>{kpi.label}</Typography>
                                        <Typography sx={{ color: kpi.color, fontWeight: 900, fontSize: '2rem', lineHeight: 1 }}>{kpi.value}</Typography>
                                    </Box>
                                </motion.div>
                            </Grid>
                        ))}
                    </Grid>
                </motion.div>

                {/* ── BUSCA ── */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Box sx={{
                        background: expressoTheme.colors.cardBackground,
                        borderRadius: expressoTheme.borderRadius.large,
                        border: `1px solid ${expressoTheme.colors.border}`,
                        p: 2.5, mb: 3,
                        boxShadow: expressoTheme.shadows.card,
                        display: 'flex', gap: 2, alignItems: 'center',
                    }}>
                        <TextField
                            fullWidth
                            placeholder="Pesquisar ação por nome, município ou número..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            size="small"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: expressoTheme.borderRadius.medium,
                                    '&:hover fieldset': { borderColor: expressoTheme.colors.primary },
                                    '&.Mui-focused fieldset': { borderColor: expressoTheme.colors.primary },
                                },
                            }}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><Search size={18} color={expressoTheme.colors.textSecondary} /></InputAdornment>,
                                endAdornment: search && (
                                    <InputAdornment position="end">
                                        <IconButton size="small" onClick={() => setSearch('')}><X size={16} /></IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <IconButton onClick={fetchAcoes} sx={{ color: expressoTheme.colors.textSecondary, '&:hover': { color: expressoTheme.colors.primary } }}>
                            <RefreshCw size={18} />
                        </IconButton>
                    </Box>
                </motion.div>

                {/* ── AÇÕES ── */}
                <Grid container spacing={2}>
                    <AnimatePresence>
                        {filtered.length === 0 ? (
                            <Grid item xs={12}>
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <Box sx={{
                                        background: expressoTheme.colors.cardBackground,
                                        borderRadius: expressoTheme.borderRadius.large,
                                        border: `1px solid ${expressoTheme.colors.border}`,
                                        p: 8, textAlign: 'center',
                                        boxShadow: expressoTheme.shadows.card,
                                    }}>
                                        <AlertCircle size={48} color={expressoTheme.colors.textLight} style={{ marginBottom: 16 }} />
                                        <Typography variant="h6" sx={{ color: expressoTheme.colors.textSecondary, mb: 1 }}>
                                            {search ? 'Nenhuma ação encontrada' : 'Nenhuma ação vinculada'}
                                        </Typography>
                                        <Typography sx={{ color: expressoTheme.colors.textLight, fontSize: '0.88rem' }}>
                                            {search
                                                ? 'Tente outro termo de busca.'
                                                : 'Peça ao administrador para vincular você a uma ação em "Gerenciar Ação → Funcionários".'}
                                        </Typography>
                                    </Box>
                                </motion.div>
                            </Grid>
                        ) : (
                            filtered.map((acao, index) => (
                                <Grid item xs={12} sm={6} md={4} lg={3} key={acao.id}>
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ delay: index * 0.05 }}
                                        whileHover={{ y: -4, scale: 1.015 }}
                                        style={{ height: '100%' }}
                                    >
                                        <Box
                                            sx={{
                                                background: expressoTheme.colors.cardBackground,
                                                borderRadius: expressoTheme.borderRadius.large,
                                                border: `1px solid ${expressoTheme.colors.border}`,
                                                p: 2, height: '100%',
                                                cursor: 'pointer',
                                                transition: 'all 0.25s ease',
                                                boxShadow: expressoTheme.shadows.card,
                                                display: 'flex', flexDirection: 'column',
                                                '&:hover': {
                                                    borderColor: expressoTheme.colors.primary,
                                                    boxShadow: expressoTheme.shadows.cardHover,
                                                    background: expressoTheme.colors.cardHover,
                                                },
                                            }}
                                            onClick={() => navigate(`/medico/acao/${acao.id}`)}
                                        >
                                            {/* Top row: ícone + chips */}
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.25 }}>
                                                <Box sx={{
                                                    display: 'inline-flex', p: 0.9,
                                                    borderRadius: expressoTheme.borderRadius.medium,
                                                    background: expressoTheme.gradients.primary,
                                                }}>
                                                    <Stethoscope size={16} color="white" />
                                                </Box>
                                                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'nowrap' }}>
                                                    <Chip
                                                        label={statusLabel[acao.status] || acao.status}
                                                        size="small"
                                                        sx={{ background: statusColor[acao.status], color: 'white', fontWeight: 700, fontSize: '0.65rem', height: 20, '& .MuiChip-label': { px: 0.75 } }}
                                                    />
                                                    <Chip
                                                        label={tipoLabel[acao.tipo] || acao.tipo}
                                                        size="small"
                                                        sx={{ background: expressoTheme.colors.cardHover, color: expressoTheme.colors.primaryDark, fontWeight: 600, fontSize: '0.65rem', height: 20, '& .MuiChip-label': { px: 0.75 } }}
                                                    />
                                                </Box>
                                            </Box>

                                            {/* Nome */}
                                            <Typography sx={{ color: expressoTheme.colors.text, fontWeight: 700, mb: 0.25, fontSize: '0.88rem', lineHeight: 1.3 }}>
                                                {acao.nome || (acao.numero_acao ? `Ação #${acao.numero_acao}` : 'Ação')}
                                            </Typography>
                                            {acao.numero_acao && (
                                                <Typography sx={{ color: expressoTheme.colors.textLight, fontSize: '0.68rem', mb: 1 }}>
                                                    Ação #{acao.numero_acao}
                                                </Typography>
                                            )}

                                            {/* Infos compactas */}
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4, mb: 1.25, flex: 1 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                                                    <MapPin size={11} color={expressoTheme.colors.primary} />
                                                    <Typography sx={{ color: expressoTheme.colors.textSecondary, fontSize: '0.72rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {acao.local_execucao} — {acao.municipio}/{acao.estado}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                                                    <Calendar size={11} color={expressoTheme.colors.primary} />
                                                    <Typography sx={{ color: expressoTheme.colors.textSecondary, fontSize: '0.72rem' }}>
                                                        {new Date(acao.data_inicio).toLocaleDateString('pt-BR')} – {new Date(acao.data_fim).toLocaleDateString('pt-BR')}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                                                    <Users size={11} color={expressoTheme.colors.primary} />
                                                    <Typography sx={{ color: expressoTheme.colors.textSecondary, fontSize: '0.72rem' }}>
                                                        {acao.totalInscritos} inscritos · <strong>{acao.pendentes}</strong> pend. · {acao.atendidos} atend.
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            {/* Barra de progresso fina */}
                                            {acao.totalInscritos > 0 && (
                                                <Box sx={{ mb: 1.25 }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                                                        <Typography sx={{ color: expressoTheme.colors.textSecondary, fontSize: '0.65rem' }}>Progresso</Typography>
                                                        <Typography sx={{ color: expressoTheme.colors.primaryDark, fontSize: '0.65rem', fontWeight: 700 }}>
                                                            {Math.round((acao.atendidos / acao.totalInscritos) * 100)}%
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ background: expressoTheme.colors.borderLight, borderRadius: 99, height: 4, overflow: 'hidden' }}>
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${Math.round((acao.atendidos / acao.totalInscritos) * 100)}%` }}
                                                            transition={{ duration: 0.8, delay: index * 0.05 + 0.3 }}
                                                            style={{ height: '100%', background: expressoTheme.gradients.primary, borderRadius: 99 }}
                                                        />
                                                    </Box>
                                                </Box>
                                            )}

                                            {/* CTA compacto */}
                                            <Button
                                                fullWidth
                                                variant="contained"
                                                endIcon={<ChevronRight size={14} />}
                                                size="small"
                                                sx={{
                                                    background: expressoTheme.gradients.primary,
                                                    borderRadius: expressoTheme.borderRadius.medium,
                                                    textTransform: 'none', fontWeight: 700,
                                                    fontSize: '0.78rem', py: 0.7,
                                                    boxShadow: expressoTheme.shadows.button,
                                                    '&:hover': { background: expressoTheme.colors.primaryDark },
                                                }}
                                            >
                                                Iniciar Atendimentos
                                            </Button>
                                        </Box>
                                    </motion.div>
                                </Grid>
                            ))
                        )}
                    </AnimatePresence>
                </Grid>
            </Container>
        </Box>
    );
};

export default MedicoAcoes;
