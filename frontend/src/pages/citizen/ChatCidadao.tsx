import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Typography, Container, Paper, List, ListItemButton,
    CircularProgress, TextField, IconButton, Avatar
} from '@mui/material';
import { MessageCircle, Users, Send } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useSnackbar } from 'notistack';
import { useLocation } from 'react-router-dom';
import api from '../../services/api';
import { getSocket } from '../../utils/socket';
import { systemTruckTheme } from '../../theme/systemTruckTheme';

interface Inscricao {
    id: string;
    acao: { id: string; descricao: string };
    curso_exame: { nome: string };
}

interface Mensagem {
    id: string;
    de: 'cidadao' | 'medico' | 'sistema';
    mensagem: string;
    created_at: string;
    profissional_nome?: string;
    profissional_cargo?: string;
    profissional_especialidade?: string;
}



const ChatCidadao: React.FC = () => {
    const user = useSelector((state: any) => state.auth?.user);
    const { enqueueSnackbar } = useSnackbar();
    
    // Lista de ações
    const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAcao, setSelectedAcao] = useState<Inscricao | null>(null);

    // Chat
    const [mensagens, setMensagens] = useState<Mensagem[]>([]);
    const [loadingMsgs, setLoadingMsgs] = useState(false);
    const [texto, setTexto] = useState('');
    const [enviando, setEnviando] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const location = useLocation();

    // Quando clica em uma ação, abre o chat direto
    const handleSelectAcao = (insc: Inscricao) => {
        setSelectedAcao(insc);
        setLoadingMsgs(true);

        api.get(`/chat/${insc.acao.id}/${user.id}`)
            .then(r => setMensagens(r.data || []))
            .catch(() => {})
            .finally(() => setLoadingMsgs(false));

        api.patch(`/chat/${insc.acao.id}/${user.id}/lido`, { de: 'cidadao' }).catch(() => {});
    };

    useEffect(() => {
        api.get('/inscricoes/me')
            .then(r => {
                const list = r.data || [];
                setInscricoes(list);
                if (location.state?.acaoId) {
                    const found = list.find((i: any) => i.acao.id === location.state.acaoId);
                    if (found) {
                        handleSelectAcao(found);
                    }
                }
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [location.state?.acaoId]);

    // Socket
    useEffect(() => {
        if (!selectedAcao) return;
        const acaoId = selectedAcao.acao.id;
        const cidadaoId = user.id;

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
    }, [selectedAcao, user.id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [mensagens]);

    const handleEnviar = async () => {
        if (!texto.trim() || enviando || !selectedAcao) return;
        setEnviando(true);
        try {
            await api.post(`/chat/${selectedAcao.acao.id}/${user.id}`, { mensagem: texto.trim(), de: 'cidadao' });
            setTexto('');
        } catch {
            enqueueSnackbar('Erro ao enviar mensagem', { variant: 'error' });
        } finally {
            setEnviando(false);
        }
    };

    const formatHora = (iso: string) =>
        new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const formatData = (iso: string) =>
        new Date(iso).toLocaleDateString('pt-BR');

    const cargoIcon = (cargo: string) => {
        const c = cargo.toLowerCase();
        if (c.includes('médic') || c.includes('medic')) return '👨‍⚕️';
        if (c.includes('enfermeir')) return '👩‍⚕️';
        if (c.includes('técnic') || c.includes('tecnic')) return '🧑‍🔬';
        return '👤';
    };

    return (
        <Container maxWidth="md" sx={{ py: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 900, color: systemTruckTheme.colors.primaryDark, mb: 0.5 }}>
                💬 Meus Chats
            </Typography>
            <Typography sx={{ color: systemTruckTheme.colors.textSecondary, fontSize: '0.85rem', mb: 3 }}>
                Selecione uma ação para conversar com a equipe médica
            </Typography>

            {loading ? (
                <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>
            ) : (
                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
                    {/* Lista de ações */}
                    <Paper sx={{ flex: '0 0 280px', borderRadius: '14px', border: `1px solid ${systemTruckTheme.colors.border}`, overflow: 'hidden' }}>
                        <Box sx={{ p: 2, background: systemTruckTheme.gradients.primary }}>
                            <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '0.88rem' }}>
                                <Users size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                                Ações Inscritas
                            </Typography>
                        </Box>
                        <List dense disablePadding>
                            {inscricoes.map(insc => (
                                <ListItemButton key={insc.id}
                                    selected={selectedAcao?.id === insc.id}
                                    onClick={() => handleSelectAcao(insc)}
                                    sx={{ py: 1.5, px: 2, '&.Mui-selected': { background: '#EFF6FF' } }}
                                >
                                    <Box>
                                        <Typography sx={{ fontWeight: 700, fontSize: '0.82rem' }}>
                                            {insc.curso_exame?.nome || 'Ação'}
                                        </Typography>
                                        <Typography sx={{ fontSize: '0.68rem', color: '#64748b' }}>
                                            {insc.acao?.descricao || ''}
                                        </Typography>
                                    </Box>
                                </ListItemButton>
                            ))}
                        </List>
                    </Paper>

                    {/* Lado Direito (Profissionais ou Chat) */}
                    <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: '14px', border: `1px solid ${systemTruckTheme.colors.border}`, overflow: 'hidden', minHeight: 450 }}>
                        {!selectedAcao ? (
                            <Box sx={{ textAlign: 'center', py: 12, color: '#94a3b8', margin: 'auto' }}>
                                <MessageCircle size={48} style={{ opacity: 0.5, marginBottom: 8 }} />
                                <Typography sx={{ fontSize: '0.9rem', fontWeight: 600 }}>Selecione uma ação</Typography>
                                <Typography sx={{ fontSize: '0.8rem', mt: 0.5 }}>para iniciar uma conversa</Typography>
                            </Box>
                        ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                {/* Header do Chat */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 2, background: 'white', borderBottom: '1px solid #e2e8f0' }}>
                                    <Avatar sx={{ width: 36, height: 36, background: '#DBEAFE', color: '#1E40AF', fontWeight: 700 }}>
                                        EQ
                                    </Avatar>
                                    <Box>
                                        <Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }}>Equipe Médica de Plantão</Typography>
                                        <Typography sx={{ fontSize: '0.7rem', color: '#64748b' }}>Ação: {selectedAcao.acao.descricao || selectedAcao.curso_exame?.nome}</Typography>
                                    </Box>
                                </Box>

                                {/* Mensagens */}
                                <Box sx={{ flex: 1, overflowY: 'auto', p: 2, background: '#f1f5f9', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    {loadingMsgs ? (
                                        <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress size={24} /></Box>
                                    ) : mensagens.length === 0 ? (
                                        <Box sx={{ textAlign: 'center', py: 8, color: '#94a3b8' }}>
                                            <MessageCircle size={36} style={{ opacity: 0.5, marginBottom: 8 }} />
                                            <Typography sx={{ fontSize: '0.88rem' }}>Mande um "Olá!" para equipe</Typography>
                                        </Box>
                                    ) : (
                                        mensagens.map((msg, i) => (
                                            <Box key={msg.id || i} sx={{ display: 'flex', justifyContent: msg.de === 'cidadao' ? 'flex-end' : msg.de === 'sistema' ? 'center' : 'flex-start' }}>
                                                <Box sx={{
                                                    maxWidth: msg.de === 'sistema' ? '90%' : '78%', px: 1.8, py: 1.2,
                                                    borderRadius: msg.de === 'cidadao' ? '14px 14px 0 14px' : msg.de === 'sistema' ? '10px' : '14px 14px 14px 0',
                                                    background: msg.de === 'cidadao' ? 'linear-gradient(135deg, #1e40af, #3b82f6)' : msg.de === 'sistema' ? '#fef9c3' : 'white',
                                                    color: msg.de === 'cidadao' ? 'white' : '#1e293b',
                                                    boxShadow: msg.de === 'sistema' ? 'none' : '0 1px 4px rgba(0,0,0,0.06)',
                                                }}>
                                                    {msg.de === 'medico' && msg.profissional_nome && (
                                                        <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, color: '#3b82f6', mb: 0.3 }}>
                                                            {cargoIcon(msg.profissional_cargo || '')} {msg.profissional_nome}
                                                        </Typography>
                                                    )}
                                                    {msg.de === 'cidadao' && (
                                                        <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', mb: 0.3 }}>
                                                            Você
                                                        </Typography>
                                                    )}
                                                    {msg.de === 'sistema' && (
                                                        <Typography sx={{ fontSize: '0.62rem', fontWeight: 600, color: '#92400e', mb: 0.2 }}>Sistema</Typography>
                                                    )}
                                                    <Typography sx={{ fontSize: '0.88rem', lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>{msg.mensagem}</Typography>
                                                    <Typography sx={{ fontSize: '0.6rem', mt: 0.4, textAlign: 'right', opacity: 0.7, color: msg.de === 'cidadao' ? 'rgba(255,255,255,0.8)' : '#64748b' }}>
                                                        {formatData(msg.created_at)} • {formatHora(msg.created_at)}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        ))
                                    )}
                                    <div ref={messagesEndRef} />
                                </Box>

                                {/* Input */}
                                <Box sx={{ p: 2, background: 'white', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                                    <TextField
                                        fullWidth size="small" multiline maxRows={3}
                                        placeholder="Digite sua mensagem para a equipe..."
                                        value={texto}
                                        onChange={(e) => setTexto(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEnviar(); } }}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', background: '#f8fafc' } }}
                                    />
                                    <IconButton onClick={handleEnviar} disabled={!texto.trim() || enviando}
                                        sx={{ 
                                            background: 'linear-gradient(135deg, #1e40af, #3b82f6)', color: 'white', 
                                            borderRadius: '12px', width: 44, height: 44, 
                                            '&:hover': { background: '#1d4ed8' }, 
                                            '&.Mui-disabled': { background: '#e2e8f0', color: '#94a3b8' } 
                                        }}>
                                        {enviando ? <CircularProgress size={20} color="inherit" /> : <Send size={20} />}
                                    </IconButton>
                                </Box>
                            </Box>
                        )}
                    </Paper>
                </Box>
            )}
        </Container>
    );
};

export default ChatCidadao;
