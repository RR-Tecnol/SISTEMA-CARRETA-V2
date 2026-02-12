import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
    Container,
    TextField,
    Button,
    Typography,
    Box,
    Link,
    InputAdornment,
    IconButton,
} from '@mui/material';
import { motion } from 'framer-motion';
import { Lock, User, Eye, EyeOff, Truck } from 'lucide-react';
import { useSnackbar } from 'notistack';
import api from '../../services/api';
import { formatCPF } from '../../utils/formatters';
import { loginSuccess } from '../../store/slices/authSlice';
import { systemTruckTheme } from '../../theme/systemTruckTheme';

const Login: React.FC = () => {
    const dispatch = useDispatch();
    const { enqueueSnackbar } = useSnackbar();

    const [cpf, setCpf] = useState('');
    const [senha, setSenha] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const numbersOnly = value.replace(/\D/g, '');
        const formatted = formatCPF(numbersOnly);
        setCpf(formatted);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!cpf) {
            enqueueSnackbar('Informe o CPF', { variant: 'error' });
            return;
        }

        if (!senha) {
            enqueueSnackbar('Informe a senha', { variant: 'error' });
            return;
        }

        setLoading(true);
        try {
            const cpfLimpo = cpf.replace(/\D/g, '');
            const response = await api.post('/auth/login', { cpf: cpfLimpo, senha });

            dispatch(loginSuccess({
                user: response.data.user,
                token: response.data.token,
            }));

            enqueueSnackbar('Login realizado com sucesso!', { variant: 'success' });

            setTimeout(() => {
                if (response.data.user.tipo === 'admin') {
                    window.location.href = '/admin';
                } else {
                    window.location.href = '/portal';
                }
            }, 500);

        } catch (error: any) {
            console.error('Erro no login:', error);
            const errMsg = error.response?.data?.error || 'Erro ao realizar login. Verifique suas credenciais.';
            enqueueSnackbar(errMsg, { variant: 'error' });
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
                    background: 'radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
                    pointerEvents: 'none',
                },
            }}
        >
            <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
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
                        {/* Logo e Título */}
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
                                    <Truck size={40} color="#fff" />
                                </Box>
                            </motion.div>

                            <Typography
                                variant="h4"
                                sx={{
                                    fontWeight: 700,
                                    background: `linear-gradient(135deg, ${systemTruckTheme.colors.primary}, ${systemTruckTheme.colors.primaryDark})`,
                                    backgroundClip: 'text',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    mb: 1,
                                }}
                            >
                                System Truck
                            </Typography>

                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: 600,
                                    color: systemTruckTheme.colors.text,
                                    mb: 1,
                                }}
                            >
                                Login
                            </Typography>

                            <Typography
                                variant="body2"
                                sx={{
                                    color: systemTruckTheme.colors.textSecondary,
                                }}
                            >
                                Acesse o portal do cidadão com seu CPF
                            </Typography>
                        </Box>

                        {/* Formulário */}
                        <Box component="form" onSubmit={handleSubmit} noValidate>
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <TextField
                                    required
                                    fullWidth
                                    label="CPF"
                                    placeholder="000.000.000-00"
                                    autoFocus
                                    value={cpf}
                                    onChange={handleCpfChange}
                                    margin="normal"
                                    inputProps={{ maxLength: 14 }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <User size={20} color={systemTruckTheme.colors.primary} />
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
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                <TextField
                                    required
                                    fullWidth
                                    type={showPassword ? 'text' : 'password'}
                                    label="Senha"
                                    value={senha}
                                    onChange={(e) => setSenha(e.target.value)}
                                    margin="normal"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Lock size={20} color={systemTruckTheme.colors.primary} />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    edge="end"
                                                    size="small"
                                                >
                                                    {showPassword ? (
                                                        <EyeOff size={20} color={systemTruckTheme.colors.textSecondary} />
                                                    ) : (
                                                        <Eye size={20} color={systemTruckTheme.colors.textSecondary} />
                                                    )}
                                                </IconButton>
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
                                transition={{ delay: 0.5 }}
                            >
                                <Button
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    size="large"
                                    disabled={loading}
                                    sx={{
                                        mt: 3,
                                        mb: 2,
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
                                        transition: 'all 0.3s ease',
                                    }}
                                >
                                    {loading ? 'Entrando...' : 'Entrar'}
                                </Button>
                            </motion.div>

                            <Box sx={{ textAlign: 'center', mt: 2 }}>
                                <Link
                                    component={RouterLink}
                                    to="/recuperar-senha"
                                    sx={{
                                        color: systemTruckTheme.colors.primary,
                                        textDecoration: 'none',
                                        fontWeight: 500,
                                        fontSize: '0.9rem',
                                        '&:hover': {
                                            textDecoration: 'underline',
                                        },
                                    }}
                                >
                                    Esqueci minha senha
                                </Link>
                            </Box>

                            <Box sx={{ textAlign: 'center', mt: 3, pt: 3, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                                <Typography variant="body2" sx={{ color: systemTruckTheme.colors.textSecondary }}>
                                    Não tem cadastro?{' '}
                                    <Link
                                        component={RouterLink}
                                        to="/cadastro"
                                        sx={{
                                            color: systemTruckTheme.colors.primary,
                                            fontWeight: 600,
                                            textDecoration: 'none',
                                            '&:hover': {
                                                textDecoration: 'underline',
                                            },
                                        }}
                                    >
                                        Cadastre-se aqui
                                    </Link>
                                </Typography>
                            </Box>
                        </Box>
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
            </Container>
        </Box>
    );
};

export default Login;
