import React, { useState, useEffect, useRef } from 'react';
import {
    Drawer, Box, Typography, TextField, IconButton,
    CircularProgress, Tooltip, Avatar,
} from '@mui/material';
import { X, Send } from 'lucide-react';
import { useSnackbar } from 'notistack';
import api from '../../services/api';
import { getSocket } from '../../utils/socket';
import { expressoTheme } from '../../theme/expressoTheme';

interface MensagemEquipe {
    id: string;
    remetente_id: string;
    destinatario_id: string;
    mensagem: string;
    lida: boolean;
    created_at: string;
}

interface ChatEquipeProps {
    open: boolean;
    onClose: () => void;
    meuId: string;
    colega: { id: string; nome: string; cargo: string; especialidade?: string };
    acaoId?: string;
}

const ChatEquipe: React.FC<ChatEquipeProps> = ({ open, onClose, meuId, colega, acaoId }) => {
    const { enqueueSnackbar } = useSnackbar();
    const [mensagens, setMensagens] = useState<MensagemEquipe[]>([]);
    const [texto, setTexto] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        setLoading(true);
        const params: any = {};
        if (acaoId) params.acao_id = acaoId;
        api.get(`/chat-equipe/${colega.id}`, { params })
            .then(r => setMensagens(r.data || []))
            .catch(() => {})
            .finally(() => setLoading(false));

        // Socket.IO
        const socket = getSocket();
        const roomKey = [meuId, colega.id].sort().join(':');
        socket.emit('join_chat_equipe', roomKey);

        const handler = (msg: MensagemEquipe) => {
            setMensagens(prev => [...prev, msg]);
        };
        socket.on('chat_equipe_msg', handler);

        return () => {
            socket.off('chat_equipe_msg', handler);
            socket.emit('leave_chat_equipe', roomKey);
        };
    }, [open, colega.id, meuId, acaoId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [mensagens]);

    const handleEnviar = async () => {
        if (!texto.trim() || enviando) return;
        setEnviando(true);
        try {
            await api.post(`/chat-equipe/${colega.id}`, { mensagem: texto.trim(), acao_id: acaoId || null });
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

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            PaperProps={{ sx: { width: { xs: '100%', sm: 400 }, display: 'flex', flexDirection: 'column' } }}
        >
            {/* Header */}
            <Box sx={{ background: expressoTheme.gradients.primary, p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ width: 36, height: 36, background: 'rgba(255,255,255,0.2)', fontWeight: 700, fontSize: '0.82rem' }}>
                    {iniciais(colega.nome)}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                    <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '0.92rem', lineHeight: 1.2 }}>
                        {colega.nome}
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.72rem' }}>
                        {colega.cargo}{colega.especialidade ? ` · ${colega.especialidade}` : ''}
                    </Typography>
                </Box>
                <Tooltip title="Fechar">
                    <IconButton onClick={onClose} sx={{ color: 'white' }}><X size={18} /></IconButton>
                </Tooltip>
            </Box>

            {/* Mensagens */}
            <Box sx={{ flex: 1, overflowY: 'auto', p: 2, background: '#f1f5f9', display: 'flex', flexDirection: 'column', gap: 1 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} /></Box>
                ) : mensagens.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 6, color: '#94a3b8' }}>
                        <Typography sx={{ fontSize: '0.85rem' }}>Nenhuma mensagem ainda</Typography>
                        <Typography sx={{ fontSize: '0.75rem', mt: 0.5 }}>Inicie a conversa com {colega.nome.split(' ')[0]} 👋</Typography>
                    </Box>
                ) : (
                    mensagens.map((msg, i) => {
                        const isMine = msg.remetente_id === meuId;
                        return (
                            <Box key={msg.id || i} sx={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                                <Box sx={{
                                    maxWidth: '78%', px: 1.8, py: 1,
                                    borderRadius: isMine ? '14px 14px 0 14px' : '14px 14px 14px 0',
                                    background: isMine ? expressoTheme.gradients.primary : 'white',
                                    color: isMine ? 'white' : '#1e293b',
                                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                                }}>
                                    <Typography sx={{ fontSize: '0.85rem', lineHeight: 1.45, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                        {msg.mensagem}
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.6rem', mt: 0.3, textAlign: 'right', opacity: 0.65, color: isMine ? 'white' : '#64748b' }}>
                                        {formatHora(msg.created_at)}
                                    </Typography>
                                </Box>
                            </Box>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </Box>

            {/* Input */}
            <Box sx={{ p: 1.5, background: 'white', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                <TextField
                    fullWidth size="small" multiline maxRows={4}
                    placeholder="Digite uma mensagem..."
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEnviar(); } }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', '&:hover fieldset': { borderColor: expressoTheme.colors.primary }, '&.Mui-focused fieldset': { borderColor: expressoTheme.colors.primary } } }}
                />
                <IconButton onClick={handleEnviar} disabled={!texto.trim() || enviando}
                    sx={{ background: expressoTheme.gradients.primary, color: 'white', borderRadius: '12px', width: 42, height: 42, '&:hover': { background: expressoTheme.colors.primaryDark }, '&.Mui-disabled': { background: '#e2e8f0', color: '#94a3b8' } }}>
                    {enviando ? <CircularProgress size={16} color="inherit" /> : <Send size={16} />}
                </IconButton>
            </Box>
        </Drawer>
    );
};

export default ChatEquipe;
