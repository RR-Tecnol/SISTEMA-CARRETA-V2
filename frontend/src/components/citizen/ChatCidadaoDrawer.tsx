import React, { useState, useEffect, useRef } from 'react';
import {
    Drawer, Box, Typography, TextField, IconButton,
    CircularProgress, Avatar, Tabs, Tab, Button,
} from '@mui/material';
import { X, Send, AlertTriangle, MessageCircle } from 'lucide-react';
import { useSnackbar } from 'notistack';
import api from '../../services/api';
import { getSocket } from '../../utils/socket';

interface Mensagem {
    id: string;
    de: 'cidadao' | 'medico' | 'sistema';
    mensagem: string;
    lida: boolean;
    created_at: string;
    funcionario_id?: string;
    profissional_nome?: string;
    profissional_cargo?: string;
    profissional_especialidade?: string;
}

interface Profissional {
    id: string;
    nome: string;
    cargo: string;
    especialidade?: string;
    crm?: string;
}

interface ChatCidadaoDrawerProps {
    open: boolean;
    onClose: () => void;
    acaoId: string;
    cidadaoId: string;
    acaoNome: string;
    onEmergencia: () => void;
    emergenciaEnviada: boolean;
}

const ChatCidadaoDrawer: React.FC<ChatCidadaoDrawerProps> = ({
    open, onClose, acaoId, cidadaoId, acaoNome, onEmergencia, emergenciaEnviada,
}) => {
    const { enqueueSnackbar } = useSnackbar();
    const [tab, setTab] = useState(0); // 0 = Chat, 1 = Emergência
    const [profissionais, setProfissionais] = useState<Profissional[]>([]);


    // Chat state
    const [mensagens, setMensagens] = useState<Mensagem[]>([]);
    const [texto, setTexto] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [loadingMsgs, setLoadingMsgs] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Carregar profissionais
    useEffect(() => {
        if (!open) return;
        api.get('/chat-equipe/profissionais', { params: { acao_id: acaoId } })
            .then(r => {
                // Inclui todos, não filtra por "meuId" pois cidadão não é funcionário
                setProfissionais(r.data || []);
            })
            .catch(() => {
                // Fallback: buscar de acao_funcionarios diretamente
                api.get(`/acoes/${acaoId}`)
                    .then(r2 => {
                        const funcs = r2.data?.funcionarios || [];
                        setProfissionais(funcs.map((f: any) => ({
                            id: f.id, nome: f.nome, cargo: f.cargo,
                            especialidade: f.especialidade, crm: f.crm,
                        })));
                    })
                    .catch(() => {});
            });
    }, [open, acaoId]);

    // Carregar mensagens quando abre chat
    useEffect(() => {
        if (!open || tab !== 0) return;
        setLoadingMsgs(true);
        api.get(`/chat/${acaoId}/${cidadaoId}`)
            .then(r => setMensagens(r.data || []))
            .catch(() => {})
            .finally(() => setLoadingMsgs(false));

        // Marcar como lidas
        api.patch(`/chat/${acaoId}/${cidadaoId}/lido`, { de: 'cidadao' }).catch(() => {});

        // Socket
        const socket = getSocket();
        socket.emit('join_chat', { acao_id: acaoId, cidadao_id: cidadaoId });
        const handler = (msg: any) => {
            if (msg.acao_id === acaoId && msg.cidadao_id === cidadaoId) {
                setMensagens(prev => [...prev, msg]);
                if (msg.de === 'medico') {
                    api.patch(`/chat/${acaoId}/${cidadaoId}/lido`, { de: 'cidadao' }).catch(() => {});
                }
            }
        };
        socket.on('chat_msg', handler);
        return () => {
            socket.off('chat_msg', handler);
            socket.emit('leave_chat', { acao_id: acaoId, cidadao_id: cidadaoId });
        };
    }, [open, acaoId, cidadaoId, tab]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [mensagens]);

    const handleEnviar = async () => {
        if (!texto.trim() || enviando) return;
        setEnviando(true);
        try {
            await api.post(`/chat/${acaoId}/${cidadaoId}`, { mensagem: texto.trim(), de: 'cidadao' });
            setTexto('');
        } catch {
            enqueueSnackbar('Erro ao enviar mensagem', { variant: 'error' });
        } finally {
            setEnviando(false);
        }
    };

    const formatHora = (iso: string) =>
        new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const iniciais = (nome: string) => nome.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();

    const cargoIcon = (cargo: string) => {
        const c = cargo.toLowerCase();
        if (c.includes('médic') || c.includes('medic')) return '👨‍⚕️';
        if (c.includes('enfermeir')) return '👩‍⚕️';
        if (c.includes('técnic') || c.includes('tecnic')) return '🧑‍🔬';
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
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            PaperProps={{ sx: { width: { xs: '100%', sm: 420 }, display: 'flex', flexDirection: 'column' } }}
        >
            {/* Header */}
            <Box sx={{ background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)', p: 2.5, color: 'white' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                        <Typography sx={{ fontWeight: 800, fontSize: '1rem' }}>
                            {tab === 0 ? '💬 Chat' : '🆘 Emergência'}
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', opacity: 0.85 }}>
                            {acaoNome}
                        </Typography>
                    </Box>
                    <IconButton onClick={onClose} sx={{ color: 'white' }}><X size={20} /></IconButton>
                </Box>

                {/* Tabs */}
                <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth"
                    sx={{
                        mt: 1.5, minHeight: 36,
                        background: 'rgba(255,255,255,0.15)', borderRadius: '10px',
                        '& .MuiTab-root': { minHeight: 36, fontSize: '0.78rem', textTransform: 'none', fontWeight: 700, color: 'rgba(255,255,255,0.7)' },
                        '& .Mui-selected': { color: 'white !important' },
                        '& .MuiTabs-indicator': { background: 'white', borderRadius: '4px', height: 3 },
                    }}
                >
                    <Tab icon={<MessageCircle size={14} />} iconPosition="start" label="Chat" />
                    <Tab icon={<AlertTriangle size={14} />} iconPosition="start" label="Emergência" />
                </Tabs>
            </Box>

            {/* Tab 0: Chat */}
            {tab === 0 && (
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Mensagens */}
                    <Box sx={{ flex: 1, overflowY: 'auto', p: 2, background: '#f1f5f9', display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, p: 1, background: 'white', borderRadius: '8px' }}>
                            <Avatar sx={{ width: 36, height: 36, background: '#DBEAFE', color: '#1E40AF', fontSize: '0.85rem', fontWeight: 700 }}>
                                EQ
                            </Avatar>
                            <Box>
                                <Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }}>Equipe Médica de Plantão</Typography>
                                <Typography sx={{ fontSize: '0.7rem', color: '#64748b' }}>Ação: {acaoNome}</Typography>
                            </Box>
                        </Box>

                        {loadingMsgs ? (
                            <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress size={24} /></Box>
                        ) : mensagens.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <MessageCircle size={28} color="#94a3b8" />
                                <Typography sx={{ color: '#94a3b8', fontSize: '0.82rem', mt: 1 }}>
                                    Nenhuma mensagem ainda
                                </Typography>
                                <Typography sx={{ color: '#94a3b8', fontSize: '0.72rem' }}>
                                    Envie uma mensagem para a equipe 👋
                                </Typography>
                            </Box>
                        ) : (
                            mensagens.map((msg, i) => (
                                <Box key={msg.id || i} sx={{ display: 'flex', justifyContent: msg.de === 'cidadao' ? 'flex-end' : msg.de === 'sistema' ? 'center' : 'flex-start' }}>
                                    <Box sx={{
                                        maxWidth: msg.de === 'sistema' ? '90%' : '78%',
                                        px: 1.8, py: 1,
                                        borderRadius: msg.de === 'cidadao' ? '14px 14px 0 14px' : msg.de === 'sistema' ? '10px' : '14px 14px 14px 0',
                                        background: msg.de === 'cidadao' ? 'linear-gradient(135deg, #1e40af, #3b82f6)' : msg.de === 'sistema' ? '#fef9c3' : 'white',
                                        color: msg.de === 'cidadao' ? 'white' : '#1e293b',
                                        boxShadow: msg.de === 'sistema' ? 'none' : '0 1px 4px rgba(0,0,0,0.06)',
                                    }}>
                                        {msg.de === 'medico' && msg.profissional_nome && (
                                            <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: '#3b82f6', mb: 0.2 }}>
                                                {cargoIcon(msg.profissional_cargo || '')} {msg.profissional_nome}
                                                {msg.profissional_especialidade ? ` · ${msg.profissional_especialidade}` : ''}
                                            </Typography>
                                        )}
                                        {msg.de === 'sistema' && (
                                            <Typography sx={{ fontSize: '0.62rem', fontWeight: 600, color: '#92400e', mb: 0.2 }}>Sistema</Typography>
                                        )}
                                        <Typography sx={{ fontSize: '0.85rem', lineHeight: 1.45, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                            {msg.mensagem}
                                        </Typography>
                                        <Typography sx={{ fontSize: '0.58rem', mt: 0.3, textAlign: 'right', opacity: 0.65, color: msg.de === 'cidadao' ? 'white' : '#64748b' }}>
                                            {formatHora(msg.created_at)}
                                        </Typography>
                                    </Box>
                                </Box>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </Box>

                    {/* Input */}
                    <Box sx={{ p: 1.5, background: 'white', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                        <TextField
                            fullWidth size="small" multiline maxRows={3}
                            placeholder="Digite uma mensagem..."
                            value={texto}
                            onChange={(e) => setTexto(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEnviar(); } }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                        />
                        <IconButton onClick={handleEnviar} disabled={!texto.trim() || enviando}
                            sx={{ background: 'linear-gradient(135deg, #1e40af, #3b82f6)', color: 'white', borderRadius: '12px', width: 42, height: 42, '&:hover': { background: '#1d4ed8' }, '&.Mui-disabled': { background: '#e2e8f0', color: '#94a3b8' } }}>
                            {enviando ? <CircularProgress size={16} color="inherit" /> : <Send size={16} />}
                        </IconButton>
                    </Box>
                </Box>
            )}

            {/* Tab 1: Emergência */}
            {tab === 1 && (
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3, gap: 3 }}>
                    <Box sx={{
                        width: 100, height: 100, borderRadius: '50%',
                        background: emergenciaEnviada ? '#d4edda' : '#fee2e2',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: emergenciaEnviada ? 'none' : '0 0 0 8px rgba(220,38,38,0.1), 0 0 0 16px rgba(220,38,38,0.05)',
                    }}>
                        {emergenciaEnviada ? (
                            <Typography sx={{ fontSize: '2.5rem' }}>✅</Typography>
                        ) : (
                            <AlertTriangle size={48} color="#dc2626" />
                        )}
                    </Box>

                    <Box sx={{ textAlign: 'center' }}>
                        <Typography sx={{ fontWeight: 800, fontSize: '1.2rem', color: emergenciaEnviada ? '#166534' : '#dc2626', mb: 0.5 }}>
                            {emergenciaEnviada ? 'Sinal Enviado!' : 'Precisa de Ajuda?'}
                        </Typography>
                        <Typography sx={{ fontSize: '0.85rem', color: '#64748b', maxWidth: 280, mx: 'auto' }}>
                            {emergenciaEnviada
                                ? 'A equipe médica foi notificada. Mantenha a calma, em breve alguém irá atendê-lo.'
                                : 'Aperte o botão abaixo para enviar um sinal de emergência para toda a equipe médica.'
                            }
                        </Typography>
                    </Box>

                    <Button
                        variant="contained"
                        size="large"
                        onClick={onEmergencia}
                        disabled={emergenciaEnviada}
                        startIcon={<AlertTriangle size={20} />}
                        sx={{
                            minWidth: 220, py: 1.5,
                            background: emergenciaEnviada ? '#6b7280' : 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                            color: 'white',
                            fontWeight: 800, fontSize: '1rem',
                            borderRadius: '14px',
                            textTransform: 'none',
                            boxShadow: emergenciaEnviada ? 'none' : '0 4px 14px rgba(220,38,38,0.3)',
                            '&:hover': { background: '#b91c1c', boxShadow: '0 6px 20px rgba(220,38,38,0.4)' },
                            '&.Mui-disabled': { background: '#6b7280', color: 'white' },
                        }}
                    >
                        {emergenciaEnviada ? '✓ Emergência Enviada' : '🆘 Enviar Emergência'}
                    </Button>

                    {emergenciaEnviada && (
                        <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                            Você poderá enviar novamente em 30 segundos
                        </Typography>
                    )}

                    {/* Profissionais de plantão */}
                    {profissionais.length > 0 && (
                        <Box sx={{ width: '100%', mt: 2 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', mb: 1, color: '#475569' }}>
                                👨‍⚕️ Equipe de Plantão
                            </Typography>
                            {profissionais.slice(0, 5).map(prof => (
                                <Box key={prof.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.8, px: 1, py: 0.8, background: '#f8fafc', borderRadius: '8px' }}>
                                    <Avatar sx={{ width: 28, height: 28, background: cargoColor(prof.cargo).bg, color: cargoColor(prof.cargo).color, fontSize: '0.62rem', fontWeight: 700 }}>
                                        {iniciais(prof.nome)}
                                    </Avatar>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography sx={{ fontWeight: 600, fontSize: '0.78rem', color: '#1e293b' }}>{prof.nome}</Typography>
                                        <Typography sx={{ fontSize: '0.62rem', color: '#64748b' }}>{prof.cargo}{prof.especialidade ? ` · ${prof.especialidade}` : ''}</Typography>
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    )}
                </Box>
            )}
        </Drawer>
    );
};

export default ChatCidadaoDrawer;
