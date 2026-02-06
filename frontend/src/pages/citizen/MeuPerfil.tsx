import React, { useState, useEffect, useRef } from 'react';
import {
    Container,
    Typography,
    TextField,
    Button,
    Grid,
    Box,
    Alert,
    Avatar,
    Card,
    CardContent,
    Divider,
    IconButton,
    CircularProgress,
    Stack,
} from '@mui/material';
import {
    PhotoCamera,
    Save,
    Person,
    Edit,
    Cancel,
    Email,
    Phone,
    LocationOn,
    Lock,
} from '@mui/icons-material';
import api from '../../services/api';
import { formatCPF, formatPhone, formatCEP } from '../../utils/formatters';
import { API_URL } from '../../services/api';

interface ViewFieldProps {
    label: string;
    value: string;
    icon: React.ReactNode;
    locked?: boolean;
}

const ViewField: React.FC<ViewFieldProps> = ({ label, value, icon, locked = false }) => (
    <Box
        sx={{
            p: 2.5,
            mb: 2,
            border: '1px solid',
            borderColor: locked ? 'warning.light' : 'divider',
            borderRadius: 2,
            bgcolor: locked ? 'warning.50' : 'background.paper',
            transition: 'all 0.2s',
            '&:hover': {
                borderColor: locked ? 'warning.main' : 'primary.light',
                boxShadow: 1,
            },
        }}
    >
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
            <Box sx={{ color: locked ? 'warning.main' : 'primary.main' }}>
                {icon}
            </Box>
            <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    fontSize: '0.7rem',
                }}
            >
                {label}
            </Typography>
        </Stack>
        <Typography
            variant="h6"
            sx={{
                fontWeight: 600,
                fontSize: '1.1rem',
                color: 'text.primary',
                pl: 4,
            }}
        >
            {value || '—'}
        </Typography>
    </Box>
);

const MeuPerfil: React.FC = () => {
    const [perfil, setPerfil] = useState<any>(null);
    const [formData, setFormData] = useState<any>(null);
    const [originalData, setOriginalData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchPerfil = async () => {
            try {
                const response = await api.get('/cidadaos/me');
                setPerfil(response.data);
                setFormData(response.data);
                setOriginalData(response.data);
            } catch (error) {
                console.error('Erro ao buscar perfil', error);
                setMessage({ type: 'error', text: 'Erro ao carregar perfil.' });
            } finally {
                setLoading(false);
            }
        };
        fetchPerfil();
    }, []);

    const handleEditMode = () => {
        setIsEditMode(true);
        setMessage({ type: '', text: '' });
    };

    const handleCancel = () => {
        setFormData(originalData);
        setIsEditMode(false);
        setMessage({ type: '', text: '' });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);
        setMessage({ type: '', text: '' });

        try {
            const dataToSend = new FormData();
            dataToSend.append('nome_completo', formData.nome_completo);
            dataToSend.append('telefone', formData.telefone);
            dataToSend.append('email', formData.email);
            dataToSend.append('municipio', formData.municipio);
            dataToSend.append('estado', formData.estado);
            if (formData.cep) dataToSend.append('cep', formData.cep);
            if (formData.rua) dataToSend.append('rua', formData.rua);
            if (formData.numero) dataToSend.append('numero', formData.numero);
            if (formData.complemento) dataToSend.append('complemento', formData.complemento);
            if (formData.bairro) dataToSend.append('bairro', formData.bairro);

            const response = await api.put('/cidadaos/me', dataToSend, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setPerfil(response.data.cidadao);
            setFormData(response.data.cidadao);
            setOriginalData(response.data.cidadao);
            setIsEditMode(false);
            setMessage({ type: 'success', text: 'Dados atualizados com sucesso!' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Erro ao atualizar dados.' });
        } finally {
            setUploading(false);
        }
    };

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        setUploading(true);
        setMessage({ type: '', text: '' });

        try {
            const dataToSend = new FormData();
            dataToSend.append('foto', file);
            dataToSend.append('nome_completo', formData.nome_completo);
            dataToSend.append('telefone', formData.telefone);
            dataToSend.append('email', formData.email);
            dataToSend.append('municipio', formData.municipio);
            dataToSend.append('estado', formData.estado);
            if (formData.cep) dataToSend.append('cep', formData.cep);
            if (formData.rua) dataToSend.append('rua', formData.rua);
            if (formData.numero) dataToSend.append('numero', formData.numero);
            if (formData.complemento) dataToSend.append('complemento', formData.complemento);
            if (formData.bairro) dataToSend.append('bairro', formData.bairro);

            const response = await api.put('/cidadaos/me', dataToSend, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setPerfil(response.data.cidadao);
            setFormData(response.data.cidadao);
            setOriginalData(response.data.cidadao);
            setMessage({ type: 'success', text: 'Foto atualizada com sucesso!' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Erro ao atualizar foto.' });
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <Container maxWidth="md" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Container>
        );
    }

    // URL base da API (sem /api)
    // URL base da API (sem /api)
    // const API_BASE_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:3001';

    const avatarUrl = perfil?.foto_perfil
        ? `${API_URL}${perfil.foto_perfil}`
        : undefined;

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                Meu Perfil
            </Typography>

            {message.text && (
                <Alert severity={message.type as any} sx={{ mb: 3 }}>
                    {message.text}
                </Alert>
            )}

            <Grid container spacing={3}>
                {/* Profile Picture Card */}
                <Grid item xs={12} md={4}>
                    <Card elevation={3}>
                        <CardContent sx={{ textAlign: 'center', py: 4 }}>
                            <Box sx={{ position: 'relative', display: 'inline-block' }}>
                                <Avatar
                                    src={avatarUrl}
                                    sx={{
                                        width: 160,
                                        height: 160,
                                        mb: 2,
                                        border: '4px solid',
                                        borderColor: 'primary.main',
                                        cursor: 'pointer',
                                        transition: 'transform 0.2s',
                                        '&:hover': {
                                            transform: 'scale(1.05)',
                                        },
                                    }}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Person sx={{ fontSize: 80 }} />
                                </Avatar>
                                <IconButton
                                    color="primary"
                                    sx={{
                                        position: 'absolute',
                                        bottom: 16,
                                        right: 0,
                                        bgcolor: 'background.paper',
                                        boxShadow: 2,
                                        '&:hover': { bgcolor: 'background.paper' },
                                    }}
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                >
                                    <PhotoCamera />
                                </IconButton>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    hidden
                                    accept="image/*"
                                    onChange={handlePhotoChange}
                                />
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {perfil?.nome_completo}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {perfil?.email}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Profile Information Card */}
                <Grid item xs={12} md={8}>
                    <Card elevation={3}>
                        <CardContent sx={{ p: 4 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Typography
                                    variant="h5"
                                    sx={{
                                        fontWeight: 700,
                                        color: 'primary.main',
                                        letterSpacing: -0.5,
                                    }}
                                >
                                    Informações Pessoais
                                </Typography>
                                {!isEditMode && (
                                    <Button
                                        variant="contained"
                                        size="large"
                                        startIcon={<Edit />}
                                        onClick={handleEditMode}
                                        sx={{
                                            px: 3,
                                            py: 1.5,
                                            fontWeight: 600,
                                            boxShadow: 2,
                                        }}
                                    >
                                        Editar meus dados
                                    </Button>
                                )}
                            </Box>
                            <Divider sx={{ mb: 4, borderColor: 'primary.light' }} />

                            {!isEditMode ? (
                                // VIEW MODE
                                <Box>
                                    <ViewField
                                        label="Nome Completo"
                                        value={perfil?.nome_completo}
                                        icon={<Person fontSize="medium" />}
                                    />
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <ViewField
                                                label="CPF (Documento Institucional)"
                                                value={formatCPF(perfil?.cpf)}
                                                icon={<Lock fontSize="medium" />}
                                                locked
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <ViewField
                                                label="E-mail"
                                                value={perfil?.email}
                                                icon={<Email fontSize="medium" />}
                                            />
                                        </Grid>
                                    </Grid>
                                    <ViewField
                                        label="Telefone"
                                        value={formatPhone(perfil?.telefone)}
                                        icon={<Phone fontSize="medium" />}
                                    />

                                    <Divider sx={{ my: 4, borderColor: 'divider' }} />

                                    <Typography
                                        variant="h6"
                                        sx={{
                                            fontWeight: 700,
                                            color: 'primary.main',
                                            mb: 3,
                                        }}
                                    >
                                        Endereço Residencial
                                    </Typography>

                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <ViewField
                                                label="CEP"
                                                value={formatCEP(perfil?.cep)}
                                                icon={<LocationOn fontSize="medium" />}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <ViewField
                                                label="Município"
                                                value={perfil?.municipio}
                                                icon={<LocationOn fontSize="medium" />}
                                            />
                                        </Grid>
                                    </Grid>
                                    <ViewField
                                        label="Rua/Logradouro"
                                        value={perfil?.rua}
                                        icon={<LocationOn fontSize="medium" />}
                                    />
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={4}>
                                            <ViewField
                                                label="Número"
                                                value={perfil?.numero}
                                                icon={<LocationOn fontSize="medium" />}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={4}>
                                            <ViewField
                                                label="Complemento"
                                                value={perfil?.complemento}
                                                icon={<LocationOn fontSize="medium" />}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={4}>
                                            <ViewField
                                                label="Bairro"
                                                value={perfil?.bairro}
                                                icon={<LocationOn fontSize="medium" />}
                                            />
                                        </Grid>
                                    </Grid>
                                    <ViewField
                                        label="Estado"
                                        value={perfil?.estado}
                                        icon={<LocationOn fontSize="medium" />}
                                    />
                                </Box>
                            ) : (
                                // EDIT MODE
                                <Box component="form" onSubmit={handleSave}>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                label="Nome Completo"
                                                value={formData?.nome_completo || ''}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, nome_completo: e.target.value })
                                                }
                                                variant="outlined"
                                                required
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="CPF (não editável)"
                                                value={formatCPF(formData?.cpf) || ''}
                                                disabled
                                                variant="outlined"
                                                InputProps={{
                                                    startAdornment: <Lock fontSize="small" sx={{ mr: 1, color: 'text.disabled' }} />,
                                                }}
                                                helperText="CPF não pode ser alterado"
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="E-mail"
                                                type="email"
                                                value={formData?.email || ''}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, email: e.target.value })
                                                }
                                                variant="outlined"
                                                required
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="Telefone"
                                                value={formData?.telefone || ''}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, telefone: e.target.value })
                                                }
                                                variant="outlined"
                                                required
                                            />
                                        </Grid>

                                        <Grid item xs={12}>
                                            <Divider sx={{ my: 2 }} />
                                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                                                Endereço Residencial
                                            </Typography>
                                        </Grid>

                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="CEP"
                                                value={formData?.cep || ''}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, cep: e.target.value })
                                                }
                                                variant="outlined"
                                                placeholder="00000-000"
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="Município"
                                                value={formData?.municipio || ''}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, municipio: e.target.value })
                                                }
                                                variant="outlined"
                                                required
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                label="Rua/Logradouro"
                                                value={formData?.rua || ''}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, rua: e.target.value })
                                                }
                                                variant="outlined"
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={4}>
                                            <TextField
                                                fullWidth
                                                label="Número"
                                                value={formData?.numero || ''}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, numero: e.target.value })
                                                }
                                                variant="outlined"
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={4}>
                                            <TextField
                                                fullWidth
                                                label="Complemento"
                                                value={formData?.complemento || ''}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, complemento: e.target.value })
                                                }
                                                variant="outlined"
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={4}>
                                            <TextField
                                                fullWidth
                                                label="Bairro"
                                                value={formData?.bairro || ''}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, bairro: e.target.value })
                                                }
                                                variant="outlined"
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                label="Estado"
                                                value={formData?.estado || ''}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, estado: e.target.value })
                                                }
                                                variant="outlined"
                                                required
                                                placeholder="UF (ex: MA)"
                                                inputProps={{ maxLength: 2 }}
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Stack direction="row" spacing={2}>
                                                <Button
                                                    type="submit"
                                                    variant="contained"
                                                    color="primary"
                                                    size="large"
                                                    startIcon={uploading ? <CircularProgress size={20} /> : <Save />}
                                                    disabled={uploading}
                                                    fullWidth
                                                >
                                                    {uploading ? 'Salvando...' : 'Salvar Alterações'}
                                                </Button>
                                                <Button
                                                    variant="outlined"
                                                    color="secondary"
                                                    size="large"
                                                    startIcon={<Cancel />}
                                                    onClick={handleCancel}
                                                    disabled={uploading}
                                                    fullWidth
                                                >
                                                    Cancelar
                                                </Button>
                                            </Stack>
                                        </Grid>
                                    </Grid>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Container>
    );
};

export default MeuPerfil;
