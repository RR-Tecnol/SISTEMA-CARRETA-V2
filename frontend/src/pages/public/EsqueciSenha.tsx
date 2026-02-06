import React, { useState } from 'react';
import { Box, Paper, Typography, TextField, Button, Alert, Link } from '@mui/material';
import api from '../../services/api'; // Adjust path if needed
import { Link as RouterLink } from 'react-router-dom';
import { useSnackbar } from 'notistack';

const EsqueciSenha: React.FC = () => {
    const [identifier, setIdentifier] = useState(''); // Email or CPF
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const { enqueueSnackbar } = useSnackbar();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setSuccessMessage('');

        try {
            // Determine if it looks like email or CPF
            const isEmail = identifier.includes('@');
            const payload = isEmail ? { email: identifier } : { cpf: identifier };

            const response = await api.post('/auth/forgot-password', payload);
            setSuccessMessage(response.data.message);
            enqueueSnackbar('Solicitação enviada!', { variant: 'success' });
        } catch (error: any) {
            console.error('Erro ao solicitar recuperação:', error);
            // Even on error (e.g. user not found), we might want to show vague success or specific error depending on policy.
            // Backend currently returns 200 with generic message if user not found (security).
            // But if it's a 500 or network error:
            const msg = error.response?.data?.error || 'Erro ao processar solicitação. Tente novamente.';
            enqueueSnackbar(msg, { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

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
                        Esqueci a Senha
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Digite seu e-mail ou CPF cadastrado para receber o link de redefinição.
                    </Typography>
                </Box>

                {successMessage ? (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        {successMessage}
                        <br />
                        <Link component={RouterLink} to="/login" sx={{ display: 'block', mt: 1 }}>
                            Voltar para o Login
                        </Link>
                    </Alert>
                ) : (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <TextField
                            label="E-mail ou CPF"
                            variant="outlined"
                            fullWidth
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            required
                            disabled={loading}
                        />

                        <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            fullWidth
                            disabled={loading || !identifier.trim()}
                            sx={{ mt: 1 }}
                        >
                            {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
                        </Button>
                    </form>
                )}

                {!successMessage && (
                    <Box sx={{ textAlign: 'center' }}>
                        <Link component={RouterLink} to="/login" variant="body2">
                            Voltar para o Login
                        </Link>
                    </Box>
                )}
            </Paper>
        </Box>
    );
};

export default EsqueciSenha;
