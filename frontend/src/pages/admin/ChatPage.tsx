import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Container, Paper, Chip,
    List, ListItemButton, ListItemAvatar, Avatar, Badge,
    TextField, CircularProgress,
} from '@mui/material';
import { MessageCircle, Users, Search } from 'lucide-react';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import { expressoTheme } from '../../theme/expressoTheme';
import ChatEquipe from '../../components/medico/ChatEquipe';

interface Profissional {
    id: string;
    nome: string;
    cargo: string;
    especialidade?: string;
    is_medico?: boolean;
    crm?: string;
    nao_lidas: number;
}

const ChatPage: React.FC = () => {
    const user = useSelector((state: any) => state.auth.user);
    const meuId = user?.funcionario_id || user?.id || '';

    const [profissionais, setProfissionais] = useState<Profissional[]>([]);
    const [loading, setLoading] = useState(true);
    const [busca, setBusca] = useState('');
    const [chatOpen, setChatOpen] = useState(false);
    const [selectedColega, setSelectedColega] = useState<Profissional | null>(null);

    const fetchProfissionais = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/chat-equipe/profissionais');
            setProfissionais(data || []);
        } catch (err) {
            console.error('Erro ao buscar profissionais:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchProfissionais(); }, []);

    const filtrados = busca
        ? profissionais.filter(p =>
            p.nome.toLowerCase().includes(busca.toLowerCase()) ||
            p.cargo.toLowerCase().includes(busca.toLowerCase()) ||
            (p.especialidade || '').toLowerCase().includes(busca.toLowerCase())
        )
        : profissionais;

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

    // Agrupar por cargo
    const porCargo = filtrados.reduce((acc: Record<string, Profissional[]>, p) => {
        const key = p.cargo || 'Outros';
        if (!acc[key]) acc[key] = [];
        acc[key].push(p);
        return acc;
    }, {});

    const totalNaoLidas = profissionais.reduce((s, p) => s + p.nao_lidas, 0);

    return (
        <Container maxWidth="md" sx={{ py: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: expressoTheme.colors.primaryDark }}>
                        💬 Central de Chat
                    </Typography>
                    <Typography sx={{ color: expressoTheme.colors.textSecondary, fontSize: '0.85rem' }}>
                        Converse com qualquer profissional da equipe
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    {totalNaoLidas > 0 && (
                        <Chip icon={<MessageCircle size={12} />} label={`${totalNaoLidas} não lida${totalNaoLidas > 1 ? 's' : ''}`}
                            size="small" sx={{ background: '#FEE2E2', color: '#DC2626', fontWeight: 700 }} />
                    )}
                    <Chip icon={<Users size={12} />} label={`${profissionais.length} profissionais`}
                        size="small" sx={{ background: expressoTheme.colors.cardHover, color: expressoTheme.colors.primary, fontWeight: 600 }} />
                </Box>
            </Box>

            {/* Busca */}
            <Paper sx={{ p: 2, borderRadius: '14px', mb: 3, border: `1px solid ${expressoTheme.colors.border}` }}>
                <TextField
                    fullWidth size="small" placeholder="Buscar profissional por nome, cargo ou especialidade..."
                    value={busca} onChange={(e) => setBusca(e.target.value)}
                    InputProps={{ startAdornment: <Search size={16} color="#94a3b8" style={{ marginRight: 8 }} /> }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                />
            </Paper>

            {/* Lista por cargo */}
            {loading ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                    <CircularProgress sx={{ color: expressoTheme.colors.primary }} />
                </Box>
            ) : Object.keys(porCargo).length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '14px' }}>
                    <Users size={32} color="#94a3b8" />
                    <Typography sx={{ mt: 1, color: '#94a3b8' }}>Nenhum profissional encontrado</Typography>
                </Paper>
            ) : (
                Object.entries(porCargo).map(([cargo, profs]) => {
                    const cc = cargoColor(cargo);
                    return (
                        <Paper key={cargo} sx={{ borderRadius: '14px', mb: 2, border: `1px solid ${expressoTheme.colors.border}`, overflow: 'hidden' }}>
                            <Box sx={{ px: 2.5, py: 1.5, background: cc.bg, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: cc.color }}>
                                    {cargoIcon(cargo)} {cargo}
                                </Typography>
                                <Chip label={profs.length} size="small" sx={{ height: 20, fontSize: '0.65rem', background: 'rgba(255,255,255,0.7)', color: cc.color, fontWeight: 700 }} />
                            </Box>
                            <List dense disablePadding>
                                {profs.map((prof) => (
                                    <ListItemButton
                                        key={prof.id}
                                        onClick={() => { setSelectedColega(prof); setChatOpen(true); }}
                                        sx={{
                                            py: 1.5, px: 2.5,
                                            background: prof.nao_lidas > 0 ? '#F0F4FF' : 'transparent',
                                            borderLeft: prof.nao_lidas > 0 ? `3px solid ${expressoTheme.colors.primary}` : 'none',
                                            '&:hover': { background: expressoTheme.colors.cardHover },
                                        }}
                                    >
                                        <ListItemAvatar sx={{ minWidth: 48 }}>
                                            <Badge badgeContent={prof.nao_lidas} color="error" max={9}
                                                sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', minWidth: 16, height: 16 } }}>
                                                <Avatar sx={{ width: 38, height: 38, background: cc.bg, color: cc.color, fontSize: '0.82rem', fontWeight: 700 }}>
                                                    {iniciais(prof.nome)}
                                                </Avatar>
                                            </Badge>
                                        </ListItemAvatar>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>
                                                {prof.nome}
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.25 }}>
                                                {prof.especialidade && (
                                                    <Chip label={prof.especialidade} size="small"
                                                        sx={{ height: 18, fontSize: '0.62rem', fontWeight: 600, background: '#F8FAFC', color: '#64748b' }} />
                                                )}
                                                {prof.crm && (
                                                    <Typography sx={{ fontSize: '0.62rem', color: '#94a3b8', alignSelf: 'center' }}>
                                                        CRM: {prof.crm}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>
                                        <MessageCircle size={18} color={prof.nao_lidas > 0 ? expressoTheme.colors.primary : '#94a3b8'} />
                                    </ListItemButton>
                                ))}
                            </List>
                        </Paper>
                    );
                })
            )}

            {/* Chat Drawer */}
            {selectedColega && (
                <ChatEquipe
                    open={chatOpen}
                    onClose={() => { setChatOpen(false); fetchProfissionais(); }}
                    meuId={meuId}
                    colega={selectedColega}
                />
            )}
        </Container>
    );
};

export default ChatPage;
