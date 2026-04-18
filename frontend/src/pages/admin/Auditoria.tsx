import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Container, Typography, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Chip, TextField, MenuItem, Select,
    FormControl, InputLabel, Button, CircularProgress, TablePagination, Tooltip,
} from '@mui/material';
import { motion } from 'framer-motion';
import { ShieldCheck, Search, RefreshCw, Trash2 } from 'lucide-react';
import { useSnackbar } from 'notistack';
import { expressoTheme } from '../../theme/expressoTheme';
import api from '../../services/api';

// ── Chip color por tipo de ação ───────────────────────────────────────────────
const getAcaoChipProps = (acao: string): { label: string; bg: string; color: string } => {
    if (acao === 'LOGIN') return { label: acao, bg: '#DBEAFE', color: '#1E40AF' };
    if (acao.startsWith('ATENDIMENTO')) return { label: acao, bg: '#DCFCE7', color: '#166534' };
    if (acao.startsWith('PRONTUARIO')) return { label: acao, bg: '#EDE9FE', color: '#5B21B6' };
    if (acao.startsWith('SENHA') || acao === 'CIDADAO_EXCLUIDO') return { label: acao, bg: '#FEE2E2', color: '#991B1B' };
    if (acao.startsWith('CIDADAO')) return { label: acao, bg: '#FEF3C7', color: '#92400E' };
    return { label: acao, bg: '#F3F4F6', color: '#374151' };
};

const formatDataHora = (d: string) => {
    const dt = new Date(d);
    return `${dt.toLocaleDateString('pt-BR')} ${dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
};

const Auditoria: React.FC = () => {
    const { enqueueSnackbar } = useSnackbar();
    const [logs, setLogs] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage] = useState(50);
    const [filtros, setFiltros] = useState({ usuario_tipo: '', acao: '', data_inicio: '', data_fim: '' });
    const [loading, setLoading] = useState(false);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = { page: page + 1, limit: rowsPerPage };
            if (filtros.usuario_tipo) params.usuario_tipo = filtros.usuario_tipo;
            if (filtros.acao) params.acao = filtros.acao;
            if (filtros.data_inicio) params.data_inicio = filtros.data_inicio;
            if (filtros.data_fim) params.data_fim = filtros.data_fim;
            const r = await api.get('/auditoria', { params });
            setLogs(r.data.logs || []);
            setTotal(r.data.total || 0);
        } catch {
            enqueueSnackbar('Erro ao carregar logs de auditoria', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage, filtros, enqueueSnackbar]);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    // Auto-refresh a cada 2 min
    useEffect(() => {
        const interval = setInterval(fetchLogs, 120000);
        return () => clearInterval(interval);
    }, [fetchLogs]);

    const limparFiltros = () => {
        setFiltros({ usuario_tipo: '', acao: '', data_inicio: '', data_fim: '' });
        setPage(0);
    };

    return (
        <Box sx={{ minHeight: '100vh', background: expressoTheme.colors.background, pb: 6 }}>
            {/* HERO HEADER */}
            <Box sx={{ background: expressoTheme.gradients.primary, py: 5, px: 4, position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', top: -60, right: -60, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
                <Container maxWidth="xl">
                    <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ p: 2, background: 'rgba(255,255,255,0.15)', borderRadius: expressoTheme.borderRadius.large, backdropFilter: 'blur(10px)' }}>
                                <ShieldCheck size={36} color="white" />
                            </Box>
                            <Box>
                                <Typography variant="h4" sx={{ color: 'white', fontWeight: 800, letterSpacing: -0.5 }}>
                                    Log de Auditoria
                                </Typography>
                                <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem', mt: 0.5 }}>
                                    Registro de todas as operações sensíveis do sistema — Conformidade LGPD
                                </Typography>
                            </Box>
                        </Box>
                    </motion.div>
                </Container>
            </Box>

            <Container maxWidth="xl" sx={{ mt: 3 }}>
                {/* BARRA DE FILTROS */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Paper sx={{ p: 2.5, mb: 3, borderRadius: expressoTheme.borderRadius.large, border: `1px solid ${expressoTheme.colors.border}`, boxShadow: expressoTheme.shadows.card }}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                            <FormControl size="small" sx={{ minWidth: 160 }}>
                                <InputLabel>Tipo de Usuário</InputLabel>
                                <Select
                                    value={filtros.usuario_tipo}
                                    label="Tipo de Usuário"
                                    onChange={e => setFiltros(f => ({ ...f, usuario_tipo: e.target.value }))}
                                    sx={{ borderRadius: expressoTheme.borderRadius.medium }}
                                >
                                    <MenuItem value="">Todos</MenuItem>
                                    <MenuItem value="admin">Admin</MenuItem>
                                    <MenuItem value="medico">Médico</MenuItem>
                                    <MenuItem value="cidadao">Cidadão</MenuItem>
                                    <MenuItem value="admin_estrada">Admin Estrada</MenuItem>
                                </Select>
                            </FormControl>

                            <TextField
                                size="small"
                                label="Ação"
                                placeholder="Ex: LOGIN, ATENDIMENTO..."
                                value={filtros.acao}
                                onChange={e => setFiltros(f => ({ ...f, acao: e.target.value }))}
                                sx={{ minWidth: 180, '& .MuiOutlinedInput-root': { borderRadius: expressoTheme.borderRadius.medium } }}
                                InputProps={{ startAdornment: <Search size={16} style={{ marginRight: 6, color: expressoTheme.colors.textSecondary }} /> }}
                            />

                            <TextField
                                size="small"
                                label="Data Início"
                                type="date"
                                value={filtros.data_inicio}
                                onChange={e => setFiltros(f => ({ ...f, data_inicio: e.target.value }))}
                                InputLabelProps={{ shrink: true }}
                                sx={{ minWidth: 150, '& .MuiOutlinedInput-root': { borderRadius: expressoTheme.borderRadius.medium } }}
                            />

                            <TextField
                                size="small"
                                label="Data Fim"
                                type="date"
                                value={filtros.data_fim}
                                onChange={e => setFiltros(f => ({ ...f, data_fim: e.target.value }))}
                                InputLabelProps={{ shrink: true }}
                                sx={{ minWidth: 150, '& .MuiOutlinedInput-root': { borderRadius: expressoTheme.borderRadius.medium } }}
                            />

                            <Button
                                variant="outlined"
                                startIcon={<Trash2 size={16} />}
                                onClick={limparFiltros}
                                sx={{
                                    textTransform: 'none', fontWeight: 600,
                                    borderColor: expressoTheme.colors.border, color: expressoTheme.colors.textSecondary,
                                    borderRadius: expressoTheme.borderRadius.medium,
                                    '&:hover': { background: expressoTheme.colors.cardHover, borderColor: expressoTheme.colors.primary },
                                }}
                            >
                                Limpar
                            </Button>

                            <Tooltip title="Atualizar">
                                <Button
                                    variant="contained"
                                    startIcon={<RefreshCw size={16} />}
                                    onClick={fetchLogs}
                                    disabled={loading}
                                    sx={{
                                        textTransform: 'none', fontWeight: 700,
                                        background: expressoTheme.colors.primary, color: 'white',
                                        borderRadius: expressoTheme.borderRadius.medium,
                                        '&:hover': { background: expressoTheme.colors.primaryDark },
                                    }}
                                >
                                    Buscar
                                </Button>
                            </Tooltip>

                            <Typography sx={{ ml: 'auto', fontSize: '0.82rem', color: expressoTheme.colors.textSecondary }}>
                                {total} registro(s)
                            </Typography>
                        </Box>
                    </Paper>
                </motion.div>

                {/* TABELA */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <TableContainer component={Paper} sx={{ borderRadius: expressoTheme.borderRadius.large, border: `1px solid ${expressoTheme.colors.border}`, boxShadow: expressoTheme.shadows.card }}>
                        {loading && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                <CircularProgress size={32} sx={{ color: expressoTheme.colors.primary }} />
                            </Box>
                        )}

                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    {['Data/Hora', 'Usuário', 'Tipo', 'Ação', 'Tabela', 'IP', 'Descrição'].map(h => (
                                        <TableCell key={h} sx={{
                                            fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase',
                                            letterSpacing: 0.5, background: expressoTheme.colors.background,
                                            color: expressoTheme.colors.primaryDark, borderBottom: `2px solid ${expressoTheme.colors.primary}`,
                                        }}>
                                            {h}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {!loading && logs.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 6, color: expressoTheme.colors.textSecondary }}>
                                            <ShieldCheck size={40} style={{ opacity: 0.3, marginBottom: 8 }} />
                                            <Typography>Nenhum log encontrado para os filtros selecionados.</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                                {logs.map((log: any) => {
                                    const chip = getAcaoChipProps(log.acao);
                                    return (
                                        <TableRow key={log.id} hover sx={{ '&:hover': { background: expressoTheme.colors.cardHover } }}>
                                            <TableCell sx={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                                                {formatDataHora(log.created_at)}
                                            </TableCell>
                                            <TableCell sx={{ fontSize: '0.8rem', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {log.usuario_nome || '—'}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={log.usuario_tipo || '—'}
                                                    size="small"
                                                    sx={{ fontSize: '0.7rem', fontWeight: 600, background: '#F3F4F6', color: '#374151' }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={chip.label}
                                                    size="small"
                                                    sx={{ fontSize: '0.7rem', fontWeight: 700, background: chip.bg, color: chip.color }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ fontSize: '0.78rem', color: expressoTheme.colors.textSecondary }}>
                                                {log.tabela_afetada || '—'}
                                            </TableCell>
                                            <TableCell sx={{ fontSize: '0.75rem', fontFamily: 'monospace', color: expressoTheme.colors.textLight }}>
                                                {log.ip_address || '—'}
                                            </TableCell>
                                            <TableCell sx={{ fontSize: '0.78rem', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                <Tooltip title={log.descricao || ''} placement="top-start">
                                                    <span>{log.descricao || '—'}</span>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>

                        <TablePagination
                            component="div"
                            count={total}
                            page={page}
                            onPageChange={(_e, p) => setPage(p)}
                            rowsPerPage={rowsPerPage}
                            rowsPerPageOptions={[50]}
                            labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
                        />
                    </TableContainer>
                </motion.div>
            </Container>
        </Box>
    );
};

export default Auditoria;
