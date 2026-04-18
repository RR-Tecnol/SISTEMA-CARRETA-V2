import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Tabs, Tab, List, ListItemButton, ListItemAvatar,
    Avatar, Badge, Chip, CircularProgress,
} from '@mui/material';
import { MessageCircle, Users } from 'lucide-react';
import api from '../../services/api';
import { expressoTheme } from '../../theme/expressoTheme';
import ChatMedico from './ChatMedico';
import ChatEquipe from './ChatEquipe';

interface Profissional {
    id: string;
    nome: string;
    cargo: string;
    especialidade?: string;
    is_medico?: boolean;
    crm?: string;
    nao_lidas: number;
}

interface ChatTabProps {
    acaoId: string;
    medicoId: string;
    inscritos: any[];
    mensagensNaoLidas?: Record<string, number>;
}

const ChatTab: React.FC<ChatTabProps> = ({ acaoId, medicoId, inscritos, mensagensNaoLidas = {} }) => {
    const [subtab, setSubtab] = useState(0);
    const [profissionais, setProfissionais] = useState<Profissional[]>([]);
    const [loadingProf, setLoadingProf] = useState(false);

    // Chat Paciente
    const [chatPacOpen, setChatPacOpen] = useState(false);
    const [chatPaciente, setChatPaciente] = useState<{ id: string; nome: string } | null>(null);

    // Chat Equipe
    const [chatEquipeOpen, setChatEquipeOpen] = useState(false);
    const [chatColega, setChatColega] = useState<Profissional | null>(null);

    // Carregar profissionais da ação
    useEffect(() => {
        if (subtab === 1) {
            setLoadingProf(true);
            api.get('/chat-equipe/profissionais', { params: { acao_id: acaoId } })
                .then(r => setProfissionais(r.data || []))
                .catch(() => {})
                .finally(() => setLoadingProf(false));
        }
    }, [subtab, acaoId]);

    const iniciais = (nome: string) => nome.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();

    const cargoIcon = (cargo: string) => {
        const c = cargo.toLowerCase();
        if (c.includes('médic') || c.includes('medic')) return '👨‍⚕️';
        if (c.includes('enfermeir')) return '👩‍⚕️';
        if (c.includes('técnic') || c.includes('tecnic')) return '🧑‍🔬';
        if (c.includes('motorista')) return '🚛';
        if (c.includes('admin')) return '👔';
        return '👤';
    };

    const cargoColor = (cargo: string) => {
        const c = cargo.toLowerCase();
        if (c.includes('médic') || c.includes('medic')) return { bg: '#DBEAFE', color: '#1E40AF' };
        if (c.includes('enfermeir')) return { bg: '#D4EDDA', color: '#166534' };
        if (c.includes('técnic') || c.includes('tecnic')) return { bg: '#F3E8FF', color: '#7C3AED' };
        return { bg: '#F1F5F9', color: '#475569' };
    };

    return (
        <Box>
            {/* Subtabs */}
            <Tabs
                value={subtab}
                onChange={(_, v) => setSubtab(v)}
                variant="fullWidth"
                sx={{
                    mb: 2,
                    minHeight: 40,
                    background: '#F8FAFC',
                    borderRadius: '12px',
                    border: `1px solid ${expressoTheme.colors.border}`,
                    '& .MuiTab-root': { minHeight: 40, textTransform: 'none', fontWeight: 700, fontSize: '0.82rem' },
                    '& .Mui-selected': { color: expressoTheme.colors.primary },
                    '& .MuiTabs-indicator': { background: expressoTheme.colors.primary, borderRadius: '4px', height: 3 },
                }}
            >
                <Tab icon={<MessageCircle size={14} />} iconPosition="start" label="Pacientes" />
                <Tab icon={<Users size={14} />} iconPosition="start" label="Equipe" />
            </Tabs>

            {/* Subtab 0: Pacientes */}
            {subtab === 0 && (
                <Box>
                    {inscritos.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 4, color: '#94a3b8' }}>
                            <MessageCircle size={28} />
                            <Typography sx={{ fontSize: '0.85rem', mt: 1 }}>Nenhum paciente inscrito</Typography>
                        </Box>
                    ) : (
                        <List dense disablePadding>
                            {inscritos.map((insc: any) => {
                                const naoLidas = mensagensNaoLidas[insc.cidadao?.id] || 0;
                                return (
                                <ListItemButton
                                    key={insc.cidadao?.id || insc.id}
                                    onClick={() => {
                                        setChatPaciente({ id: insc.cidadao?.id, nome: insc.cidadao?.nome });
                                        setChatPacOpen(true);
                                    }}
                                    sx={{
                                        borderRadius: '10px', mb: 0.5, py: 1.2,
                                        border: naoLidas > 0 ? `1px solid ${expressoTheme.colors.primary}` : 'none',
                                        background: naoLidas > 0 ? '#F0F4FF' : 'transparent',
                                        '&:hover': { background: expressoTheme.colors.cardHover },
                                    }}
                                >
                                    <ListItemAvatar sx={{ minWidth: 44 }}>
                                        <Badge badgeContent={naoLidas} color="error" max={9}
                                            sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', minWidth: 16, height: 16 } }}>
                                            <Avatar sx={{ width: 34, height: 34, background: expressoTheme.gradients.primary, fontSize: '0.75rem', fontWeight: 700 }}>
                                                {iniciais(insc.cidadao?.nome || '')}
                                            </Avatar>
                                        </Badge>
                                    </ListItemAvatar>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>
                                            {insc.cidadao?.nome || 'Cidadão'}
                                        </Typography>
                                        <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                                            Clique para abrir o chat
                                        </Typography>
                                    </Box>
                                    <MessageCircle size={16} color={expressoTheme.colors.primary} />
                                </ListItemButton>
                            )})}
                        </List>
                    )}
                </Box>
            )}

            {/* Subtab 1: Equipe */}
            {subtab === 1 && (
                <Box>
                    {loadingProf ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <CircularProgress size={24} sx={{ color: expressoTheme.colors.primary }} />
                        </Box>
                    ) : profissionais.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 4, color: '#94a3b8' }}>
                            <Users size={28} />
                            <Typography sx={{ fontSize: '0.85rem', mt: 1 }}>Nenhum profissional nesta ação</Typography>
                        </Box>
                    ) : (
                        <List dense disablePadding>
                            {profissionais.map((prof) => {
                                const cc = cargoColor(prof.cargo);
                                return (
                                    <ListItemButton
                                        key={prof.id}
                                        onClick={() => {
                                            setChatColega(prof);
                                            setChatEquipeOpen(true);
                                        }}
                                        sx={{
                                            borderRadius: '10px', mb: 0.5, py: 1.2,
                                            border: prof.nao_lidas > 0 ? `1px solid ${expressoTheme.colors.primary}` : 'none',
                                            background: prof.nao_lidas > 0 ? '#F0F4FF' : 'transparent',
                                            '&:hover': { background: expressoTheme.colors.cardHover },
                                        }}
                                    >
                                        <ListItemAvatar sx={{ minWidth: 44 }}>
                                            <Badge badgeContent={prof.nao_lidas} color="error" max={9}
                                                sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', minWidth: 16, height: 16 } }}>
                                                <Avatar sx={{ width: 34, height: 34, background: cc.bg, color: cc.color, fontSize: '0.75rem', fontWeight: 700 }}>
                                                    {iniciais(prof.nome)}
                                                </Avatar>
                                            </Badge>
                                        </ListItemAvatar>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>
                                                {cargoIcon(prof.cargo)} {prof.nome}
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.25 }}>
                                                <Chip label={prof.cargo} size="small"
                                                    sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, background: cc.bg, color: cc.color }} />
                                                {prof.especialidade && (
                                                    <Chip label={prof.especialidade} size="small"
                                                        sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600, background: '#F8FAFC', color: '#64748b' }} />
                                                )}
                                                {prof.crm && (
                                                    <Typography sx={{ fontSize: '0.62rem', color: '#94a3b8', alignSelf: 'center' }}>
                                                        CRM: {prof.crm}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>
                                        <MessageCircle size={16} color={expressoTheme.colors.primary} />
                                    </ListItemButton>
                                );
                            })}
                        </List>
                    )}
                </Box>
            )}

            {/* Drawers */}
            {chatPaciente && (
                <ChatMedico
                    open={chatPacOpen}
                    onClose={() => setChatPacOpen(false)}
                    acaoId={acaoId}
                    cidadaoId={chatPaciente.id}
                    nomeCidadao={chatPaciente.nome}
                    medicoId={medicoId}
                />
            )}

            {chatColega && (
                <ChatEquipe
                    open={chatEquipeOpen}
                    onClose={() => setChatEquipeOpen(false)}
                    meuId={medicoId}
                    colega={chatColega}
                    acaoId={acaoId}
                />
            )}
        </Box>
    );
};

export default ChatTab;
