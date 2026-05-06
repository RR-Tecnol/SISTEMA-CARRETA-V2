import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Container, Paper, CircularProgress, Accordion,
    AccordionSummary, AccordionDetails, IconButton, Tooltip, Chip,
    Button
} from '@mui/material';
import { Stethoscope, ChevronDown, FileDown, Download, Paperclip, FileText, ExternalLink } from 'lucide-react';
import api, { BASE_URL } from '../../services/api';
import { systemTruckTheme } from '../../theme/systemTruckTheme';
import { gerarPdfResultado } from '../../utils/gerarPdfResultado';

const MeusExames: React.FC = () => {
    const [atendimentos, setAtendimentos] = useState<any[]>([]);
    const [laudos, setLaudos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [paciente, setPaciente] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [atdRes, meRes] = await Promise.allSettled([
                    api.get('/medico-monitoring/meus-atendimentos'),
                    api.get('/cidadaos/me'),
                ]);

                if (atdRes.status === 'fulfilled') setAtendimentos(atdRes.value.data);
                if (meRes.status === 'fulfilled') {
                    const me = meRes.value.data;
                    setPaciente(me);
                    // Buscar laudos usando o ID do cidadão
                    try {
                        const laudosRes = await api.get(`/cidadaos/${me.id}/laudos`);
                        setLaudos(Array.isArray(laudosRes.data) ? laudosRes.data : []);
                    } catch { /* sem laudos */ }
                }
            } catch { /* silently */ }
            finally { setLoading(false); }
        };
        fetchData();
    }, []);

    const formatData = (iso: string) => {
        if (!iso) return '—';
        return new Date(iso).toLocaleDateString('pt-BR');
    };

    const handleDownloadAll = () => {
        if (!atendimentos.length) return;
        const nomePaciente = paciente?.nome_completo || 'Paciente';
        gerarPdfResultado(atendimentos, paciente || {}, `resultados-${nomePaciente.replace(/\s+/g, '-')}.pdf`);
    };

    const handleDownloadOne = (atd: any) => {
        const nomePaciente = paciente?.nome_completo || 'Paciente';
        const data = new Date(atd.hora_inicio).toLocaleDateString('pt-BR').replace(/\//g, '-');
        gerarPdfResultado([atd], paciente || {}, `resultado-${nomePaciente.replace(/\s+/g, '-')}-${data}.pdf`);
    };


    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            {/* Cabeçalho */}
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                        <Box sx={{ p: 1, background: systemTruckTheme.gradients.primary, borderRadius: '8px', display: 'flex', color: 'white' }}>
                            <Stethoscope size={24} />
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 900, color: systemTruckTheme.colors.primaryDark }}>
                            Meu Histórico Médico
                        </Typography>
                    </Box>
                    <Typography sx={{ color: systemTruckTheme.colors.textSecondary, fontSize: '0.9rem' }}>
                        Resultados, prontuários e laudos dos seus atendimentos
                    </Typography>
                </Box>
                {atendimentos.length > 0 && (
                    <Tooltip title="Baixar todos os resultados em PDF">
                        <Button
                            id="btn-baixar-todos-resultados"
                            variant="outlined"
                            startIcon={<Download size={16} />}
                            onClick={handleDownloadAll}
                            sx={{
                                borderColor: systemTruckTheme.colors.primary,
                                color: systemTruckTheme.colors.primary,
                                textTransform: 'none',
                                fontWeight: 700,
                                borderRadius: '10px',
                                display: { xs: 'none', sm: 'flex' },
                                '&:hover': { background: 'rgba(14,165,233,0.06)' },
                            }}
                        >
                            Baixar Todos
                        </Button>
                    </Tooltip>
                )}
            </Box>

            {loading ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* ── ATENDIMENTOS ── */}
                    {atendimentos.length === 0 ? (
                        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: '16px', background: '#f8fafc', border: '1px dashed #cbd5e1' }}>
                            <Stethoscope size={48} color="#94a3b8" style={{ marginBottom: 16 }} />
                            <Typography sx={{ color: '#475569', fontWeight: 600, fontSize: '1.1rem', mb: 1 }}>
                                Nenhum atendimento registrado ainda
                            </Typography>
                            <Typography sx={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                                Após ser atendido, seus resultados aparecerão aqui.
                            </Typography>
                        </Paper>
                    ) : (
                        atendimentos.map((atd) => {
                            const f = atd.ficha_clinica || {};
                            const temFicha = Object.keys(f).length > 0;
                            const data = formatData(atd.hora_inicio);

                            return (
                                <Paper key={atd.id} sx={{
                                    borderRadius: '14px',
                                    border: `1px solid ${systemTruckTheme.colors.border}`,
                                    overflow: 'hidden',
                                }}>
                                    {/* Header do Card */}
                                    <Box sx={{
                                        p: 2.5,
                                        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                                        borderBottom: `1px solid ${systemTruckTheme.colors.border}`,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                    }}>
                                        <Box>
                                            <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#1e293b', mb: 0.5 }}>
                                                🏥 {atd.acao?.nome || 'Ação'}
                                            </Typography>
                                            <Typography sx={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 500 }}>
                                                {data}{atd.acao?.municipio ? ` · ${atd.acao.municipio}` : ''}
                                            </Typography>
                                            <Typography sx={{ fontSize: '0.82rem', color: '#475569', fontWeight: 500, mt: 0.5 }}>
                                                👨‍⚕️ {atd.funcionario?.nome || '—'}
                                                {atd.funcionario?.especialidade ? ` · ${atd.funcionario.especialidade}` : ''}
                                                {atd.funcionario?.crm ? ` · CRM: ${atd.funcionario.crm}` : ''}
                                            </Typography>
                                        </Box>
                                        <Tooltip title="Baixar este resultado em PDF">
                                            <IconButton
                                                id={`btn-baixar-resultado-${atd.id}`}
                                                onClick={() => handleDownloadOne(atd)}
                                                sx={{
                                                    background: systemTruckTheme.colors.primary,
                                                    color: 'white',
                                                    borderRadius: '10px',
                                                    p: 1,
                                                    '&:hover': {
                                                        background: systemTruckTheme.colors.primaryDark,
                                                        transform: 'scale(1.05)',
                                                    },
                                                    transition: 'all 0.2s',
                                                }}
                                            >
                                                <FileDown size={20} />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>

                                    {/* Resumo de Resultados */}
                                    <Box sx={{ p: 2.5 }}>
                                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                                            <Box>
                                                <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>
                                                    📋 Diagnóstico
                                                </Typography>
                                                <Typography sx={{ fontSize: '0.9rem', color: '#1e293b', fontWeight: 600 }}>
                                                    {f.diagnostico || '—'}
                                                </Typography>
                                            </Box>
                                            <Box>
                                                <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>
                                                    🏷️ CID-10
                                                </Typography>
                                                <Chip
                                                    label={f.cid || '—'}
                                                    size="small"
                                                    sx={{
                                                        fontWeight: 700,
                                                        background: f.cid ? '#dbeafe' : '#f1f5f9',
                                                        color: f.cid ? '#1d4ed8' : '#94a3b8',
                                                    }}
                                                />
                                            </Box>
                                            <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}>
                                                <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>
                                                    💊 Prescrição
                                                </Typography>
                                                <Typography sx={{ fontSize: '0.9rem', color: '#1e293b', fontWeight: 500, whiteSpace: 'pre-line' }}>
                                                    {f.prescricao || '—'}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}>
                                                <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>
                                                    🔄 Retorno / Orientações
                                                </Typography>
                                                <Typography sx={{ fontSize: '0.9rem', color: '#1e293b', fontWeight: 500 }}>
                                                    {f.retorno || '—'}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>

                                    {/* Prontuário Completo (Accordion) */}
                                    {(temFicha || atd.observacoes) && (
                                        <Accordion disableGutters elevation={0} sx={{
                                            '&:before': { display: 'none' },
                                            borderTop: `1px solid ${systemTruckTheme.colors.border}`,
                                        }}>
                                            <AccordionSummary expandIcon={<ChevronDown size={18} />} sx={{ background: '#f8fafc', minHeight: 48, '& .MuiAccordionSummary-content': { my: 0 } }}>
                                                <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#3b82f6' }}>
                                                    Ver prontuário completo
                                                </Typography>
                                            </AccordionSummary>
                                            <AccordionDetails sx={{ p: 2.5, background: '#fafafa' }}>
                                                {temFicha && (
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                                                        {f.pressao_arterial && <Typography sx={{ fontSize: '0.85rem' }}><strong>PA:</strong> {f.pressao_arterial}</Typography>}
                                                        {f.fc && <Typography sx={{ fontSize: '0.85rem' }}><strong>FC:</strong> {f.fc}</Typography>}
                                                        {f.t && <Typography sx={{ fontSize: '0.85rem' }}><strong>Temp:</strong> {f.t}</Typography>}
                                                        {f.peso && <Typography sx={{ fontSize: '0.85rem' }}><strong>Peso:</strong> {f.peso}kg</Typography>}
                                                        {f.altura && <Typography sx={{ fontSize: '0.85rem' }}><strong>Altura:</strong> {f.altura}cm</Typography>}
                                                        {f.peso && f.altura && (
                                                            <Typography sx={{ fontSize: '0.85rem' }}>
                                                                <strong>IMC:</strong> {(Number(f.peso) / Math.pow(Number(f.altura) / 100, 2)).toFixed(1)}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                )}
                                                {f.queixa_principal && (
                                                    <Box sx={{ mb: 2 }}>
                                                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', mb: 0.5 }}>Queixa Principal</Typography>
                                                        <Typography sx={{ fontSize: '0.9rem', color: '#334155' }}>{f.queixa_principal}</Typography>
                                                    </Box>
                                                )}
                                                {atd.observacoes && (
                                                    <Box sx={{ mb: 2 }}>
                                                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', mb: 0.5 }}>Observações do Médico</Typography>
                                                        <Typography sx={{ fontSize: '0.9rem', color: '#334155', whiteSpace: 'pre-wrap' }}>{atd.observacoes}</Typography>
                                                    </Box>
                                                )}
                                                {f.conduta && (
                                                    <Box>
                                                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', mb: 0.5 }}>Conduta</Typography>
                                                        <Typography sx={{ fontSize: '0.9rem', color: '#334155', whiteSpace: 'pre-wrap' }}>{f.conduta}</Typography>
                                                    </Box>
                                                )}
                                            </AccordionDetails>
                                        </Accordion>
                                    )}
                                </Paper>
                            );
                        })
                    )}

                    {/* ── LAUDOS / ARQUIVOS ANEXADOS ── */}
                    {laudos.length > 0 && (
                        <Paper sx={{ borderRadius: '14px', border: `1px solid ${systemTruckTheme.colors.border}`, overflow: 'hidden' }}>
                            <Box sx={{
                                p: 2.5,
                                background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                                borderBottom: `1px solid ${systemTruckTheme.colors.border}`,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                            }}>
                                <Box sx={{ p: 0.75, background: '#16a34a', borderRadius: '8px', display: 'flex', color: 'white' }}>
                                    <Paperclip size={18} />
                                </Box>
                                <Box>
                                    <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#14532d' }}>
                                        Laudos e Arquivos Anexados
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.78rem', color: '#166534' }}>
                                        Arquivos enviados pela equipe médica • {laudos.length} arquivo{laudos.length > 1 ? 's' : ''}
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                {laudos.map((laudo, i) => {
                                    const isPdf = laudo.mimetype?.includes('pdf');
                                    const sizeKb = Math.round((laudo.size || 0) / 1024);
                                    const date = laudo.uploadedAt ? new Date(laudo.uploadedAt).toLocaleDateString('pt-BR') : '';
                                    return (
                                        <Box key={i} sx={{
                                            display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5,
                                            borderRadius: '10px',
                                            border: `1px solid ${systemTruckTheme.colors.border}`,
                                            background: '#f8fafc',
                                            transition: 'all 0.2s',
                                            '&:hover': { background: '#f0fdf4', borderColor: '#86efac' },
                                        }}>
                                            <Box sx={{ p: 1, borderRadius: '8px', background: isPdf ? '#fee2e2' : '#e0f2fe', flexShrink: 0 }}>
                                                <FileText size={20} color={isPdf ? '#dc2626' : '#0284c7'} />
                                            </Box>
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#1e293b' }}>
                                                    {laudo.originalname}
                                                </Typography>
                                                <Typography sx={{ fontSize: '0.75rem', color: systemTruckTheme.colors.textSecondary }}>
                                                    {sizeKb} KB{date ? ` · Enviado em ${date}` : ''}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                                                <Tooltip title="Abrir arquivo">
                                                    <IconButton
                                                        id={`btn-abrir-laudo-${i}`}
                                                        size="small"
                                                        onClick={() => window.open(`${BASE_URL}${laudo.url}`, '_blank')}
                                                        sx={{ color: '#0284c7' }}
                                                    >
                                                        <ExternalLink size={16} />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Baixar arquivo">
                                                    <IconButton
                                                        id={`btn-baixar-laudo-${i}`}
                                                        size="small"
                                                        component="a"
                                                        href={`${BASE_URL}${laudo.url}`}
                                                        download={laudo.originalname}
                                                        sx={{ color: '#16a34a' }}
                                                    >
                                                        <Download size={16} />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </Box>
                                    );
                                })}
                            </Box>
                        </Paper>
                    )}
                </Box>
            )}
        </Container>
    );
};

export default MeusExames;
