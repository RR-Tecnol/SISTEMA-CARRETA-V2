import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Box, Typography, Button, TextField, Chip, Tooltip,
    IconButton, CircularProgress, Alert, Container, Grid,
    List, ListItemButton, ListItemText, ListItemAvatar, Avatar, Tabs, Tab,
} from '@mui/material';
import {
    Play, Activity,
    CheckCircle2, XCircle,
    AlertTriangle, Stethoscope, RefreshCw, LogIn, LogOut,
    Timer, Users, ClipboardList, Wifi, WifiOff, Frown,
    ArrowLeft, Search, Bell, Clock,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { useSnackbar } from 'notistack';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { expressoTheme } from '../../theme/expressoTheme';

// ─── Interfaces ────────────────────────────────────────────────────────────────
interface Atendimento {
    id: string;
    nome_paciente?: string;
    cidadao?: { nome: string };
    hora_inicio: string;
    hora_fim?: string;
    duracao_minutos?: number;
    status: 'em_andamento' | 'concluido' | 'cancelado';
    observacoes?: string;
}

interface Inscrito {
    id: string;
    cidadao: { id: string; nome: string; cpf: string; data_nascimento?: string; telefone?: string; genero?: string };
    status: 'pendente' | 'atendido' | 'faltou';
}

// ─── Utilitários ───────────────────────────────────────────────────────────────
const formatDuration = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const formatHora = (iso: string) =>
    new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

// ─── Componente Principal ──────────────────────────────────────────────────────
const MedicoPanel: React.FC = () => {
    const { enqueueSnackbar } = useSnackbar();
    const navigate = useNavigate();
    const { acaoId } = useParams<{ acaoId: string }>();
    const user = useSelector((state: any) => state.auth?.user);

    const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
    const [emAndamento, setEmAndamento] = useState<Atendimento | null>(null);
    const [inscritos, setInscritos] = useState<Inscrito[]>([]);
    const [loading, setLoading] = useState(true);
    const [timerSecs, setTimerSecs] = useState(0);
    const [nomePaciente, setNomePaciente] = useState('');
    const [cidadaoSelecionado, setCidadaoSelecionado] = useState<Inscrito | null>(null);
    const [observacoes, setObservacoes] = useState('');
    const [observacoesEmAndamento, setObservacoesEmAndamento] = useState('');
    const [iniciando, setIniciando] = useState(false);
    const [finalizando, setFinalizando] = useState(false);
    const [pontoStatus, setPontoStatus] = useState<'trabalhando' | 'saiu' | null>(null);
    const [pontoId, setPontoId] = useState<string | null>(null);
    const [online, setOnline] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [tabInscritos, setTabInscritos] = useState<'pendente' | 'atendido' | 'todos'>('pendente');
    const [buscaInscrito, setBuscaInscrito] = useState('');
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const pollRef = useRef<NodeJS.Timeout | null>(null);
    const [filaEspera, setFilaEspera] = useState<Array<{ id: string; nome_display: string; tempo_espera_segundos: number; cidadao?: any; acao?: any }>>([]);
    const filaCountRef = useRef<number>(-1);
    const filaRef = useRef<NodeJS.Timeout | null>(null);

    const formatEspera = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    };

    // ── Clock ──
    useEffect(() => {
        const id = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(id);
    }, []);

    // ── Timer Consulta ──
    useEffect(() => {
        if (emAndamento) {
            const inicio = new Date(emAndamento.hora_inicio).getTime();
            const update = () => {
                const srvOffset = (window as any).__serverTimeOffset || 0;
                const nowServer = Date.now() + srvOffset;
                setTimerSecs(Math.max(0, Math.floor((nowServer - inicio) / 1000)));
            };
            update();
            timerRef.current = setInterval(update, 1000);
        } else {
            setTimerSecs(0);
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [emAndamento]);

    // ── Online status ──
    useEffect(() => {
        const on = () => setOnline(true);
        const off = () => setOnline(false);
        window.addEventListener('online', on);
        window.addEventListener('offline', off);
        return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
    }, []);

    // ── Buscar inscritos da ação ──
    const fetchInscritos = useCallback(async () => {
        if (!acaoId) return;
        try {
            const r = await api.get(`/medico-monitoring/acao/${acaoId}/inscricoes?status=todos&limit=200`);
            setInscritos(r.data.inscricoes || []);
        } catch { /* silencioso */ }
    }, [acaoId]);

    // ── Data Fetch ──
    const fetchData = useCallback(async () => {
        try {
            const url = acaoId
                ? `/medico-monitoring/me?acao_id=${acaoId}`
                : '/medico-monitoring/me';
            const r = await api.get(url);
            const data = r.data;

            // Sincronizar relógio com o servidor (usando payload explícito) para o Timer
            if (data.serverTime) {
                const srvTime = new Date(data.serverTime).getTime();
                (window as any).__serverTimeOffset = srvTime - Date.now();
            }

            setAtendimentos(data.atendimentos || []);
            setEmAndamento(data.emAndamento || null);
            setPontoStatus(data.pontoStatus || null);
            setPontoId(data.pontoId || null);
            if (data.emAndamento) setObservacoesEmAndamento(data.emAndamento.observacoes || '');
            setOnline(true);
        } catch {
            setOnline(false);
        } finally {
            setLoading(false);
        }
    }, [acaoId]);

    // ── Fila de espera ──
    const fetchFila = useCallback(async () => {
        if (!user?.id) return;
        try {
            const params: any = {};
            if (acaoId) params.acao_id = acaoId;
            const r = await api.get(`/medico-monitoring/fila/${user.id}`, { params });
            const novaFila = r.data?.fila || [];
            const novoTotal = r.data?.total ?? 0;
            if (filaCountRef.current >= 0 && novoTotal > filaCountRef.current) {
                const novosPacientes = novaFila.slice(filaCountRef.current);
                novosPacientes.forEach((p: any) => {
                    enqueueSnackbar(`👥 Novo paciente na fila: ${p.nome_display}`, {
                        variant: 'info',
                        anchorOrigin: { vertical: 'top', horizontal: 'right' },
                        autoHideDuration: 6000,
                    });
                });
            }
            filaCountRef.current = novoTotal;
            setFilaEspera(novaFila);
        } catch { /* silencioso */ }
    }, [user?.id, acaoId, enqueueSnackbar]);

    useEffect(() => {
        fetchData();
        fetchInscritos();
        fetchFila();
        pollRef.current = setInterval(() => { fetchData(); fetchInscritos(); }, 30000);
        filaRef.current = setInterval(fetchFila, 10000);
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
            if (filaRef.current) clearInterval(filaRef.current);
        };
    }, [fetchData, fetchInscritos, fetchFila]);

    // ── Derivados ──
    const feitos = atendimentos.filter((a) => a.status === 'concluido');
    const cancelados = atendimentos.filter((a) => a.status === 'cancelado');
    const tempoMedio = feitos.length ? Math.round(feitos.reduce((acc, a) => acc + (a.duracao_minutos || 0), 0) / feitos.length) : 0;

    const inscritosFiltrados = inscritos
        .filter((i) => tabInscritos === 'todos' || i.status === tabInscritos)
        .filter((i) => !buscaInscrito || i.cidadao.nome.toLowerCase().includes(buscaInscrito.toLowerCase()));

    const handleAbrirPonto = async () => {
        if (!user?.id) return;
        try {
            await api.post('/medico-monitoring/ponto/entrada', { funcionario_id: user.id });
            enqueueSnackbar('Turno iniciado!', { variant: 'success' });
            await fetchData();
        } catch (e: any) {
            if (e.response?.status === 409) { await fetchData(); }
            else { enqueueSnackbar('Erro ao iniciar turno', { variant: 'error' }); }
        }
    };

    const handleFecharPonto = async () => {
        if (!pontoId) return;
        try {
            await api.put(`/medico-monitoring/ponto/${pontoId}/saida`);
            enqueueSnackbar('Turno encerrado!', { variant: 'success' });
            await fetchData();
        } catch { enqueueSnackbar('Erro ao encerrar turno', { variant: 'error' }); }
    };

    const handleIniciarConsulta = async (inscrito?: Inscrito) => {
        const paciente = inscrito?.cidadao.nome || nomePaciente.trim();
        if (!paciente) { enqueueSnackbar('Informe o nome do paciente', { variant: 'warning' }); return; }
        setIniciando(true);
        try {
            await api.post('/medico-monitoring/atendimento/iniciar', {
                funcionario_id: user?.id,
                nome_paciente: paciente,
                cidadao_id: inscrito?.cidadao.id,
                acao_id: acaoId,
                observacoes,
                ponto_id: pontoId,
            });
            setNomePaciente(''); setObservacoes(''); setCidadaoSelecionado(null);
            enqueueSnackbar('Consulta iniciada!', { variant: 'success' });
            await fetchData(); await fetchInscritos();
        } catch (e: any) {
            enqueueSnackbar(e.response?.data?.error || 'Erro ao iniciar consulta', { variant: 'error' });
        } finally { setIniciando(false); }
    };

    const handleFinalizarConsulta = async () => {
        if (!emAndamento) return;
        setFinalizando(true);
        try {
            await api.put(`/medico-monitoring/atendimento/${emAndamento.id}/finalizar`, { observacoes: observacoesEmAndamento });
            enqueueSnackbar('Consulta finalizada!', { variant: 'success' });
            await fetchData(); await fetchInscritos();
        } catch { enqueueSnackbar('Erro ao finalizar', { variant: 'error' }); }
        finally { setFinalizando(false); }
    };

    const handleCancelarConsulta = async () => {
        if (!emAndamento) return;
        try {
            await api.put(`/medico-monitoring/atendimento/${emAndamento.id}/cancelar`);
            enqueueSnackbar('Consulta cancelada', { variant: 'warning' });
            await fetchData(); await fetchInscritos();
        } catch { enqueueSnackbar('Erro ao cancelar', { variant: 'error' }); }
    };

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', background: expressoTheme.colors.background }}>
            <CircularProgress sx={{ color: expressoTheme.colors.primary }} size={56} />
        </Box>
    );

    const nomeMedico = user?.nome || 'Médico';
    const timerColor = timerSecs > 1800 ? expressoTheme.colors.warning : expressoTheme.colors.success;

    const kpis = [
        { label: 'Hoje', value: atendimentos.length, color: expressoTheme.colors.primary },
        { label: 'Concluídos', value: feitos.length, color: expressoTheme.colors.success },
        { label: 'Tempo Médio', value: tempoMedio > 0 ? `${tempoMedio}min` : '—', color: '#F59E0B' },
        { label: 'Cancelados', value: cancelados.length, color: expressoTheme.colors.danger },
    ];

    return (
        <Box sx={{ minHeight: '100vh', background: expressoTheme.colors.background, py: 3 }}>
            <Container maxWidth="xl">

                {/* ── HEADER ── */}
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Tooltip title="Voltar para Ações">
                                <IconButton
                                    onClick={() => navigate('/medico')}
                                    sx={{ background: expressoTheme.colors.cardBackground, border: `1px solid ${expressoTheme.colors.border}`, '&:hover': { borderColor: expressoTheme.colors.primary, color: expressoTheme.colors.primary } }}
                                >
                                    <ArrowLeft size={18} />
                                </IconButton>
                            </Tooltip>
                            <Box>
                                <Typography sx={{ color: expressoTheme.colors.textSecondary, fontSize: '0.75rem', letterSpacing: 1, textTransform: 'uppercase' }}>
                                    {currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </Typography>
                                <Typography variant="h5" sx={{ fontWeight: 800, color: expressoTheme.colors.primaryDark, lineHeight: 1.2 }}>
                                    Dr(a). {nomeMedico.split(' ')[0]} — Painel de Atendimento
                                </Typography>
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Chip
                                icon={online ? <Wifi size={13} /> : <WifiOff size={13} />}
                                label={online ? 'Online' : 'Offline'}
                                size="small"
                                sx={{
                                    background: online ? '#D4EDDA' : '#F8D7DA',
                                    color: online ? expressoTheme.colors.success : expressoTheme.colors.danger,
                                    fontWeight: 600,
                                    '& .MuiChip-icon': { color: 'inherit' },
                                }}
                            />
                            <Tooltip title="Atualizar">
                                <IconButton onClick={() => { fetchData(); fetchInscritos(); }} size="small" sx={{ color: expressoTheme.colors.textSecondary }}>
                                    <RefreshCw size={16} />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Box>
                </motion.div>

                {/* ── ALERTA PONTO ── */}
                {pontoStatus !== 'trabalhando' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <Alert
                            severity="warning"
                            icon={<LogIn size={18} />}
                            sx={{ mb: 2.5, borderRadius: expressoTheme.borderRadius.medium }}
                            action={
                                <Button size="small" variant="contained" onClick={handleAbrirPonto} startIcon={<LogIn size={14} />}
                                    sx={{ background: expressoTheme.gradients.primary, borderRadius: expressoTheme.borderRadius.medium, textTransform: 'none', fontWeight: 600, boxShadow: expressoTheme.shadows.button }}>
                                    Iniciar Turno
                                </Button>
                            }
                        >
                            Você ainda não iniciou o turno de hoje.
                        </Alert>
                    </motion.div>
                )}

                <Grid container spacing={3}>
                    {/* ── COLUNA PRINCIPAL ── */}
                    <Grid item xs={12} lg={8}>

                        {/* ── CONSULTA EM ANDAMENTO ou NOVA CONSULTA ── */}
                        <AnimatePresence mode="wait">
                            {emAndamento ? (
                                <motion.div key="em-andamento" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                    <Box sx={{
                                        background: expressoTheme.colors.cardBackground,
                                        borderRadius: expressoTheme.borderRadius.large,
                                        border: `2px solid ${expressoTheme.colors.success}`,
                                        p: 3, mb: 3,
                                        boxShadow: expressoTheme.shadows.card,
                                    }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                                            <Box sx={{
                                                width: 10, height: 10, borderRadius: '50%',
                                                background: expressoTheme.colors.success,
                                                boxShadow: `0 0 0 4px ${expressoTheme.colors.success}30`,
                                                animation: 'pulse 1.5s ease-in-out infinite',
                                                '@keyframes pulse': { '0%,100%': { boxShadow: `0 0 0 4px ${expressoTheme.colors.success}30` }, '50%': { boxShadow: `0 0 0 8px ${expressoTheme.colors.success}10` } },
                                            }} />
                                            <Typography sx={{ color: expressoTheme.colors.success, fontWeight: 700, fontSize: '0.8rem', letterSpacing: 1, textTransform: 'uppercase' }}>
                                                Consulta em Andamento
                                            </Typography>
                                        </Box>

                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                                            <Box>
                                                <Typography sx={{ color: expressoTheme.colors.textSecondary, fontSize: '0.78rem', mb: 0.5 }}>Paciente</Typography>
                                                <Typography variant="h5" sx={{ color: expressoTheme.colors.text, fontWeight: 800 }}>
                                                    {emAndamento.nome_paciente || emAndamento.cidadao?.nome || '—'}
                                                </Typography>
                                                <Typography sx={{ color: expressoTheme.colors.textSecondary, fontSize: '0.82rem', mt: 0.5 }}>
                                                    Início: {formatHora(emAndamento.hora_inicio)}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ background: expressoTheme.colors.background, borderRadius: expressoTheme.borderRadius.large, border: `1px solid ${expressoTheme.colors.border}`, px: 3, py: 1.5, textAlign: 'center' }}>
                                                <Typography sx={{ color: expressoTheme.colors.textSecondary, fontSize: '0.7rem', letterSpacing: 1, textTransform: 'uppercase', mb: 0.25 }}>Tempo</Typography>
                                                <motion.div animate={{ scale: [1, 1.01, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                                                    <Typography sx={{ fontFamily: 'monospace', fontSize: '2.8rem', fontWeight: 900, color: timerColor, lineHeight: 1, letterSpacing: -1 }}>
                                                        {formatDuration(timerSecs)}
                                                    </Typography>
                                                </motion.div>
                                                {timerSecs > 1800 && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mt: 0.5 }}>
                                                        <AlertTriangle size={12} color={expressoTheme.colors.warning} />
                                                        <Typography sx={{ color: expressoTheme.colors.warning, fontSize: '0.7rem' }}>Consulta longa</Typography>
                                                    </Box>
                                                )}
                                            </Box>
                                        </Box>

                                        <TextField fullWidth multiline rows={2} placeholder="Observações do atendimento..."
                                            value={observacoesEmAndamento} onChange={(e) => setObservacoesEmAndamento(e.target.value)}
                                            sx={{ mb: 2.5, '& .MuiOutlinedInput-root': { borderRadius: expressoTheme.borderRadius.medium, '&:hover fieldset': { borderColor: expressoTheme.colors.primary }, '&.Mui-focused fieldset': { borderColor: expressoTheme.colors.primary } } }}
                                        />

                                        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                                            <Button variant="contained"
                                                startIcon={finalizando ? <CircularProgress size={16} color="inherit" /> : <CheckCircle2 size={16} />}
                                                onClick={handleFinalizarConsulta} disabled={finalizando}
                                                sx={{ flex: 1, py: 1.5, borderRadius: expressoTheme.borderRadius.medium, fontWeight: 700, textTransform: 'none', background: expressoTheme.gradients.primary, boxShadow: expressoTheme.shadows.button, '&:hover': { background: expressoTheme.colors.primaryDark } }}>
                                                Finalizar Consulta
                                            </Button>
                                            <Button variant="outlined" startIcon={<XCircle size={16} />} onClick={handleCancelarConsulta}
                                                sx={{ py: 1.5, borderRadius: expressoTheme.borderRadius.medium, textTransform: 'none', borderColor: expressoTheme.colors.danger, color: expressoTheme.colors.danger, '&:hover': { background: '#FDF2F2', borderColor: expressoTheme.colors.danger } }}>
                                                Cancelar
                                            </Button>
                                        </Box>
                                    </Box>
                                </motion.div>
                            ) : (
                                <motion.div key="nova-consulta" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                    <Box sx={{ background: expressoTheme.colors.cardBackground, borderRadius: expressoTheme.borderRadius.large, border: `1px solid ${expressoTheme.colors.border}`, p: 3, mb: 3, boxShadow: expressoTheme.shadows.card }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                                            <Box sx={{ display: 'inline-flex', p: 1.2, borderRadius: expressoTheme.borderRadius.medium, background: expressoTheme.gradients.primary, boxShadow: expressoTheme.shadows.button }}>
                                                <Stethoscope size={20} color="white" />
                                            </Box>
                                            <Typography variant="h6" sx={{ fontWeight: 700, color: expressoTheme.colors.primaryDark }}>Nova Consulta</Typography>
                                        </Box>

                                        {/* Selecionado da lista */}
                                        {cidadaoSelecionado ? (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, mb: 2, background: expressoTheme.colors.cardHover, borderRadius: expressoTheme.borderRadius.medium, border: `1px solid ${expressoTheme.colors.primary}` }}>
                                                <Avatar sx={{ background: expressoTheme.gradients.primary, width: 36, height: 36, fontSize: '0.9rem', fontWeight: 700 }}>
                                                    {cidadaoSelecionado.cidadao.nome[0]}
                                                </Avatar>
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography sx={{ fontWeight: 700, color: expressoTheme.colors.text }}>{cidadaoSelecionado.cidadao.nome}</Typography>
                                                    <Typography sx={{ fontSize: '0.77rem', color: expressoTheme.colors.textSecondary }}>Selecionado da lista de inscritos</Typography>
                                                </Box>
                                                <IconButton size="small" onClick={() => setCidadaoSelecionado(null)}><XCircle size={18} /></IconButton>
                                            </Box>
                                        ) : (
                                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start', mb: 0 }}>
                                                <TextField label="Nome do Paciente" value={nomePaciente} onChange={(e) => setNomePaciente(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleIniciarConsulta()}
                                                    disabled={pontoStatus !== 'trabalhando'}
                                                    sx={{ flex: 2, minWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: expressoTheme.borderRadius.medium, '&:hover fieldset': { borderColor: expressoTheme.colors.primary }, '&.Mui-focused fieldset': { borderColor: expressoTheme.colors.primary } } }}
                                                />
                                                <TextField label="Observações (opcional)" value={observacoes} onChange={(e) => setObservacoes(e.target.value)}
                                                    disabled={pontoStatus !== 'trabalhando'}
                                                    sx={{ flex: 3, minWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: expressoTheme.borderRadius.medium, '&:hover fieldset': { borderColor: expressoTheme.colors.primary }, '&.Mui-focused fieldset': { borderColor: expressoTheme.colors.primary } } }}
                                                />
                                            </Box>
                                        )}

                                        <Box sx={{ display: 'flex', gap: 1.5, mt: 2 }}>
                                            <Button variant="contained"
                                                startIcon={iniciando ? <CircularProgress size={16} color="inherit" /> : <Play size={16} />}
                                                onClick={() => handleIniciarConsulta(cidadaoSelecionado || undefined)}
                                                disabled={iniciando || pontoStatus !== 'trabalhando'}
                                                sx={{ flex: 1, py: 1.6, borderRadius: expressoTheme.borderRadius.medium, fontWeight: 700, textTransform: 'none', fontSize: '0.95rem', background: expressoTheme.gradients.primary, boxShadow: expressoTheme.shadows.button, '&:hover': { background: expressoTheme.colors.primaryDark } }}>
                                                {iniciando ? 'Iniciando...' : 'Iniciar Consulta'}
                                            </Button>
                                        </Box>
                                        {pontoStatus !== 'trabalhando' && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5 }}>
                                                <AlertTriangle size={14} color={expressoTheme.colors.warning} />
                                                <Typography sx={{ color: expressoTheme.colors.warning, fontSize: '0.8rem' }}>Inicie o turno para liberar consultas.</Typography>
                                            </Box>
                                        )}
                                    </Box>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* ── FILA DE ESPERA ── */}
                        {filaEspera.length > 0 && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                                <Box sx={{
                                    background: 'linear-gradient(135deg, #fef9c3 0%, #fef3c7 100%)',
                                    borderRadius: expressoTheme.borderRadius.large,
                                    border: '2px solid #fbbf24',
                                    p: 3, mb: 3,
                                    boxShadow: '0 4px 20px rgba(251,191,36,0.2)',
                                }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 0.8, background: '#fbbf24', borderRadius: '10px' }}>
                                            <Bell size={18} color="white" />
                                        </Box>
                                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#92400e', flex: 1 }}>
                                            Fila de Espera
                                        </Typography>
                                        <Chip
                                            label={`${filaEspera.length} paciente${filaEspera.length > 1 ? 's' : ''}`}
                                            size="small"
                                            sx={{ background: '#fbbf24', color: '#78350f', fontWeight: 800, fontSize: '0.78rem' }}
                                        />
                                    </Box>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        {filaEspera.map((paciente, idx) => (
                                            <motion.div key={paciente.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}>
                                                <Box sx={{
                                                    display: 'flex', alignItems: 'center', gap: 2,
                                                    p: 1.5, borderRadius: expressoTheme.borderRadius.medium,
                                                    background: 'rgba(255,255,255,0.8)', border: '1px solid #fde68a',
                                                }}>
                                                    <Box sx={{ width: 36, height: 36, borderRadius: '10px', background: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        <Typography sx={{ color: '#78350f', fontWeight: 800, fontSize: '0.9rem' }}>{idx + 1}</Typography>
                                                    </Box>
                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                        <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#78350f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {paciente.nome_display}
                                                        </Typography>
                                                        {paciente.acao && (
                                                            <Typography sx={{ fontSize: '0.72rem', color: '#92400e', opacity: 0.8 }}>
                                                                {paciente.acao.nome || `Ação #${paciente.acao.numero_acao}`}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                                                        <Clock size={13} color="#92400e" />
                                                        <Typography sx={{ fontFamily: 'monospace', fontSize: '0.88rem', fontWeight: 700, color: '#92400e' }}>
                                                            {formatEspera(paciente.tempo_espera_segundos)}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </motion.div>
                                        ))}
                                    </Box>
                                </Box>
                            </motion.div>
                        )}

                        {/* ── LISTA DE INSCRITOS DA AÇÃO ── */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                            <Box sx={{ background: expressoTheme.colors.cardBackground, borderRadius: expressoTheme.borderRadius.large, border: `1px solid ${expressoTheme.colors.border}`, p: 3, mb: 3, boxShadow: expressoTheme.shadows.card }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                    <Users size={20} color={expressoTheme.colors.primary} />
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: expressoTheme.colors.primaryDark, flex: 1 }}>
                                        Inscritos na Ação
                                    </Typography>
                                    <Chip label={inscritos.filter(i => i.status === 'pendente').length + ' pendentes'} size="small"
                                        sx={{ background: '#FFF3CD', color: '#856404', fontWeight: 700 }} />
                                </Box>

                                {/* Tabs + busca */}
                                <Box sx={{ display: 'flex', gap: 1.5, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                                    <Tabs value={tabInscritos} onChange={(_, v) => setTabInscritos(v)} sx={{
                                        minHeight: 36,
                                        '& .MuiTab-root': { minHeight: 36, fontSize: '0.78rem', textTransform: 'none', fontWeight: 600 },
                                        '& .MuiTabs-indicator': { background: expressoTheme.colors.primary },
                                    }}>
                                        <Tab value="pendente" label="Pendentes" />
                                        <Tab value="atendido" label="Atendidos" />
                                        <Tab value="todos" label="Todos" />
                                    </Tabs>
                                    <TextField size="small" placeholder="Buscar..." value={buscaInscrito} onChange={(e) => setBuscaInscrito(e.target.value)}
                                        InputProps={{ startAdornment: <Search size={15} color={expressoTheme.colors.textSecondary} style={{ marginRight: 6 }} /> }}
                                        sx={{ minWidth: 180, '& .MuiOutlinedInput-root': { borderRadius: expressoTheme.borderRadius.medium, fontSize: '0.85rem' } }}
                                    />
                                </Box>

                                <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                                    {inscritosFiltrados.length === 0 ? (
                                        <Box sx={{ textAlign: 'center', py: 4 }}>
                                            <Frown size={32} color={expressoTheme.colors.textLight} />
                                            <Typography sx={{ color: expressoTheme.colors.textSecondary, mt: 1, fontSize: '0.88rem' }}>
                                                {tabInscritos === 'pendente' ? 'Nenhum inscrito pendente!' : 'Nenhum resultado'}
                                            </Typography>
                                        </Box>
                                    ) : (
                                        <List dense disablePadding>
                                            {inscritosFiltrados.map((inscrito, idx) => (
                                                <motion.div key={inscrito.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.02 }}>
                                                    <ListItemButton
                                                        disabled={inscrito.status === 'atendido' || !!emAndamento || pontoStatus !== 'trabalhando'}
                                                        onClick={() => {
                                                            if (inscrito.status === 'pendente' && !emAndamento && pontoStatus === 'trabalhando') {
                                                                setCidadaoSelecionado(inscrito);
                                                                handleIniciarConsulta(inscrito);
                                                            }
                                                        }}
                                                        sx={{
                                                            borderRadius: expressoTheme.borderRadius.medium,
                                                            mb: 0.5,
                                                            border: `1px solid ${expressoTheme.colors.borderLight}`,
                                                            '&:hover:not(.Mui-disabled)': { background: expressoTheme.colors.cardHover, borderColor: expressoTheme.colors.primary },
                                                            '&.Mui-disabled': { opacity: 0.6 },
                                                        }}
                                                    >
                                                        <ListItemAvatar>
                                                            <Avatar sx={{
                                                                width: 36, height: 36,
                                                                background: inscrito.status === 'atendido' ? expressoTheme.colors.success : expressoTheme.gradients.primary,
                                                                fontSize: '0.85rem', fontWeight: 700,
                                                            }}>
                                                                {inscrito.cidadao.nome[0]}
                                                            </Avatar>
                                                        </ListItemAvatar>
                                                        <ListItemText
                                                            primary={<Typography sx={{ fontWeight: 600, fontSize: '0.88rem', color: expressoTheme.colors.text }}>{inscrito.cidadao.nome}</Typography>}
                                                            secondary={<Typography sx={{ fontSize: '0.75rem', color: expressoTheme.colors.textSecondary }}>{inscrito.cidadao.cpf} {inscrito.cidadao.telefone ? `· ${inscrito.cidadao.telefone}` : ''}</Typography>}
                                                        />
                                                        <Chip
                                                            label={inscrito.status === 'atendido' ? '✓ Atendido' : inscrito.status === 'faltou' ? 'Faltou' : 'Atender →'}
                                                            size="small"
                                                            sx={{
                                                                background: inscrito.status === 'atendido' ? '#D4EDDA' : inscrito.status === 'faltou' ? '#F8D7DA' : expressoTheme.gradients.primary,
                                                                color: inscrito.status === 'atendido' ? expressoTheme.colors.success : inscrito.status === 'faltou' ? expressoTheme.colors.danger : 'white',
                                                                fontWeight: 700, fontSize: '0.72rem',
                                                            }}
                                                        />
                                                    </ListItemButton>
                                                </motion.div>
                                            ))}
                                        </List>
                                    )}
                                </Box>
                            </Box>
                        </motion.div>

                        {/* ── HISTÓRICO DO DIA ── */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                            <Box sx={{ background: expressoTheme.colors.cardBackground, borderRadius: expressoTheme.borderRadius.large, border: `1px solid ${expressoTheme.colors.border}`, p: 3, boxShadow: expressoTheme.shadows.card }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                                    <ClipboardList size={20} color={expressoTheme.colors.primary} />
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: expressoTheme.colors.primaryDark }}>Histórico de Hoje</Typography>
                                    <Chip label={atendimentos.length} size="small" sx={{ background: expressoTheme.colors.cardHover, color: expressoTheme.colors.primary, fontWeight: 700 }} />
                                </Box>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 280, overflowY: 'auto' }}>
                                    <AnimatePresence>
                                        {atendimentos.length === 0 ? (
                                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                                <Frown size={32} color={expressoTheme.colors.textLight} />
                                                <Typography sx={{ mt: 1.5, color: expressoTheme.colors.textSecondary }}>Nenhum atendimento hoje</Typography>
                                            </Box>
                                        ) : atendimentos.map((a, idx) => (
                                            <motion.div key={a.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }}>
                                                <Box sx={{
                                                    display: 'flex', alignItems: 'center', gap: 2,
                                                    p: 1.5, borderRadius: expressoTheme.borderRadius.medium,
                                                    border: `1px solid ${expressoTheme.colors.borderLight}`,
                                                    background: a.status === 'em_andamento' ? '#F0FDF4' : a.status === 'cancelado' ? '#FEF2F2' : expressoTheme.colors.background,
                                                    '&:hover': { borderColor: expressoTheme.colors.primary, background: expressoTheme.colors.cardHover },
                                                }}>
                                                    <Box sx={{ width: 36, height: 36, borderRadius: '10px', flexShrink: 0, background: a.status === 'concluido' ? '#D4EDDA' : a.status === 'cancelado' ? '#F8D7DA' : '#D1ECF1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        {a.status === 'concluido' ? <CheckCircle2 size={18} color={expressoTheme.colors.success} />
                                                            : a.status === 'cancelado' ? <XCircle size={18} color={expressoTheme.colors.danger} />
                                                                : <Activity size={18} color={expressoTheme.colors.info} />}
                                                    </Box>
                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                        <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', color: expressoTheme.colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {a.nome_paciente || a.cidadao?.nome || 'Paciente'}
                                                        </Typography>
                                                        <Typography sx={{ fontSize: '0.76rem', color: expressoTheme.colors.textSecondary }}>
                                                            {formatHora(a.hora_inicio)}{a.hora_fim ? ` → ${formatHora(a.hora_fim)}` : ''}
                                                        </Typography>
                                                    </Box>
                                                    <Chip label={a.status === 'concluido' ? 'Concluído' : a.status === 'cancelado' ? 'Cancelado' : 'Em andamento'} size="small"
                                                        sx={{ background: a.status === 'concluido' ? '#D4EDDA' : a.status === 'cancelado' ? '#F8D7DA' : '#D1ECF1', color: a.status === 'concluido' ? expressoTheme.colors.success : a.status === 'cancelado' ? expressoTheme.colors.danger : expressoTheme.colors.info, fontWeight: 600, fontSize: '0.72rem' }} />
                                                    {a.duracao_minutos && (
                                                        <Typography sx={{ color: expressoTheme.colors.textSecondary, fontSize: '0.75rem' }}>{a.duracao_minutos}min</Typography>
                                                    )}
                                                </Box>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </Box>
                            </Box>
                        </motion.div>
                    </Grid>

                    {/* ── COLUNA LATERAL ── */}
                    <Grid item xs={12} lg={4}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

                            {/* ── RELÓGIO ── */}
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                                <Box sx={{ background: expressoTheme.gradients.primary, borderRadius: expressoTheme.borderRadius.large, p: 3, textAlign: 'center', boxShadow: expressoTheme.shadows.button }}>
                                    <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.72rem', letterSpacing: 2, textTransform: 'uppercase', mb: 0.5 }}>Hora Atual</Typography>
                                    <motion.div animate={{ scale: [1, 1.005, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                                        <Typography sx={{ fontFamily: 'monospace', fontSize: '2.8rem', fontWeight: 900, color: '#fff', letterSpacing: -1, lineHeight: 1 }}>
                                            {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        </Typography>
                                    </motion.div>
                                    <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.78rem', mt: 0.5 }}>
                                        {currentTime.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
                                    </Typography>
                                </Box>
                            </motion.div>

                            {/* ── KPI CARDS ── */}
                            {kpis.map((kpi, i) => (
                                <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.05 }} whileHover={{ y: -4, scale: 1.02 }}>
                                    <Box sx={{ background: expressoTheme.colors.cardBackground, borderRadius: expressoTheme.borderRadius.large, border: `1px solid ${expressoTheme.colors.border}`, p: 2.5, display: 'flex', alignItems: 'center', gap: 2, boxShadow: expressoTheme.shadows.card, transition: 'all 0.3s ease', '&:hover': { borderColor: kpi.color, boxShadow: expressoTheme.shadows.cardHover } }}>
                                        <Box sx={{ width: 48, height: 48, borderRadius: expressoTheme.borderRadius.medium, background: expressoTheme.colors.background, border: `2px solid ${kpi.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Timer size={22} color={kpi.color} />
                                        </Box>
                                        <Box>
                                            <Typography sx={{ color: expressoTheme.colors.textSecondary, fontSize: '0.75rem', mb: 0.25 }}>{kpi.label}</Typography>
                                            <Typography sx={{ color: expressoTheme.colors.text, fontWeight: 800, fontSize: '1.6rem', lineHeight: 1 }}>{kpi.value}</Typography>
                                        </Box>
                                    </Box>
                                </motion.div>
                            ))}

                            {/* ── ENCERRAR TURNO ── */}
                            {pontoStatus === 'trabalhando' && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                                    <Button fullWidth variant="outlined" startIcon={<LogOut size={16} />} onClick={handleFecharPonto}
                                        sx={{ py: 1.5, borderRadius: expressoTheme.borderRadius.medium, textTransform: 'none', fontWeight: 600, borderColor: expressoTheme.colors.danger, color: expressoTheme.colors.danger, '&:hover': { background: '#FEF2F2', borderColor: expressoTheme.colors.danger } }}>
                                        Encerrar Turno
                                    </Button>
                                </motion.div>
                            )}
                        </Box>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default MedicoPanel;
