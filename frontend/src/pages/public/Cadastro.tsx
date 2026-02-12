import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    Box,
    Grid,
    MenuItem,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import InputMask from 'react-input-mask';
import TermoLGPD, { ConsentData } from '../../components/common/TermoLGPD';
import api from '../../services/api';
import { loginSuccess } from '../../store/slices/authSlice';

const Cadastro: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { enqueueSnackbar } = useSnackbar();

    const [showTermo, setShowTermo] = useState(false);
    const [formData, setFormData] = useState({
        cpf: '',
        nome_completo: '',
        nome_mae: '',
        data_nascimento: '',
        telefone: '',
        email: '',
        senha: '',
        confirmarSenha: '',
        municipio: '',
        estado: '',
        genero: '',
        raca: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate form
        if (!formData.cpf || !formData.nome_completo || !formData.email) {
            enqueueSnackbar('Preencha todos os campos obrigatórios', { variant: 'error' });
            return;
        }

        // Validate password
        if (!formData.senha) {
            enqueueSnackbar('A senha é obrigatória', { variant: 'error' });
            return;
        }

        if (formData.senha.length < 6) {
            enqueueSnackbar('A senha deve ter no mínimo 6 caracteres', { variant: 'error' });
            return;
        }

        if (formData.senha !== formData.confirmarSenha) {
            enqueueSnackbar('As senhas não coincidem', { variant: 'error' });
            return;
        }

        // Show LGPD term
        setShowTermo(true);
    };

    const handleAcceptTermo = async (consentData: ConsentData) => {
        try {
            // Remove confirmarSenha before sending to API
            const { confirmarSenha, ...dataToSend } = formData;
            const cadastroData = {
                ...dataToSend,
                consentimento_lgpd: consentData.consentimento_lgpd,
            };

            const response = await api.post('/auth/cadastro', cadastroData);

            console.log('Cadastro response:', response.data);

            // Store auth data
            dispatch(loginSuccess({
                user: response.data.user,
                token: response.data.token,
            }));

            enqueueSnackbar('Cadastro realizado com sucesso!', { variant: 'success' });

            // Always redirect to portal for new registrations (never admin)
            console.log('Redirecting to /portal');
            navigate('/portal');
        } catch (error: any) {
            console.error('Cadastro error:', error);
            const errorMessage = error.response?.data?.error || 'Erro ao realizar cadastro';
            enqueueSnackbar(errorMessage, { variant: 'error' });
        }
    };

    const handleDeclineTermo = () => {
        setShowTermo(false);
        enqueueSnackbar(
            'Para se cadastrar, você deve aceitar os termos LGPD',
            { variant: 'warning' }
        );
    };

    const estados = [
        'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
        'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
        'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
    ];

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h4" gutterBottom align="center">
                    Cadastro de Cidadão
                </Typography>

                <Typography variant="body2" color="text.secondary" align="center" paragraph>
                    Preencha os dados abaixo para se cadastrar no sistema
                </Typography>

                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                            <InputMask
                                mask="999.999.999-99"
                                value={formData.cpf}
                                onChange={handleChange}
                            >
                                {(inputProps: any) => (
                                    <TextField
                                        {...inputProps}
                                        required
                                        fullWidth
                                        label="CPF"
                                        name="cpf"
                                        placeholder="000.000.000-00"
                                    />
                                )}
                            </InputMask>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                required
                                fullWidth
                                label="Nome Completo"
                                name="nome_completo"
                                value={formData.nome_completo}
                                onChange={handleChange}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Nome da Mãe"
                                name="nome_mae"
                                value={formData.nome_mae}
                                onChange={handleChange}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                required
                                fullWidth
                                type="date"
                                label="Data de Nascimento"
                                name="data_nascimento"
                                value={formData.data_nascimento}
                                onChange={handleChange}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                select
                                fullWidth
                                label="Gênero"
                                name="genero"
                                value={formData.genero}
                                onChange={handleChange}
                            >
                                <MenuItem value="">Prefiro não informar</MenuItem>
                                <MenuItem value="masculino">Masculino</MenuItem>
                                <MenuItem value="feminino">Feminino</MenuItem>
                                <MenuItem value="outro">Outro</MenuItem>
                            </TextField>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                select
                                fullWidth
                                label="Raça/Cor"
                                name="raca"
                                value={formData.raca}
                                onChange={handleChange}
                            >
                                <MenuItem value="">Prefiro não informar</MenuItem>
                                <MenuItem value="branca">Branca</MenuItem>
                                <MenuItem value="preta">Preta</MenuItem>
                                <MenuItem value="parda">Parda</MenuItem>
                                <MenuItem value="amarela">Amarela</MenuItem>
                                <MenuItem value="indigena">Indígena</MenuItem>
                            </TextField>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <InputMask
                                mask="(99) 99999-9999"
                                value={formData.telefone}
                                onChange={handleChange}
                            >
                                {(inputProps: any) => (
                                    <TextField
                                        {...inputProps}
                                        required
                                        fullWidth
                                        label="Telefone"
                                        name="telefone"
                                        placeholder="(00) 00000-0000"
                                    />
                                )}
                            </InputMask>
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                required
                                fullWidth
                                type="email"
                                label="E-mail"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                required
                                fullWidth
                                type="password"
                                label="Senha"
                                name="senha"
                                value={formData.senha}
                                onChange={handleChange}
                                helperText="Mínimo de 6 caracteres"
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                required
                                fullWidth
                                type="password"
                                label="Confirmar Senha"
                                name="confirmarSenha"
                                value={formData.confirmarSenha}
                                onChange={handleChange}
                                error={formData.senha !== formData.confirmarSenha && formData.confirmarSenha !== ''}
                                helperText={
                                    formData.senha !== formData.confirmarSenha && formData.confirmarSenha !== ''
                                        ? 'As senhas não coincidem'
                                        : ''
                                }
                            />
                        </Grid>

                        <Grid item xs={12} sm={8}>
                            <TextField
                                required
                                fullWidth
                                label="Município"
                                name="municipio"
                                value={formData.municipio}
                                onChange={handleChange}
                            />
                        </Grid>

                        <Grid item xs={12} sm={4}>
                            <TextField
                                required
                                select
                                fullWidth
                                label="Estado"
                                name="estado"
                                value={formData.estado}
                                onChange={handleChange}
                            >
                                {estados.map((uf) => (
                                    <MenuItem key={uf} value={uf}>
                                        {uf}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                    </Grid>

                    <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
                        <Button
                            variant="outlined"
                            onClick={() => navigate('/login')}
                        >
                            Já tenho cadastro
                        </Button>

                        <Button
                            type="submit"
                            variant="contained"
                            size="large"
                        >
                            Prosseguir
                        </Button>
                    </Box>
                </Box>
            </Paper>

            {/* LGPD Term Dialog */}
            <TermoLGPD
                open={showTermo}
                onAccept={handleAcceptTermo}
                onDecline={handleDeclineTermo}
            />
        </Container>
    );
};

export default Cadastro;
