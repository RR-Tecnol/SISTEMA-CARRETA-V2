import React, { useState, useEffect } from 'react';
import { formatPhone } from '../../utils/formatters';
import {
    Container,
    Typography,
    Box,
    TextField,
    Button,
    Avatar,
    Grid,
    IconButton,
    CircularProgress,
    MenuItem,
} from '@mui/material';
import { motion } from 'framer-motion';
import {
    User,
    Mail,
    Phone,
    MapPin,
    Camera,
    Save,
    Edit,
    Users,
} from 'lucide-react';
import { useSnackbar } from 'notistack';
import api, { BASE_URL } from '../../services/api';
import { systemTruckTheme } from '../../theme/systemTruckTheme';

interface CidadaoData {
    nome_completo: string;
    email: string;
    cpf: string;
    telefone: string;
    data_nascimento: string;
    genero?: string;
    raca?: string;
    cep: string;
    rua: string;
    numero: string;
    complemento: string;
    bairro: string;
    municipio: string;
    estado: string;
    foto_perfil?: string;
}

const MeuPerfil: React.FC = () => {
    const { enqueueSnackbar } = useSnackbar();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState<CidadaoData>({
        nome_completo: '',
        email: '',
        cpf: '',
        telefone: '',
        data_nascimento: '',
        genero: '',
        raca: '',
        cep: '',
        rua: '',
        numero: '',
        complemento: '',
        bairro: '',
        municipio: '',
        estado: '',
    });
    const [fotoPreview, setFotoPreview] = useState<string>('');

    useEffect(() => {
        fetchPerfil();
    }, []);

    const fetchPerfil = async () => {
        try {
            const response = await api.get('/cidadaos/me');
            console.log('📸 Dados do perfil:', response.data);
            const data = {
                ...response.data,
                telefone: response.data.telefone || '',
                cep: response.data.cep || '',
                rua: response.data.rua || '',
                numero: response.data.numero || '',
                complemento: response.data.complemento || '',
                bairro: response.data.bairro || '',
                genero: response.data.genero || '',
                raca: response.data.raca || '',
            };
            setFormData(data);
            if (response.data.foto_perfil) {
                const fotoUrl = `${BASE_URL}${response.data.foto_perfil}`;
                console.log('📸 URL da foto:', fotoUrl);
                setFotoPreview(fotoUrl);
            }
        } catch (error: any) {
            enqueueSnackbar(error.response?.data?.error || 'Erro ao carregar perfil', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: keyof CidadaoData) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [field]: e.target.value });
    };

    const handleFotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formDataUpload = new FormData();
        formDataUpload.append('foto', file);
        // Incluir todos os campos obrigatórios
        formDataUpload.append('nome_completo', formData.nome_completo);
        formDataUpload.append('telefone', formData.telefone);
        formDataUpload.append('email', formData.email);
        formDataUpload.append('municipio', formData.municipio);
        formDataUpload.append('estado', formData.estado);
        if (formData.cep) formDataUpload.append('cep', formData.cep);
        if (formData.rua) formDataUpload.append('rua', formData.rua);
        if (formData.numero) formDataUpload.append('numero', formData.numero);
        if (formData.complemento) formDataUpload.append('complemento', formData.complemento);
        if (formData.bairro) formDataUpload.append('bairro', formData.bairro);
        if (formData.genero) formDataUpload.append('genero', formData.genero);
        if (formData.raca) formDataUpload.append('raca', formData.raca);

        try {
            const response = await api.put('/cidadaos/me', formDataUpload, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const newPhotoUrl = `${BASE_URL}${response.data.cidadao.foto_perfil}?t=${Date.now()}`;
            console.log('📸 Nova foto URL:', newPhotoUrl);
            setFotoPreview(newPhotoUrl);
            enqueueSnackbar('Foto atualizada com sucesso!', { variant: 'success' });

            // Dispatch event to update avatar in layout
            console.log('🔔 Disparando evento profilePhotoUpdated');
            window.dispatchEvent(new Event('profilePhotoUpdated'));

            await fetchPerfil();
        } catch (error: any) {
            enqueueSnackbar(error.response?.data?.error || 'Erro ao atualizar foto', { variant: 'error' });
        }
    };

    const handleSubmit = async () => {
        setSaving(true);
        try {
            await api.put('/cidadaos/me', formData);
            enqueueSnackbar('Perfil atualizado com sucesso!', { variant: 'success' });
            setEditing(false);
            fetchPerfil();
        } catch (error: any) {
            enqueueSnackbar(error.response?.data?.error || 'Erro ao atualizar perfil', { variant: 'error' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <CircularProgress sx={{ color: systemTruckTheme.colors.primary }} size={60} />
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', background: systemTruckTheme.colors.background, py: 4 }}>
            <Container maxWidth="lg">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <Box sx={{ mb: 4 }}>
                        <Typography
                            variant="h4"
                            sx={{
                                fontWeight: 700,
                                color: systemTruckTheme.colors.primaryDark,
                                mb: 0.5,
                            }}
                        >
                            Meu Perfil
                        </Typography>
                        <Typography sx={{ color: systemTruckTheme.colors.textSecondary }}>
                            Gerencie suas informações pessoais
                        </Typography>
                    </Box>
                </motion.div>

                <Grid container spacing={3}>
                    {/* Card de Foto e Info Básica */}
                    <Grid item xs={12} md={4}>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <Box
                                sx={{
                                    background: systemTruckTheme.colors.cardBackground,
                                    borderRadius: systemTruckTheme.borderRadius.large,
                                    border: `1px solid ${systemTruckTheme.colors.border}`,
                                    p: 4,
                                    textAlign: 'center',
                                    boxShadow: systemTruckTheme.shadows.card,
                                }}
                            >
                                {/* Avatar */}
                                <Box sx={{ position: 'relative', display: 'inline-block', mb: 3 }}>
                                    <Avatar
                                        src={fotoPreview}
                                        sx={{
                                            width: 150,
                                            height: 150,
                                            border: `4px solid ${systemTruckTheme.colors.primary}`,
                                            fontSize: '3rem',
                                            background: systemTruckTheme.gradients.primary,
                                        }}
                                    >
                                        {formData.nome_completo?.charAt(0).toUpperCase() || 'C'}
                                    </Avatar>
                                    <input
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        id="foto-upload"
                                        type="file"
                                        onChange={handleFotoChange}
                                    />
                                    <label htmlFor="foto-upload">
                                        <IconButton
                                            component="span"
                                            sx={{
                                                position: 'absolute',
                                                bottom: 0,
                                                right: 0,
                                                background: systemTruckTheme.colors.primary,
                                                color: 'white',
                                                '&:hover': {
                                                    background: systemTruckTheme.colors.primaryDark,
                                                },
                                            }}
                                        >
                                            <Camera size={20} />
                                        </IconButton>
                                    </label>
                                </Box>

                                {/* Nome e Email */}
                                <Typography variant="h5" sx={{ fontWeight: 700, color: systemTruckTheme.colors.text, mb: 0.5 }}>
                                    {formData.nome_completo || 'Cidadão'}
                                </Typography>
                                <Typography sx={{ color: systemTruckTheme.colors.textSecondary, mb: 3 }}>
                                    {formData.email || ''}
                                </Typography>

                                {/* Botão Editar */}
                                <Button
                                    fullWidth
                                    variant={editing ? 'outlined' : 'contained'}
                                    startIcon={editing ? <Save size={20} /> : <Edit size={20} />}
                                    onClick={() => (editing ? handleSubmit() : setEditing(true))}
                                    disabled={saving}
                                    sx={{
                                        background: editing ? 'transparent' : systemTruckTheme.gradients.primary,
                                        color: editing ? systemTruckTheme.colors.primary : 'white',
                                        borderColor: systemTruckTheme.colors.primary,
                                        py: 1.5,
                                        fontWeight: 600,
                                        borderRadius: systemTruckTheme.borderRadius.medium,
                                        textTransform: 'none',
                                        '&:hover': {
                                            background: editing ? systemTruckTheme.colors.cardHover : systemTruckTheme.colors.primaryDark,
                                        },
                                    }}
                                >
                                    {saving ? 'Salvando...' : editing ? 'Salvar Alterações' : 'Editar Perfil'}
                                </Button>
                            </Box>
                        </motion.div>
                    </Grid>

                    {/* Card de Informações Detalhadas */}
                    <Grid item xs={12} md={8}>
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <Box
                                sx={{
                                    background: systemTruckTheme.colors.cardBackground,
                                    borderRadius: systemTruckTheme.borderRadius.large,
                                    border: `1px solid ${systemTruckTheme.colors.border}`,
                                    p: 4,
                                    boxShadow: systemTruckTheme.shadows.card,
                                }}
                            >
                                {/* Informações Pessoais */}
                                <Box sx={{ mb: 4 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                                        <User size={24} color={systemTruckTheme.colors.primary} />
                                        <Typography variant="h6" sx={{ fontWeight: 700, color: systemTruckTheme.colors.primaryDark }}>
                                            Informações Pessoais
                                        </Typography>
                                    </Box>

                                    <Grid container spacing={2}>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                label="Nome Completo"
                                                value={formData.nome_completo}
                                                onChange={handleChange('nome_completo')}
                                                disabled={!editing}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: systemTruckTheme.borderRadius.medium,
                                                    },
                                                    '& .MuiInputBase-input': {
                                                        fontWeight: editing ? 400 : '600 !important',
                                                    },
                                                    '& .MuiInputBase-input.Mui-disabled': {
                                                        fontWeight: '600 !important',
                                                        WebkitTextFillColor: systemTruckTheme.colors.text,
                                                    },
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="CPF"
                                                value={formData.cpf}
                                                disabled
                                                InputProps={{
                                                    startAdornment: <User size={20} style={{ marginRight: 8, color: systemTruckTheme.colors.textSecondary }} />,
                                                }}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: systemTruckTheme.borderRadius.medium,
                                                    },
                                                    '& .MuiInputBase-input.Mui-disabled': {
                                                        fontWeight: '600 !important',
                                                        WebkitTextFillColor: systemTruckTheme.colors.text,
                                                    },
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="Telefone"
                                                value={formData.telefone}
                                                onChange={(e) => setFormData({ ...formData, telefone: formatPhone(e.target.value) })}
                                                disabled={!editing}
                                                inputProps={{ maxLength: 15 }}
                                                placeholder="(00) 00000-0000"
                                                InputProps={{
                                                    startAdornment: <Phone size={20} style={{ marginRight: 8, color: systemTruckTheme.colors.textSecondary }} />,
                                                }}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: systemTruckTheme.borderRadius.medium,
                                                    },
                                                    '& .MuiInputBase-input': {
                                                        fontWeight: editing ? 400 : '600 !important',
                                                    },
                                                    '& .MuiInputBase-input.Mui-disabled': {
                                                        fontWeight: '600 !important',
                                                        WebkitTextFillColor: systemTruckTheme.colors.text,
                                                    },
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                label="E-mail"
                                                value={formData.email}
                                                onChange={handleChange('email')}
                                                disabled={!editing}
                                                InputProps={{
                                                    startAdornment: <Mail size={20} style={{ marginRight: 8, color: systemTruckTheme.colors.textSecondary }} />,
                                                }}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: systemTruckTheme.borderRadius.medium,
                                                    },
                                                    '& .MuiInputBase-input': {
                                                        fontWeight: editing ? 400 : '600 !important',
                                                    },
                                                    '& .MuiInputBase-input.Mui-disabled': {
                                                        fontWeight: '600 !important',
                                                        WebkitTextFillColor: systemTruckTheme.colors.text,
                                                    },
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                select
                                                fullWidth
                                                label="Gênero"
                                                value={formData.genero || ''}
                                                onChange={handleChange('genero')}
                                                disabled={!editing}
                                                InputProps={{
                                                    startAdornment: <Users size={20} style={{ marginRight: 8, color: systemTruckTheme.colors.textSecondary }} />,
                                                }}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: systemTruckTheme.borderRadius.medium,
                                                    },
                                                    '& .MuiInputBase-input': {
                                                        fontWeight: editing ? 400 : '600 !important',
                                                    },
                                                    '& .MuiInputBase-input.Mui-disabled': {
                                                        fontWeight: '600 !important',
                                                        WebkitTextFillColor: systemTruckTheme.colors.text,
                                                    },
                                                }}
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
                                                value={formData.raca || ''}
                                                onChange={handleChange('raca')}
                                                disabled={!editing}
                                                InputProps={{
                                                    startAdornment: <Users size={20} style={{ marginRight: 8, color: systemTruckTheme.colors.textSecondary }} />,
                                                }}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: systemTruckTheme.borderRadius.medium,
                                                    },
                                                    '& .MuiInputBase-input': {
                                                        fontWeight: editing ? 400 : '600 !important',
                                                    },
                                                    '& .MuiInputBase-input.Mui-disabled': {
                                                        fontWeight: '600 !important',
                                                        WebkitTextFillColor: systemTruckTheme.colors.text,
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
                                    </Grid>
                                </Box>

                                {/* Endereço Residencial */}
                                <Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                                        <MapPin size={24} color={systemTruckTheme.colors.primary} />
                                        <Typography variant="h6" sx={{ fontWeight: 700, color: systemTruckTheme.colors.primaryDark }}>
                                            Endereço Residencial
                                        </Typography>
                                    </Box>

                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={4}>
                                            <TextField
                                                fullWidth
                                                label="CEP"
                                                value={formData.cep}
                                                onChange={handleChange('cep')}
                                                disabled={!editing}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: systemTruckTheme.borderRadius.medium,
                                                    },
                                                    '& .MuiInputBase-input': {
                                                        fontWeight: editing ? 400 : '600 !important',
                                                    },
                                                    '& .MuiInputBase-input.Mui-disabled': {
                                                        fontWeight: '600 !important',
                                                        WebkitTextFillColor: systemTruckTheme.colors.text,
                                                    },
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={8}>
                                            <TextField
                                                fullWidth
                                                label="Município"
                                                value={formData.municipio}
                                                onChange={handleChange('municipio')}
                                                disabled={!editing}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: systemTruckTheme.borderRadius.medium,
                                                    },
                                                    '& .MuiInputBase-input': {
                                                        fontWeight: editing ? 400 : '600 !important',
                                                    },
                                                    '& .MuiInputBase-input.Mui-disabled': {
                                                        fontWeight: '600 !important',
                                                        WebkitTextFillColor: systemTruckTheme.colors.text,
                                                    },
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={8}>
                                            <TextField
                                                fullWidth
                                                label="Rua / Logradouro"
                                                value={formData.rua}
                                                onChange={handleChange('rua')}
                                                disabled={!editing}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: systemTruckTheme.borderRadius.medium,
                                                    },
                                                    '& .MuiInputBase-input': {
                                                        fontWeight: editing ? 400 : '600 !important',
                                                    },
                                                    '& .MuiInputBase-input.Mui-disabled': {
                                                        fontWeight: '600 !important',
                                                        WebkitTextFillColor: systemTruckTheme.colors.text,
                                                    },
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={4}>
                                            <TextField
                                                fullWidth
                                                label="Número"
                                                value={formData.numero}
                                                onChange={handleChange('numero')}
                                                disabled={!editing}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: systemTruckTheme.borderRadius.medium,
                                                    },
                                                    '& .MuiInputBase-input': {
                                                        fontWeight: editing ? 400 : '600 !important',
                                                    },
                                                    '& .MuiInputBase-input.Mui-disabled': {
                                                        fontWeight: '600 !important',
                                                        WebkitTextFillColor: systemTruckTheme.colors.text,
                                                    },
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="Complemento"
                                                value={formData.complemento}
                                                onChange={handleChange('complemento')}
                                                disabled={!editing}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: systemTruckTheme.borderRadius.medium,
                                                    },
                                                    '& .MuiInputBase-input': {
                                                        fontWeight: editing ? 400 : '600 !important',
                                                    },
                                                    '& .MuiInputBase-input.Mui-disabled': {
                                                        fontWeight: '600 !important',
                                                        WebkitTextFillColor: systemTruckTheme.colors.text,
                                                    },
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="Bairro"
                                                value={formData.bairro}
                                                onChange={handleChange('bairro')}
                                                disabled={!editing}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: systemTruckTheme.borderRadius.medium,
                                                    },
                                                    '& .MuiInputBase-input': {
                                                        fontWeight: editing ? 400 : '600 !important',
                                                    },
                                                    '& .MuiInputBase-input.Mui-disabled': {
                                                        fontWeight: '600 !important',
                                                        WebkitTextFillColor: systemTruckTheme.colors.text,
                                                    },
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={4}>
                                            <TextField
                                                fullWidth
                                                label="Estado"
                                                value={formData.estado}
                                                onChange={handleChange('estado')}
                                                disabled={!editing}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: systemTruckTheme.borderRadius.medium,
                                                    },
                                                    '& .MuiInputBase-input': {
                                                        fontWeight: editing ? 400 : '600 !important',
                                                    },
                                                    '& .MuiInputBase-input.Mui-disabled': {
                                                        fontWeight: '600 !important',
                                                        WebkitTextFillColor: systemTruckTheme.colors.text,
                                                    },
                                                }}
                                            />
                                        </Grid>
                                    </Grid>
                                </Box>

                                {/* Botões de Ação (Mobile) */}
                                {editing && (
                                    <Box sx={{ mt: 4, display: { xs: 'flex', md: 'none' }, gap: 2 }}>
                                        <Button
                                            fullWidth
                                            variant="outlined"
                                            onClick={() => {
                                                setEditing(false);
                                                fetchPerfil();
                                            }}
                                            sx={{
                                                borderColor: systemTruckTheme.colors.border,
                                                color: systemTruckTheme.colors.text,
                                                borderRadius: systemTruckTheme.borderRadius.medium,
                                                textTransform: 'none',
                                            }}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            onClick={handleSubmit}
                                            disabled={saving}
                                            sx={{
                                                background: systemTruckTheme.gradients.primary,
                                                borderRadius: systemTruckTheme.borderRadius.medium,
                                                textTransform: 'none',
                                            }}
                                        >
                                            {saving ? 'Salvando...' : 'Salvar'}
                                        </Button>
                                    </Box>
                                )}
                            </Box>
                        </motion.div>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default MeuPerfil;
