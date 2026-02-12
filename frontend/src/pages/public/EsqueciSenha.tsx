import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Link, InputAdornment } from '@mui/material';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, KeyRound, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import { Link as RouterLink } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { systemTruckTheme } from '../../theme/systemTruckTheme';

const EsqueciSenha: React.FC = () => {
    const [identifier, setIdentifier] = useState('');
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const { enqueueSnackbar } = useSnackbar();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setSuccessMessage('');

        try {
            const isEmail = identifier.includes('@');
            const payload = isEmail ? { email: identifier } : { cpf: identifier };

            const response = await api.post('/auth/forgot-password', payload);
            setSuccessMessage(response.data.message);
            enqueueSnackbar('Solicitação enviada!', { variant: 'success' });
        } catch (error: any) {
            console.error('Erro ao solicitar recuperação:', error);
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
                background: `linear-gradient(135deg, ${systemTruckTheme.colors.primary} 0%, ${systemTruckTheme.colors.primaryDark} 100%)`,
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
                    pointerEvents: 'none',
                },
            }}
        >
            <Box sx={{ maxWidth: 480, width: '100%', px: 2, position: 'relative', zIndex: 1 }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Box
                        sx={{
                            background: 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(20px)',
                            borderRadius: '24px',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                            p: { xs: 3, sm: 5 },
                        }}
                    >
                        {/* Ícone e Título */}
                        <Box sx={{ textAlign: 'center', mb: 4 }}>
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                            >
                                <Box
                                    sx={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: 80,
                                        height: 80,
                                        borderRadius: '20px',
                                        background: `linear-gradient(135deg, ${systemTruckTheme.colors.primary}, ${systemTruckTheme.colors.primaryDark})`,
                                        mb: 2,
                                        boxShadow: `0 8px 24px ${systemTruckTheme.colors.primary}40`,
                                    }}
                                >
                                    <KeyRound size={40} color="#fff" />
                                </Box>
                            </motion.div>

                            <Typography
                                variant="h5"
                                sx={{
                                    fontWeight: 700,
                                    background: `linear-gradient(135deg, ${systemTruckTheme.colors.primary}, ${systemTruckTheme.colors.primaryDark})`,
                                    backgroundClip: 'text',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    mb: 1,
                                }}
                            >
                                Esqueci a Senha
                            </Typography>

                            <Typography
                                variant="body2"
                                sx={{
                                    color: systemTruckTheme.colors.textSecondary,
                                    px: 2,
                                }}
                            >
                                Digite seu e-mail ou CPF cadastrado para receber o link de redefinição.
                            </Typography>
                        </Box>

                        {successMessage ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Box
                                    sx={{
                                        background: 'rgba(16, 185, 129, 0.1)',
                                        border: '1px solid rgba(16, 185, 129, 0.3)',
                                        borderRadius: '12px',
                                        p: 3,
                                        textAlign: 'center',
                                    }}
                                >
                                    <CheckCircle size={48} color={systemTruckTheme.colors.success} style={{ marginBottom: 16 }} />
                                    <Typography
                                        variant="body1"
                                        sx={{
                                            color: systemTruckTheme.colors.text,
                                            mb: 2,
                                            fontWeight: 500,
                                        }}
                                    >
                                        {successMessage}
                                    </Typography>
                                    <Button
                                        component={RouterLink}
                                        to="/login"
                                        variant="contained"
                                        fullWidth
                                        startIcon={<ArrowLeft size={20} />}
                                        sx={{
                                            mt: 2,
                                            borderRadius: '12px',
                                            py: 1.5,
                                            background: `linear-gradient(135deg, ${systemTruckTheme.colors.primary}, ${systemTruckTheme.colors.primaryDark})`,
                                            fontWeight: 600,
                                            textTransform: 'none',
                                            boxShadow: `0 4px 16px ${systemTruckTheme.colors.primary}40`,
                                            '&:hover': {
                                                background: `linear-gradient(135deg, ${systemTruckTheme.colors.primaryDark}, ${systemTruckTheme.colors.primary})`,
                                                transform: 'translateY(-2px)',
                                                boxShadow: `0 6px 20px ${systemTruckTheme.colors.primary}60`,
                                            },
                                            transition: 'all 0.3s ease',
                                        }}
                                    >
                                        Voltar para o Login
                                    </Button>
                                </Box>
                            </motion.div>
                        ) : (
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <TextField
                                        label="E-mail ou CPF"
                                        variant="outlined"
                                        fullWidth
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                        required
                                        disabled={loading}
                                        placeholder="seu@email.com ou 000.000.000-00"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Mail size={20} color={systemTruckTheme.colors.primary} />
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: '12px',
                                                '&:hover fieldset': {
                                                    borderColor: systemTruckTheme.colors.primary,
                                                },
                                                '&.Mui-focused fieldset': {
                                                    borderColor: systemTruckTheme.colors.primary,
                                                },
                                            },
                                        }}
                                    />
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        size="large"
                                        fullWidth
                                        disabled={loading || !identifier.trim()}
                                        sx={{
                                            mt: 1,
                                            borderRadius: '12px',
                                            py: 1.5,
                                            background: `linear-gradient(135deg, ${systemTruckTheme.colors.primary}, ${systemTruckTheme.colors.primaryDark})`,
                                            fontWeight: 600,
                                            fontSize: '1rem',
                                            textTransform: 'none',
                                            boxShadow: `0 4px 16px ${systemTruckTheme.colors.primary}40`,
                                            '&:hover': {
                                                background: `linear-gradient(135deg, ${systemTruckTheme.colors.primaryDark}, ${systemTruckTheme.colors.primary})`,
                                                transform: 'translateY(-2px)',
                                                boxShadow: `0 6px 20px ${systemTruckTheme.colors.primary}60`,
                                            },
                                            '&:disabled': {
                                                background: 'rgba(0, 0, 0, 0.12)',
                                            },
                                            transition: 'all 0.3s ease',
                                        }}
                                    >
                                        {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
                                    </Button>
                                </motion.div>

                                <Box sx={{ textAlign: 'center', mt: 2 }}>
                                    <Link
                                        component={RouterLink}
                                        to="/login"
                                        sx={{
                                            color: systemTruckTheme.colors.primary,
                                            textDecoration: 'none',
                                            fontWeight: 500,
                                            fontSize: '0.9rem',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 0.5,
                                            '&:hover': {
                                                textDecoration: 'underline',
                                            },
                                        }}
                                    >
                                        <ArrowLeft size={16} />
                                        Voltar para o Login
                                    </Link>
                                </Box>
                            </form>
                        )}
                    </Box>
                </motion.div>

                {/* Footer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                >
                    <Typography
                        variant="caption"
                        sx={{
                            display: 'block',
                            textAlign: 'center',
                            color: 'rgba(255, 255, 255, 0.8)',
                            mt: 3,
                        }}
                    >
                        © 2026 System Truck. Todos os direitos reservados.
                    </Typography>
                </motion.div>
            </Box>
        </Box>
    );
};

export default EsqueciSenha;
