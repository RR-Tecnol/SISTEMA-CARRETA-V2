/**
 * pages/admin/GerenciarFila.tsx
 * Painel de Gerenciamento da Fila de Atendimento (Recepção)
 * Permite cadastrar pacientes na fila e chamar o próximo
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box, Container, Typography, TextField, Button, Grid,
    Card, CardContent, Chip, MenuItem, IconButton,
    CircularProgress, Divider, Alert, InputAdornment,
} from '@mui/material';
import {
    UserPlus, Users, Bell, CheckCircle, XCircle,
    Search, Clock, Loader, RefreshCw, Monitor, Tv2,
} from 'lucide-react';


import { motion, AnimatePresence } from 'framer-motion';
import { useSnackbar } from 'notistack';
import api from '../../services/api';
import { joinAcaoRoom, leaveAcaoRoom } from '../../utils/socket';
import { formatCPF, validateCPF } from '../../utils/formatters';
import { systemTruckTheme } from '../../theme/systemTruckTheme';
import type { Socket } from 'socket.io-client';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Acao { id: string; nome: string; status: string; municipio: string; }
interface Cidadao { id: string; nome_completo: string; cpf: string; telefone?: string; }
interface EstacaoItem {
    id: string;
    nome: string;
    status: 'ativa' | 'pausada' | 'manutencao';
    motivo_pausa?: string;
}
interface FichaItem {
    id: string;
    numero_ficha: number;
    status: 'aguardando' | 'chamado' | 'em_atendimento' | 'concluido' | 'cancelado';
    hora_entrada: string;
    hora_chamada?: string;
    guiche?: string;
    cidadao: Cidadao;
    inscricao?: { curso_exame?: { nome: string; tipo: string } };
}


// ─── Badge de status ──────────────────────────────────────────────────────────
const statusConfig: Record<string, { label: string; color: 'default' | 'warning' | 'primary' | 'success' | 'error' }> = {
    aguardando: { label: 'Aguardando', color: 'warning' },
    chamado: { label: 'Chamado ▶', color: 'primary' },
    em_atendimento: { label: 'Em Atendimento', color: 'success' },
    concluido: { label: 'Concluído ✓', color: 'success' },
    cancelado: { label: 'Cancelado', color: 'error' },
};

// ─── Formatação de hora ───────────────────────────────────────────────────────
const fmtHora = (iso?: string) => iso ? new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—';
const minutosEspera = (entrada: string) => Math.floor((Date.now() - new Date(entrada).getTime()) / 60000);

// ─── Componente ───────────────────────────────────────────────────────────────
export default function GerenciarFila() {
    const { enqueueSnackbar } = useSnackbar();
    const socketRef = useRef<Socket | null>(null);

    // Estado
    const [acoes, setAcoes] = useState<Acao[]>([]);
    const [acaoId, setAcaoId] = useState('');
    const [fila, setFila] = useState<FichaItem[]>([]);
    const [carregando, setCarregando] = useState(false);
    const [sincronizando, setSincronizando] = useState(false);

    // Busca de cidadão
    const [cpfBusca, setCpfBusca] = useState('');
    const [cidadaoEncontrado, setCidadaoEncontrado] = useState<Cidadao | null>(null);
    const [buscando, setBuscando] = useState(false);
    const [guiche, setGuiche] = useState('Sala 1');

    // Stats
    const aguardando = fila.filter(f => f.status === 'aguardando').length;
    const emAtendimento = fila.filter(f => f.status === 'em_atendimento').length;
    const chamado = fila.filter(f => f.status === 'chamado').length;
    const concluidos = fila.filter(f => f.status === 'concluido').length;

    // Estações da ação selecionada
    const [estacoes, setEstacoes] = useState<EstacaoItem[]>([]);

    const carregarEstacoes = useCallback(async (id: string) => {
        try {
            const r = await api.get(`/estacoes/acao/${id}`);
            setEstacoes(r.data || []);
        } catch { setEstacoes([]); }
    }, []);

    // ─── Carregar fila via HTTP (fallback + carga inicial) ─────────────────
    const carregarFila = useCallback(async (id: string) => {
        try {
            const r = await api.get(`/fichas/acao/${id}/fila`);
            setFila(Array.isArray(r.data) ? r.data : []);
        } catch { /* silencioso — socket.io já cuida das atualizações */ }
    }, []);

    // ─── Sincronizar inscrições → fichas ──────────────────────────────────
    const sincronizarFila = useCallback(async () => {
        if (!acaoId) return;
        setSincronizando(true);
        try {
            const r = await api.post(`/fichas/acao/${acaoId}/sincronizar-inscricoes`);
            enqueueSnackbar(
                `✅ ${r.data.criadas ?? 0} ficha(s) criada(s) a partir das inscrições`,
                { variant: 'success' }
            );
            await carregarFila(acaoId);
        } catch {
            enqueueSnackbar('Erro ao sincronizar inscrições com a fila', { variant: 'error' });
        } finally {
            setSincronizando(false);
        }
    }, [acaoId, carregarFila]);

    const statusEstacaoColor: Record<string, string> = {
        ativa: '#00C853',
        pausada: '#FF6F00',
        manutencao: '#C62828',
    };

    // ─── Carregar ações ativas ──────────────────────────────────────────────
    useEffect(() => {
        api.get('/acoes?status=ativa').then(r => {
            const data = Array.isArray(r.data) ? r.data : (r.data.acoes || []);
            setAcoes(data.filter((a: Acao) => a.status === 'ativa'));
        }).catch(() => enqueueSnackbar('Erro ao carregar ações', { variant: 'error' }));
    }, []);

    // ─── Carregar fila + estações ao trocar ação ───────────────────────────
    useEffect(() => {
        if (acaoId) {
            carregarEstacoes(acaoId);
            carregarFila(acaoId);
        } else {
            setEstacoes([]);
            setFila([]);
        }
    }, [acaoId, carregarEstacoes, carregarFila]);


    // ─── Socket.IO — entrar na sala da ação ────────────────────────────────
    useEffect(() => {
        if (!acaoId) return;

        const socket = joinAcaoRoom(acaoId);
        socketRef.current = socket;

        socket.on('fila_atualizada', ({ fila: novaFila }: { acao_id: string; fila?: FichaItem[] }) => {
            if (novaFila && Array.isArray(novaFila)) {
                // Dados embutidos: atualizar direto
                setFila(novaFila);
            } else {
                // A7: backend emitiu apenas { acao_id } — recarregar via HTTP
                carregarFila(acaoId);
            }
        });

        // Se o socket reconectar, recarregar a fila via HTTP como fallback
        socket.on('connect', () => {
            carregarFila(acaoId);
        });

        // Senha chamada = todos os exames do cidadão de uma vez
        socket.on('senha_chamada', ({ numero_ficha, cidadao }: { numero_ficha: number; fichas: any[]; cidadao: Cidadao; guiche: string }) => {
            enqueueSnackbar(
                `📢 Senha ${String(numero_ficha).padStart(3, '0')} — ${cidadao?.nome_completo}`,
                { variant: 'info', autoHideDuration: 6000 }
            );
        });

        return () => {
            leaveAcaoRoom(acaoId);
            socket.off('fila_atualizada');
            socket.off('senha_chamada');
            socket.off('paciente_chamado');
            socket.off('connect');
        };
    }, [acaoId, carregarFila]);


    // ─── Buscar cidadão por CPF ────────────────────────────────────────────
    const buscarCidadao = useCallback(async () => {
        const cpfLimpo = cpfBusca.replace(/\D/g, '');
        if (!validateCPF(cpfBusca)) {
            enqueueSnackbar('CPF inválido', { variant: 'warning' });
            return;
        }
        setBuscando(true);
        try {
            const r = await api.get(`/cidadaos/buscar-cpf/${cpfLimpo}`);
            setCidadaoEncontrado(r.data);
        } catch {
            enqueueSnackbar('Cidadão não encontrado. Cadastre-o primeiro.', { variant: 'warning' });
            setCidadaoEncontrado(null);
        } finally {
            setBuscando(false);
        }
    }, [cpfBusca]);

    // ─── Chamar próximo de uma fila específica (por nome de exame / sala) ─────
    const chamarProximo = async (curso_exame_id?: string, nomeExame?: string) => {
        if (!acaoId) return;
        setCarregando(true);
        try {
            const r = await api.post(`/fichas/acao/${acaoId}/chamar-proximo`, {
                guiche,
                ...(curso_exame_id ? { curso_exame_id } : {}),
            });
            if (!r.data.ficha) {
                const label = nomeExame ? `fila de ${nomeExame}` : 'fila';
                enqueueSnackbar(`Nenhum paciente aguardando na ${label}`, { variant: 'info' });
            } else {
                const senha = String(r.data.ficha.numero_ficha).padStart(3, '0');
                const nome = r.data.cidadao?.nome_completo || 'Paciente';
                const exame = nomeExame ? ` — ${nomeExame}` : '';
                enqueueSnackbar(`📢 Senha ${senha}${exame} — ${nome}`, { variant: 'success', autoHideDuration: 6000 });
            }
        } catch {
            enqueueSnackbar('Erro ao chamar próximo', { variant: 'error' });
        } finally {
            setCarregando(false);
        }
    };


    // ─── Cancelar ficha ────────────────────────────────────────────────────
    const cancelarFicha = async (fichaId: string) => {
        try {
            await api.patch(`/fichas/${fichaId}/cancelar`, { motivo: 'Cancelado pela recepção' });
            enqueueSnackbar('Ficha cancelada', { variant: 'info' });
        } catch {
            enqueueSnackbar('Erro ao cancelar ficha', { variant: 'error' });
        }
    };

    // ─── Render ────────────────────────────────────────────────────────────
    return (
        <Box sx={{ minHeight: '100vh', background: systemTruckTheme.colors.background, py: 3 }}>
            <Container maxWidth="xl">
                {/* Header */}
                <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Users size={28} color={systemTruckTheme.colors.primary} />
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 700, color: systemTruckTheme.colors.primaryDark }}>
                                Fila de Atendimento
                            </Typography>
                            <Typography sx={{ color: systemTruckTheme.colors.textSecondary, fontSize: '0.85rem' }}>
                                {acaoId ? `${acoes.find(a => a.id === acaoId)?.nome || ''}` : 'Selecione uma ação para comenzar'}
                                {' '}— Tempo real via Socket.IO
                            </Typography>
                        </Box>
                    </Box>
                    {/* Botão painel TV */}
                    {acaoId && (
                        <Button
                            variant="outlined"
                            startIcon={<Monitor size={18} />}
                            onClick={() => window.open(`/painel/${acaoId}`, '_blank')}
                            sx={{
                                borderColor: systemTruckTheme.colors.primary,
                                color: systemTruckTheme.colors.primary,
                                textTransform: 'none',
                                fontWeight: 600,
                                borderRadius: systemTruckTheme.borderRadius.medium,
                                '&:hover': { background: `${systemTruckTheme.colors.primary}10` },
                            }}
                        >
                            Abrir Painel TV
                        </Button>
                    )}
                </Box>

                <Grid container spacing={3}>
                    {/* Coluna esquerda — controles */}
                    <Grid item xs={12} md={4}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

                            {/* Selecionar ação */}
                            <Card sx={{ borderRadius: systemTruckTheme.borderRadius.large, border: `1px solid ${systemTruckTheme.colors.border}` }}>
                                <CardContent>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: systemTruckTheme.colors.primaryDark }}>
                                        ⚙️ Configuração
                                    </Typography>
                                    <TextField
                                        select fullWidth
                                        label="Ação em andamento"
                                        value={acaoId}
                                        onChange={e => setAcaoId(e.target.value)}
                                        helperText={acoes.length === 0 ? 'Nenhuma ação ativa disponível' : `${acoes.length} ação(ões) ativa(s)`}
                                        size="small"
                                        sx={{ mb: 2 }}
                                    >
                                        {acoes.map(a => <MenuItem key={a.id} value={a.id}>{a.nome} — {a.municipio}</MenuItem>)}
                                    </TextField>
                                    <TextField
                                        fullWidth size="small"
                                        label="Guichê / Sala"
                                        value={guiche}
                                        onChange={e => setGuiche(e.target.value)}

                                        placeholder="Ex: Sala 1, Guichê 2"
                                    />
                                </CardContent>
                            </Card>

                            {/* Info: ficha automática */}
                            <Card sx={{ borderRadius: systemTruckTheme.borderRadius.large, border: `1px solid ${systemTruckTheme.colors.border}`, background: `${systemTruckTheme.colors.primary}08` }}>
                                <CardContent>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: systemTruckTheme.colors.primaryDark }}>
                                        <UserPlus size={18} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                                        Consultar Cidadão na Fila
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.78rem', color: systemTruckTheme.colors.textSecondary, mb: 1.5, lineHeight: 1.5 }}>
                                        🎫 As fichas são geradas <strong>automaticamente</strong> ao fazer a inscrição.<br />
                                        Use o CPF abaixo para verificar a situação do cidadão.
                                    </Typography>
                                    <TextField
                                        fullWidth size="small"
                                        label="CPF do cidadão"
                                        value={cpfBusca}
                                        onChange={e => setCpfBusca(formatCPF(e.target.value))}
                                        onKeyDown={e => e.key === 'Enter' && buscarCidadao()}
                                        placeholder="000.000.000-00"
                                        inputProps={{ maxLength: 14 }}
                                        sx={{ mb: 1.5 }}
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton size="small" onClick={buscarCidadao} disabled={buscando}>
                                                        {buscando ? <CircularProgress size={16} /> : <Search size={16} />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                    />

                                    <AnimatePresence>
                                        {cidadaoEncontrado && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                            >
                                                <Alert severity="success" sx={{ mb: 1.5, py: 0.5 }}>
                                                    <strong>{cidadaoEncontrado.nome_completo}</strong>
                                                    <br />
                                                    <span style={{ fontSize: '0.8rem' }}>{cidadaoEncontrado.telefone || '—'}</span>
                                                </Alert>
                                                {/* Fichas deste cidadão na fila atual */}
                                                {acaoId && (() => {
                                                    const fichasCidadao = fila.filter(f => f.cidadao?.id === cidadaoEncontrado.id || (f.cidadao as any)?.cpf === cidadaoEncontrado.cpf);
                                                    return fichasCidadao.length > 0 ? (
                                                        <Box>
                                                            {fichasCidadao.map(f => (
                                                                <Box key={f.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, p: 0.8, borderRadius: 1, background: `${systemTruckTheme.colors.primary}15`, border: `1px solid ${systemTruckTheme.colors.primary}30` }}>
                                                                    <Typography sx={{ fontWeight: 900, fontSize: '1rem', color: systemTruckTheme.colors.primary, minWidth: 32 }}>
                                                                        {String(f.numero_ficha).padStart(3, '0')}
                                                                    </Typography>
                                                                    <Typography sx={{ flex: 1, fontSize: '0.75rem', color: systemTruckTheme.colors.text }}>
                                                                        {f.inscricao?.curso_exame?.nome || 'Exame'}
                                                                    </Typography>
                                                                    <Chip label={statusConfig[f.status]?.label} color={statusConfig[f.status]?.color} size="small" sx={{ height: 18, fontSize: '0.6rem' }} />
                                                                </Box>
                                                            ))}
                                                        </Box>
                                                    ) : (
                                                        <Alert severity="warning" sx={{ py: 0.5, fontSize: '0.75rem' }}>
                                                            Cidadão não está na fila desta ação hoje
                                                        </Alert>
                                                    );
                                                })()}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </CardContent>
                            </Card>


                            {/* Stats rápidas */}
                            <Grid container spacing={1.5}>
                                {[
                                    { label: 'Aguardando', value: aguardando, color: '#F39C12', icon: Clock },
                                    { label: 'Chamados', value: chamado, color: systemTruckTheme.colors.primary, icon: Bell },
                                    { label: 'Em Atend.', value: emAtendimento, color: '#27AE60', icon: CheckCircle },
                                    { label: 'Concluído', value: concluidos, color: '#20C997', icon: CheckCircle },
                                ].map(({ label, value, color, icon: Icon }) => (
                                    <Grid item xs={3} key={label}>
                                        <Card sx={{ textAlign: 'center', p: 1, borderRadius: 2, border: `1px solid ${color}22` }}>
                                            <Icon size={20} color={color} />
                                            <Typography sx={{ fontSize: '1.4rem', fontWeight: 700, color, lineHeight: 1.2 }}>{value}</Typography>
                                            <Typography sx={{ fontSize: '0.65rem', color: systemTruckTheme.colors.textSecondary }}>{label}</Typography>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>

                            {/* Status das estações */}
                            {acaoId && estacoes.length > 0 && (
                                <Card sx={{ borderRadius: systemTruckTheme.borderRadius.large, border: `1px solid ${systemTruckTheme.colors.border}` }}>
                                    <CardContent sx={{ pb: '12px !important' }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: systemTruckTheme.colors.primaryDark, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Tv2 size={16} /> Status das Salas
                                        </Typography>
                                        {estacoes.map(e => (
                                            <Box key={e.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, p: 1, borderRadius: 1.5, background: `${statusEstacaoColor[e.status]}10`, border: `1px solid ${statusEstacaoColor[e.status]}30` }}>
                                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: statusEstacaoColor[e.status], boxShadow: `0 0 6px ${statusEstacaoColor[e.status]}`, flexShrink: 0 }} />
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: systemTruckTheme.colors.text, lineHeight: 1 }}>{e.nome}</Typography>
                                                    {e.motivo_pausa && e.status !== 'ativa' && (
                                                        <Typography sx={{ fontSize: '0.65rem', color: systemTruckTheme.colors.textSecondary }}>{e.motivo_pausa}</Typography>
                                                    )}
                                                </Box>
                                                <Chip label={e.status === 'ativa' ? 'Ativa' : e.status === 'pausada' ? 'Pausada' : 'Manutenção'} size="small" sx={{ background: statusEstacaoColor[e.status], color: '#fff', fontWeight: 700, fontSize: '0.6rem', height: 18 }} />
                                            </Box>
                                        ))}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Sincronizar inscrições → fila — sempre visível com ação selecionada */}
                            {acaoId && (
                                <Button
                                    fullWidth variant="outlined" size="medium"
                                    onClick={sincronizarFila}
                                    disabled={sincronizando}
                                    startIcon={sincronizando ? <Loader size={18} /> : <RefreshCw size={18} />}
                                    sx={{
                                        borderColor: systemTruckTheme.colors.primary,
                                        color: systemTruckTheme.colors.primary,
                                        textTransform: 'none', fontWeight: 600,
                                        borderRadius: systemTruckTheme.borderRadius.medium,
                                        '&:hover': { background: `${systemTruckTheme.colors.primary}10` },
                                    }}
                                >
                                    {sincronizando ? 'Sincronizando...' : '🔄 Carregar Inscritos na Fila'}
                                </Button>
                            )}

                            {/* Chamar próximo */}
                            <Button
                                fullWidth variant="contained" size="large"
                                onClick={() => chamarProximo()}
                                disabled={carregando || !acaoId || aguardando === 0}
                                startIcon={carregando ? <Loader size={20} /> : <Bell size={20} />}
                                sx={{
                                    background: aguardando > 0
                                        ? 'linear-gradient(135deg, #1ABC9C 0%, #16A085 100%)'
                                        : undefined,
                                    textTransform: 'none', fontWeight: 700,
                                    fontSize: '1rem', py: 1.5,
                                    borderRadius: systemTruckTheme.borderRadius.medium,
                                    boxShadow: systemTruckTheme.shadows.button,
                                }}
                            >
                                {carregando ? 'Chamando...' : `📢 Chamar Próximo (${aguardando} na fila)`}
                            </Button>
                        </Box>
                    </Grid>

                    {/* Coluna direita — fila */}
                    <Grid item xs={12} md={8}>
                        <Card sx={{
                            borderRadius: systemTruckTheme.borderRadius.large,
                            border: `1px solid ${systemTruckTheme.colors.border}`,
                            boxShadow: systemTruckTheme.shadows.card,
                            minHeight: 400,
                        }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: systemTruckTheme.colors.primaryDark }}>
                                        📋 Fila Atual
                                    </Typography>
                                    {acaoId && (
                                        <Chip
                                            icon={<RefreshCw size={12} />}
                                            label="Ao vivo"
                                            size="small"
                                            color="success"
                                            sx={{ fontSize: '0.7rem' }}
                                        />
                                    )}
                                </Box>
                                <Divider sx={{ mb: 2 }} />

                                {!acaoId ? (
                                    <Box sx={{ textAlign: 'center', py: 6, color: systemTruckTheme.colors.textSecondary }}>
                                        <Users size={48} style={{ opacity: 0.3 }} />
                                        <Typography sx={{ mt: 1 }}>Selecione uma ação para ver a fila</Typography>
                                    </Box>
                                ) : fila.length === 0 ? (
                                    <Box sx={{ textAlign: 'center', py: 6, color: systemTruckTheme.colors.textSecondary }}>
                                        <CheckCircle size={48} style={{ opacity: 0.3 }} />
                                        <Typography sx={{ mt: 1 }}>Fila vazia — nenhum paciente aguardando</Typography>
                                    </Box>
                                ) : (
                                    // ━━ FILA AGRUPADA POR EXAME — cada exame tem fila independente ━━
                                    (() => {
                                        // Agrupar fichas por nome do exame
                                        const filaAtiva = fila.filter(f => !['cancelado'].includes(f.status));
                                        const grupos: Record<string, { exameId?: string; fichas: FichaItem[] }> = {};

                                        filaAtiva.forEach(f => {
                                            const nome = f.inscricao?.curso_exame?.nome || 'Geral';
                                            if (!grupos[nome]) grupos[nome] = { fichas: [] };
                                            grupos[nome].fichas.push(f);
                                        });

                                        const nomeExames = Object.keys(grupos).sort();

                                        if (nomeExames.length === 0) {
                                            return (
                                                <Box sx={{ textAlign: 'center', py: 4, color: systemTruckTheme.colors.textSecondary }}>
                                                    <CheckCircle size={36} style={{ opacity: 0.3 }} />
                                                    <Typography sx={{ mt: 1, fontSize: '0.85rem' }}>Fila vazia</Typography>
                                                </Box>
                                            );
                                        }

                                        return (
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                {nomeExames.map(nomeExame => {
                                                    const grupo = grupos[nomeExame];
                                                    const aguardandoGrupo = grupo.fichas.filter(f => f.status === 'aguardando').length;
                                                    const chamadoGrupo = grupo.fichas.filter(f => f.status === 'chamado').length;

                                                    return (
                                                        <Box key={nomeExame} sx={{
                                                            borderRadius: 2,
                                                            border: `1px solid ${systemTruckTheme.colors.border}`,
                                                            overflow: 'hidden',
                                                        }}>
                                                            {/* Cabeçalho da sala/exame */}
                                                            <Box sx={{
                                                                px: 2, py: 1, display: 'flex', alignItems: 'center',
                                                                justifyContent: 'space-between', flexWrap: 'wrap', gap: 1,
                                                                background: `${systemTruckTheme.colors.primary}08`,
                                                                borderBottom: `1px solid ${systemTruckTheme.colors.border}`,
                                                            }}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                    <Bell size={14} color={systemTruckTheme.colors.primary} />
                                                                    <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: systemTruckTheme.colors.primaryDark }}>
                                                                        {nomeExame}
                                                                    </Typography>
                                                                    <Chip label={`${aguardandoGrupo} aguardando`} size="small" color="warning" sx={{ height: 18, fontSize: '0.6rem' }} />
                                                                    {chamadoGrupo > 0 && <Chip label={`${chamadoGrupo} chamado`} size="small" color="primary" sx={{ height: 18, fontSize: '0.6rem' }} />}
                                                                </Box>
                                                                <Button
                                                                    size="small"
                                                                    variant="contained"
                                                                    disabled={aguardandoGrupo === 0 || carregando || !acaoId}
                                                                    onClick={() => chamarProximo(undefined, nomeExame)}
                                                                    startIcon={<Bell size={12} />}
                                                                    sx={{ fontSize: '0.7rem', py: 0.4, px: 1.2 }}
                                                                >
                                                                    Chamar Próximo
                                                                </Button>

                                                            </Box>

                                                            {/* Pacientes desta fila */}
                                                            <Box sx={{ p: 1 }}>
                                                                <AnimatePresence>
                                                                    {grupo.fichas
                                                                        .sort((a, b) => a.numero_ficha - b.numero_ficha)
                                                                        .map((ficha, idx) => (
                                                                            <motion.div
                                                                                key={ficha.id}
                                                                                initial={{ opacity: 0, y: -8 }}
                                                                                animate={{ opacity: 1, y: 0 }}
                                                                                exit={{ opacity: 0, y: 8 }}
                                                                                transition={{ delay: idx * 0.04 }}
                                                                            >
                                                                                <Box sx={{
                                                                                    display: 'flex', alignItems: 'center', gap: 1.5,
                                                                                    p: 1, mb: 0.5, borderRadius: 1.5,
                                                                                    border: `1px solid ${ficha.status === 'chamado' ? systemTruckTheme.colors.primary
                                                                                        : ficha.status === 'em_atendimento' ? '#27AE60'
                                                                                            : '#eee'
                                                                                        }`,
                                                                                    background: ficha.status === 'chamado' ? `${systemTruckTheme.colors.primary}10`
                                                                                        : ficha.status === 'em_atendimento' ? '#27AE6010' : 'white',
                                                                                }}>
                                                                                    {/* Senha */}
                                                                                    <Box sx={{
                                                                                        minWidth: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                                                                                        background: ficha.status === 'chamado' ? systemTruckTheme.gradients.primary
                                                                                            : ficha.status === 'em_atendimento' ? 'linear-gradient(135deg,#27AE60,#1E8449)'
                                                                                                : '#e0e0e0',
                                                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                                        color: ['chamado', 'em_atendimento'].includes(ficha.status) ? 'white' : '#666',
                                                                                        fontWeight: 900, fontSize: '0.85rem',
                                                                                    }}>
                                                                                        {String(ficha.numero_ficha).padStart(3, '0')}
                                                                                    </Box>

                                                                                    {/* Nome + hora */}
                                                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                                        <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: systemTruckTheme.colors.text, lineHeight: 1.2 }} noWrap>
                                                                                            {ficha.cidadao?.nome_completo}
                                                                                        </Typography>
                                                                                        <Typography sx={{ fontSize: '0.65rem', color: systemTruckTheme.colors.textSecondary }}>
                                                                                            🕐 {fmtHora(ficha.hora_entrada)}
                                                                                            {ficha.status === 'aguardando' && ` · ${minutosEspera(ficha.hora_entrada)}min`}
                                                                                            {ficha.guiche && ` · ${ficha.guiche}`}
                                                                                        </Typography>
                                                                                    </Box>

                                                                                    {/* Status */}
                                                                                    <Chip
                                                                                        label={statusConfig[ficha.status]?.label || ficha.status}
                                                                                        color={statusConfig[ficha.status]?.color || 'default'}
                                                                                        size="small"
                                                                                        sx={{ height: 20, fontSize: '0.6rem' }}
                                                                                    />

                                                                                    {/* Cancelar */}
                                                                                    {['aguardando', 'chamado'].includes(ficha.status) && (
                                                                                        <IconButton size="small" onClick={() => cancelarFicha(ficha.id)} sx={{ color: systemTruckTheme.colors.danger }}>
                                                                                            <XCircle size={15} />
                                                                                        </IconButton>
                                                                                    )}
                                                                                </Box>
                                                                            </motion.div>
                                                                        ))}
                                                                </AnimatePresence>
                                                            </Box>
                                                        </Box>
                                                    );
                                                })}
                                            </Box>
                                        );
                                    })()
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
}
