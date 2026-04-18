import { useState, useEffect, useRef } from 'react';
import { Box, Typography, Paper, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, Tooltip, CircularProgress } from '@mui/material';
import { Upload, Download, FileText, CheckCircle2 } from 'lucide-react';
import { expressoTheme } from '../../theme/expressoTheme';
import api from '../../services/api';
import { useSnackbar } from 'notistack';

export default function MedicoLaudos({ acaoId }: { user?: any, acaoId?: string }) {
    const { enqueueSnackbar } = useSnackbar();
    const [pacientes, setPacientes] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploadingId, setUploadingId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [selectedFichaId, setSelectedFichaId] = useState<string | null>(null);

    const carregarPacientes = async () => {
        try {
            setLoading(true);
            // Reutilizando endpoint de fila atual ou criaremos um de resultados
            const { data } = await api.get(`/medico-monitoring/resultados`, {
                params: { acao_id: acaoId }
            });
            setPacientes(data);
        } catch (err) {
            console.error('Erro ao buscar pacientes', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (acaoId) carregarPacientes();
    }, [acaoId]);

    const handleUploadClick = (fichaId: string) => {
        setSelectedFichaId(fichaId);
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !selectedFichaId) return;

        try {
            setUploadingId(selectedFichaId);
            const formData = new FormData();
            formData.append('file', file);
            formData.append('ficha_id', selectedFichaId);

            await api.post('/medico-monitoring/resultado/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            enqueueSnackbar('Laudo anexado com sucesso!', { variant: 'success' });
            carregarPacientes(); // refresh
        } catch (err) {
            enqueueSnackbar('Erro ao anexar arquivo', { variant: 'error' });
        } finally {
            setUploadingId(null);
            setSelectedFichaId(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleExportar = async () => {
        try {
            const resp = await api.get('/medico-monitoring/resultados/exportar', {
                params: { acao_id: acaoId },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([resp.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Resultados_Exames_${acaoId || 'Geral'}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            enqueueSnackbar('Erro ao gerar planilha', { variant: 'error' });
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: expressoTheme.colors.primaryDark }}>
                    Upload e Entrega de Laudos / Exames
                </Typography>
                <Button 
                    variant="outlined" 
                    startIcon={<Download size={16} />}
                    onClick={handleExportar}
                    sx={{ textTransform: 'none', borderColor: expressoTheme.colors.primary }}
                >
                    Baixar Planilha de Resultados
                </Button>
            </Box>
            
            <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept="application/pdf,image/*"
                onChange={handleFileChange}
            />

            <TableContainer component={Paper} sx={{ borderRadius: expressoTheme.borderRadius.medium, boxShadow: expressoTheme.shadows.card }}>
                <Table size="small">
                    <TableHead sx={{ background: expressoTheme.colors.background }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Nº Ficha</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Paciente</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Cidadão CPF</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Exame/Serviço</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Status do Laudo</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>Ações</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {pacientes.length === 0 && !loading && (
                            <TableRow><TableCell colSpan={6} align="center">Nenhuma requisição de exame encontrada para esta ação.</TableCell></TableRow>
                        )}
                        {loading && (
                            <TableRow><TableCell colSpan={6} align="center">Carregando...</TableCell></TableRow>
                        )}
                        {!loading && pacientes.map((row) => (
                            <TableRow key={row.id} hover>
                                <TableCell>{String(row.numero_ficha).padStart(3, '0')}</TableCell>
                                <TableCell>{row.cidadao?.nome_completo}</TableCell>
                                <TableCell>{row.cidadao?.cpf}</TableCell>
                                <TableCell>{row.inscricao?.curso_exame?.nome || '-'}</TableCell>
                                <TableCell>
                                    <Chip 
                                        size="small" 
                                        icon={row.resultado_url ? <CheckCircle2 size={14}/> : <FileText size={14}/>}
                                        label={row.resultado_url ? 'Pronto' : 'Faltando'} 
                                        color={row.resultado_url ? 'success' : 'warning'} 
                                        variant={row.resultado_url ? 'filled' : 'outlined'}
                                    />
                                </TableCell>
                                <TableCell align="right">
                                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                        {row.resultado_url && (
                                            <Tooltip title="Visualizar PDF">
                                                <IconButton size="small" color="primary" onClick={() => window.open(row.resultado_url, '_blank')}>
                                                    <FileText size={18}/>
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                        <Tooltip title="Anexar Laudo Físico (PDF)">
                                            <span>
                                                <IconButton 
                                                    size="small" 
                                                    color="primary" 
                                                    disabled={uploadingId === row.id}
                                                    onClick={() => handleUploadClick(row.id)}
                                                    sx={{ background: expressoTheme.colors.background }}
                                                >
                                                    {uploadingId === row.id ? <CircularProgress size={18} /> : <Upload size={18}/>}
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}
