import React, { useState, useEffect, useRef } from 'react';
import {
    Drawer, Box, Typography, TextField, IconButton,
    CircularProgress, Tooltip,
} from '@mui/material';
import { X, Send } from 'lucide-react';
import { useSnackbar } from 'notistack';
import api from '../../services/api';
import { getSocket } from '../../utils/socket';
import { expressoTheme } from '../../theme/expressoTheme';

interface Mensagem {
    id: string;
    de: 'cidadao' | 'medico' | 'sistema';
    mensagem: string;
    lida: boolean;
    created_at: string;
}

interface ChatMedicoProps {
    open: boolean;
    onClose: () => void;
    acaoId: string;
    cidadaoId: string;
    nomeCidadao: string;
    medicoId: string;
}

const ChatMedico: React.FC<ChatMedicoProps> = ({
    open, onClose, acaoId, cidadaoId, nomeCidadao, medicoId: _medicoId,
}) => {
    const { enqueueSnackbar } = useSnackbar();
    const [mensagens, setMensagens] = useState<Mensagem[]>([]);
    const [texto, setTexto] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Carregar histórico + entrar na sala
    useEffect(() => {
        if (!open) return;
        setLoading(true);
        api.get(`/chat/${acaoId}/${cidadaoId}`)
            .then((r) => setMensagens(r.data || []))
            .catch(() => {})
            .finally(() => setLoading(false));

        // Marcar mensagens do cidadão como lidas
        api.patch(`/chat/${acaoId}/${cidadaoId}/lido`, { de: 'medico' }).catch(() => {});

        // Entrar na sala via Socket.IO
        const socket = getSocket();
        socket.emit('join_chat', { acao_id: acaoId, cidadao_id: cidadaoId });

        const handleMsg = (msg: Mensagem & { acao_id: string; cidadao_id: string }) => {
            if (msg.acao_id === acaoId && msg.cidadao_id === cidadaoId) {
                setMensagens((prev) => [...prev, msg]);
                if (msg.de === 'cidadao') {
                    api.patch(`/chat/${acaoId}/${cidadaoId}/lido`, { de: 'medico' }).catch(() => {});
                }
            }
        };
        socket.on('chat_msg', handleMsg);

        return () => {
            socket.off('chat_msg', handleMsg);
            socket.emit('leave_chat', { acao_id: acaoId, cidadao_id: cidadaoId });
        };
    }, [open, acaoId, cidadaoId]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [mensagens]);

    // Enviar
    const handleEnviar = async () => {
        if (!texto.trim() || enviando) return;
        setEnviando(true);
        try {
            await api.post(`/chat/${acaoId}/${cidadaoId}`, { mensagem: texto.trim(), de: 'medico' });
            setTexto('');
        } catch {
            enqueueSnackbar('Erro ao enviar mensagem', { variant: 'error' });
        } finally {
            setEnviando(false);
        }
    };

    const formatHora = (iso: string) =>
        new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: { width: { xs: '100%', sm: 400 }, display: 'flex', flexDirection: 'column' },
            }}
        >
            {/* Header */}
            <Box sx={{
                background: expressoTheme.gradients.primary,
                p: 2, display: 'flex', alignItems: 'center', gap: 1.5,
            }}>
                <Typography sx={{ flex: 1, color: 'white', fontWeight: 800, fontSize: '0.95rem' }}>
                    💬 Chat com {nomeCidadao.split(' ')[0]}
                </Typography>
                <Tooltip title="Fechar">
                    <IconButton onClick={onClose} sx={{ color: 'white' }}>
                        <X size={18} />
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Mensagens */}
            <Box sx={{
                flex: 1, overflowY: 'auto', p: 2,
                background: '#f1f5f9',
                display: 'flex', flexDirection: 'column', gap: 1,
            }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress size={24} />
                    </Box>
                ) : mensagens.length === 0 ? (
                    <Typography sx={{ textAlign: 'center', color: '#94a3b8', py: 6, fontSize: '0.85rem' }}>
                        Nenhuma mensagem ainda. Diga olá! 👋
                    </Typography>
                ) : (
                    mensagens.map((msg, i) => (
                        <Box
                            key={msg.id || i}
                            sx={{
                                display: 'flex',
                                justifyContent: msg.de === 'medico' ? 'flex-end'
                                    : msg.de === 'sistema' ? 'center' : 'flex-start',
                            }}
                        >
                            <Box sx={{
                                maxWidth: msg.de === 'sistema' ? '90%' : '78%',
                                px: 1.8, py: 1,
                                borderRadius: msg.de === 'medico'
                                    ? '14px 14px 0 14px'
                                    : msg.de === 'cidadao'
                                        ? '14px 14px 14px 0'
                                        : '10px',
                                background: msg.de === 'medico'
                                    ? expressoTheme.gradients.primary
                                    : msg.de === 'sistema'
                                        ? '#fef9c3'
                                        : 'white',
                                color: msg.de === 'medico' ? 'white' : '#1e293b',
                                boxShadow: msg.de === 'sistema' ? 'none' : '0 1px 4px rgba(0,0,0,0.06)',
                            }}>
                                {msg.de === 'sistema' && (
                                    <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: '#92400e', mb: 0.2 }}>
                                        Sistema
                                    </Typography>
                                )}
                                <Typography sx={{
                                    fontSize: msg.de === 'sistema' ? '0.75rem' : '0.85rem',
                                    lineHeight: 1.45,
                                    fontStyle: msg.de === 'sistema' ? 'italic' : 'normal',
                                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                                }}>
                                    {msg.mensagem}
                                </Typography>
                                <Typography sx={{
                                    fontSize: '0.6rem', mt: 0.3, textAlign: 'right',
                                    opacity: 0.65, color: msg.de === 'medico' ? 'white' : '#64748b',
                                }}>
                                    {formatHora(msg.created_at)}
                                </Typography>
                            </Box>
                        </Box>
                    ))
                )}
                <div ref={messagesEndRef} />
            </Box>

            {/* Footer: input + enviar */}
            <Box sx={{
                p: 1.5, background: 'white',
                borderTop: '1px solid #e2e8f0',
                display: 'flex', gap: 1, alignItems: 'flex-end',
            }}>
                <TextField
                    fullWidth size="small" multiline maxRows={4}
                    placeholder="Digite uma mensagem..."
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleEnviar();
                        }
                    }}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                            '&:hover fieldset': { borderColor: expressoTheme.colors.primary },
                            '&.Mui-focused fieldset': { borderColor: expressoTheme.colors.primary },
                        },
                    }}
                />
                <IconButton
                    onClick={handleEnviar}
                    disabled={!texto.trim() || enviando}
                    sx={{
                        background: expressoTheme.gradients.primary,
                        color: 'white',
                        borderRadius: '12px',
                        width: 42, height: 42,
                        '&:hover': { background: expressoTheme.colors.primaryDark },
                        '&.Mui-disabled': { background: '#e2e8f0', color: '#94a3b8' },
                    }}
                >
                    {enviando ? <CircularProgress size={16} color="inherit" /> : <Send size={16} />}
                </IconButton>
            </Box>
        </Drawer>
    );
};

export default ChatMedico;
