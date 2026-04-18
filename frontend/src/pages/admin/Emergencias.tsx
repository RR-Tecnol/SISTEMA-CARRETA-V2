import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Container, Paper, Chip, Grid,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Select, MenuItem, FormControl, InputLabel, IconButton, Tooltip,
    Button, TextField, CircularProgress, Alert,
} from '@mui/material';
import {
    AlertTriangle, CheckCircle, Clock, FileText, Eye,
    RefreshCw, Search, Shield, ArrowLeft, MessageCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import { expressoTheme } from '../../theme/expressoTheme';
import ChatMedico from '../../components/medico/ChatMedico';

interface EmergenciaItem {
    id: string;
    acao_id: string;
    cidadao_id: string;
    nome_cidadao: string;
    status: string;
    atendido_por?: string;
    observacoes?: string;
    resolvido_em?: string;
    created_at: string;
    updated_at: string;
}

const statusConfig: Record<string, { cor: string; bg: string; label: string; icon: React.ReactNode }> = {
    novo: { cor: '#DC2626', bg: '#FEE2E2', label: '🔴 NOVO', icon: <AlertTriangle size={14} /> },
    visto: { cor: '#D97706', bg: '#FEF3C7', label: '🟡 Visto', icon: <Eye size={14} /> },
    em_atendimento: { cor: '#2563EB', bg: '#DBEAFE', label: '🔵 Atendendo', icon: <FileText size={14} /> },
    resolvido: { cor: '#16A34A', bg: '#D4EDDA', label: '🟢 Resolvido', icon: <CheckCircle size={14} /> },
};

const Emergencias: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [emergencias, setEmergencias] = useState<EmergenciaItem[]>([]);
    const [total, setTotal] = useState(0);
    const [filtroStatus, setFiltroStatus] = useState('todos');
    const [busca, setBusca] = useState('');
    const [stats, setStats] = useState({ novo: 0, visto: 0, em_atendimento: 0, resolvido: 0 });

    const user = useSelector((state: any) => state.auth.user);
    const [chatOpen, setChatOpen] = useState(false);
    const [chatTarget, setChatTarget] = useState<{ acao_id: string; cidadao_id: string; nome: string } | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params: any = { limit: 100 };
            if (filtroStatus !== 'todos') params.status = filtroStatus;

            const { data } = await api.get('/emergencias', { params });
            setEmergencias(data.emergencias || []);
            setTotal(data.total || 0);

            // Calcular estatísticas
            const all = data.emergencias || [];
            setStats({
                novo: all.filter((e: any) => e.status === 'novo').length,
                visto: all.filter((e: any) => e.status === 'visto').length,
                em_atendimento: all.filter((e: any) => e.status === 'em_atendimento').length,
                resolvido: all.filter((e: any) => e.status === 'resolvido').length,
            });
        } catch (err) {
            console.error('Erro ao buscar emergências:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [filtroStatus]);

    const handleChangeStatus = async (id: string, novoStatus: string) => {
        try {
            await api.put(`/emergencias/${id}/status`, { status: novoStatus });
            fetchData();
        } catch (err) {
            console.error('Erro ao atualizar status:', err);
        }
    };

    const filtrados = busca
        ? emergencias.filter(e => e.nome_cidadao.toLowerCase().includes(busca.toLowerCase()))
        : emergencias;

    const StatCard = ({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) => (
        <Grid item xs={6} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center', borderRadius: '14px', border: `1px solid ${bg}`, background: 'white' }}>
                <Typography sx={{ fontSize: '2rem', fontWeight: 900, color }}>{value}</Typography>
                <Typography sx={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>{label}</Typography>
            </Paper>
        </Grid>
    );

    return (
        <Container maxWidth="lg" sx={{ py: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Tooltip title="Voltar">
                        <IconButton
                            onClick={() => navigate(-1)}
                            sx={{ background: expressoTheme.colors.cardBackground, border: `1px solid ${expressoTheme.colors.border}`, '&:hover': { borderColor: expressoTheme.colors.primary, color: expressoTheme.colors.primary } }}
                        >
                            <ArrowLeft size={18} />
                        </IconButton>
                    </Tooltip>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 900, color: expressoTheme.colors.primaryDark }}>
                            🆘 Central de Emergências
                        </Typography>
                        <Typography sx={{ color: expressoTheme.colors.textSecondary, fontSize: '0.85rem' }}>
                            Monitoramento e gestão de alertas de emergência dos cidadãos
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip icon={<Shield size={12} />} label="LGPD · 30 dias" size="small"
                        sx={{ background: '#FEF3C7', color: '#92400E', fontWeight: 600 }} />
                    <Button variant="outlined" startIcon={<RefreshCw size={14} />}
                        onClick={fetchData} size="small"
                        sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '10px', borderColor: expressoTheme.colors.primary, color: expressoTheme.colors.primary }}>
                        Atualizar
                    </Button>
                </Box>
            </Box>

            {/* Estatísticas */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <StatCard label="Novas" value={stats.novo} color="#DC2626" bg="#FEE2E2" />
                <StatCard label="Vistas" value={stats.visto} color="#D97706" bg="#FEF3C7" />
                <StatCard label="Em Atendimento" value={stats.em_atendimento} color="#2563EB" bg="#DBEAFE" />
                <StatCard label="Resolvidas" value={stats.resolvido} color="#16A34A" bg="#D4EDDA" />
            </Grid>

            {/* Filtros */}
            <Paper sx={{ p: 2.5, borderRadius: '14px', mb: 3, border: `1px solid ${expressoTheme.colors.border}` }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                        <InputLabel>Status</InputLabel>
                        <Select value={filtroStatus} label="Status"
                            onChange={(e) => setFiltroStatus(e.target.value)}
                            sx={{ borderRadius: '10px' }}>
                            <MenuItem value="todos">Todos</MenuItem>
                            <MenuItem value="novo">🔴 Novos</MenuItem>
                            <MenuItem value="visto">🟡 Vistos</MenuItem>
                            <MenuItem value="em_atendimento">🔵 Em Atendimento</MenuItem>
                            <MenuItem value="resolvido">🟢 Resolvidos</MenuItem>
                        </Select>
                    </FormControl>
                    <TextField
                        size="small" placeholder="Buscar por nome..."
                        value={busca} onChange={(e) => setBusca(e.target.value)}
                        InputProps={{ startAdornment: <Search size={16} color="#94a3b8" style={{ marginRight: 8 }} /> }}
                        sx={{ minWidth: 220, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                    />
                    <Typography sx={{ ml: 'auto', fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
                        {total} registro{total !== 1 ? 's' : ''}
                    </Typography>
                </Box>
            </Paper>

            {/* Tabela */}
            {loading ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                    <CircularProgress sx={{ color: expressoTheme.colors.primary }} />
                </Box>
            ) : filtrados.length === 0 ? (
                <Alert severity="info" sx={{ borderRadius: '14px' }}>
                    Nenhuma emergência encontrada.
                </Alert>
            ) : (
                <TableContainer component={Paper} sx={{ borderRadius: '14px', border: `1px solid ${expressoTheme.colors.border}` }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ background: expressoTheme.colors.cardHover }}>
                                <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Paciente</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Data/Hora</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Resolução</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }} align="center">Ações</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filtrados.map((em) => {
                                const cfg = statusConfig[em.status] || statusConfig.novo;
                                return (
                                    <TableRow key={em.id} sx={{
                                        background: em.status === 'novo' ? '#FFF5F5' : 'transparent',
                                        '&:hover': { background: expressoTheme.colors.cardHover },
                                    }}>
                                        <TableCell>
                                            <Chip
                                                icon={cfg.icon as React.ReactElement}
                                                label={cfg.label} size="small"
                                                sx={{ background: cfg.bg, color: cfg.cor, fontWeight: 700, fontSize: '0.72rem', '& .MuiChip-icon': { color: cfg.cor } }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>
                                                {em.nome_cidadao}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography sx={{ fontSize: '0.82rem', color: '#475569' }}>
                                                {(() => {
                                                    const d = em.created_at || (em as any).createdAt;
                                                    return d ? `${new Date(d).toLocaleDateString('pt-BR')} às ${new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : '—';
                                                })()}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            {em.resolvido_em ? (
                                                <Typography sx={{ fontSize: '0.78rem', color: '#16A34A' }}>
                                                    ✓ {new Date(em.resolvido_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                </Typography>
                                            ) : (
                                                <Typography sx={{ fontSize: '0.78rem', color: '#94a3b8' }}>—</Typography>
                                            )}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                                <Tooltip title="Ver Ficha Clínica">
                                                    <IconButton size="small" onClick={() => navigate(`/ficha/${em.cidadao_id}`)}
                                                        sx={{ color: expressoTheme.colors.primary, border: `1px solid ${expressoTheme.colors.borderLight}`, borderRadius: '8px' }}>
                                                        <FileText size={16} />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Falar no Chat">
                                                    <IconButton size="small" onClick={() => {
                                                        setChatTarget({ acao_id: em.acao_id, cidadao_id: em.cidadao_id, nome: em.nome_cidadao });
                                                        setChatOpen(true);
                                                    }}
                                                        sx={{ color: '#0EA5E9', border: '1px solid #E0F2FE', borderRadius: '8px' }}>
                                                        <MessageCircle size={16} />
                                                    </IconButton>
                                                </Tooltip>
                                                {em.status === 'novo' && (
                                                    <Tooltip title="Marcar como Visto">
                                                        <IconButton size="small" onClick={() => handleChangeStatus(em.id, 'visto')}
                                                            sx={{ color: '#D97706', border: '1px solid #FEF3C7', borderRadius: '8px' }}>
                                                            <Eye size={16} />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                {(em.status === 'novo' || em.status === 'visto') && (
                                                    <Tooltip title="Estou Atendendo">
                                                        <IconButton size="small" onClick={() => handleChangeStatus(em.id, 'em_atendimento')}
                                                            sx={{ color: '#2563EB', border: '1px solid #DBEAFE', borderRadius: '8px' }}>
                                                            <Clock size={16} />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                {em.status !== 'resolvido' && (
                                                    <Tooltip title="Marcar como Resolvido">
                                                        <IconButton size="small" onClick={() => handleChangeStatus(em.id, 'resolvido')}
                                                            sx={{ color: '#16A34A', border: '1px solid #D4EDDA', borderRadius: '8px' }}>
                                                            <CheckCircle size={16} />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* LGPD Notice */}
            <Alert severity="info" icon={<Shield size={16} />}
                sx={{ mt: 3, borderRadius: '12px', background: '#F0F9FF', border: '1px solid #BAE6FD', fontSize: '0.75rem' }}>
                Dados protegidos pela LGPD (Lei nº 13.709/2018). Registros são automaticamente removidos após 30 dias.
            </Alert>

            {chatOpen && chatTarget && (
                <ChatMedico
                    open={chatOpen}
                    onClose={() => setChatOpen(false)}
                    acaoId={chatTarget.acao_id}
                    cidadaoId={chatTarget.cidadao_id}
                    nomeCidadao={chatTarget.nome}
                    medicoId={user?.funcionario_id || user?.id || ''}
                />
            )}
        </Container>
    );
};

export default Emergencias;
