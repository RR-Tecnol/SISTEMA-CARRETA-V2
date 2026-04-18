import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Box, Typography, Button, TextField, Chip, Tooltip,
    IconButton, CircularProgress, Alert, Container, Grid,
    List, ListItemButton, ListItemText, ListItemAvatar, Avatar, Tabs, Tab,
    FormControl, Select, InputLabel, MenuItem,
    Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
    Play, Activity,
    CheckCircle2, XCircle,
    AlertTriangle, Stethoscope, RefreshCw, LogIn, LogOut,
    Timer, Users, ClipboardList, Wifi, WifiOff, Frown,
    ArrowLeft, Search, Bell, Clock, ClipboardEdit, QrCode, MessageCircle,
    Coffee, UtensilsCrossed, Megaphone, Mic, MicOff,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { useSnackbar } from 'notistack';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { expressoTheme } from '../../theme/expressoTheme';
import FichaClinica from '../../components/medico/FichaClinica';
import QrCodePaciente from '../../components/medico/QrCodePaciente';
import ChatMedico from '../../components/medico/ChatMedico';
import EmergenciaAlert from '../../components/medico/EmergenciaAlert';
import ChatTab from '../../components/medico/ChatTab';
import MedicoHistorico from '../../components/medico/MedicoHistorico';
import MedicoLaudos from '../../components/medico/MedicoLaudos';
import { getSocket } from '../../utils/socket';
import { Paper } from '@mui/material';
import { FileText } from 'lucide-react';

// ─── Interfaces ────────────────────────────────────────────────────────────────
interface Atendimento {
    id: string;
    nome_paciente?: string;
    nome_exame?: string;
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
    curso_exame?: { id: string; nome: string; tipo?: string };
    status: 'pendente' | 'atendido' | 'faltou';
    fichas?: any[];
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
    const [inscricaoAtual, setInscricaoAtual] = useState<Inscrito | null>(null); // inscrição específica em atendimento
    const [observacoes, setObservacoes] = useState('');
    const [observacoesEmAndamento, setObservacoesEmAndamento] = useState('');
    const [iniciando, setIniciando] = useState(false);
    const [finalizando, setFinalizando] = useState(false);
    const [pontoStatus, setPontoStatus] = useState<'trabalhando' | 'saiu' | 'intervalo' | null>(null);
    const [pontoSala, setPontoSala] = useState<string | null>(null);
    const [pontoId, setPontoId] = useState<string | null>(null);
    const [modalSalaOpen, setModalSalaOpen] = useState(false);
    const [salaEscolhida, setSalaEscolhida] = useState('');
    const [salasOcupadas, setSalasOcupadas] = useState<string[]>([]);
    const [online, setOnline] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [tabInscritos, setTabInscritos] = useState<'pendente' | 'atendido' | 'todos' | 'chat' | 'emergencias'>('pendente');
    const [activeMenu, setActiveMenu] = useState<'atendimento' | 'historico' | 'laudos' | 'chat' | 'emergencias'>('atendimento');
    const [buscaInscrito, setBuscaInscrito] = useState('');
    const [filtroExameId, setFiltroExameId] = useState<string>('');
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const pollRef = useRef<NodeJS.Timeout | null>(null);
    const [filaEspera, setFilaEspera] = useState<Array<{ id: string; nome_display: string; tempo_espera_segundos: number; cidadao?: any; acao?: any }>>([]);
    const filaCountRef = useRef<number>(-1);
    const filaRef = useRef<NodeJS.Timeout | null>(null);
    // B1: Prontuário eletrônico
    const [fichaOpen, setFichaOpen] = useState(false);
    // B2: QR Code
    const [qrOpen, setQrOpen] = useState(false);
    const [qrCidadao, setQrCidadao] = useState<any>(null);
    const [qrHistorico, setQrHistorico] = useState<any>(null);
    // B3: Chat + Emergência
    const [chatOpen, setChatOpen] = useState(false);
    const [chatCidadao, setChatCidadao] = useState<{ id: string; nome: string } | null>(null);
    const [emergenciaAtiva, setEmergenciaAtiva] = useState<{ id?: string; cidadao_id: string; nome: string; hora: string } | null>(null);
    const [mensagensNaoLidas, setMensagensNaoLidas] = useState<Record<string, number>>({});
    // A1: Gravação de voz no card de consulta em andamento
    const [gravandoVoz, setGravandoVoz] = useState(false);
    const recognitionPanelRef = useRef<any>(null);

    const formatEspera = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    };

    // A1: Gravação de voz inline no card de consulta
    const iniciarGravacaoPanel = async () => {
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            enqueueSnackbar('Navegador não suporta reconhecimento de voz. Use Chrome ou Edge.', { variant: 'warning' });
            return;
        }
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (err: any) {
            const tipo = err?.name || '';
            if (tipo === 'NotAllowedError' || tipo === 'PermissionDeniedError') {
                enqueueSnackbar('🎤 Permissão de microfone negada. Clique no cadeado na barra de endereço.', { variant: 'error', autoHideDuration: 8000 });
            } else {
                enqueueSnackbar('Não foi possível acessar o microfone.', { variant: 'warning' });
            }
            return;
        }
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'pt-BR';
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.onresult = (event: any) => {
            const transcript = Array.from(event.results).map((r: any) => r[0].transcript).join(' ');
            setObservacoesEmAndamento(prev => prev ? `${prev} ${transcript}` : transcript);
        };
        recognition.onerror = (event: any) => {
            setGravandoVoz(false);
            if (event.error === 'not-allowed') {
                enqueueSnackbar('🎤 Microfone bloqueado. Libere nas configurações do navegador.', { variant: 'error' });
            } else if (event.error !== 'no-speech') {
                enqueueSnackbar(`Erro na gravação: ${event.error}`, { variant: 'warning' });
            }
        };
        recognition.onend = () => setGravandoVoz(false);
        recognitionPanelRef.current = recognition;
        recognition.start();
        setGravandoVoz(true);
        enqueueSnackbar('🎤 Gravando observações... Fale agora!', { variant: 'info', autoHideDuration: 2000 });
    };

    const pararGravacaoPanel = () => {
        recognitionPanelRef.current?.stop();
        setGravandoVoz(false);
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
            setPontoSala(data.pontoSala || null);
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

    const checkEmergenciaAtiva = useCallback(async () => {
        if (!acaoId) return;
        try {
            const listRes = await api.get('/emergencias', { params: { acao_id: acaoId, limit: 1 } });
            const list = listRes.data?.emergencias || [];
            if (list.length > 0 && list[0].status === 'novo') {
                const em = list[0];
                setEmergenciaAtiva({ 
                    id: em.id,
                    cidadao_id: em.cidadao_id, 
                    nome: em.nome_cidadao, 
                    hora: em.created_at || (em as any).createdAt || new Date().toISOString() 
                });
            }
        } catch { /* */ }
    }, [acaoId]);

    useEffect(() => {
        fetchData();
        fetchInscritos();
        fetchFila();
        checkEmergenciaAtiva();
        pollRef.current = setInterval(() => { fetchData(); fetchInscritos(); checkEmergenciaAtiva(); }, 30000);
        filaRef.current = setInterval(fetchFila, 10000);
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
            if (filaRef.current) clearInterval(filaRef.current);
        };
    }, [fetchData, fetchInscritos, fetchFila]);


    // ── WebSocket: emergências, mensagens E eventos da fila em tempo real ──
    useEffect(() => {
        if (!acaoId) return;
        const socket = getSocket();

        const handleEmergencia = (data: { id?: string; cidadao_id: string; nome: string; hora: string }) => {
            setEmergenciaAtiva(data);
            try {
                const ctx = new AudioContext();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = 880;
                gain.gain.value = 0.3;
                osc.start();
                setTimeout(() => { osc.stop(); ctx.close(); }, 800);
            } catch { /* silencioso */ }
        };

        const handleNovaMsg = ({ cidadao_id }: { cidadao_id: string; acao_id: string }) => {
            if (!chatOpen || chatCidadao?.id !== cidadao_id) {
                setMensagensNaoLidas(prev => ({ ...prev, [cidadao_id]: (prev[cidadao_id] || 0) + 1 }));
            }
        };

        // A5: Atualizar inscritos e fila imediatamente ao receber evento da room
        const handleFilaAtualizada = () => {
            fetchInscritos();
            fetchFila();
        };

        // A5: Função de join garantido após conexão
        const doJoin = () => {
            console.log(`📡 [MedicoPanel] join_acao:${acaoId}`);
            socket.emit('join_acao', acaoId);
        };

        const handleConnect = () => {
            doJoin();
        };

        socket.on('emergencia', handleEmergencia);
        socket.on('chat_nova_msg', handleNovaMsg);
        socket.on('fila_atualizada', handleFilaAtualizada);
        socket.on('paciente_chamado', handleFilaAtualizada); // também atualiza ao chamar
        socket.on('connect', handleConnect);

        // Se já está conectado, fazer join imediatamente
        if (socket.connected) {
            doJoin();
        }

        return () => {
            socket.off('emergencia', handleEmergencia);
            socket.off('chat_nova_msg', handleNovaMsg);
            socket.off('fila_atualizada', handleFilaAtualizada);
            socket.off('paciente_chamado', handleFilaAtualizada);
            socket.off('connect', handleConnect);
            socket.emit('leave_acao', acaoId);
        };
    }, [acaoId, chatOpen, chatCidadao, fetchInscritos, fetchFila]);


    // ── Derivados ──
    const feitos = atendimentos.filter((a) => a.status === 'concluido');
    const cancelados = atendimentos.filter((a) => a.status === 'cancelado');
    const tempoMedio = feitos.length ? Math.round(feitos.reduce((acc, a) => acc + (a.duracao_minutos || 0), 0) / feitos.length) : 0;

    const examesDisponiveis = React.useMemo(() => {
        const seen = new Set<string>();
        const result: Array<{ id: string; nome: string }> = [];
        inscritos.forEach(i => {
            if (i.curso_exame && !seen.has(i.curso_exame.id)) {
                seen.add(i.curso_exame.id);
                result.push({ id: i.curso_exame.id, nome: i.curso_exame.nome });
            }
        });
        return result;
    }, [inscritos]);

    const inscritosFiltrados = inscritos
        .filter((i) => tabInscritos === 'todos' || i.status === tabInscritos)
        .filter((i) => !buscaInscrito || i.cidadao.nome.toLowerCase().includes(buscaInscrito.toLowerCase()))
        .filter((i) => !filtroExameId || i.curso_exame?.id === filtroExameId);

    const handleCarregarSalas = async () => {
        if (!user?.id || !acaoId) {
            enqueueSnackbar('Ação não selecionada. Recarregue a página.', { variant: 'warning' });
            return;
        }
        try {
            const r = await api.get(`/medico-monitoring/ponto/acao/${acaoId}/salas-ocupadas`);
            setSalasOcupadas(r.data || []);
            setSalaEscolhida(''); // reseta a seleção
            setModalSalaOpen(true);
        } catch {
            enqueueSnackbar('Erro ao carregar salas ocupadas', { variant: 'error' });
        }
    };

    const handleConfirmarTurno = async () => {
        if (!user?.id || !acaoId || !salaEscolhida) return;
        try {
            await api.post('/medico-monitoring/ponto/entrada', { 
                funcionario_id: user.id,
                acao_id: acaoId,
                sala: salaEscolhida
            });
            enqueueSnackbar(`Turno iniciado: ${salaEscolhida}!`, { variant: 'success' });
            setModalSalaOpen(false);
            await fetchData();
        } catch (e: any) {
            if (e.response?.status === 409) { 
                enqueueSnackbar(e.response.data.error || 'Sala ocupada', { variant: 'warning' });
                // Repinta as salas ocupadas só pra garantir
                handleCarregarSalas();
            }
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

    // ── B5: Almoço / Intervalo ──
    const handleIniciarAlmoco = async () => {
        if (!pontoId) return;
        try {
            await api.post(`/medico-monitoring/ponto/${pontoId}/almoco/iniciar`);
            enqueueSnackbar('☕ Intervalo iniciado!', { variant: 'info' });
            await fetchData();
        } catch (e: any) {
            enqueueSnackbar(e.response?.data?.error || 'Erro ao iniciar intervalo', { variant: 'error' });
        }
    };

    const handleFinalizarAlmoco = async () => {
        if (!pontoId) return;
        try {
            await api.post(`/medico-monitoring/ponto/${pontoId}/almoco/finalizar`);
            enqueueSnackbar('✅ Intervalo encerrado, bom retorno!', { variant: 'success' });
            await fetchData();
        } catch (e: any) {
            enqueueSnackbar(e.response?.data?.error || 'Erro ao finalizar intervalo', { variant: 'error' });
        }
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
                inscricao_id: inscrito?.id ?? null, // 🔗 vincula à ficha do exame específico
            });
            if (inscrito) setInscricaoAtual(inscrito);
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
            await api.put(`/medico-monitoring/atendimento/${emAndamento.id}/finalizar`, {
                observacoes: observacoesEmAndamento,
                inscricao_id: inscricaoAtual?.id ?? null, // passar ID específico da inscrição
            });
            enqueueSnackbar('Consulta finalizada!', { variant: 'success' });
            setInscricaoAtual(null);
            setCidadaoSelecionado(null);
            await fetchData(); await fetchInscritos();
        } catch { enqueueSnackbar('Erro ao finalizar', { variant: 'error' }); }
        finally { setFinalizando(false); }
    };

    const handleCancelarConsulta = async () => {
        if (!emAndamento) return;
        try {
            await api.put(`/medico-monitoring/atendimento/${emAndamento.id}/cancelar`);
            enqueueSnackbar('Consulta cancelada', { variant: 'warning' });
            setCidadaoSelecionado(null);
            await fetchData(); await fetchInscritos();
        } catch { enqueueSnackbar('Erro ao cancelar', { variant: 'error' }); }
    };

    const handleChamarPaciente = async (e: React.MouseEvent, inscrito: any) => {
        e.stopPropagation();
        const ficha = inscrito.fichas?.[0];
        if (!ficha) {
            enqueueSnackbar('Este paciente ainda não tem ficha gerada hoje.', { variant: 'warning' });
            return;
        }
        try {
            await api.patch(`/fichas/${ficha.id}/chamar`, { guiche: pontoSala || 'Consultório Médico' });
            enqueueSnackbar(`Chamando ${inscrito.cidadao.nome}...`, { variant: 'success' });
            await fetchInscritos();
            await fetchFila();
        } catch (err: any) {
            enqueueSnackbar(err.response?.data?.error || 'Erro ao chamar paciente', { variant: 'error' });
        }
    };

    const getExameAbbrev = (nome?: string) => {
        if (!nome) return '';
        const n = nome.toLowerCase();
        if (n.includes('vista')) return 'EV';
        if (n.includes('admissional')) return 'EMA';
        if (n.includes('geral')) return 'CG';
        return nome.split(' ').filter(w => w.length > 2).map(w => w[0].toUpperCase()).join('').substring(0, 3);
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
        <>
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
                            {/* Status chip: Online / Offline / Em Intervalo */}
                            {pontoStatus === 'intervalo' ? (
                                <Chip
                                    icon={<Coffee size={13} />}
                                    label="Em Intervalo"
                                    size="small"
                                    sx={{
                                        background: '#FFF3CD',
                                        color: '#856404',
                                        fontWeight: 600,
                                        '& .MuiChip-icon': { color: 'inherit' },
                                        animation: 'pulse 2s infinite',
                                        '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.7 } },
                                    }}
                                />
                            ) : (
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
                            )}

                            {/* B5: Botão Almoço — aparece ao lado do Online quando turno ativo */}
                            {pontoStatus === 'trabalhando' && !emAndamento && (
                                <Tooltip title="Iniciar pausa para almoço">
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        startIcon={<UtensilsCrossed size={14} />}
                                        onClick={handleIniciarAlmoco}
                                        sx={{
                                            borderColor: expressoTheme.colors.primary,
                                            color: expressoTheme.colors.primary,
                                            textTransform: 'none',
                                            fontWeight: 600,
                                            fontSize: '0.78rem',
                                            borderRadius: expressoTheme.borderRadius.medium,
                                            '&:hover': { background: `${expressoTheme.colors.primary}10`, borderColor: expressoTheme.colors.primaryDark },
                                        }}
                                    >
                                        Pausa Almoço
                                    </Button>
                                </Tooltip>
                            )}
                            {pontoStatus === 'intervalo' && (
                                <Tooltip title="Encerrar intervalo e voltar a trabalhar">
                                    <Button
                                        size="small"
                                        variant="contained"
                                        startIcon={<LogIn size={14} />}
                                        onClick={handleFinalizarAlmoco}
                                        sx={{
                                            background: expressoTheme.gradients.primary,
                                            textTransform: 'none',
                                            fontWeight: 600,
                                            fontSize: '0.78rem',
                                            borderRadius: expressoTheme.borderRadius.medium,
                                            boxShadow: expressoTheme.shadows.button,
                                        }}
                                    >
                                        Voltar do Intervalo
                                    </Button>
                                </Tooltip>
                            )}

                            <Tooltip title="Atualizar">
                                <IconButton onClick={() => { fetchData(); fetchInscritos(); }} size="small" sx={{ color: expressoTheme.colors.textSecondary }}>
                                    <RefreshCw size={16} />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Box>
                </motion.div>

                {/* ── ALERTA PONTO ── */}
                {pontoStatus !== 'trabalhando' && pontoStatus !== 'intervalo' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <Alert
                            severity="warning"
                            icon={<LogIn size={18} />}
                            sx={{ mb: 2.5, borderRadius: expressoTheme.borderRadius.medium }}
                            action={
                                <Button size="small" variant="contained" onClick={handleCarregarSalas} startIcon={<LogIn size={14} />}
                                    sx={{ background: expressoTheme.gradients.primary, borderRadius: expressoTheme.borderRadius.medium, textTransform: 'none', fontWeight: 600, boxShadow: expressoTheme.shadows.button }}>
                                    Iniciar Turno
                                </Button>
                            }
                        >
                            Você ainda não iniciou o turno de hoje.
                        </Alert>
                    </motion.div>
                )}
                {/* ── ALERTA INTERVALO ── */}
                {pontoStatus === 'intervalo' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <Alert
                            severity="info"
                            icon={<Coffee size={18} />}
                            sx={{ mb: 2.5, borderRadius: expressoTheme.borderRadius.medium, background: '#FFF8E1', border: '1px solid #FFD54F' }}
                            action={
                                <Button size="small" variant="contained" onClick={handleFinalizarAlmoco} startIcon={<LogIn size={14} />}
                                    sx={{ background: expressoTheme.gradients.primary, borderRadius: expressoTheme.borderRadius.medium, textTransform: 'none', fontWeight: 600, boxShadow: expressoTheme.shadows.button }}>
                                    Voltar do Intervalo
                                </Button>
                            }
                        >
                            ☕ Você está em intervalo de almoço. O atendimento está pausado.
                        </Alert>
                    </motion.div>
                )}

                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, alignItems: 'flex-start' }}>
                    {/* ── SIDEBAR MENU ── */}
                    <Paper sx={{ width: { xs: '100%', md: 240 }, flexShrink: 0, p: 2, borderRadius: expressoTheme.borderRadius.medium, position: 'sticky', top: 24 }}>
                        <Typography variant="overline" sx={{ fontWeight: 800, color: expressoTheme.colors.textSecondary, mb: 1, display: 'block', pl: 1 }}>
                            MENU DO MÉDICO
                        </Typography>
                        <List component="nav" sx={{ '& .MuiListItemButton-root': { borderRadius: 2, mb: 0.5 } }}>
                            <ListItemButton selected={activeMenu === 'atendimento'} onClick={() => setActiveMenu('atendimento')} sx={{ color: activeMenu === 'atendimento' ? expressoTheme.colors.primary : 'inherit', '&.Mui-selected': { background: `${expressoTheme.colors.primary}15` } }}>
                                <Stethoscope size={18} style={{ marginRight: 12 }} />
                                <ListItemText primary="Atendimento / Fila" primaryTypographyProps={{ fontWeight: activeMenu === 'atendimento' ? 700 : 500, fontSize: '0.9rem' }} />
                            </ListItemButton>
                            <ListItemButton selected={activeMenu === 'historico'} onClick={() => setActiveMenu('historico')} sx={{ color: activeMenu === 'historico' ? expressoTheme.colors.primary : 'inherit', '&.Mui-selected': { background: `${expressoTheme.colors.primary}15` } }}>
                                <ClipboardList size={18} style={{ marginRight: 12 }} />
                                <ListItemText primary="Histórico Clínico" primaryTypographyProps={{ fontWeight: activeMenu === 'historico' ? 700 : 500, fontSize: '0.9rem' }} />
                            </ListItemButton>
                            <ListItemButton selected={activeMenu === 'laudos'} onClick={() => setActiveMenu('laudos')} sx={{ color: activeMenu === 'laudos' ? expressoTheme.colors.primary : 'inherit', '&.Mui-selected': { background: `${expressoTheme.colors.primary}15` } }}>
                                <FileText size={18} style={{ marginRight: 12 }} />
                                <ListItemText primary="Laudos & Exames" primaryTypographyProps={{ fontWeight: activeMenu === 'laudos' ? 700 : 500, fontSize: '0.9rem' }} />
                            </ListItemButton>
                            <ListItemButton selected={activeMenu === 'chat'} onClick={() => setActiveMenu('chat')} sx={{ color: activeMenu === 'chat' ? expressoTheme.colors.primary : 'inherit', '&.Mui-selected': { background: `${expressoTheme.colors.primary}15` } }}>
                                <MessageCircle size={18} style={{ marginRight: 12 }} />
                                <ListItemText primary="Chats da Ação" primaryTypographyProps={{ fontWeight: activeMenu === 'chat' ? 700 : 500, fontSize: '0.9rem' }} />
                            </ListItemButton>
                            <ListItemButton selected={activeMenu === 'emergencias'} onClick={() => setActiveMenu('emergencias')} sx={{ color: activeMenu === 'emergencias' ? expressoTheme.colors.primary : 'inherit', '&.Mui-selected': { background: `${expressoTheme.colors.primary}15` } }}>
                                <AlertTriangle size={18} style={{ marginRight: 12 }} color={activeMenu === 'emergencias' ? expressoTheme.colors.danger : expressoTheme.colors.textSecondary} />
                                <ListItemText primary="Emergências" primaryTypographyProps={{ fontWeight: activeMenu === 'emergencias' ? 700 : 500, fontSize: '0.9rem' }} />
                            </ListItemButton>
                        </List>
                    </Paper>

                    {/* ── MAIN CONTENT AREA ── */}
                    <Box sx={{ flexGrow: 1, width: '100%' }}>
                        {activeMenu === 'atendimento' && (
                            <Grid container spacing={3}>
                    {/* ── COLUNA PRINCIPAL ── */}
                    <Grid item xs={12} lg={8}>

                        {/* ── ALERTA CENTRAL DE EMERGÊNCIA ── */}
                        <AnimatePresence>
                            {emergenciaAtiva && (
                                <motion.div initial={{ opacity: 0, scale: 0.9, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0 }}>
                                    <Box sx={{
                                        background: '#FEF2F2',
                                        borderRadius: expressoTheme.borderRadius.large,
                                        border: '2px solid #DC2626',
                                        p: 4, mb: 4,
                                        boxShadow: '0 12px 30px rgba(220, 38, 38, 0.3)',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
                                        position: 'relative', overflow: 'hidden'
                                    }}>
                                        <Box sx={{ position: 'absolute', top: -30, right: -30, opacity: 0.05, transform: 'rotate(15deg)' }}>
                                            <AlertTriangle size={200} color="#DC2626" />
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                            <Box sx={{ animation: 'pulse 1s infinite' }}>
                                                <AlertTriangle size={48} color="#DC2626" />
                                            </Box>
                                            <Typography variant="h4" sx={{ fontWeight: 900, color: '#DC2626', textTransform: 'uppercase', letterSpacing: 2 }}>
                                                Sinal de Emergência
                                            </Typography>
                                        </Box>
                                        <Typography sx={{ fontSize: '1.2rem', color: '#7F1D1D', mb: 1 }}>
                                            O cidadão <strong>{emergenciaAtiva.nome}</strong> está solicitando ajuda médica imediata na sua unidade!
                                        </Typography>
                                        <Typography sx={{ fontSize: '0.9rem', color: '#991B1B', mb: 3, fontWeight: 600 }}>
                                            Alerta recebido às {new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                                        </Typography>
                                        
                                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                                            <Button 
                                                variant="contained" 
                                                color="error"
                                                size="large"
                                                startIcon={<ClipboardEdit />}
                                                onClick={async () => {
                                                    try {
                                                        if (emergenciaAtiva.id) await api.put(`/emergencias/${emergenciaAtiva.id}/status`, { status: 'em_atendimento' });
                                                    } catch {}
                                                    setEmergenciaAtiva(null);
                                                    navigate(`/ficha/${emergenciaAtiva.cidadao_id}`);
                                                }}
                                                sx={{ background: '#DC2626', fontWeight: 800, px: 4, borderRadius: '12px' }}
                                            >
                                                Abrir Prontuário Imediatamente
                                            </Button>
                                            <Button 
                                                variant="outlined" 
                                                color="error"
                                                size="large"
                                                onClick={async () => {
                                                    try {
                                                        if (emergenciaAtiva.id) await api.put(`/emergencias/${emergenciaAtiva.id}/status`, { status: 'visto' });
                                                    } catch {}
                                                    setEmergenciaAtiva(null);
                                                }}
                                                sx={{ fontWeight: 700, borderRadius: '12px', background: '#fff' }}
                                            >
                                                Omitir Alerta
                                            </Button>
                                        </Box>
                                    </Box>
                                </motion.div>
                            )}
                        </AnimatePresence>

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

                                        <Box sx={{ position: 'relative', mb: 2.5 }}>
                                            <TextField fullWidth multiline rows={2} placeholder="Observações do atendimento..."
                                                value={observacoesEmAndamento} onChange={(e) => setObservacoesEmAndamento(e.target.value)}
                                                InputProps={{
                                                    endAdornment: (
                                                        <Tooltip title={gravandoVoz ? 'Parar gravação' : 'Gravar observações por voz'}>
                                                            <IconButton
                                                                size="small"
                                                                onClick={gravandoVoz ? pararGravacaoPanel : iniciarGravacaoPanel}
                                                                sx={{
                                                                    position: 'absolute', right: 8, top: 8,
                                                                    color: gravandoVoz ? '#ef4444' : expressoTheme.colors.primary,
                                                                    background: gravandoVoz ? '#FEF2F2' : `${expressoTheme.colors.primary}10`,
                                                                    border: `1px solid ${gravandoVoz ? '#FECACA' : expressoTheme.colors.borderLight}`,
                                                                    animation: gravandoVoz ? 'pulse 1.2s infinite' : 'none',
                                                                    '@keyframes pulse': { '0%,100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.15)' } },
                                                                }}
                                                            >
                                                                {gravandoVoz ? <MicOff size={16} /> : <Mic size={16} />}
                                                            </IconButton>
                                                        </Tooltip>
                                                    ),
                                                }}
                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: expressoTheme.borderRadius.medium, '&:hover fieldset': { borderColor: expressoTheme.colors.primary }, '&.Mui-focused fieldset': { borderColor: expressoTheme.colors.primary }, borderColor: gravandoVoz ? '#ef4444' : undefined } }}
                                            />
                                            {gravandoVoz && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s infinite' }} />
                                                    <Typography sx={{ fontSize: '0.72rem', color: '#ef4444', fontWeight: 600 }}>Gravando...</Typography>
                                                </Box>
                                            )}
                                        </Box>

                                        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                                            {/* B1: Botão Prontuário */}
                                            <Button
                                                variant="outlined"
                                                startIcon={<ClipboardEdit size={16} />}
                                                onClick={() => setFichaOpen(true)}
                                                sx={{
                                                    py: 1.5,
                                                    borderRadius: expressoTheme.borderRadius.medium,
                                                    textTransform: 'none',
                                                    fontWeight: 700,
                                                    borderColor: '#8b5cf6',
                                                    color: '#8b5cf6',
                                                    '&:hover': { background: '#f5f3ff', borderColor: '#7c3aed' },
                                                }}
                                            >
                                                📋 Prontuário
                                            </Button>
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
                                        <Tab value="chat" label="💬 Chat" />
                                        <Tab value="emergencias" label="🆘" />
                                    </Tabs>
                                    <TextField size="small" placeholder="Buscar..." value={buscaInscrito} onChange={(e) => setBuscaInscrito(e.target.value)}
                                        InputProps={{ startAdornment: <Search size={15} color={expressoTheme.colors.textSecondary} style={{ marginRight: 6 }} /> }}
                                        sx={{ minWidth: 180, '& .MuiOutlinedInput-root': { borderRadius: expressoTheme.borderRadius.medium, fontSize: '0.85rem' } }}
                                    />
                                    {examesDisponiveis.length >= 2 && (
                                        <FormControl size="small" sx={{ minWidth: 160 }}>
                                            <InputLabel>Exame</InputLabel>
                                            <Select
                                                value={filtroExameId}
                                                label="Exame"
                                                onChange={(e) => setFiltroExameId(e.target.value)}
                                                sx={{ borderRadius: expressoTheme.borderRadius.medium, fontSize: '0.82rem' }}
                                            >
                                                <MenuItem value="">Todos</MenuItem>
                                                {examesDisponiveis.map(e => (
                                                    <MenuItem key={e.id} value={e.id}>{e.nome}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    )}
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
                                                        <ListItemText disableTypography
                                                            primary={
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                                                                    <Typography sx={{ fontWeight: 600, fontSize: '0.88rem', color: expressoTheme.colors.text }}>
                                                                        {inscrito.cidadao.nome}
                                                                    </Typography>
                                                                    {inscrito.curso_exame && (
                                                                        <Chip
                                                                            label={inscrito.curso_exame.nome}
                                                                            size="small"
                                                                            icon={<Stethoscope size={11} />}
                                                                            sx={{
                                                                                height: 20, fontSize: '0.68rem', fontWeight: 700,
                                                                                background: inscrito.status === 'atendido' ? '#D4EDDA' : 'linear-gradient(135deg,#E3F2FD,#EDE7F6)',
                                                                                color: inscrito.status === 'atendido' ? expressoTheme.colors.success : expressoTheme.colors.primary,
                                                                                border: `1px solid ${inscrito.status === 'atendido' ? '#C3E6CB' : '#BBDEFB'}`,
                                                                                '& .MuiChip-icon': { color: 'inherit', ml: 0.5 },
                                                                                '& .MuiChip-label': { px: 0.75 },
                                                                            }}
                                                                        />
                                                                    )}
                                                                </Box>
                                                            }
                                                            secondary={
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                                                    <Typography sx={{ fontSize: '0.75rem', color: expressoTheme.colors.textSecondary }}>{inscrito.cidadao.cpf} {inscrito.cidadao.telefone ? `· ${inscrito.cidadao.telefone}` : ''}</Typography>
                                                                    {inscrito.fichas?.[0] && (
                                                                        <Chip
                                                                            label={`Ficha: ${String(inscrito.fichas[0].numero_ficha).padStart(3, '0')}${getExameAbbrev(inscrito.curso_exame?.nome)}`}
                                                                            size="small"
                                                                            sx={{
                                                                                height: 18, fontSize: '0.65rem', fontWeight: 800,
                                                                                background: inscrito.fichas[0].status === 'chamado' ? '#FFF3CD' : '#E0E0E0',
                                                                                color: inscrito.fichas[0].status === 'chamado' ? '#856404' : '#616161',
                                                                            }}
                                                                        />
                                                                    )}
                                                                </Box>
                                                            }
                                                        />

                                                        {/* B2/B3: Ações rápidas — QR Code, Chat e Chamar */}
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mr: 1, flexShrink: 0 }}>
                                                            {inscrito.fichas?.[0] && inscrito.status !== 'atendido' && inscrito.status !== 'faltou' && (
                                                                <Tooltip title="Chamar Paciente no Painel">
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={(e) => handleChamarPaciente(e, inscrito)}
                                                                        sx={{
                                                                            color: '#059669',
                                                                            border: `1px solid #D1FAE5`,
                                                                            borderRadius: expressoTheme.borderRadius.medium,
                                                                            p: 0.6, background: '#ECFDF5',
                                                                            '&:hover': { background: '#D1FAE5', borderColor: '#10B981' },
                                                                        }}
                                                                    >
                                                                        <Megaphone size={18} />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            )}
                                                            <Tooltip title="QR Code do Paciente">

                                                                <IconButton
                                                                    size="small"
                                                                    onClick={async (e) => {
                                                                        e.stopPropagation();
                                                                        setQrCidadao(inscrito.cidadao);
                                                                        setQrHistorico(null);
                                                                        setQrOpen(true);
                                                                        // Buscar perfil clínico completo
                                                                        try {
                                                                            const r = await api.get(`/medico-monitoring/cidadao/${inscrito.cidadao.id}/perfil-clinico`);
                                                                            setQrCidadao(r.data.cidadao);
                                                                            setQrHistorico(r.data.historico_clinico);
                                                                        } catch { /* usa dados básicos */ }
                                                                    }}
                                                                    sx={{
                                                                        color: expressoTheme.colors.primary,
                                                                        border: `1px solid ${expressoTheme.colors.borderLight}`,
                                                                        borderRadius: expressoTheme.borderRadius.medium,
                                                                        p: 0.6,
                                                                        '&:hover': { background: `${expressoTheme.colors.primary}15`, borderColor: expressoTheme.colors.primary },
                                                                    }}
                                                                >
                                                                    <QrCode size={18} />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Chat com paciente">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setChatCidadao({ id: inscrito.cidadao.id, nome: inscrito.cidadao.nome });
                                                                        setMensagensNaoLidas(prev => ({ ...prev, [inscrito.cidadao.id]: 0 }));
                                                                        setChatOpen(true);
                                                                    }}
                                                                    sx={{
                                                                        color: expressoTheme.colors.primary,
                                                                        border: `1px solid ${expressoTheme.colors.borderLight}`,
                                                                        borderRadius: expressoTheme.borderRadius.medium,
                                                                        p: 0.6,
                                                                        position: 'relative',
                                                                        '&:hover': { background: `${expressoTheme.colors.primary}15`, borderColor: expressoTheme.colors.primary },
                                                                    }}
                                                                >
                                                                    <MessageCircle size={18} />
                                                                    {(mensagensNaoLidas[inscrito.cidadao.id] || 0) > 0 && (
                                                                        <Box sx={{
                                                                            position: 'absolute', top: -4, right: -4,
                                                                            width: 16, height: 16, borderRadius: '50%',
                                                                            background: '#ef4444', display: 'flex',
                                                                            alignItems: 'center', justifyContent: 'center',
                                                                            border: '2px solid white',
                                                                        }}>
                                                                            <Typography sx={{ fontSize: '0.6rem', color: 'white', fontWeight: 700 }}>
                                                                                {mensagensNaoLidas[inscrito.cidadao.id]}
                                                                            </Typography>
                                                                        </Box>
                                                                    )}
                                                                </IconButton>
                                                            </Tooltip>
                                                        </Box>

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

                                {/* Chat Tab */}
                                {tabInscritos === 'chat' && (
                                    <ChatTab
                                        acaoId={acaoId!}
                                        medicoId={user?.funcionario_id || user?.id || ''}
                                        inscritos={inscritos.filter((i: any) => i.cidadao)}
                                        mensagensNaoLidas={mensagensNaoLidas}
                                    />
                                )}

                                {/* Emergências Tab */}
                                {tabInscritos === 'emergencias' && (
                                    <Box sx={{ textAlign: 'center', py: 3 }}>
                                        <Typography sx={{ fontWeight: 700, fontSize: '0.92rem', mb: 1, color: expressoTheme.colors.primaryDark }}>
                                            🆘 Alertas de Emergência
                                        </Typography>
                                        <Typography sx={{ fontSize: '0.82rem', color: expressoTheme.colors.textSecondary, mb: 2 }}>
                                            Utilize o sino 🔔 no header ou acesse a página dedicada.
                                        </Typography>
                                        <Button variant="outlined" size="small"
                                            onClick={() => navigate('/medico/emergencias')}
                                            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '10px', borderColor: expressoTheme.colors.primary, color: expressoTheme.colors.primary }}
                                        >
                                            Abrir Central de Emergências →
                                        </Button>
                                    </Box>
                                )}

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
                                                        {a.nome_exame && (
                                                            <Typography sx={{ fontSize: '0.72rem', color: expressoTheme.colors.primary, fontWeight: 700, mt: 0.2 }}>
                                                                {a.nome_exame}
                                                            </Typography>
                                                        )}
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
                )}
                {activeMenu === 'historico' && (
                     <MedicoHistorico user={user} acaoId={acaoId} />
                )}

                {activeMenu === 'laudos' && (
                     <MedicoLaudos user={user} acaoId={acaoId} />
                )}

                {/* Main Views for Chat and Emergencias directly from Sidebar */}
                {activeMenu === 'chat' && (
                    <Box sx={{ background: expressoTheme.colors.cardBackground, p: 3, borderRadius: expressoTheme.borderRadius.large, border: `1px solid ${expressoTheme.colors.border}` }}>
                        <ChatTab
                            acaoId={acaoId!}
                            medicoId={user?.funcionario_id || user?.id || ''}
                            inscritos={inscritos.filter((i: any) => i.cidadao)}
                            mensagensNaoLidas={mensagensNaoLidas}
                        />
                    </Box>
                )}

                {activeMenu === 'emergencias' && (
                    <Box sx={{ background: expressoTheme.colors.cardBackground, p: 4, borderRadius: expressoTheme.borderRadius.large, border: `1px solid ${expressoTheme.colors.border}`, textAlign: 'center' }}>
                        <Typography sx={{ fontWeight: 800, fontSize: '1.2rem', mb: 1, color: expressoTheme.colors.danger }}>
                            🆘 Central de Emergências
                        </Typography>
                        <Typography sx={{ fontSize: '0.9rem', color: expressoTheme.colors.textSecondary, mb: 3 }}>
                            Visualização detalhada dos alertas de pânico e SOS da Unidade Móvel.
                        </Typography>
                        <Button variant="contained" size="large"
                            onClick={() => navigate('/medico/emergencias')}
                            sx={{ background: expressoTheme.colors.danger, color: 'white', fontWeight: 700, borderRadius: '8px', '&:hover': { background: '#c53030' } }}
                        >
                            Acessar Monitor de Emergência
                        </Button>
                    </Box>
                )}

                </Box> {/* End Main Content Box */}
                </Box> {/* End Wrapper flex row */}
            </Container>
        </Box>

        {/* B1: Prontuário Eletrônico */}
        {emAndamento && (
            <FichaClinica
                open={fichaOpen}
                onClose={() => setFichaOpen(false)}
                atendimentoId={emAndamento.id}
                cidadaoId={(emAndamento as any).cidadao?.id ?? cidadaoSelecionado?.cidadao.id}
                nomePaciente={emAndamento.nome_paciente || emAndamento.cidadao?.nome || '—'}
                fichaInicial={(emAndamento as any).ficha_clinica}
                onFinalizar={async (_ficha, obs) => {
                    setObservacoesEmAndamento(obs);
                    setFichaOpen(false);
                    await handleFinalizarConsulta();
                }}
            />
        )}

        {/* B2: QR Code */}
        <QrCodePaciente
            open={qrOpen}
            onClose={() => { setQrOpen(false); setQrCidadao(null); setQrHistorico(null); }}
            cidadao={qrCidadao}
            historicoClinico={qrHistorico}
        />

        {/* B3: Chat médico */}
        {chatCidadao && acaoId && user?.id && (
            <ChatMedico
                open={chatOpen}
                onClose={() => { setChatOpen(false); setChatCidadao(null); }}
                acaoId={acaoId}
                cidadaoId={chatCidadao.id}
                nomeCidadao={chatCidadao.nome}
                medicoId={user.id}
            />
        )}

        {/* B3: Alerta de emergência */}
        <AnimatePresence>
            {emergenciaAtiva && (
                <EmergenciaAlert
                    emergencia={emergenciaAtiva}
                    onDismiss={() => setEmergenciaAtiva(null)}
                    onAbrirFicha={async (cidadao_id) => {
                        const inscrito = inscritos.find(i => i.cidadao.id === cidadao_id);
                        if (inscrito) {
                            setQrCidadao(inscrito.cidadao);
                            setQrHistorico(null);
                            setQrOpen(true);
                            try {
                                const r = await api.get(`/medico-monitoring/cidadao/${cidadao_id}/perfil-clinico`);
                                setQrCidadao(r.data.cidadao);
                                setQrHistorico(r.data.historico_clinico);
                            } catch { /* dados básicos */ }
                        }
                        setEmergenciaAtiva(null);
                    }}
                    onAbrirChat={(cidadao_id) => {
                        const inscrito = inscritos.find(i => i.cidadao.id === cidadao_id);
                        if (inscrito) {
                            setChatCidadao({ id: inscrito.cidadao.id, nome: inscrito.cidadao.nome });
                            setChatOpen(true);
                        }
                        setEmergenciaAtiva(null);
                    }}
                />
            )}
        </AnimatePresence>

        {/* B5: Modal de Seleção de Sala */}
        <Dialog open={modalSalaOpen} onClose={() => setModalSalaOpen(false)} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontWeight: 'bold', color: expressoTheme.colors.text }}>Escolha sua Sala</DialogTitle>
            <DialogContent dividers>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Selecione a sala onde você realizará os atendimentos. Salas ocupadas estão em uso por outros profissionais e foram bloqueadas.
                </Typography>
                <FormControl fullWidth>
                    <InputLabel id="sala-select-label">Sala *</InputLabel>
                    <Select
                        labelId="sala-select-label"
                        value={salaEscolhida}
                        label="Sala *"
                        onChange={(e) => setSalaEscolhida(e.target.value)}
                    >
                        {Array.from({ length: 15 }, (_, i) => `Sala ${i + 1}`).map(salaName => {
                            const isOcupada = salasOcupadas.includes(salaName);
                            return (
                                <MenuItem key={salaName} value={salaName} disabled={isOcupada} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>{salaName}</span>
                                    {isOcupada && <Chip size="small" label="Ocupada" color="error" variant="outlined" sx={{ height: 20 }} />}
                                </MenuItem>
                            );
                        })}
                    </Select>
                </FormControl>
            </DialogContent>
            <DialogActions sx={{ p: 2, pt: 1 }}>
                <Button onClick={() => setModalSalaOpen(false)} color="inherit" sx={{ textTransform: 'none', fontWeight: 600 }}>Cancelar</Button>
                <Button 
                    onClick={handleConfirmarTurno} 
                    variant="contained" 
                    disabled={!salaEscolhida}
                    sx={{ textTransform: 'none', fontWeight: 600, background: expressoTheme.gradients.primary, borderRadius: expressoTheme.borderRadius.medium }}
                >
                    Confirmar
                </Button>
            </DialogActions>
        </Dialog>
    </>
    );
};

export default MedicoPanel;

