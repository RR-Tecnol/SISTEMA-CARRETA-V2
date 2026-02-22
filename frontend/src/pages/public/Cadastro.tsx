import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
    TextField,
    Button,
    Typography,
    Box,
    Grid,
    MenuItem,
    InputAdornment,
    IconButton,
} from '@mui/material';
import { motion } from 'framer-motion';
import {
    User,
    Mail,
    Lock,
    Phone,
    MapPin,
    Calendar,
    Eye,
    EyeOff,
    UserPlus,
    ArrowLeft,
    CreditCard,
} from 'lucide-react';
import { useSnackbar } from 'notistack';
import InputMask from 'react-input-mask';
import TermoLGPD, { ConsentData } from '../../components/common/TermoLGPD';
import api from '../../services/api';
import { loginSuccess } from '../../store/slices/authSlice';
import { systemTruckTheme } from '../../theme/systemTruckTheme';

const Cadastro: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { enqueueSnackbar } = useSnackbar();

    const [showTermo, setShowTermo] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
        cartao_sus: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.cpf || !formData.nome_completo || !formData.email) {
            enqueueSnackbar('Preencha todos os campos obrigatórios', { variant: 'error' });
            return;
        }

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

        setShowTermo(true);
    };

    const handleAcceptTermo = async (consentData: ConsentData) => {
        try {
            const { confirmarSenha, ...dataToSend } = formData;
            const cadastroData = {
                ...dataToSend,
                consentimento_lgpd: consentData.consentimento_lgpd,
            };

            const response = await api.post('/auth/cadastro', cadastroData);

            dispatch(loginSuccess({
                user: response.data.user,
                token: response.data.token,
            }));

            enqueueSnackbar('Cadastro realizado com sucesso!', { variant: 'success' });
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
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `linear-gradient(135deg, ${systemTruckTheme.colors.primary} 0%, ${systemTruckTheme.colors.primaryDark} 100%)`,
                position: 'relative',
                overflow: 'hidden',
                py: 4,
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
                    pointerEvents: 'none',
                },
            }}
        >
            <Box sx={{ maxWidth: 720, width: '100%', px: 2, position: 'relative', zIndex: 1 }}>
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
                            p: { xs: 2.5, sm: 3.5 },
                        }}
                    >
                        {/* Ícone e Título */}
                        <Box sx={{ textAlign: 'center', mb: 2.5 }}>
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
                                        width: 60,
                                        height: 60,
                                        borderRadius: '16px',
                                        background: `linear-gradient(135deg, ${systemTruckTheme.colors.primary}, ${systemTruckTheme.colors.primaryDark})`,
                                        mb: 1.5,
                                        boxShadow: `0 6px 18px ${systemTruckTheme.colors.primary}40`,
                                    }}
                                >
                                    <UserPlus size={28} color="#fff" />
                                </Box>
                            </motion.div>

                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: 700,
                                    background: `linear-gradient(135deg, ${systemTruckTheme.colors.primary}, ${systemTruckTheme.colors.primaryDark})`,
                                    backgroundClip: 'text',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    mb: 0.5,
                                }}
                            >
                                Cadastro de Cidadão
                            </Typography>

                            <Typography
                                variant="body2"
                                sx={{
                                    color: systemTruckTheme.colors.textSecondary,
                                }}
                            >
                                Preencha os dados abaixo para se cadastrar no sistema
                            </Typography>
                        </Box>

                        {/* Formulário */}
                        <Box component="form" onSubmit={handleSubmit} noValidate>
                            <Grid container spacing={2}>
                                {/* CPF */}
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
                                        )}
                                    </InputMask>
                                </Grid>

                                {/* Nome Completo */}
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        required
                                        fullWidth
                                        label="Nome Completo"
                                        name="nome_completo"
                                        value={formData.nome_completo}
                                        onChange={handleChange}
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
                                </Grid>

                                {/* Nome da Mãe */}
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Nome da Mãe"
                                        name="nome_mae"
                                        value={formData.nome_mae}
                                        onChange={handleChange}
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
                                </Grid>

                                {/* Data de Nascimento */}
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
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Calendar size={20} color={systemTruckTheme.colors.primary} />
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
                                </Grid>

                                {/* Gênero */}
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        select
                                        fullWidth
                                        label="Gênero"
                                        name="genero"
                                        value={formData.genero}
                                        onChange={handleChange}
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
                                    >
                                        <MenuItem value="">Prefiro não informar</MenuItem>
                                        <MenuItem value="masculino">Masculino</MenuItem>
                                        <MenuItem value="feminino">Feminino</MenuItem>
                                        <MenuItem value="outro">Outro</MenuItem>
                                    </TextField>
                                </Grid>

                                {/* Raça/Cor */}
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        select
                                        fullWidth
                                        label="Raça/Cor"
                                        name="raca"
                                        value={formData.raca}
                                        onChange={handleChange}
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
                                    >
                                        <MenuItem value="">Prefiro não informar</MenuItem>
                                        <MenuItem value="branca">Branca</MenuItem>
                                        <MenuItem value="preta">Preta</MenuItem>
                                        <MenuItem value="parda">Parda</MenuItem>
                                        <MenuItem value="amarela">Amarela</MenuItem>
                                        <MenuItem value="indigena">Indígena</MenuItem>
                                    </TextField>
                                </Grid>

                                {/* Telefone */}
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
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <Phone size={20} color={systemTruckTheme.colors.primary} />
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
                                        )}
                                    </InputMask>
                                </Grid>

                                {/* E-mail */}
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        required
                                        fullWidth
                                        type="email"
                                        label="E-mail"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
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
                                </Grid>

                                {/* Senha */}
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        required
                                        fullWidth
                                        type={showPassword ? 'text' : 'password'}
                                        label="Senha"
                                        name="senha"
                                        value={formData.senha}
                                        onChange={handleChange}
                                        helperText="Mínimo de 6 caracteres"
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
                                </Grid>

                                {/* Confirmar Senha */}
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        required
                                        fullWidth
                                        type={showConfirmPassword ? 'text' : 'password'}
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
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Lock size={20} color={systemTruckTheme.colors.primary} />
                                                </InputAdornment>
                                            ),
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                        edge="end"
                                                        size="small"
                                                    >
                                                        {showConfirmPassword ? (
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
                                </Grid>

                                {/* Município */}
                                <Grid item xs={12} sm={8}>
                                    <TextField
                                        required
                                        fullWidth
                                        label="Município"
                                        name="municipio"
                                        value={formData.municipio}
                                        onChange={handleChange}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <MapPin size={20} color={systemTruckTheme.colors.primary} />
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
                                </Grid>

                                {/* Estado */}
                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        required
                                        select
                                        fullWidth
                                        label="Estado"
                                        name="estado"
                                        value={formData.estado}
                                        onChange={handleChange}
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
                                    >
                                        {estados.map((uf) => (
                                            <MenuItem key={uf} value={uf}>
                                                {uf}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>

                                {/* Cartão SUS (CNS) */}
                                <Grid item xs={12}>
                                    <InputMask
                                        mask="999 9999 9999 9999"
                                        value={formData.cartao_sus}
                                        onChange={handleChange}
                                    >
                                        {(inputProps: any) => (
                                            <TextField
                                                {...inputProps}
                                                fullWidth
                                                label="Cartão SUS (CNS)"
                                                name="cartao_sus"
                                                placeholder="000 0000 0000 0000"
                                                helperText="Opcional — número do Cartão Nacional de Saúde"
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <CreditCard size={20} color={systemTruckTheme.colors.primary} />
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
                                        )}
                                    </InputMask>
                                </Grid>
                            </Grid>

                            {/* Botões */}
                            <Box sx={{ mt: 4, display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    onClick={() => navigate('/login')}
                                    startIcon={<ArrowLeft size={20} />}
                                    sx={{
                                        borderRadius: '12px',
                                        py: 1.5,
                                        borderColor: systemTruckTheme.colors.primary,
                                        color: systemTruckTheme.colors.primary,
                                        fontWeight: 600,
                                        textTransform: 'none',
                                        '&:hover': {
                                            borderColor: systemTruckTheme.colors.primaryDark,
                                            background: 'rgba(70, 130, 180, 0.05)',
                                        },
                                    }}
                                >
                                    Já tenho cadastro
                                </Button>

                                <Button
                                    type="submit"
                                    variant="contained"
                                    fullWidth
                                    sx={{
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
                                    Prosseguir
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                </motion.div>
            </Box>

            {/* LGPD Term Dialog */}
            <TermoLGPD
                open={showTermo}
                onAccept={handleAcceptTermo}
                onDecline={handleDeclineTermo}
            />
        </Box>
    );
};

export default Cadastro;
