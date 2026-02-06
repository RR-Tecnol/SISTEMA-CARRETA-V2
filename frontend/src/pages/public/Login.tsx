import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    Box,
    Link,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import api from '../../services/api';
import { formatCPF } from '../../utils/formatters';
import { loginSuccess } from '../../store/slices/authSlice';

const Login: React.FC = () => {
    const dispatch = useDispatch();
    const { enqueueSnackbar } = useSnackbar();

    const [cpf, setCpf] = useState('');
    const [senha, setSenha] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Remove tudo que não é número
        const numbersOnly = value.replace(/\D/g, '');
        // Aplica a máscara
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
            // Remove a máscara do CPF antes de enviar
            const cpfLimpo = cpf.replace(/\D/g, '');
            const response = await api.post('/auth/login', { cpf: cpfLimpo, senha });

            // Salvar no Redux e LocalStorage
            dispatch(loginSuccess({
                user: response.data.user,
                token: response.data.token,
            }));

            enqueueSnackbar('Login realizado com sucesso!', { variant: 'success' });

            // Redirecionamento forçado para garantir estado limpo
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
        <Container maxWidth="sm" sx={{ py: 8 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom align="center" color="primary">
                    System Truck
                </Typography>

                <Typography variant="h5" gutterBottom align="center" sx={{ mb: 3 }}>
                    Login
                </Typography>

                <Typography variant="body2" color="text.secondary" align="center" paragraph>
                    Acesse o portal do cidadão com seu CPF
                </Typography>

                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }} noValidate>
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
                    />

                    <TextField
                        required
                        fullWidth
                        type="password"
                        label="Senha"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        margin="normal"
                    />

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        size="large"
                        sx={{ mt: 3, mb: 2 }}
                        disabled={loading}
                    >
                        {loading ? 'Entrando...' : 'Entrar'}
                    </Button>

                    <Box sx={{ textAlign: 'center', mt: 2 }}>
                        <Link
                            component={RouterLink}
                            to="/recuperar-senha"
                            variant="body2"
                        >
                            Esqueci minha senha
                        </Link>
                    </Box>

                    <Box sx={{ textAlign: 'center', mt: 3 }}>
                        <Typography variant="body2">
                            Não tem cadastro?{' '}
                            <Link component={RouterLink} to="/cadastro" fontWeight="bold">
                                Cadastre-se aqui
                            </Link>
                        </Typography>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
};

export default Login;
