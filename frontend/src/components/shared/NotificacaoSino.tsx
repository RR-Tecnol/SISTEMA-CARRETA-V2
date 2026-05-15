import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Typography, Badge, IconButton, Tooltip, Popover,
    List, ListItemButton, Chip, Divider, Button,
} from '@mui/material';
import { Bell, AlertTriangle, FileText, CheckCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { getSocket } from '../../utils/socket';
import { expressoTheme } from '../../theme/expressoTheme';

interface EmergenciaItem {
    id: string;
    acao_id: string;
    cidadao_id: string;
    nome_cidadao: string;
    status: string;
    created_at: string;
}

interface NotificacaoSinoProps {
    acaoId?: string; // Se definido, filtra por ação específica
}

const NotificacaoSino: React.FC<NotificacaoSinoProps> = ({ acaoId }) => {
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [novasCount, setNovasCount] = useState(0);
    const [emergencias, setEmergencias] = useState<EmergenciaItem[]>([]);
    const [pulsar, setPulsar] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Buscar contagem e emergências recentes
    const fetchEmergencias = async () => {
        try {
            const params: any = {};
            if (acaoId) params.acao_id = acaoId;
            params.limit = 10;

            const [countRes, listRes] = await Promise.all([
                api.get('/emergencias/nao-lidas', { params: { acao_id: acaoId } }),
                api.get('/emergencias', { params }),
            ]);

            setNovasCount(countRes.data.novas || 0);
            setEmergencias(listRes.data.emergencias || []);
        } catch { /* silencioso */ }
    };

    useEffect(() => {
        fetchEmergencias();
        const interval = setInterval(fetchEmergencias, 30000); // Atualizar a cada 30s
        return () => clearInterval(interval);
    }, [acaoId]);

    // Socket.IO: escutar emergências em tempo real
    useEffect(() => {
        const socket = getSocket();

        if (acaoId) {
            socket.emit('join_acao', acaoId);
        }

        socket.on('emergencia', () => {
            fetchEmergencias();
            setPulsar(true);
            // Tocar som de alerta
            try {
                if (!audioRef.current) {
                    audioRef.current = new Audio('data:audio/wav;base64,UklGRl9vT19teleWF2ZaFtdA==');
                }
                // Usar Web Audio API para beep
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = 880;
                gain.gain.value = 0.3;
                osc.start();
                setTimeout(() => { osc.stop(); ctx.close(); }, 300);
            } catch { /* sem som */ }
            setTimeout(() => setPulsar(false), 5000);
        });

        return () => {
            if (acaoId) socket.emit('leave_acao', acaoId);
            socket.off('emergencia');
        };
    }, [acaoId]);

    const handleMarcarVisto = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await api.put(`/emergencias/${id}/status`, { status: 'visto' });
            fetchEmergencias();
        } catch { /* silencioso */ }
    };

    const handleAbrirFicha = (cidadao_id: string) => {
        setAnchorEl(null);
        navigate(`/ficha/${cidadao_id}`);
    };

    const statusConfig: Record<string, { cor: string; bg: string; label: string; icon: React.ReactNode }> = {
        novo: { cor: '#DC2626', bg: '#FEE2E2', label: 'NOVO', icon: <AlertTriangle size={12} /> },
        visto: { cor: '#D97706', bg: '#FEF3C7', label: 'Visto', icon: <Clock size={12} /> },
        em_atendimento: { cor: '#2563EB', bg: '#DBEAFE', label: 'Atendendo', icon: <FileText size={12} /> },
        resolvido: { cor: '#16A34A', bg: '#D4EDDA', label: 'Resolvido', icon: <CheckCircle size={12} /> },
    };

    const open = Boolean(anchorEl);

    return (
        <>
            <style>{`
                @keyframes sinoPulse {
                    0%, 100% { transform: scale(1); }
                    25% { transform: scale(1.15) rotate(-8deg); }
                    50% { transform: scale(1.1) rotate(8deg); }
                    75% { transform: scale(1.15) rotate(-4deg); }
                }
            `}</style>
            <Tooltip title={novasCount > 0 ? `${novasCount} emergência(s) nova(s)` : 'Sem alertas'}>
                <IconButton
                    size="small"
                    onClick={(e) => { setAnchorEl(e.currentTarget); fetchEmergencias(); }}
                    sx={{
                        color: expressoTheme.colors.textSecondary,
                        animation: pulsar ? 'sinoPulse 0.4s ease-in-out 3' : 'none',
                        '&:hover': { background: novasCount > 0 ? '#FEE2E2' : expressoTheme.colors.cardHover },
                    }}
                >
                    <Badge
                        badgeContent={novasCount}
                        color="error"
                        max={9}
                        sx={{
                            '& .MuiBadge-badge': {
                                fontSize: '0.65rem', fontWeight: 800,
                                minWidth: 18, height: 18,
                                // Animação removida porque sobreescrevia o transform (translate)
                                // que o MUI usa para manter o badge no canto superior direito
                            },
                        }}
                    >
                        <Bell size={20} />
                    </Badge>
                </IconButton>
            </Tooltip>

            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{
                    sx: {
                        mt: 1, borderRadius: '14px', width: 360, maxHeight: 450,
                        boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
                        border: `1px solid ${expressoTheme.colors.border}`,
                    },
                }}
            >
                {/* Header */}
                <Box sx={{
                    background: expressoTheme.gradients.primary, px: 2.5, py: 1.5,
                    borderRadius: '14px 14px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '0.92rem' }}>
                        🆘 Emergências
                    </Typography>
                    {novasCount > 0 && (
                        <Chip label={`${novasCount} nova${novasCount > 1 ? 's' : ''}`} size="small"
                            sx={{ background: 'rgba(255,255,255,0.25)', color: 'white', fontWeight: 700, fontSize: '0.7rem' }} />
                    )}
                </Box>

                {/* Lista */}
                {emergencias.length === 0 ? (
                    <Box sx={{ py: 4, textAlign: 'center', color: expressoTheme.colors.textSecondary }}>
                        <Bell size={28} />
                        <Typography sx={{ fontSize: '0.85rem', mt: 1 }}>Nenhum alerta recente</Typography>
                    </Box>
                ) : (
                    <List dense disablePadding sx={{ maxHeight: 320, overflowY: 'auto' }}>
                        {emergencias.map((em, i) => {
                            const cfg = statusConfig[em.status] || statusConfig.novo;
                            return (
                                <React.Fragment key={em.id}>
                                    <ListItemButton
                                        onClick={() => handleAbrirFicha(em.cidadao_id)}
                                        sx={{
                                            py: 1.5, px: 2.5,
                                            background: em.status === 'novo' ? '#FFF5F5' : 'transparent',
                                            '&:hover': { background: expressoTheme.colors.cardHover },
                                        }}
                                    >
                                        <Box sx={{ flex: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                                                <Chip
                                                    icon={cfg.icon as React.ReactElement}
                                                    label={cfg.label}
                                                    size="small"
                                                    sx={{
                                                        background: cfg.bg, color: cfg.cor,
                                                        fontWeight: 700, fontSize: '0.65rem', height: 22,
                                                        '& .MuiChip-icon': { color: cfg.cor },
                                                    }}
                                                />
                                                <Typography sx={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                                                    {(() => {
                                                        const d = em.created_at || (em as any).createdAt;
                                                        return d ? new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Agora';
                                                    })()}
                                                </Typography>
                                            </Box>
                                            <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>
                                                {em.nome_cidadao}
                                            </Typography>
                                        </Box>
                                        {em.status === 'novo' && (
                                            <Tooltip title="Marcar como visto">
                                                <IconButton size="small" onClick={(e) => handleMarcarVisto(em.id, e)}
                                                    sx={{ color: '#D97706', '&:hover': { background: '#FEF3C7' } }}>
                                                    <CheckCircle size={16} />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </ListItemButton>
                                    {i < emergencias.length - 1 && <Divider />}
                                </React.Fragment>
                            );
                        })}
                    </List>
                )}

                {/* Footer */}
                <Box sx={{ p: 1.5, borderTop: `1px solid ${expressoTheme.colors.borderLight}`, textAlign: 'center' }}>
                    <Button
                        size="small"
                        onClick={() => { setAnchorEl(null); navigate('/admin/emergencias'); }}
                        sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.78rem', color: expressoTheme.colors.primary }}
                    >
                        Ver todas as emergências →
                    </Button>
                </Box>
            </Popover>
        </>
    );
};

export default NotificacaoSino;
