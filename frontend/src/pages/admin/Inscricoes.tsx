import React, { useState } from 'react';
import {
    Container,
    Typography,
    Grid,
    Box,
    TextField,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    MenuItem,
} from '@mui/material';
import { motion } from 'framer-motion';
import { UserPlus, Save } from 'lucide-react';
import { useSnackbar } from 'notistack';
import api from '../../services/api';
import { systemTruckTheme } from '../../theme/systemTruckTheme';

const Inscricoes: React.FC = () => {
    const { enqueueSnackbar } = useSnackbar();
    const [modalOpen, setModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form data
    const [formData, setFormData] = useState({
        nome_completo: '',
        nome_mae: '',
        cpf: '',
        data_nascimento: '',
        sexo: '',
        raca: '',
        telefone: '',
        email: '',
        cep: '',
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        municipio: '',
        estado: '',
        senha: '',
    });

    const handleOpenModal = () => {
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setFormData({
            nome_completo: '',
            nome_mae: '',
            cpf: '',
            data_nascimento: '',
            sexo: '',
            raca: '',
            telefone: '',
            email: '',
            cep: '',
            logradouro: '',
            numero: '',
            complemento: '',
            bairro: '',
            municipio: '',
            estado: '',
            senha: '',
        });
    };

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        // Validação básica
        if (!formData.nome_completo || !formData.cpf || !formData.email || !formData.telefone) {
            enqueueSnackbar('Preencha todos os campos obrigatórios', { variant: 'warning' });
            return;
        }

        try {
            setSubmitting(true);
            await api.post('/cidadaos', formData);
            enqueueSnackbar('Cidadão cadastrado com sucesso!', { variant: 'success' });
            handleCloseModal();
        } catch (error: any) {
            enqueueSnackbar(error.response?.data?.error || 'Erro ao cadastrar cidadão', { variant: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    const estados = [
        'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
        'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
        'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
    ];

    return (
        <Box sx={{ minHeight: '100vh', background: systemTruckTheme.colors.background, py: 4 }}>
            <Container maxWidth="xl">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: systemTruckTheme.colors.primaryDark, mb: 0.5 }}>
                                Cadastrar Cidadão
                            </Typography>
                            <Typography sx={{ color: systemTruckTheme.colors.textSecondary }}>
                                Cadastre novos cidadãos no sistema
                            </Typography>
                        </Box>
                        <Button
                            variant="contained"
                            startIcon={<UserPlus size={20} />}
                            onClick={handleOpenModal}
                            sx={{
                                background: systemTruckTheme.gradients.primary,
                                color: 'white',
                                borderRadius: systemTruckTheme.borderRadius.medium,
                                textTransform: 'none',
                                fontWeight: 600,
                                px: 3,
                                py: 1.5,
                                boxShadow: systemTruckTheme.shadows.button,
                                '&:hover': {
                                    boxShadow: '0 8px 24px rgba(0, 188, 212, 0.4)',
                                },
                            }}
                        >
                            Novo Cidadão
                        </Button>
                    </Box>
                </motion.div>

                {/* Info Card */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Box
                        sx={{
                            background: systemTruckTheme.colors.cardBackground,
                            borderRadius: systemTruckTheme.borderRadius.large,
                            border: `1px solid ${systemTruckTheme.colors.border}`,
                            p: 6,
                            textAlign: 'center',
                            boxShadow: systemTruckTheme.shadows.card,
                        }}
                    >
                        <UserPlus size={64} color={systemTruckTheme.colors.primary} style={{ marginBottom: 24 }} />
                        <Typography variant="h5" sx={{ color: systemTruckTheme.colors.text, fontWeight: 700, mb: 2 }}>
                            Cadastro de Cidadãos
                        </Typography>
                        <Typography sx={{ color: systemTruckTheme.colors.textSecondary, maxWidth: 600, mx: 'auto' }}>
                            Clique no botão "Novo Cidadão" para cadastrar um novo cidadão no sistema.
                            Todos os cidadãos cadastrados poderão acessar o portal e se inscrever em ações.
                        </Typography>
                    </Box>
                </motion.div>
            </Container>

            {/* Modal de Cadastro */}
            <Dialog
                open={modalOpen}
                onClose={handleCloseModal}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: systemTruckTheme.borderRadius.large,
                        background: systemTruckTheme.colors.cardBackground,
                    },
                }}
            >
                <DialogTitle sx={{ borderBottom: `1px solid ${systemTruckTheme.colors.border}` }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: systemTruckTheme.colors.primaryDark }}>
                        Cadastrar Novo Cidadão
                    </Typography>
                </DialogTitle>
                <DialogContent sx={{ pt: 4 }}>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        {/* Dados Pessoais */}
                        <Grid item xs={12}>
                            <Typography variant="h6" sx={{ color: systemTruckTheme.colors.text, fontWeight: 600, mb: 1 }}>
                                Dados Pessoais
                            </Typography>
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Nome Completo *"
                                value={formData.nome_completo}
                                onChange={(e) => handleChange('nome_completo', e.target.value)}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: systemTruckTheme.borderRadius.medium,
                                    },
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Nome da Mãe"
                                value={formData.nome_mae}
                                onChange={(e) => handleChange('nome_mae', e.target.value)}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: systemTruckTheme.borderRadius.medium,
                                    },
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="CPF *"
                                value={formData.cpf}
                                onChange={(e) => handleChange('cpf', e.target.value)}
                                placeholder="000.000.000-00"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: systemTruckTheme.borderRadius.medium,
                                    },
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                type="date"
                                label="Data de Nascimento"
                                value={formData.data_nascimento}
                                onChange={(e) => handleChange('data_nascimento', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: systemTruckTheme.borderRadius.medium,
                                    },
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                select
                                fullWidth
                                label="Sexo"
                                value={formData.sexo}
                                onChange={(e) => handleChange('sexo', e.target.value)}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: systemTruckTheme.borderRadius.medium,
                                    },
                                }}
                            >
                                <MenuItem value="M">Masculino</MenuItem>
                                <MenuItem value="F">Feminino</MenuItem>
                                <MenuItem value="O">Outro</MenuItem>
                            </TextField>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                select
                                fullWidth
                                label="Raça/Cor"
                                value={formData.raca}
                                onChange={(e) => handleChange('raca', e.target.value)}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: systemTruckTheme.borderRadius.medium,
                                    },
                                }}
                            >
                                <MenuItem value="branca">Branca</MenuItem>
                                <MenuItem value="preta">Preta</MenuItem>
                                <MenuItem value="parda">Parda</MenuItem>
                                <MenuItem value="amarela">Amarela</MenuItem>
                                <MenuItem value="indigena">Indígena</MenuItem>
                            </TextField>
                        </Grid>

                        {/* Contato */}
                        <Grid item xs={12}>
                            <Typography variant="h6" sx={{ color: systemTruckTheme.colors.text, fontWeight: 600, mb: 1, mt: 2 }}>
                                Contato
                            </Typography>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Telefone *"
                                value={formData.telefone}
                                onChange={(e) => handleChange('telefone', e.target.value)}
                                placeholder="(00) 00000-0000"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: systemTruckTheme.borderRadius.medium,
                                    },
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                type="email"
                                label="E-mail *"
                                value={formData.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: systemTruckTheme.borderRadius.medium,
                                    },
                                }}
                            />
                        </Grid>

                        {/* Endereço */}
                        <Grid item xs={12}>
                            <Typography variant="h6" sx={{ color: systemTruckTheme.colors.text, fontWeight: 600, mb: 1, mt: 2 }}>
                                Endereço
                            </Typography>
                        </Grid>

                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="CEP"
                                value={formData.cep}
                                onChange={(e) => handleChange('cep', e.target.value)}
                                placeholder="00000-000"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: systemTruckTheme.borderRadius.medium,
                                    },
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={8}>
                            <TextField
                                fullWidth
                                label="Logradouro"
                                value={formData.logradouro}
                                onChange={(e) => handleChange('logradouro', e.target.value)}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: systemTruckTheme.borderRadius.medium,
                                    },
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="Número"
                                value={formData.numero}
                                onChange={(e) => handleChange('numero', e.target.value)}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: systemTruckTheme.borderRadius.medium,
                                    },
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={8}>
                            <TextField
                                fullWidth
                                label="Complemento"
                                value={formData.complemento}
                                onChange={(e) => handleChange('complemento', e.target.value)}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: systemTruckTheme.borderRadius.medium,
                                    },
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Bairro"
                                value={formData.bairro}
                                onChange={(e) => handleChange('bairro', e.target.value)}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: systemTruckTheme.borderRadius.medium,
                                    },
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="Município"
                                value={formData.municipio}
                                onChange={(e) => handleChange('municipio', e.target.value)}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: systemTruckTheme.borderRadius.medium,
                                    },
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={2}>
                            <TextField
                                select
                                fullWidth
                                label="UF"
                                value={formData.estado}
                                onChange={(e) => handleChange('estado', e.target.value)}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: systemTruckTheme.borderRadius.medium,
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

                        {/* Senha */}
                        <Grid item xs={12}>
                            <Typography variant="h6" sx={{ color: systemTruckTheme.colors.text, fontWeight: 600, mb: 1, mt: 2 }}>
                                Acesso
                            </Typography>
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                type="password"
                                label="Senha"
                                value={formData.senha}
                                onChange={(e) => handleChange('senha', e.target.value)}
                                placeholder="Deixe em branco para gerar automaticamente"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: systemTruckTheme.borderRadius.medium,
                                    },
                                }}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ borderTop: `1px solid ${systemTruckTheme.colors.border}`, p: 2 }}>
                    <Button onClick={handleCloseModal} sx={{ textTransform: 'none', fontWeight: 600 }}>
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Save size={18} />}
                        onClick={handleSubmit}
                        disabled={submitting}
                        sx={{
                            background: systemTruckTheme.gradients.primary,
                            color: 'white',
                            textTransform: 'none',
                            fontWeight: 600,
                            boxShadow: systemTruckTheme.shadows.button,
                        }}
                    >
                        {submitting ? 'Salvando...' : 'Salvar Cidadão'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Inscricoes;
