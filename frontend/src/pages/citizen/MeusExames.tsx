import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Container, Paper, CircularProgress, Accordion,
    AccordionSummary, AccordionDetails, IconButton, Tooltip
} from '@mui/material';
import { Stethoscope, ChevronDown, Printer } from 'lucide-react';
import api from '../../services/api';
import { systemTruckTheme } from '../../theme/systemTruckTheme';

const MeusExames: React.FC = () => {
    const [atendimentos, setAtendimentos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/medico-monitoring/meus-atendimentos')
            .then(r => setAtendimentos(r.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const formatData = (iso: string) => {
        if (!iso) return '—';
        return new Date(iso).toLocaleDateString('pt-BR');
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            {/* Cabecalho - Nao impresso se estiver imprimindo uma pagina especifica fora dessa area, mas eh bom manter pra contexto */}
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
                        Resultados e fichas dos seus atendimentos concluídos
                    </Typography>
                </Box>
                <Tooltip title="Imprimir todos">
                    <IconButton onClick={handlePrint} sx={{ display: { xs: 'none', sm: 'flex' } }}>
                        <Printer size={20} />
                    </IconButton>
                </Tooltip>
            </Box>

            {loading ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <CircularProgress />
                </Box>
            ) : atendimentos.length === 0 ? (
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
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {atendimentos.map((atd) => {
                        const f = atd.ficha_clinica || {};
                        const temFicha = Object.keys(f).length > 0;
                        const data = formatData(atd.hora_inicio);
                        
                        return (
                            <Paper key={atd.id} className="print-card" sx={{
                                borderRadius: '14px',
                                border: `1px solid ${systemTruckTheme.colors.border}`,
                                overflow: 'hidden',
                                '&.print-card': { breakInside: 'avoid' }
                            }}>
                                {/* Header do Card */}
                                <Box sx={{ p: 2.5, background: '#f8fafc', borderBottom: `1px solid ${systemTruckTheme.colors.border}` }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                        <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#1e293b' }}>
                                            🏥 {atd.acao?.nome || 'Ação'}
                                        </Typography>
                                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>
                                            {data} • {atd.acao?.local || '—'}
                                        </Typography>
                                    </Box>
                                    <Typography sx={{ fontSize: '0.85rem', color: '#475569', fontWeight: 500 }}>
                                        👨‍⚕️ Dr(a). {atd.medico?.nome || '—'} {atd.medico?.especialidade ? `• ${atd.medico.especialidade}` : ''}
                                    </Typography>
                                </Box>

                                {/* Resumo de Resultados */}
                                <Box sx={{ p: 2.5 }}>
                                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                                        <Box>
                                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                                                📋 Diagnóstico
                                            </Typography>
                                            <Typography sx={{ fontSize: '0.9rem', color: '#1e293b', mt: 0.5, fontWeight: 500 }}>
                                                {f.diagnostico || '—'}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                                                🏷️ CID-10
                                            </Typography>
                                            <Typography sx={{ fontSize: '0.9rem', color: '#1e293b', mt: 0.5, fontWeight: 500 }}>
                                                {f.cid || '—'}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}>
                                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                                                💊 Prescrição
                                            </Typography>
                                            <Typography sx={{ fontSize: '0.9rem', color: '#1e293b', mt: 0.5, fontWeight: 500 }}>
                                                {f.prescricao || '—'}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}>
                                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                                                🔄 Retorno / Orientações
                                            </Typography>
                                            <Typography sx={{ fontSize: '0.9rem', color: '#1e293b', mt: 0.5, fontWeight: 500 }}>
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
                                        <AccordionSummary expandIcon={<ChevronDown size={18} />} sx={{ background: '#f1f5f9', minHeight: 48, '& .MuiAccordionSummary-content': { my: 0 } }}>
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
                    })}
                </Box>
            )}

            {/* Estilos para impressao */}
            <style>
                {`
                @media print {
                    body { background: white; }
                    .MuiDrawer-root, header, nav, .MuiAppBar-root { display: none !important; }
                    .MuiContainer-root { max-width: 100% !important; padding: 0 !important; }
                    .print-card { break-inside: avoid; border: 1px solid #ccc !important; margin-bottom: 20px; box-shadow: none !important; }
                    .MuiAccordion-root { border: none !important; }
                    .MuiAccordionSummary-root { display: none !important; }
                    .MuiAccordionDetails-root { display: block !important; padding: 0 !important; background: white !important; }
                    .MuiCollapse-root { height: auto !important; visibility: visible !important; }
                }
                `}
            </style>
        </Container>
    );
};

export default MeusExames;
