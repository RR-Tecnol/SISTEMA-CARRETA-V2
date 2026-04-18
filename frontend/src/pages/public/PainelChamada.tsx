/**
 * PainelChamada.tsx — Painel público de chamada de fichas (TV/Telão)
 * Rota: /painel/:acao_id — sem autenticação
 * Design: Light, profissional, Full HD — com histórico de chamadas
 * D1: Síntese de voz (Web Speech API) adicionada
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Chip, Divider, Button } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { getSocket } from '../../utils/socket';

const isLocal = window.location.hostname === 'localhost';
const API = process.env.REACT_APP_API_URL || (isLocal ? 'http://localhost:3001/api' : '/api');

interface FichaPublica {
    id: string;
    numero_ficha: number;
    status: string;
    hora_chamada?: string;
    cidadao?: { nome_completo: string };
    inscricao?: { curso_exame?: { nome: string } };
    estacao?: { id: string; nome: string; status: string };
    guiche?: string;
}

interface EstacaoPublica {
    id: string;
    nome: string;
    status: 'ativa' | 'pausada' | 'manutencao';
    motivo_pausa?: string;
    curso_exame?: { nome: string };
}

interface PainelData {
    ultimaChamada: FichaPublica | null;
    aguardando: FichaPublica[];
    chamadas: FichaPublica[];   // historico de chamadas do dia
    estacoes: EstacaoPublica[];
    profissionaisSalas?: Array<{
        id: string;
        medico_nome: string;
        especialidade: string | null;
        sala: string;
        status: string;
    }>;
    totalHoje: number;
    concluidos: number;
    nomeAcao: string;
}


const fmtHora = (iso?: string) =>
    iso ? new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';

export default function PainelChamada() {
    const { acao_id } = useParams<{ acao_id: string }>();
    const [painel, setPainel] = useState<PainelData | null>(null);
    const [callQueue, setCallQueue] = useState<FichaPublica[]>([]);
    const [hora, setHora] = useState(new Date());
    const [flashActive, setFlashActive] = useState(false);
    const [historico, setHistorico] = useState<FichaPublica[]>([]);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const isPlayingRef = useRef(false);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    // D1 — Estado de ativação de voz (navegador bloqueia sem gesto do usuário)
    const [vozAtivada, setVozAtivada] = useState(false);

    // D1 — Pré-carregar vozes assincronamente (Chrome carrega após interação)
    useEffect(() => {
        if (!window.speechSynthesis) return;
        const carregarVozes = () => window.speechSynthesis.getVoices();
        carregarVozes();
        window.speechSynthesis.onvoiceschanged = carregarVozes;
        return () => { window.speechSynthesis.onvoiceschanged = null; };
    }, []);

    // D1 — Função de síntese de voz convertida para Promise para enfileiramento
    const reproduzirVoz = async (ficha: FichaPublica): Promise<void> => {
        return new Promise((resolve) => {
            if (!vozAtivada || !window.speechSynthesis) {
                resolve();
                return;
            }

            const numero = String(ficha.numero_ficha).padStart(3, '0').split('').join(' ');
            const sala = ficha.estacao?.nome || ficha.guiche || 'Balcão de Atendimento';
            const exame = ficha.inscricao?.curso_exame?.nome ? `, para ${ficha.inscricao.curso_exame.nome}` : '';
            const texto = `Senha, ${numero}${exame}. Dirija-se ao ${sala}, por favor.`;

            const utterance = new SpeechSynthesisUtterance(texto);
            utteranceRef.current = utterance; // Previne Garbage Collection no Chrome

            utterance.lang = 'pt-BR';
            utterance.rate = 0.88;
            utterance.pitch = 1.05;
            utterance.volume = 1;

            const vozes = window.speechSynthesis.getVoices();
            const vozBR = vozes.find(v => v.lang === 'pt-BR') || vozes.find(v => v.lang.startsWith('pt'));
            if (vozBR) utterance.voice = vozBR;

            const fallbackTimer = setTimeout(() => {
                window.speechSynthesis.cancel();
                resolve();
            }, 10000); // Fallback: unblock the queue if the voice engine freezes

            utterance.onend = () => {
                clearTimeout(fallbackTimer);
                setTimeout(resolve, 600); // aguarda 0.6s após a fala antes de liberar a fila
            };
            
            utterance.onerror = () => {
                clearTimeout(fallbackTimer);
                resolve(); // libera se der erro
            };

            window.speechSynthesis.speak(utterance);
        });
    };

    // D1 — Ativar voz com gesto do usuário (desbloqueia AudioContext/SpeechSynthesis)
    const ativarVoz = () => {
        setVozAtivada(true);
        if (window.speechSynthesis) {
            const teste = new SpeechSynthesisUtterance('Voz ativada. Sistema pronto.');
            teste.lang = 'pt-BR';
            teste.volume = 0.7;
            const vozes = window.speechSynthesis.getVoices();
            const vozBR = vozes.find(v => v.lang === 'pt-BR') || vozes.find(v => v.lang.startsWith('pt'));
            if (vozBR) teste.voice = vozBR;
            window.speechSynthesis.speak(teste);
        }
    };

    // Loop de Processamento da Fila
    useEffect(() => {
        let isCancelled = false;

        const loopQueue = async () => {
            if (isPlayingRef.current || callQueue.length === 0) return;
            
            isPlayingRef.current = true;
            const proximaFicha = callQueue[0];
            
            // Atualizar UI tela para a ficha que vai tocar
            setPainel(prev => prev ? { ...prev, ultimaChamada: proximaFicha } : null);
            setFlashActive(true);
            setTimeout(() => { if (!isCancelled) setFlashActive(false); }, 2000);
            audioRef.current?.play().catch(() => {});

            // Tocar Voz Assincronamente
            await reproduzirVoz(proximaFicha);

            if (!isCancelled) {
                setCallQueue(prev => prev.slice(1)); // Remove a ficha já tocada
                isPlayingRef.current = false; // Libera o lock
            }
        };

        loopQueue();
        return () => { isCancelled = true; };
    }, [callQueue, vozAtivada]);

    // ─── Polling de dados (fetch HTTP) ─────────────────────────
    // DEVE ser declarado ANTES dos useEffects que o referenciam
    const fetchPainelAsync = useCallback(async (forceRefresh = false) => {
        if (!acao_id) return;
        try {
            const { data } = await axios.get(`${API}/fichas/painel/${acao_id}`);
            setPainel(prev => {
                if (!prev || forceRefresh) {
                    if (data.chamadas?.length) setHistorico(data.chamadas.slice(0, 12));
                    return data;
                }
                return {
                    ...prev,
                    totalHoje: data.totalHoje,
                    concluidos: data.concluidos,
                    nomeAcao: data.nomeAcao,
                    estacoes: data.estacoes,
                    profissionaisSalas: data.profissionaisSalas
                };
            });
        } catch { } // Silencioso
    }, [acao_id]);

    // ─── WebSocket — conexão robusta ────────────────────────────
    useEffect(() => {
        if (!acao_id) return;

        const socket = getSocket();

        // Handlers de eventos da fila
        const handleFilaAtualizada = (dados: any) => {
            // L2: Se não vier payload 'fila', fazer refetch HTTP — evento emitido por inscricoes.ts
            if (!dados.fila || !Array.isArray(dados.fila)) {
                fetchPainelAsync(true);
                return;
            }

            const aguardandoFila = dados.fila.filter((f: any) =>
                f.status === 'aguardando' || f.status === 'pendente'
            );
            const pChamadosEAtendidos = dados.fila.filter((f: any) =>
                ['chamado', 'em_atendimento', 'concluido'].includes(f.status)
            );

            pChamadosEAtendidos.sort((a: any, b: any) =>
                new Date(b.hora_chamada || 0).getTime() - new Date(a.hora_chamada || 0).getTime()
            );

            setPainel(prev => prev ? { ...prev, aguardando: aguardandoFila } : null);

            setHistorico(prev => {
                const combinados = [...pChamadosEAtendidos, ...prev];
                const ids = new Set();
                return combinados
                    .filter(item => { if (ids.has(item.id)) return false; ids.add(item.id); return true; })
                    .sort((a, b) => new Date(b.hora_chamada || 0).getTime() - new Date(a.hora_chamada || 0).getTime())
                    .slice(0, 12);
            });
        };

        const handlePacienteChamado = (payload: any) => {
            if (!payload?.ficha) return;
            const bf = payload.ficha;
            const bc = payload.cidadao;

            const novaFicha: FichaPublica = {
                id: bf.id,
                numero_ficha: bf.numero_ficha,
                status: bf.status,
                hora_chamada: bf.hora_chamada,
                cidadao: bc ? { nome_completo: bc.nome_completo } : undefined,
                guiche: payload.guiche || bf.guiche,
                inscricao: bf.inscricao,
                estacao: bf.estacao,
            };

            setHistorico(prev => {
                if (prev[0]?.id === novaFicha.id) return prev;
                return [novaFicha, ...prev].slice(0, 12);
            });

            // Enfileira para tocar som + voz
            setCallQueue(prev => [...prev, novaFicha]);
        };

        // Garante o join à room — chamado sempre que socket estiver conectado
        const doJoin = () => {
            console.log(`📡 [PainelTV] Emitindo join_acao:${acao_id}`);
            socket.emit('join_acao', acao_id);
        };

        // Handler de reconexão: rejoin + fetch completo para recuperar estado
        const handleConnect = () => {
            console.log('📡 [PainelTV] Socket conectado/reconectado — rejoinando e recarregando dados');
            doJoin();
            fetchPainelAsync(true);
        };

        // A4: Atualizar painel quando médico finaliza atendimento
        const handleAtendimentoConcluido = () => {
            fetchPainelAsync(true);
        };

        // Registrar listeners
        socket.on('fila_atualizada', handleFilaAtualizada);
        socket.on('paciente_chamado', handlePacienteChamado);
        socket.on('atendimento_concluido', handleAtendimentoConcluido);
        socket.on('connect', handleConnect);

        // Se o socket JÁ está conectado agora, fazer join imediatamente
        // (o evento 'connect' não vai mais disparar para conexões estabilizadas)
        if (socket.connected) {
            doJoin();
        }

        return () => {
            socket.off('fila_atualizada', handleFilaAtualizada);
            socket.off('paciente_chamado', handlePacienteChamado);
            socket.off('atendimento_concluido', handleAtendimentoConcluido);
            socket.off('connect', handleConnect);
            socket.emit('leave_acao', acao_id);
        };
    }, [acao_id, fetchPainelAsync]);

    // ─── Polling HTTP periódico (15s) ───────────────────────────
    useEffect(() => {
        fetchPainelAsync();
        const interval = setInterval(fetchPainelAsync, 15000);
        return () => clearInterval(interval);
    }, [fetchPainelAsync]);



    useEffect(() => {
        const tick = setInterval(() => setHora(new Date()), 1000);
        return () => clearInterval(tick);
    }, []);

    const horaStr = hora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dataStr = hora.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

    const ultimaChamada = painel?.ultimaChamada;

    return (
        <Box sx={{
            minHeight: '100vh',
            background: 'linear-gradient(160deg, #F0F4FF 0%, #EBF3FF 50%, #F5F8FF 100%)',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: '"Inter", "Roboto", sans-serif',
            overflow: 'hidden',
            userSelect: 'none',
        }}>
            <audio ref={audioRef} src="/beep.mp3" preload="auto" />

            {/* Flash ao chamar nova senha */}
            <AnimatePresence>
                {flashActive && (
                    <motion.div
                        initial={{ opacity: 0.5 }}
                        animate={{ opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 2 }}
                        style={{
                            position: 'fixed', inset: 0,
                            background: 'rgba(37, 99, 235, 0.12)',
                            pointerEvents: 'none', zIndex: 999,
                        }}
                    />
                )}
            </AnimatePresence>

            {/* D1 — Overlay "Ativar Voz" enquanto não ativado */}
            {!vozAtivada && (
                <Box sx={{
                    position: 'fixed', inset: 0, zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(15, 23, 42, 0.55)',
                    backdropFilter: 'blur(4px)',
                }}>
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    >
                        <Box sx={{
                            background: 'white',
                            borderRadius: 4,
                            p: 5,
                            textAlign: 'center',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                            maxWidth: 420,
                        }}>
                            <Typography sx={{ fontSize: '3rem', mb: 1 }}>🔊</Typography>
                            <Typography sx={{ color: '#1E3A8A', fontWeight: 800, fontSize: '1.5rem', mb: 1 }}>
                                Painel de Chamada
                            </Typography>
                            <Typography sx={{ color: '#64748B', fontSize: '0.95rem', mb: 3, lineHeight: 1.6 }}>
                                Clique para ativar a voz de chamada.
                                Os navegadores exigem uma interação do usuário para liberar o áudio.
                            </Typography>
                            <Button
                                variant="contained"
                                onClick={ativarVoz}
                                sx={{
                                    background: 'linear-gradient(135deg, #2563EB, #1E40AF)',
                                    color: 'white',
                                    fontWeight: 700,
                                    fontSize: '1rem',
                                    px: 5,
                                    py: 1.5,
                                    borderRadius: 3,
                                    textTransform: 'none',
                                    boxShadow: '0 4px 16px rgba(37,99,235,0.4)',
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #1D4ED8, #1E3A8A)',
                                        transform: 'translateY(-1px)',
                                    },
                                    transition: 'all 0.2s',
                                }}
                            >
                                🔊 Ativar Voz e Iniciar Painel
                            </Button>
                            <Typography sx={{ color: '#94A3B8', fontSize: '0.72rem', mt: 2 }}>
                                Você pode continuar sem voz clicando fora desta janela
                            </Typography>
                            <Button
                                onClick={() => setVozAtivada(true)}
                                sx={{ color: '#94A3B8', fontSize: '0.72rem', mt: 0.5, textTransform: 'none' }}
                            >
                                Continuar sem voz
                            </Button>
                        </Box>
                    </motion.div>
                </Box>
            )}

            {/* ── HEADER ─────────────────────────────────────────── */}
            <Box sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                px: 5, py: 1.8,
                borderBottom: '1px solid #DBEAFE',
                background: 'white',
                boxShadow: '0 1px 12px rgba(37,99,235,0.08)',
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{
                        width: 46, height: 46, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #2563EB, #1E40AF)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(37,99,235,0.35)',
                    }}>
                        <Typography sx={{ color: 'white', fontWeight: 900, fontSize: '1.2rem' }}>G</Typography>
                    </Box>
                    <Box>
                        <Typography sx={{ color: '#1E3A8A', fontWeight: 800, fontSize: '1.1rem', lineHeight: 1.1 }}>
                            Gestão Sobre Rodas
                        </Typography>
                        <Typography sx={{ color: '#64748B', fontSize: '0.75rem' }}>
                            {painel?.nomeAcao || 'Carregando...'}
                        </Typography>
                    </Box>
                </Box>

                {/* D1 — Indicador de voz ativa no header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    {vozAtivada && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                        >
                            <Box sx={{
                                display: 'flex', alignItems: 'center', gap: 0.8,
                                background: '#DCFCE7', border: '1px solid #BBF7D0',
                                borderRadius: 2, px: 1.5, py: 0.6,
                            }}>
                                <Box sx={{
                                    width: 7, height: 7, borderRadius: '50%',
                                    background: '#16A34A',
                                    animation: 'pulse 1.5s ease-in-out infinite',
                                    '@keyframes pulse': {
                                        '0%, 100%': { opacity: 1 },
                                        '50%': { opacity: 0.4 },
                                    },
                                }} />
                                <Typography sx={{ color: '#15803D', fontSize: '0.7rem', fontWeight: 700 }}>
                                    🔊 Voz ativa
                                </Typography>
                            </Box>
                        </motion.div>
                    )}

                    <Box sx={{ textAlign: 'right' }}>
                        <Typography sx={{ color: '#1E3A8A', fontWeight: 800, fontSize: '2.1rem', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                            {horaStr}
                        </Typography>
                        <Typography sx={{ color: '#64748B', fontSize: '0.72rem', textTransform: 'capitalize' }}>
                            {dataStr}
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* ── MAIN GRID ─────────────────────────────────────── */}
            <Box sx={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 380px 340px', minHeight: 0 }}>

                {/* ── CENTRO — Senha em destaque ──────────────────── */}
                <Box sx={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', p: 5,
                    borderRight: '1px solid #DBEAFE',
                }}>
                    <Typography sx={{
                        color: '#94A3B8', fontSize: '0.85rem', letterSpacing: 4,
                        textTransform: 'uppercase', mb: 1, fontWeight: 600,
                    }}>
                        {ultimaChamada ? '📣  Chamando agora' : 'Aguardando Início'}
                    </Typography>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={ultimaChamada?.numero_ficha ?? 'vazio'}
                            initial={{ scale: 0.75, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 1.1, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
                            style={{ textAlign: 'center' }}
                        >
                            <Typography sx={{
                                fontSize: 'clamp(110px, 18vw, 210px)',
                                fontWeight: 900,
                                lineHeight: 0.85,
                                background: ultimaChamada
                                    ? 'linear-gradient(135deg, #2563EB 30%, #06B6D4 100%)'
                                    : 'linear-gradient(135deg, #CBD5E1, #94A3B8)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                letterSpacing: '-6px',
                                fontVariantNumeric: 'tabular-nums',
                                filter: ultimaChamada ? 'drop-shadow(0 4px 24px rgba(37,99,235,0.25))' : 'none',
                            }}>
                                {ultimaChamada
                                    ? String(ultimaChamada.numero_ficha).padStart(3, '0')
                                    : '---'}
                            </Typography>
                        </motion.div>
                    </AnimatePresence>

                    {ultimaChamada && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginTop: 16 }}>
                            <Typography sx={{ color: '#1E3A8A', fontSize: '2rem', fontWeight: 800, lineHeight: 1.2 }}>
                                {ultimaChamada.estacao?.nome || ultimaChamada.guiche || 'Balcão de Atendimento'}
                            </Typography>
                            {ultimaChamada.inscricao?.curso_exame?.nome && (
                                <Chip
                                    label={ultimaChamada.inscricao.curso_exame.nome}
                                    sx={{
                                        mt: 1, background: '#DBEAFE', color: '#1D4ED8',
                                        fontWeight: 700, fontSize: '0.9rem', height: 32,
                                        border: '1px solid #BFDBFE',
                                    }}
                                />
                            )}
                            {ultimaChamada.cidadao?.nome_completo && (
                                <Typography sx={{ 
                                    color: '#0F172A', 
                                    fontSize: '2.8rem', 
                                    mt: 2, 
                                    fontWeight: 800,
                                    letterSpacing: '-1px',
                                    textTransform: 'uppercase',
                                    textShadow: '0 2px 10px rgba(0,0,0,0.05)'
                                }}>
                                    {ultimaChamada.cidadao.nome_completo}
                                </Typography>
                            )}
                        </motion.div>
                    )}

                    {/* Stats */}
                    <Box sx={{
                        display: 'flex', gap: 4, mt: 5,
                        background: 'white', borderRadius: 3, px: 5, py: 2,
                        border: '1px solid #DBEAFE',
                        boxShadow: '0 2px 12px rgba(37,99,235,0.07)',
                    }}>
                        {[
                            { label: 'Atendidos hoje', value: painel?.concluidos ?? 0, color: '#16A34A' },
                            { label: 'Aguardando', value: painel?.aguardando.length ?? 0, color: '#D97706' },
                            { label: 'Total hoje', value: painel?.totalHoje ?? 0, color: '#2563EB' },
                        ].map(s => (
                            <Box key={s.label} sx={{ textAlign: 'center' }}>
                                <Typography sx={{ fontSize: '2.2rem', fontWeight: 900, color: s.color, lineHeight: 1 }}>
                                    {s.value}
                                </Typography>
                                <Typography sx={{ color: '#94A3B8', fontSize: '0.7rem', mt: 0.3 }}>
                                    {s.label}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>

                {/* ── DIREITA 1 — Próximas fichas + Salas ─────────── */}
                <Box sx={{
                    display: 'flex', flexDirection: 'column', px: 2.5, py: 3, gap: 2,
                    overflowY: 'auto', borderRight: '1px solid #DBEAFE',
                    background: 'white',
                }}>
                    <Typography sx={{ color: '#94A3B8', fontSize: '0.68rem', letterSpacing: 3, textTransform: 'uppercase', fontWeight: 700 }}>
                        Próximas fichas
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                        <AnimatePresence>
                            {(painel?.aguardando ?? []).slice(0, 8).map((f, i) => (
                                <motion.div key={f.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                                    <Box sx={{
                                        display: 'flex', alignItems: 'center', gap: 1.5,
                                        background: i === 0 ? '#F0FDF4' : '#F8FAFC',
                                        border: `1px solid ${i === 0 ? '#BBF7D0' : '#E2E8F0'}`,
                                        borderRadius: 2, px: 2, py: 1.2,
                                    }}>
                                        <Typography sx={{
                                            fontWeight: 900, fontSize: '1.3rem',
                                            color: i === 0 ? '#15803D' : '#334155',
                                            minWidth: 44, fontVariantNumeric: 'tabular-nums',
                                        }}>
                                            {String(f.numero_ficha).padStart(3, '0')}
                                        </Typography>
                                        <Typography sx={{ flex: 1, color: '#475569', fontSize: '0.78rem' }} noWrap>
                                            {f.inscricao?.curso_exame?.nome || f.estacao?.nome || '—'}
                                        </Typography>
                                        {i === 0 && (
                                            <Chip label="PRÓXIMO" size="small" sx={{ background: '#DCFCE7', color: '#15803D', fontWeight: 700, fontSize: '0.58rem', height: 18 }} />
                                        )}
                                    </Box>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {(painel?.aguardando.length ?? 0) === 0 && (
                            <Typography sx={{ color: '#CBD5E1', fontSize: '0.82rem', textAlign: 'center', py: 2 }}>
                                Nenhuma ficha aguardando
                            </Typography>
                        )}
                    </Box>

                    <Divider sx={{ borderColor: '#E2E8F0' }} />

                    <Typography sx={{ color: '#94A3B8', fontSize: '0.68rem', letterSpacing: 3, textTransform: 'uppercase', fontWeight: 700 }}>
                        Status das salas
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                        {(painel?.profissionaisSalas ?? []).map(p => {
                            const isAtivo = p.status === 'trabalhando';
                            const dotColor = isAtivo ? '#16A34A' : '#D97706';
                            return (
                                <Box key={p.id} sx={{
                                    display: 'flex', alignItems: 'center', gap: 1.5,
                                    background: '#F8FAFC', border: '1px solid #E2E8F0',
                                    borderRadius: 2, px: 2, py: 1.2,
                                }}>
                                    <Box sx={{ width: 9, height: 9, borderRadius: '50%', background: dotColor, boxShadow: `0 0 6px ${dotColor}`, flexShrink: 0 }} />
                                    <Box sx={{ flex: 1 }}>
                                        <Typography sx={{ color: '#1E293B', fontSize: '0.82rem', fontWeight: 600, lineHeight: 1.2 }}>
                                            {p.sala}
                                        </Typography>
                                        <Typography sx={{ color: '#94A3B8', fontSize: '0.62rem' }}>{p.medico_nome}</Typography>
                                    </Box>
                                    <Chip
                                        label={isAtivo ? 'Atendendo' : 'Intervalo'}
                                        size="small"
                                        sx={{
                                            background: isAtivo ? '#DCFCE7' : '#FEF3C7',
                                            color: isAtivo ? '#15803D' : '#92400E',
                                            fontWeight: 700, fontSize: '0.6rem', height: 20,
                                        }}
                                    />
                                </Box>
                            );
                        })}
                        {(painel?.profissionaisSalas?.length ?? 0) === 0 && (
                            <Typography sx={{ color: '#CBD5E1', fontSize: '0.82rem', textAlign: 'center', py: 1 }}>
                                Nenhum médico ativo no momento
                            </Typography>
                        )}
                    </Box>
                </Box>

                {/* ── DIREITA 2 — Histórico de senhas chamadas ────── */}
                <Box sx={{
                    display: 'flex', flexDirection: 'column', px: 2.5, py: 3, gap: 1.5,
                    overflowY: 'auto',
                    background: '#F8FAFC',
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography sx={{ color: '#94A3B8', fontSize: '0.68rem', letterSpacing: 3, textTransform: 'uppercase', fontWeight: 700 }}>
                            Histórico de chamadas
                        </Typography>
                    </Box>

                    <AnimatePresence>
                        {historico.length === 0 ? (
                            <Typography sx={{ color: '#CBD5E1', fontSize: '0.82rem', textAlign: 'center', py: 3 }}>
                                Nenhuma chamada ainda
                            </Typography>
                        ) : (
                            historico.map((f, i) => (
                                <motion.div
                                    key={f.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                >
                                    <Box sx={{
                                        display: 'flex', alignItems: 'center', gap: 1.5,
                                        background: i === 0 ? '#EFF6FF' : 'white',
                                        border: `1px solid ${i === 0 ? '#BFDBFE' : '#E2E8F0'}`,
                                        borderRadius: 2, px: 1.8, py: 1,
                                        opacity: 1 - i * 0.07,
                                    }}>
                                        {/* Número */}
                                        <Box sx={{
                                            minWidth: 42, height: 42, borderRadius: '10px', flexShrink: 0,
                                            background: i === 0
                                                ? 'linear-gradient(135deg, #2563EB, #06B6D4)'
                                                : '#E2E8F0',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <Typography sx={{
                                                fontWeight: 900, fontSize: '1rem',
                                                color: i === 0 ? 'white' : '#64748B',
                                                fontVariantNumeric: 'tabular-nums',
                                            }}>
                                                {String(f.numero_ficha).padStart(3, '0')}
                                            </Typography>
                                        </Box>

                                        {/* Dados */}
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography sx={{
                                                fontWeight: 600, fontSize: '0.78rem',
                                                color: i === 0 ? '#1E3A8A' : '#334155',
                                                lineHeight: 1.2,
                                            }} noWrap>
                                                {f.cidadao?.nome_completo || 'Paciente'}
                                            </Typography>
                                            <Typography sx={{ color: '#94A3B8', fontSize: '0.62rem' }} noWrap>
                                                {f.inscricao?.curso_exame?.nome || f.estacao?.nome || '—'}
                                            </Typography>
                                        </Box>

                                        {/* Hora */}
                                        <Typography sx={{
                                            color: i === 0 ? '#2563EB' : '#94A3B8',
                                            fontSize: '0.65rem', fontWeight: i === 0 ? 700 : 400,
                                            flexShrink: 0,
                                        }}>
                                            {fmtHora(f.hora_chamada)}
                                        </Typography>
                                    </Box>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </Box>
            </Box>

            {/* ── FOOTER ─────────────────────────────────────────── */}
            <Box sx={{ textAlign: 'center', py: 1.2, borderTop: '1px solid #DBEAFE', background: 'white' }}>
                <Typography sx={{ color: '#CBD5E1', fontSize: '0.65rem' }}>
                    Sistema Gestão Sobre Rodas — Governo do Maranhão • Atualizado automaticamente a cada 5 segundos
                    {vozAtivada && ' • 🔊 Síntese de voz ativa'}
                </Typography>
            </Box>
        </Box>
    );
}
