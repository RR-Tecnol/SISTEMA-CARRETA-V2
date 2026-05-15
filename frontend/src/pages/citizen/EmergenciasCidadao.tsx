import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Container, Paper, Chip, CircularProgress, Button
} from '@mui/material';
import { AlertTriangle, Clock, CheckCircle, Stethoscope } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { systemTruckTheme } from '../../theme/systemTruckTheme';

interface Emergencia {
    id: string;
    acao_id: string;
    status: string;
    nome_cidadao: string;
    created_at: string;
    updated_at: string;
    atendido_por_nome?: string;
}

const EmergenciasCidadao: React.FC = () => {
    const user = useSelector((state: any) => state.auth?.user);
    const navigate = useNavigate();
    const [emergencias, setEmergencias] = useState<Emergencia[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/emergencias', { params: { cidadao_id: user?.id } })
            .then(r => setEmergencias(r.data?.emergencias || r.data?.data || []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [user?.id]);

    const formatDate = (iso: string) =>
        new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const statusConfig: Record<string, { label: string; bg: string; color: string; icon: React.ReactNode }> = {
        novo: { label: 'Novo', bg: '#FEE2E2', color: '#DC2626', icon: <AlertTriangle size={14} /> },
        visto: { label: 'Visto', bg: '#FEF3C7', color: '#D97706', icon: <Clock size={14} /> },
        em_atendimento: { label: 'Em Atendimento', bg: '#DBEAFE', color: '#2563EB', icon: <Stethoscope size={14} /> },
        resolvido: { label: 'Resolvido', bg: '#D1FAE5', color: '#059669', icon: <CheckCircle size={14} /> },
    };

    return (
        <Container maxWidth="md" sx={{ py: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 900, color: systemTruckTheme.colors.primaryDark, mb: 0.5 }}>
                🆘 Minhas Emergências
            </Typography>
            <Typography sx={{ color: systemTruckTheme.colors.textSecondary, fontSize: '0.85rem', mb: 3 }}>
                Histórico de alertas de emergência enviados
            </Typography>

            {loading ? (
                <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>
            ) : emergencias.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '14px' }}>
                    <AlertTriangle size={36} color="#94a3b8" />
                    <Typography sx={{ mt: 1, color: '#94a3b8', fontSize: '0.88rem' }}>
                        Nenhum alerta de emergência registrado
                    </Typography>
                    <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem', mt: 0.5 }}>
                        Seus alertas de emergência aparecerão aqui quando enviados
                    </Typography>
                </Paper>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {emergencias.map(emerg => {
                        const sc = statusConfig[emerg.status] || statusConfig.novo;
                        return (
                            <Paper key={emerg.id} sx={{
                                p: 2.5, borderRadius: '14px',
                                border: `1px solid ${systemTruckTheme.colors.border}`,
                                borderLeft: `4px solid ${sc.color}`,
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                    <Chip
                                        icon={sc.icon as React.ReactElement}
                                        label={sc.label}
                                        size="small"
                                        sx={{ background: sc.bg, color: sc.color, fontWeight: 700, fontSize: '0.72rem' }}
                                    />
                                    <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>
                                        {formatDate(emerg.created_at)}
                                    </Typography>
                                </Box>

                                {emerg.atendido_por_nome && (
                                    <Typography sx={{ fontSize: '0.78rem', color: '#475569', mt: 0.5 }}>
                                        👨‍⚕️ Atendido por: <strong>{emerg.atendido_por_nome}</strong>
                                    </Typography>
                                )}

                                {emerg.status === 'novo' && (
                                    <Typography sx={{ fontSize: '0.75rem', color: '#dc2626', mt: 0.5, fontStyle: 'italic' }}>
                                        ⏳ Aguardando atendimento da equipe médica...
                                    </Typography>
                                )}

                                {emerg.status === 'resolvido' && (
                                    <Typography sx={{ fontSize: '0.75rem', color: '#059669', mt: 0.5 }}>
                                        ✅ Esta emergência foi resolvida em {formatDate(emerg.updated_at || emerg.created_at)}.
                                    </Typography>
                                )}

                                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={() => navigate('/portal/chat', { state: { acaoId: emerg.acao_id } })}
                                        sx={{ 
                                            textTransform: 'none', borderRadius: '8px', 
                                            borderColor: systemTruckTheme.colors.primary, 
                                            color: systemTruckTheme.colors.primary,
                                            fontWeight: 600
                                        }}
                                    >
                                        Ir para o Chat
                                    </Button>
                                </Box>
                            </Paper>
                        );
                    })}
                </Box>
            )}
        </Container>
    );
};

export default EmergenciasCidadao;
