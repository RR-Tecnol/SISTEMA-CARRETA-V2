import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Drawer, Box, Typography, TextField, Button, Grid,
    Accordion, AccordionSummary, AccordionDetails, Chip,
    CircularProgress, IconButton, Tooltip, Divider,
} from '@mui/material';
import { ChevronDown, X, Save, Mic, MicOff, Clipboard, Heart, Stethoscope, FileText, Activity } from 'lucide-react';
import { useSnackbar } from 'notistack';
import api from '../../services/api';
import { expressoTheme } from '../../theme/expressoTheme';

// ── Interfaces ────────────────────────────────────────────────────────────────
export interface FichaClinicaData {
    // Anamnese
    queixa_principal: string;
    historia_doenca: string;
    alergias: string;
    medicamentos_uso: string;
    doencas_cronicas: string;
    // Exame físico
    pressao_arterial: string;
    frequencia_cardiaca: string;
    temperatura: string;
    peso: string;
    altura: string;
    spo2: string;
    // Conduta
    diagnostico: string;
    cid: string;
    conduta: string;
    prescricao: string;
    retorno: string;
    observacoes_medico: string;
}

interface FichaClinicaProps {
    open: boolean;
    onClose: () => void;
    atendimentoId: string;
    cidadaoId?: string;
    nomePaciente: string;
    fichaInicial?: Record<string, any>;
    onFinalizar: (ficha: FichaClinicaData, observacoes: string) => void;
}

const FICHA_VAZIA: FichaClinicaData = {
    queixa_principal: '', historia_doenca: '', alergias: '',
    medicamentos_uso: '', doencas_cronicas: '',
    pressao_arterial: '', frequencia_cardiaca: '', temperatura: '',
    peso: '', altura: '', spo2: '',
    diagnostico: '', cid: '', conduta: '', prescricao: '',
    retorno: '', observacoes_medico: '',
};

// ── Componente ────────────────────────────────────────────────────────────────
const FichaClinica: React.FC<FichaClinicaProps> = ({
    open, onClose, atendimentoId, cidadaoId, nomePaciente,
    fichaInicial, onFinalizar,
}) => {
    const { enqueueSnackbar } = useSnackbar();
    const [ficha, setFicha] = useState<FichaClinicaData>({ ...FICHA_VAZIA, ...(fichaInicial as any) });
    const [fichaModificada, setFichaModificada] = useState(false);
    const [gravando, setGravando] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [cidadaoData, setCidadaoData] = useState<any>(null);
    const [historico, setHistorico] = useState<any[]>([]);
    const [loadingHistorico, setLoadingHistorico] = useState(false);
    const [audioLevel, setAudioLevel] = useState(0); // Para o medidor de volume
    const recognitionRef = useRef<any>(null);
    const audioContextRef = useRef<any>(null);
    const analyserRef = useRef<any>(null);
    const microphoneRef = useRef<any>(null);
    const animationFrameRef = useRef<number>(0);

    // Resetar ao abrir
    useEffect(() => {
        if (open) {
            setFicha({ ...FICHA_VAZIA, ...(fichaInicial as any) });
            setFichaModificada(false);
        }
    }, [open, fichaInicial]);

    // Buscar dados do cidadão + histórico
    useEffect(() => {
        if (!open || !cidadaoId) return;
        setLoadingHistorico(true);
        api.get(`/medico-monitoring/cidadao/${cidadaoId}/historico`)
            .then((r) => {
                setCidadaoData(r.data.cidadao);
                setHistorico(r.data.historico || []);
            })
            .catch(() => { /* silencioso */ })
            .finally(() => setLoadingHistorico(false));
    }, [open, cidadaoId]);

    // Atualizar campo
    const handleChange = useCallback((campo: keyof FichaClinicaData, valor: string) => {
        setFicha((prev) => ({ ...prev, [campo]: valor }));
        setFichaModificada(true);
    }, []);

    // Autosave com debounce 3s
    useEffect(() => {
        if (!atendimentoId || !fichaModificada) return;
        const timer = setTimeout(async () => {
            try {
                await api.patch(`/medico-monitoring/atendimento/${atendimentoId}/ficha`, {
                    ficha_clinica: ficha,
                });
            } catch { /* silencioso */ }
        }, 3000);
        return () => clearTimeout(timer);
    }, [ficha, atendimentoId, fichaModificada]);

    // IMC calculado
    const imc = ficha.peso && ficha.altura
        ? (parseFloat(ficha.peso) / Math.pow(parseFloat(ficha.altura) / 100, 2)).toFixed(1)
        : null;
    const imcClass = imc
        ? parseFloat(imc) < 18.5 ? 'Abaixo' : parseFloat(imc) < 25 ? 'Normal' : parseFloat(imc) < 30 ? 'Sobrepeso' : 'Obesidade'
        : null;

    // Gravação de voz — com pedido explícito de permissão
    const iniciarGravacao = async () => {
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            enqueueSnackbar('Navegador não suporta reconhecimento de voz. Use Chrome ou Edge.', { variant: 'warning' });
            return;
        }

        // Medidor de Áudio Local para debugar se o Mic realmente tem volume!
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            audioContextRef.current = new AudioContext();
            analyserRef.current = audioContextRef.current.createAnalyser();
            microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
            microphoneRef.current.connect(analyserRef.current);
            analyserRef.current.fftSize = 256;
            
            const pcmData = new Uint8Array(analyserRef.current.frequencyBinCount);
            const checkAudioLevel = () => {
                if (!analyserRef.current) return;
                analyserRef.current.getByteFrequencyData(pcmData);
                let sum = 0;
                for (let i = 0; i < pcmData.length; i++) { sum += pcmData[i]; }
                setAudioLevel(sum / pcmData.length);
                animationFrameRef.current = requestAnimationFrame(checkAudioLevel);
            };
            checkAudioLevel();
        } catch (e) {
            console.error("Erro no medidor de áudio:", e);
        }

        // Apenas confira o suporte. O navegador gerencia a permissão por conta própria no .start()
        const textoOriginal = ficha.observacoes_medico ? ficha.observacoes_medico + ' ' : '';

        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'pt-BR';
        recognition.continuous = true;
        recognition.interimResults = true; // Exibir em tempo real
        recognition.onresult = (event: any) => {
            let sessionTranscript = '';
            for (let i = 0; i < event.results.length; i++) {
                sessionTranscript += event.results[i][0].transcript;
            }
            
            // O texto final é o que já havia + o transcrito desta sessão
            setFicha((prev) => ({
                ...prev,
                observacoes_medico: textoOriginal + sessionTranscript,
            }));
            setFichaModificada(true);
        };
        recognition.onerror = (event: any) => {
            setGravando(false);
            if (event.error === 'not-allowed') {
                enqueueSnackbar('🎤 Microfone bloqueado. Libere nas configurações do navegador.', { variant: 'error' });
            } else if (event.error === 'no-speech') {
                enqueueSnackbar('Nenhuma fala detectada. Tente novamente.', { variant: 'info' });
            } else {
                enqueueSnackbar(`Erro na gravação: ${event.error}`, { variant: 'warning' });
            }
        };
        recognition.onend = () => {
            setGravando(false);
            cancelAnimationFrame(animationFrameRef.current);
            if (audioContextRef.current) audioContextRef.current.close();
            audioContextRef.current = null;
            analyserRef.current = null;
            microphoneRef.current = null;
            setAudioLevel(0);
        };
        recognitionRef.current = recognition;
        recognition.start();
        setGravando(true);
        enqueueSnackbar('🎤 Gravando... Fale agora!', { variant: 'info', autoHideDuration: 2000 });
    };

    const pararGravacao = () => {
        recognitionRef.current?.stop();
        setGravando(false);
        cancelAnimationFrame(animationFrameRef.current);
        if (audioContextRef.current) audioContextRef.current.close().catch(()=>{});
        audioContextRef.current = null;
        analyserRef.current = null;
        setAudioLevel(0);
    };

    // Salvar manualmente
    const handleSalvar = async () => {
        setSalvando(true);
        try {
            await api.patch(`/medico-monitoring/atendimento/${atendimentoId}/ficha`, {
                ficha_clinica: ficha,
                observacoes: ficha.observacoes_medico || undefined,
            });
            enqueueSnackbar('Prontuário salvo!', { variant: 'success' });
            setFichaModificada(false);
        } catch {
            enqueueSnackbar('Erro ao salvar prontuário', { variant: 'error' });
        } finally {
            setSalvando(false);
        }
    };

    // Finalizar
    const handleFinalizar = async () => {
        await handleSalvar();
        onFinalizar(ficha, ficha.observacoes_medico);
    };

    const formatIdade = (dn: string) => {
        if (!dn) return '';
        const hoje = new Date();
        const nasc = new Date(dn);
        let idade = hoje.getFullYear() - nasc.getFullYear();
        if (hoje.getMonth() < nasc.getMonth() || (hoje.getMonth() === nasc.getMonth() && hoje.getDate() < nasc.getDate())) idade--;
        return `${idade} anos`;
    };

    const formatCpf = (cpf: string) => {
        if (!cpf) return '';
        const c = cpf.replace(/\D/g, '');
        return c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    };

    // ── Estilos compartilhados TextFields ──
    const tfSx = {
        '& .MuiOutlinedInput-root': {
            borderRadius: '10px',
            '&:hover fieldset': { borderColor: expressoTheme.colors.primary },
            '&.Mui-focused fieldset': { borderColor: expressoTheme.colors.primary },
        },
    };

    const sectionHeaderSx = {
        background: 'transparent',
        '&.Mui-expanded': { minHeight: 48 },
        '& .MuiAccordionSummary-content': { my: 1 },
    };

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    width: { xs: '100%', sm: 540 },
                    background: '#f8fafc',
                },
            }}
        >
            {/* ── HEADER ── */}
            <Box sx={{
                background: expressoTheme.gradients.primary,
                p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5,
                position: 'sticky', top: 0, zIndex: 10,
            }}>
                <Clipboard size={22} color="white" />
                <Box sx={{ flex: 1 }}>
                    <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '1rem' }}>
                        📋 Prontuário Eletrônico
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.78rem' }}>
                        {nomePaciente}
                    </Typography>
                </Box>
                <Tooltip title="Salvar">
                    <IconButton onClick={handleSalvar} disabled={salvando}
                        sx={{ color: 'white', '&:hover': { background: 'rgba(255,255,255,0.15)' } }}>
                        {salvando ? <CircularProgress size={18} color="inherit" /> : <Save size={18} />}
                    </IconButton>
                </Tooltip>
                <Tooltip title="Fechar">
                    <IconButton onClick={onClose}
                        sx={{ color: 'white', '&:hover': { background: 'rgba(255,255,255,0.15)' } }}>
                        <X size={18} />
                    </IconButton>
                </Tooltip>
            </Box>

            <Box sx={{ overflowY: 'auto', flex: 1, pb: '100px' }}>

                {/* ── IDENTIFICAÇÃO ── */}
                {cidadaoData && (
                    <Box sx={{ m: 2, p: 2, background: '#e2e8f0', borderRadius: '12px' }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#334155', mb: 1 }}>
                            Identificação do Paciente
                        </Typography>
                        <Grid container spacing={1}>
                            <Grid item xs={8}>
                                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>
                                    {cidadaoData.nome_completo}
                                </Typography>
                            </Grid>
                            <Grid item xs={4}>
                                <Typography sx={{ fontSize: '0.78rem', color: '#475569' }}>
                                    {cidadaoData.data_nascimento ? formatIdade(cidadaoData.data_nascimento) : ''}
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                                    CPF: {formatCpf(cidadaoData.cpf)}
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                                    CNS: {cidadaoData.cartao_sus || 'N/A'}
                                </Typography>
                            </Grid>
                            {cidadaoData.genero && (
                                <Grid item xs={4}>
                                    <Chip label={cidadaoData.genero} size="small"
                                        sx={{ fontSize: '0.7rem', height: 20, background: '#dbeafe', color: '#1e40af' }} />
                                </Grid>
                            )}
                            {cidadaoData.campos_customizados?.alergias && (
                                <Grid item xs={12}>
                                    <Chip label={`⚠️ Alergias: ${cidadaoData.campos_customizados.alergias}`}
                                        size="small" sx={{ fontSize: '0.7rem', background: '#fee2e2', color: '#b91c1c', fontWeight: 700 }} />
                                </Grid>
                            )}
                        </Grid>
                    </Box>
                )}

                {/* ── HISTÓRICO ANTERIOR ── */}
                <Box sx={{ mx: 2 }}>
                    <Accordion defaultExpanded={false} sx={{
                        borderRadius: '12px !important', mb: 1.5, boxShadow: 'none',
                        border: `1px solid ${expressoTheme.colors.borderLight}`,
                        '&::before': { display: 'none' },
                    }}>
                        <AccordionSummary expandIcon={<ChevronDown size={18} />} sx={sectionHeaderSx}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <FileText size={16} color={expressoTheme.colors.primary} />
                                <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: expressoTheme.colors.primaryDark }}>
                                    Histórico Anterior
                                </Typography>
                                <Chip label={historico.length} size="small"
                                    sx={{ height: 18, fontSize: '0.68rem', background: '#e2e8f0', fontWeight: 700 }} />
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ pt: 0 }}>
                            {loadingHistorico ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                                    <CircularProgress size={20} />
                                </Box>
                            ) : historico.length === 0 ? (
                                <Typography sx={{ fontSize: '0.82rem', color: '#94a3b8', textAlign: 'center', py: 1.5 }}>
                                    🩺 Primeiro atendimento
                                </Typography>
                            ) : (
                                historico.map((h: any, i: number) => (
                                    <Accordion key={h.id || i} defaultExpanded={i === 0} sx={{
                                        borderRadius: '8px !important', mb: 1, boxShadow: 'none',
                                        border: '1px solid #e2e8f0', '&::before': { display: 'none' },
                                    }}>
                                        <AccordionSummary expandIcon={<ChevronDown size={15} />} sx={{ minHeight: '40px !important', py: 0 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', pr: 1 }}>
                                                <Box>
                                                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>
                                                        {new Date(h.hora_inicio).toLocaleDateString('pt-BR')} — {new Date(h.hora_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                    </Typography>
                                                    <Typography sx={{ fontSize: '0.68rem', color: '#64748b' }}>
                                                        {h.funcionario?.nome || 'Médico'}{h.funcionario?.crm ? ` • CRM ${h.funcionario.crm}` : ''}
                                                        {h.duracao_minutos ? ` • ${h.duracao_minutos} min` : ''}
                                                    </Typography>
                                                </Box>
                                                {h.ficha_clinica?.diagnostico && (
                                                    <Chip label={h.ficha_clinica.diagnostico.substring(0, 30) + (h.ficha_clinica.diagnostico.length > 30 ? '...' : '')}
                                                        size="small" sx={{ fontSize: '0.65rem', height: 18, background: '#dbeafe', color: '#1e40af', maxWidth: 150 }} />
                                                )}
                                            </Box>
                                        </AccordionSummary>
                                        <AccordionDetails sx={{ pt: 0.5, pb: 1.5 }}>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                                                {/* Queixa */}
                                                {h.ficha_clinica?.queixa_principal && (
                                                    <Box><Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Queixa Principal</Typography>
                                                    <Typography sx={{ fontSize: '0.78rem', color: '#1e293b' }}>{h.ficha_clinica.queixa_principal}</Typography></Box>
                                                )}
                                                {/* Sinais Vitais */}
                                                {(h.ficha_clinica?.pressao_arterial || h.ficha_clinica?.frequencia_cardiaca || h.ficha_clinica?.temperatura || h.ficha_clinica?.spo2) && (
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                                                        {h.ficha_clinica.pressao_arterial && <Chip label={`PA: ${h.ficha_clinica.pressao_arterial}`} size="small" sx={{ fontSize: '0.65rem', height: 18, background: '#fef3c7', color: '#92400e' }} />}
                                                        {h.ficha_clinica.frequencia_cardiaca && <Chip label={`FC: ${h.ficha_clinica.frequencia_cardiaca} bpm`} size="small" sx={{ fontSize: '0.65rem', height: 18, background: '#fee2e2', color: '#b91c1c' }} />}
                                                        {h.ficha_clinica.temperatura && <Chip label={`T: ${h.ficha_clinica.temperatura}°C`} size="small" sx={{ fontSize: '0.65rem', height: 18, background: '#ede9fe', color: '#6d28d9' }} />}
                                                        {h.ficha_clinica.spo2 && <Chip label={`SpO2: ${h.ficha_clinica.spo2}%`} size="small" sx={{ fontSize: '0.65rem', height: 18, background: '#dcfce7', color: '#166534' }} />}
                                                        {h.ficha_clinica.peso && h.ficha_clinica.altura && (
                                                            <Chip label={`${h.ficha_clinica.peso}kg / ${h.ficha_clinica.altura}cm`} size="small" sx={{ fontSize: '0.65rem', height: 18, background: '#f0fdf4', color: '#15803d' }} />
                                                        )}
                                                    </Box>
                                                )}
                                                {/* Diagnóstico */}
                                                {h.ficha_clinica?.diagnostico && (
                                                    <Box><Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Diagnóstico</Typography>
                                                    <Typography sx={{ fontSize: '0.78rem', color: '#1e293b', fontWeight: 600 }}>
                                                        {h.ficha_clinica.diagnostico}{h.ficha_clinica.cid ? ` (CID: ${h.ficha_clinica.cid})` : ''}
                                                    </Typography></Box>
                                                )}
                                                {/* Conduta */}
                                                {h.ficha_clinica?.conduta && (
                                                    <Box><Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Conduta</Typography>
                                                    <Typography sx={{ fontSize: '0.78rem', color: '#475569' }}>{h.ficha_clinica.conduta}</Typography></Box>
                                                )}
                                                {/* Prescrição */}
                                                {h.ficha_clinica?.prescricao && (
                                                    <Box><Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Prescrição</Typography>
                                                    <Typography sx={{ fontSize: '0.78rem', color: '#475569' }}>{h.ficha_clinica.prescricao}</Typography></Box>
                                                )}
                                                {/* Retorno */}
                                                {h.ficha_clinica?.retorno && (
                                                    <Chip label={`Retorno: ${h.ficha_clinica.retorno}`} size="small" sx={{ fontSize: '0.65rem', height: 20, background: '#eff6ff', color: '#1d4ed8', width: 'fit-content' }} />
                                                )}
                                                {/* Observações */}
                                                {h.observacoes && (
                                                    <Box><Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Observações</Typography>
                                                    <Typography sx={{ fontSize: '0.78rem', color: '#475569' }}>{h.observacoes}</Typography></Box>
                                                )}
                                                {h.ficha_clinica?.observacoes_medico && (
                                                    <Box><Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Obs. Médico</Typography>
                                                    <Typography sx={{ fontSize: '0.78rem', color: '#475569' }}>{h.ficha_clinica.observacoes_medico}</Typography></Box>
                                                )}
                                                {/* Nenhum dado */}
                                                {!h.ficha_clinica && !h.observacoes && (
                                                    <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic' }}>Sem dados clínicos registrados neste atendimento.</Typography>
                                                )}
                                            </Box>
                                        </AccordionDetails>
                                    </Accordion>
                                ))
                            )}
                        </AccordionDetails>
                    </Accordion>
                </Box>

                {/* ── ANAMNESE ── */}
                <Box sx={{ mx: 2 }}>
                    <Accordion defaultExpanded sx={{
                        borderRadius: '12px !important', mb: 1.5, boxShadow: 'none',
                        border: `1px solid ${expressoTheme.colors.borderLight}`,
                        '&::before': { display: 'none' },
                    }}>
                        <AccordionSummary expandIcon={<ChevronDown size={18} />} sx={sectionHeaderSx}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Heart size={16} color="#ef4444" />
                                <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: expressoTheme.colors.primaryDark }}>
                                    Anamnese
                                </Typography>
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ pt: 0, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            <TextField fullWidth size="small" label="Queixa Principal *" multiline rows={2}
                                value={ficha.queixa_principal} onChange={(e) => handleChange('queixa_principal', e.target.value)}
                                sx={tfSx} />
                            <TextField fullWidth size="small" label="História da Doença Atual" multiline rows={3}
                                value={ficha.historia_doenca} onChange={(e) => handleChange('historia_doenca', e.target.value)}
                                sx={tfSx} />
                            <TextField fullWidth size="small" label="Alergias conhecidas"
                                value={ficha.alergias} onChange={(e) => handleChange('alergias', e.target.value)}
                                sx={tfSx} placeholder="AINE, Dipirona, Penicilina..." />
                            <TextField fullWidth size="small" label="Medicamentos em uso" multiline rows={2}
                                value={ficha.medicamentos_uso} onChange={(e) => handleChange('medicamentos_uso', e.target.value)}
                                sx={tfSx} placeholder="Losartana 50mg 1x/dia, Metformina 850mg..." />
                            <TextField fullWidth size="small" label="Doenças crônicas"
                                value={ficha.doencas_cronicas} onChange={(e) => handleChange('doencas_cronicas', e.target.value)}
                                sx={tfSx} placeholder="DM, HAS, ICC..." />
                        </AccordionDetails>
                    </Accordion>
                </Box>

                {/* ── EXAME FÍSICO ── */}
                <Box sx={{ mx: 2 }}>
                    <Accordion defaultExpanded sx={{
                        borderRadius: '12px !important', mb: 1.5, boxShadow: 'none',
                        border: `1px solid ${expressoTheme.colors.borderLight}`,
                        '&::before': { display: 'none' },
                    }}>
                        <AccordionSummary expandIcon={<ChevronDown size={18} />} sx={sectionHeaderSx}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Activity size={16} color={expressoTheme.colors.success} />
                                <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: expressoTheme.colors.primaryDark }}>
                                    Exame Físico
                                </Typography>
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ pt: 0 }}>
                            <Grid container spacing={1.5}>
                                <Grid item xs={4}>
                                    <TextField fullWidth size="small" label="PA (mmHg)"
                                        value={ficha.pressao_arterial} onChange={(e) => handleChange('pressao_arterial', e.target.value)}
                                        sx={tfSx} placeholder="120/80" />
                                </Grid>
                                <Grid item xs={4}>
                                    <TextField fullWidth size="small" label="FC (bpm)"
                                        value={ficha.frequencia_cardiaca} onChange={(e) => handleChange('frequencia_cardiaca', e.target.value)}
                                        sx={tfSx} placeholder="72" />
                                </Grid>
                                <Grid item xs={4}>
                                    <TextField fullWidth size="small" label="Temp. (°C)"
                                        value={ficha.temperatura} onChange={(e) => handleChange('temperatura', e.target.value)}
                                        sx={tfSx} placeholder="36.5" />
                                </Grid>
                                <Grid item xs={4}>
                                    <TextField fullWidth size="small" label="Peso (kg)"
                                        value={ficha.peso} onChange={(e) => handleChange('peso', e.target.value)}
                                        sx={tfSx} placeholder="70" />
                                </Grid>
                                <Grid item xs={4}>
                                    <TextField fullWidth size="small" label="Altura (cm)"
                                        value={ficha.altura} onChange={(e) => handleChange('altura', e.target.value)}
                                        sx={tfSx} placeholder="170" />
                                </Grid>
                                <Grid item xs={4}>
                                    <TextField fullWidth size="small" label="SpO2 (%)"
                                        value={ficha.spo2} onChange={(e) => handleChange('spo2', e.target.value)}
                                        sx={tfSx} placeholder="98" />
                                </Grid>
                            </Grid>
                            {imc && (
                                <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Chip
                                        label={`IMC: ${imc} — ${imcClass}`}
                                        size="small"
                                        sx={{
                                            fontWeight: 700, fontSize: '0.75rem',
                                            background: imcClass === 'Normal' ? '#d1fae5' : imcClass === 'Abaixo' ? '#dbeafe' : '#fef3c7',
                                            color: imcClass === 'Normal' ? '#065f46' : imcClass === 'Abaixo' ? '#1e40af' : '#92400e',
                                        }}
                                    />
                                </Box>
                            )}
                        </AccordionDetails>
                    </Accordion>
                </Box>

                {/* ── CONDUTA ── */}
                <Box sx={{ mx: 2 }}>
                    <Accordion defaultExpanded sx={{
                        borderRadius: '12px !important', mb: 1.5, boxShadow: 'none',
                        border: `1px solid ${expressoTheme.colors.borderLight}`,
                        '&::before': { display: 'none' },
                    }}>
                        <AccordionSummary expandIcon={<ChevronDown size={18} />} sx={sectionHeaderSx}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Stethoscope size={16} color="#8b5cf6" />
                                <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: expressoTheme.colors.primaryDark }}>
                                    Conduta
                                </Typography>
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ pt: 0, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            <TextField fullWidth size="small" label="Diagnóstico"
                                value={ficha.diagnostico} onChange={(e) => handleChange('diagnostico', e.target.value)}
                                sx={tfSx} />
                            <TextField fullWidth size="small" label="CID-10"
                                value={ficha.cid} onChange={(e) => handleChange('cid', e.target.value)}
                                sx={tfSx} placeholder="Ex: J06.9, I10, E11.9" />
                            <TextField fullWidth size="small" label="Conduta / Procedimento" multiline rows={2}
                                value={ficha.conduta} onChange={(e) => handleChange('conduta', e.target.value)}
                                sx={tfSx} />
                            <TextField fullWidth size="small" label="Prescrição" multiline rows={3}
                                value={ficha.prescricao} onChange={(e) => handleChange('prescricao', e.target.value)}
                                sx={tfSx} placeholder="Medicamento, dose, via, frequência..." />
                            <TextField fullWidth size="small" label="Retorno em"
                                value={ficha.retorno} onChange={(e) => handleChange('retorno', e.target.value)}
                                sx={tfSx} placeholder="30 dias, 1 semana, se necessário..." />
                        </AccordionDetails>
                    </Accordion>
                </Box>

                {/* ── OBSERVAÇÕES + VOZ ── */}
                <Box sx={{ mx: 2, mb: 2 }}>
                    <Box sx={{
                        background: 'white', borderRadius: '12px', p: 2,
                        border: `1px solid ${expressoTheme.colors.borderLight}`,
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                            <Mic size={16} color={expressoTheme.colors.primary} />
                            <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: expressoTheme.colors.primaryDark }}>
                                Observações com Gravação de Voz
                            </Typography>
                        </Box>
                        <TextField fullWidth size="small" multiline rows={4}
                            label="Observações livres"
                            value={ficha.observacoes_medico}
                            onChange={(e) => handleChange('observacoes_medico', e.target.value)}
                            sx={tfSx}
                        />
                        <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
                            {!gravando ? (
                                <Button
                                    variant="outlined" size="small"
                                    startIcon={<Mic size={14} />}
                                    onClick={iniciarGravacao}
                                    sx={{
                                        textTransform: 'none', fontWeight: 600,
                                        borderColor: expressoTheme.colors.primary,
                                        color: expressoTheme.colors.primary,
                                        borderRadius: '8px',
                                        '&:hover': { background: '#eff6ff' },
                                    }}
                                >
                                    🎤 Iniciar Gravação
                                </Button>
                            ) : (
                                <Button
                                    variant="contained" size="small"
                                    startIcon={<MicOff size={14} />}
                                    onClick={pararGravacao}
                                    sx={{
                                        textTransform: 'none', fontWeight: 600,
                                        background: '#ef4444', borderRadius: '8px',
                                        animation: 'pulse 1.5s ease-in-out infinite',
                                        '@keyframes pulse': {
                                            '0%,100%': { boxShadow: '0 0 0 0 rgba(239,68,68,0.4)' },
                                            '50%': { boxShadow: '0 0 0 8px rgba(239,68,68,0)' },
                                        },
                                        '&:hover': { background: '#dc2626' },
                                    }}
                                >
                                    🔴 Parar Gravação
                                </Button>
                            )}
                            {gravando && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Chip label={audioLevel > 5 ? "Captando volume..." : "Sem som..."} size="small"
                                        sx={{ background: audioLevel > 5 ? '#dcfce7' : '#fef2f2', color: audioLevel > 5 ? '#166534' : '#b91c1c', fontWeight: 600 }} />
                                    {/* Barra visual de volume do microfone */}
                                    <Box sx={{ width: '50px', height: '10px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                        <Box sx={{ width: `${Math.min(100, Math.round(audioLevel))}%`, height: '100%', background: audioLevel > 5 ? '#22c55e' : '#ef4444', transition: 'width 0.1s linear' }} />
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    </Box>
                </Box>

                <Divider sx={{ mx: 2 }} />

                {/* Indicador de autosave */}
                {fichaModificada && (
                    <Typography sx={{ textAlign: 'center', fontSize: '0.7rem', color: '#94a3b8', mt: 1 }}>
                        💾 Salvamento automático em 3 segundos...
                    </Typography>
                )}
            </Box>

            {/* ── FOOTER FIXO ── */}
            <Box sx={{
                position: 'sticky', bottom: 0, background: 'white',
                borderTop: '1px solid #e2e8f0', p: 2,
                display: 'flex', gap: 1.5, zIndex: 10,
            }}>
                <Button
                    variant="outlined" fullWidth
                    startIcon={salvando ? <CircularProgress size={14} color="inherit" /> : <Save size={14} />}
                    onClick={handleSalvar}
                    disabled={salvando}
                    sx={{
                        textTransform: 'none', fontWeight: 600,
                        borderRadius: '10px', borderColor: expressoTheme.colors.primary,
                        color: expressoTheme.colors.primary,
                    }}
                >
                    Salvar Rascunho
                </Button>
                <Button
                    variant="contained" fullWidth
                    startIcon={<Stethoscope size={14} />}
                    onClick={handleFinalizar}
                    sx={{
                        textTransform: 'none', fontWeight: 700,
                        borderRadius: '10px',
                        background: expressoTheme.gradients.primary,
                        boxShadow: expressoTheme.shadows.button,
                    }}
                >
                    Finalizar Consulta
                </Button>
            </Box>
        </Drawer>
    );
};

export default FichaClinica;
