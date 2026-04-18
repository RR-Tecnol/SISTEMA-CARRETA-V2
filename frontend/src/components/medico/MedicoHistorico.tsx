/**
 * MedicoHistorico.tsx — Histórico clínico de atendimentos com cards clicáveis
 * Exibe todos os campos preenchidos pelo médico em um modal de detalhes
 */
import { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Paper, TextField, Button, Chip, CircularProgress,
    Dialog, DialogTitle, DialogContent, DialogActions, Divider, Grid, IconButton,
} from '@mui/material';
import {
    Search, X, FileText, Clock, Stethoscope, Activity, ChevronRight,
} from 'lucide-react';
import { expressoTheme } from '../../theme/expressoTheme';
import api from '../../services/api';

interface AtendimentoHistorico {
    id: string;
    hora_inicio: string;
    hora_conclusao?: string;
    duracao_minutos?: number;
    status: string;
    nome_paciente?: string;
    observacoes?: string;
    ficha_clinica?: Record<string, any>;
    cidadao?: { nome_completo: string; cpf?: string; data_nascimento?: string; cartao_sus?: string; genero?: string; };
    funcionario?: { nome: string; crm?: string; };
    acao?: { nome?: string; numero_acao?: number; cursos?: { nome: string }[]; };
}

const LABEL_MAP: Record<string, string> = {
    queixa_principal: 'Queixa Principal',
    historia_doenca: 'História da Doença',
    alergias: 'Alergias',
    medicamentos_uso: 'Medicamentos em uso',
    doencas_cronicas: 'Doenças crônicas',
    pressao_arterial: 'PA (mmHg)',
    frequencia_cardiaca: 'FC (bpm)',
    temperatura: 'Temperatura (°C)',
    peso: 'Peso (kg)',
    altura: 'Altura (cm)',
    spo2: 'SpO2 (%)',
    diagnostico: 'Diagnóstico',
    cid: 'CID',
    conduta: 'Conduta',
    prescricao: 'Prescrição',
    retorno: 'Retorno',
    observacoes_medico: 'Observações do Médico',
};

const VITAL_KEYS = ['pressao_arterial', 'frequencia_cardiaca', 'temperatura', 'spo2', 'peso', 'altura'];
const ANAMNESE_KEYS = ['queixa_principal', 'historia_doenca', 'alergias', 'medicamentos_uso', 'doencas_cronicas'];
const CONDUTA_KEYS = ['diagnostico', 'cid', 'conduta', 'prescricao', 'retorno', 'observacoes_medico'];

const vitalColor: Record<string, { bg: string; text: string }> = {
    pressao_arterial: { bg: '#fef3c7', text: '#92400e' },
    frequencia_cardiaca: { bg: '#fee2e2', text: '#b91c1c' },
    temperatura: { bg: '#ede9fe', text: '#6d28d9' },
    spo2: { bg: '#dcfce7', text: '#166534' },
    peso: { bg: '#f0fdf4', text: '#15803d' },
    altura: { bg: '#eff6ff', text: '#1d4ed8' },
};

const fmtHora = (iso?: string) =>
    iso ? new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—';
const fmtData = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

export default function MedicoHistorico({ user, acaoId }: { user: any; acaoId?: string }) {
    const [historico, setHistorico] = useState<AtendimentoHistorico[]>([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState<AtendimentoHistorico | null>(null);
    const [filtros, setFiltros] = useState({
        data_inicio: new Date().toISOString().split('T')[0],
        data_fim: new Date().toISOString().split('T')[0],
        busca: '',
    });

    const carregarHistorico = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/medico-monitoring/historico', {
                params: { ...filtros, acao_id: acaoId, funcionario_id: user?.id },
            });
            setHistorico(Array.isArray(data) ? data : []);
        } catch {
            setHistorico([]);
        } finally {
            setLoading(false);
        }
    }, [filtros.data_inicio, filtros.data_fim, filtros.busca, acaoId, user?.id]);

    useEffect(() => { carregarHistorico(); }, [filtros.data_inicio, filtros.data_fim]);

    const hasAnyValue = (obj: Record<string, any> | undefined, keys: string[]) =>
        obj && keys.some(k => obj[k]);

    return (
        <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: expressoTheme.colors.primaryDark, mb: 2 }}>
                📋 Histórico Clínico de Atendimentos
            </Typography>

            {/* Filtros */}
            <Paper sx={{ p: 2, mb: 3, borderRadius: expressoTheme.borderRadius.medium, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', border: `1px solid ${expressoTheme.colors.border}`, boxShadow: 'none' }}>
                <TextField label="Data Início" type="date" size="small" value={filtros.data_inicio}
                    onChange={(e) => setFiltros({ ...filtros, data_inicio: e.target.value })}
                    InputLabelProps={{ shrink: true }} sx={{ width: 150 }} />
                <TextField label="Data Fim" type="date" size="small" value={filtros.data_fim}
                    onChange={(e) => setFiltros({ ...filtros, data_fim: e.target.value })}
                    InputLabelProps={{ shrink: true }} sx={{ width: 150 }} />
                <TextField label="Buscar" size="small" placeholder="Nome do paciente..."
                    value={filtros.busca} onChange={(e) => setFiltros({ ...filtros, busca: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && carregarHistorico()}
                    InputProps={{ endAdornment: <Search size={15} color={expressoTheme.colors.textSecondary} /> }}
                    sx={{ minWidth: 200 }} />
                <Button variant="contained" onClick={carregarHistorico} startIcon={<Search size={16} />}
                    sx={{ background: expressoTheme.gradients.primary, textTransform: 'none', fontWeight: 600 }}>
                    Filtrar
                </Button>
                <Chip label={`${historico.length} atendimento${historico.length !== 1 ? 's' : ''}`}
                    size="small" sx={{ ml: 'auto', fontWeight: 700, background: expressoTheme.colors.background }} />
            </Paper>

            {/* Cards */}
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                    <CircularProgress size={32} />
                </Box>
            ) : historico.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8, color: expressoTheme.colors.textSecondary }}>
                    <FileText size={48} style={{ opacity: 0.3 }} />
                    <Typography sx={{ mt: 1.5 }}>Nenhum atendimento encontrado neste período.</Typography>
                </Box>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {historico.map((row) => {
                        const fc = row.ficha_clinica;
                        const nomePaciente = row.cidadao?.nome_completo || row.nome_paciente || 'Paciente';
                        const exame = row.acao?.cursos?.[0]?.nome || 'Consulta';
                        const temDados = fc && Object.values(fc).some(v => v && String(v).trim());

                        return (
                            <Paper
                                key={row.id}
                                onClick={() => setSelected(row)}
                                elevation={0}
                                sx={{
                                    p: 2, cursor: 'pointer',
                                    border: `1px solid ${expressoTheme.colors.border}`,
                                    borderRadius: expressoTheme.borderRadius.medium,
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        borderColor: expressoTheme.colors.primary,
                                        background: `${expressoTheme.colors.primary}05`,
                                        transform: 'translateY(-1px)',
                                        boxShadow: expressoTheme.shadows.card,
                                    },
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    {/* Ícone status */}
                                    <Box sx={{
                                        width: 44, height: 44, borderRadius: '12px', flexShrink: 0,
                                        background: row.status === 'concluido'
                                            ? 'linear-gradient(135deg, #1ABC9C, #16A085)'
                                            : 'linear-gradient(135deg, #E74C3C, #C0392B)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <Stethoscope size={20} color="white" />
                                    </Box>

                                    {/* Info principal */}
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography sx={{ fontWeight: 700, fontSize: '0.92rem', color: expressoTheme.colors.text }} noWrap>
                                            {nomePaciente}
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mt: 0.3 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                                                <Clock size={12} color={expressoTheme.colors.textSecondary} />
                                                <Typography sx={{ fontSize: '0.72rem', color: expressoTheme.colors.textSecondary }}>
                                                    {fmtData(row.hora_inicio)} às {fmtHora(row.hora_inicio)}
                                                    {row.duracao_minutos ? ` · ${row.duracao_minutos} min` : ''}
                                                </Typography>
                                            </Box>
                                            <Chip label={exame} size="small"
                                                sx={{ height: 18, fontSize: '0.62rem', background: '#EDE7F6', color: '#6D28D9' }} />
                                            {fc?.diagnostico && (
                                                <Chip label={fc.diagnostico.substring(0, 25) + (fc.diagnostico.length > 25 ? '...' : '')}
                                                    size="small" sx={{ height: 18, fontSize: '0.62rem', background: '#DBEAFE', color: '#1E40AF' }} />
                                            )}
                                        </Box>
                                    </Box>

                                    {/* Badges */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                                        {temDados && (
                                            <Chip label="Dados clínicos" size="small" icon={<Activity size={11} />}
                                                sx={{ height: 20, fontSize: '0.62rem', background: '#DCFCE7', color: '#166534', '& .MuiChip-icon': { color: '#166534' } }} />
                                        )}
                                        <Chip label={row.status === 'concluido' ? 'Concluído ✓' : 'Cancelado'}
                                            size="small" color={row.status === 'concluido' ? 'success' : 'error'} variant="outlined"
                                            sx={{ height: 22, fontSize: '0.65rem', fontWeight: 700 }} />
                                        <ChevronRight size={18} color={expressoTheme.colors.textSecondary} />
                                    </Box>
                                </Box>
                            </Paper>
                        );
                    })}
                </Box>
            )}

            {/* ── Modal de Detalhes ── */}
            <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="md" fullWidth
                PaperProps={{ sx: { borderRadius: expressoTheme.borderRadius.large } }}>
                {selected && (
                    <>
                        <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                                <Typography sx={{ fontWeight: 800, color: expressoTheme.colors.primaryDark }}>
                                    🩺 {selected.cidadao?.nome_completo || selected.nome_paciente || 'Paciente'}
                                </Typography>
                                <Typography sx={{ fontSize: '0.8rem', color: expressoTheme.colors.textSecondary }}>
                                    {fmtData(selected.hora_inicio)} às {fmtHora(selected.hora_inicio)}
                                    {selected.hora_conclusao ? ` → ${fmtHora(selected.hora_conclusao)}` : ''}
                                    {selected.duracao_minutos ? ` · ${selected.duracao_minutos} min` : ''}
                                    {selected.funcionario?.nome ? ` · Dr. ${selected.funcionario.nome}` : ''}
                                    {selected.funcionario?.crm ? ` (CRM ${selected.funcionario.crm})` : ''}
                                </Typography>
                            </Box>
                            <IconButton onClick={() => setSelected(null)}><X size={20} /></IconButton>
                        </DialogTitle>
                        <Divider />
                        <DialogContent sx={{ pt: 2 }}>
                            {/* Dados do paciente */}
                            {selected.cidadao && (
                                <Box sx={{ mb: 2, p: 1.5, borderRadius: '8px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', mb: 0.5 }}>
                                        Dados do Paciente
                                    </Typography>
                                    <Grid container spacing={1}>
                                        {selected.cidadao.cpf && <Grid item xs={6} sm={3}><Typography sx={{ fontSize: '0.78rem', color: '#1E293B' }}>CPF: {selected.cidadao.cpf}</Typography></Grid>}
                                        {selected.cidadao.data_nascimento && <Grid item xs={6} sm={3}><Typography sx={{ fontSize: '0.78rem', color: '#1E293B' }}>Nasc.: {fmtData(selected.cidadao.data_nascimento)}</Typography></Grid>}
                                        {selected.cidadao.cartao_sus && <Grid item xs={6} sm={3}><Typography sx={{ fontSize: '0.78rem', color: '#1E293B' }}>CNS: {selected.cidadao.cartao_sus}</Typography></Grid>}
                                        {selected.cidadao.genero && <Grid item xs={6} sm={3}><Typography sx={{ fontSize: '0.78rem', color: '#1E293B', textTransform: 'capitalize' }}>Gênero: {selected.cidadao.genero}</Typography></Grid>}
                                    </Grid>
                                </Box>
                            )}

                            {/* Sinais Vitais */}
                            {selected.ficha_clinica && hasAnyValue(selected.ficha_clinica, VITAL_KEYS) && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', mb: 1 }}>
                                        Sinais Vitais
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        {VITAL_KEYS.filter(k => selected.ficha_clinica![k]).map(k => (
                                            <Chip key={k}
                                                label={`${LABEL_MAP[k]}: ${selected.ficha_clinica![k]}`}
                                                size="small"
                                                sx={{
                                                    background: vitalColor[k]?.bg || '#F1F5F9',
                                                    color: vitalColor[k]?.text || '#334155',
                                                    fontWeight: 600, fontSize: '0.72rem', height: 24,
                                                }} />
                                        ))}
                                    </Box>
                                </Box>
                            )}

                            {/* Anamnese */}
                            {selected.ficha_clinica && hasAnyValue(selected.ficha_clinica, ANAMNESE_KEYS) && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', mb: 1 }}>
                                        Anamnese
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        {ANAMNESE_KEYS.filter(k => selected.ficha_clinica![k]).map(k => (
                                            <Box key={k}>
                                                <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#94A3B8' }}>{LABEL_MAP[k]}</Typography>
                                                <Typography sx={{ fontSize: '0.82rem', color: '#1E293B' }}>{selected.ficha_clinica![k]}</Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                            )}

                            {/* Conduta e Diagnóstico */}
                            {selected.ficha_clinica && hasAnyValue(selected.ficha_clinica, CONDUTA_KEYS) && (
                                <Box sx={{ mb: 2, p: 1.5, borderRadius: '8px', background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase', mb: 1 }}>
                                        Conduta Médica
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        {CONDUTA_KEYS.filter(k => selected.ficha_clinica![k]).map(k => (
                                            <Box key={k}>
                                                <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#166534', opacity: 0.8 }}>{LABEL_MAP[k]}</Typography>
                                                <Typography sx={{ fontSize: '0.82rem', color: '#14532D', fontWeight: k === 'diagnostico' ? 700 : 400 }}>
                                                    {selected.ficha_clinica![k]}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                            )}

                            {/* Observações do Atendimento */}
                            {selected.observacoes && (
                                <Box sx={{ p: 1.5, borderRadius: '8px', background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#92400E', textTransform: 'uppercase', mb: 0.5 }}>
                                        Observações do Atendimento
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.82rem', color: '#78350F' }}>{selected.observacoes}</Typography>
                                </Box>
                            )}

                            {/* Sem dados */}
                            {!selected.ficha_clinica && !selected.observacoes && (
                                <Typography sx={{ textAlign: 'center', color: '#94A3B8', py: 3, fontStyle: 'italic' }}>
                                    Nenhum dado clínico foi registrado neste atendimento.
                                </Typography>
                            )}
                        </DialogContent>
                        <DialogActions sx={{ px: 3, pb: 2 }}>
                            <Button onClick={() => setSelected(null)} sx={{ textTransform: 'none' }}>Fechar</Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </Box>
    );
}
