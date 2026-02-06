import React, { useState } from 'react';
import { Box, Paper, Typography, TextField, Button } from '@mui/material';
import api from '../../services/api';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';

const RedefinirSenha: React.FC = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();

    const [senha, setSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [loading, setLoading] = useState(false);

    // Redirect if no token
    React.useEffect(() => {
        if (!token) {
            enqueueSnackbar('Token inválido ou ausente.', { variant: 'error' });
            navigate('/login');
        }
    }, [token, navigate, enqueueSnackbar]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (senha !== confirmarSenha) {
            enqueueSnackbar('As senhas não coincidem.', { variant: 'warning' });
            return;
        }

        if (senha.length < 6) {
            enqueueSnackbar('A senha deve ter pelo menos 6 caracteres.', { variant: 'warning' });
            return;
        }

        setLoading(true);

        try {
            await api.post('/auth/reset-password', { token, senha });
            enqueueSnackbar('Senha redefinida com sucesso!', { variant: 'success' });
            navigate('/login');
        } catch (error: any) {
            console.error('Erro ao redefinir senha:', error);
            const msg = error.response?.data?.error || 'Erro ao redefinir senha. O link pode ter expirado.';
            enqueueSnackbar(msg, { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    if (!token) return null;

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)',
                p: 2,
            }}
        >
            <Paper
                elevation={6}
                sx={{
                    p: 4,
                    width: '100%',
                    maxWidth: 400,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                    borderRadius: 2,
                }}
            >
                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" component="h1" fontWeight="bold" color="primary">
                        Redefinir Senha
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Crie uma nova senha para sua conta.
                    </Typography>
                </Box>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <TextField
                        label="Nova Senha"
                        type="password"
                        variant="outlined"
                        fullWidth
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        required
                        disabled={loading}
                    />
                    <TextField
                        label="Confirmar Senha"
                        type="password"
                        variant="outlined"
                        fullWidth
                        value={confirmarSenha}
                        onChange={(e) => setConfirmarSenha(e.target.value)}
                        required
                        disabled={loading}
                    />

                    <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        fullWidth
                        disabled={loading}
                        sx={{ mt: 1 }}
                    >
                        {loading ? 'Redefinindo...' : 'Alterar Senha'}
                    </Button>
                </form>
            </Paper>
        </Box>
    );
};

export default RedefinirSenha;
