/**
 * PainelChamada.tsx — Painel público de chamada de fichas (TV/Telão)
 * Rota: /painel/:acao_id — sem autenticação
 * Design: Light, profissional, Full HD — com histórico de chamadas
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Chip, Divider } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

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
    totalHoje: number;
    concluidos: number;
    nomeAcao: string;
}

const STATUS_DOT: Record<string, string> = {
    ativa: '#16A34A',
    pausada: '#D97706',
    manutencao: '#DC2626',
};

const fmtHora = (iso?: string) =>
    iso ? new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';

export default function PainelChamada() {
    const { acao_id } = useParams<{ acao_id: string }>();
    const [painel, setPainel] = useState<PainelData | null>(null);
    const [prevFicha, setPrevFicha] = useState<number | null>(null);
    const [hora, setHora] = useState(new Date());
    const [flashActive, setFlashActive] = useState(false);
    const [historico, setHistorico] = useState<FichaPublica[]>([]);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const fetchPainel = useCallback(async () => {
        if (!acao_id) return;
        try {
            const { data } = await axios.get(`${API}/fichas/painel/${acao_id}`);
            setPainel(data);

            // Atualizar histórico com fichas chamadas/em_atendimento/concluidas
            if (data.chamadas?.length) {
                setHistorico(data.chamadas.slice(0, 12));
            }

            if (data.ultimaChamada && data.ultimaChamada.numero_ficha !== prevFicha) {
                setPrevFicha(data.ultimaChamada.numero_ficha);
                setFlashActive(true);
                setTimeout(() => setFlashActive(false), 2000);
                audioRef.current?.play().catch(() => {});
            }
        } catch {
            // silencioso
        }
    }, [acao_id, prevFicha]);

    useEffect(() => {
        fetchPainel();
        const interval = setInterval(fetchPainel, 5000);
        return () => clearInterval(interval);
    }, [fetchPainel]);

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
                <Box sx={{ textAlign: 'right' }}>
                    <Typography sx={{ color: '#1E3A8A', fontWeight: 800, fontSize: '2.1rem', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                        {horaStr}
                    </Typography>
                    <Typography sx={{ color: '#64748B', fontSize: '0.72rem', textTransform: 'capitalize' }}>
                        {dataStr}
                    </Typography>
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
                                <Typography sx={{ color: '#475569', fontSize: '1rem', mt: 1 }}>
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
                        {(painel?.estacoes ?? []).map(e => (
                            <Box key={e.id} sx={{
                                display: 'flex', alignItems: 'center', gap: 1.5,
                                background: '#F8FAFC', border: '1px solid #E2E8F0',
                                borderRadius: 2, px: 2, py: 1.2,
                            }}>
                                <Box sx={{ width: 9, height: 9, borderRadius: '50%', background: STATUS_DOT[e.status] ?? '#16A34A', boxShadow: `0 0 6px ${STATUS_DOT[e.status] ?? '#16A34A'}`, flexShrink: 0 }} />
                                <Box sx={{ flex: 1 }}>
                                    <Typography sx={{ color: '#1E293B', fontSize: '0.82rem', fontWeight: 600, lineHeight: 1.2 }}>
                                        {e.nome}
                                    </Typography>
                                    {e.curso_exame?.nome && (
                                        <Typography sx={{ color: '#94A3B8', fontSize: '0.62rem' }}>{e.curso_exame.nome}</Typography>
                                    )}
                                </Box>
                                <Chip
                                    label={e.status === 'ativa' ? 'Ativa' : e.status === 'pausada' ? 'Pausada' : 'Manutenção'}
                                    size="small"
                                    sx={{
                                        background: e.status === 'ativa' ? '#DCFCE7' : e.status === 'pausada' ? '#FEF3C7' : '#FEE2E2',
                                        color: e.status === 'ativa' ? '#15803D' : e.status === 'pausada' ? '#92400E' : '#991B1B',
                                        fontWeight: 700, fontSize: '0.6rem', height: 20,
                                    }}
                                />
                            </Box>
                        ))}
                        {(painel?.estacoes.length ?? 0) === 0 && (
                            <Typography sx={{ color: '#CBD5E1', fontSize: '0.82rem', textAlign: 'center', py: 1 }}>
                                Nenhuma sala configurada
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
                </Typography>
            </Box>
        </Box>
    );
}
