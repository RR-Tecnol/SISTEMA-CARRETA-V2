import { useState, useEffect, useCallback } from 'react';
import {
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Grid,
    MenuItem,
    Box,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    IconButton,
    Radio,
    RadioGroup,
    FormControlLabel,
    FormControl,
    FormLabel,
} from '@mui/material';
import {
    Plus,
    Trash2,
    Edit,
    Download,
    UserPlus,
    Truck,
    Stethoscope,
    CheckCircle
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import api from '../../services/api';

interface Instituicao {
    id: string;
    razao_social: string;
}

interface CursoExame {
    id: string;
    nome: string;
    tipo: 'curso' | 'exame';
    descricao?: string;
}

interface AcaoCursoExame {
    id: string;
    acao_id: string;
    curso_exame_id: string;
    vagas: number;
    curso_exame?: CursoExame;
}

const GerenciarAcao = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();

    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(0);

    // Form state
    const [formData, setFormData] = useState({
        nome: '',
        instituicao_id: '',
        tipo: '',
        status: '',
        municipio: '',
        estado: '',
        data_inicio: '',
        data_fim: '',
        local_execucao: '',
        vagas_disponiveis: 0,
        distancia_km: 0,
        preco_combustivel_referencia: 0,
        descricao: '',
    });

    // Instituições
    const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);

    // Inscrições state
    const [inscricoes, setInscricoes] = useState<any[]>([]);

    // Custos state
    const [custos, setCustos] = useState<any[]>([]);

    // Despesa Geral state
    const [openDespesaDialog, setOpenDespesaDialog] = useState(false);
    const [despesaGeral, setDespesaGeral] = useState({
        descricao: '',
        valor: '',
        data_vencimento: new Date().toISOString().split('T')[0],
        observacoes: ''
    });
    // Funcion�rios state
    const [funcionariosAcao, setFuncionariosAcao] = useState<any[]>([]);
    const [funcionariosDisponiveis, setFuncionariosDisponiveis] = useState<any[]>([]);
    const [openFuncionarioDialog, setOpenFuncionarioDialog] = useState(false);
    const [selectedFuncionario, setSelectedFuncionario] = useState('');
    const [openAbastecimentoDialog, setOpenAbastecimentoDialog] = useState(false);
    const [abastecimentoForm, setAbastecimentoForm] = useState({
        caminhao_id: '',
        data_abastecimento: new Date().toISOString().split('T')[0],
        litros: 0,
        valor_total: 0,
        observacoes: '',
    });

    // Recursos state
    const [caminhoes, setCaminhoes] = useState<any[]>([]);
    const [caminhoesVinculados, setCaminhoesVinculados] = useState<any[]>([]);
    const [openAddCaminhaoDialog, setOpenAddCaminhaoDialog] = useState(false);
    const [selectedCaminhaoId, setSelectedCaminhaoId] = useState('');

    // Cursos/Exames state
    const [cursosExames, setCursosExames] = useState<CursoExame[]>([]);
    const [cursosExamesVinculados, setCursosExamesVinculados] = useState<AcaoCursoExame[]>([]);
    const [openAddCursoExameDialog, setOpenAddCursoExameDialog] = useState(false);
    const [selectedCursoExameId, setSelectedCursoExameId] = useState('');
    const [vagasCursoExame, setVagasCursoExame] = useState(10);

    // Inscrição state
    const [openInscricaoDialog, setOpenInscricaoDialog] = useState(false);
    const [cpfBusca, setCpfBusca] = useState('');
    const [cidadaoEncontrado, setCidadaoEncontrado] = useState<any>(null);
    const [buscandoCidadao, setBuscandoCidadao] = useState(false);
    const [selectedAcaoCursoId, setSelectedAcaoCursoId] = useState('');

    // Editar status inscrição state
    const [openEditStatusDialog, setOpenEditStatusDialog] = useState(false);
    const [inscricaoSelecionada, setInscricaoSelecionada] = useState<any>(null);
    const [novoStatus, setNovoStatus] = useState('pendente');

    const loadData = useCallback(async () => {
        try {
            const [acaoResponse, instituicoesResponse] = await Promise.all([
                api.get(`/acoes/${id}`),
                api.get('/instituicoes'),
            ]);

            setFormData(acaoResponse.data);
            setInstituicoes(instituicoesResponse.data);
            setLoading(false);
        } catch (error: any) {
            enqueueSnackbar(
                error.response?.data?.error || 'Erro ao carregar dados',
                { variant: 'error' }
            );
            setLoading(false);
        }
    }, [id, enqueueSnackbar]);

    const loadInscricoes = useCallback(async () => {
        if (!id) return;

        try {
            const response = await api.get(`/inscricoes/acoes/${id}/inscricoes`);
            setInscricoes(response.data);
        } catch (error: any) {
            enqueueSnackbar(
                error.response?.data?.error || 'Erro ao carregar inscrições',
                { variant: 'error' }
            );
        }
    }, [id, enqueueSnackbar]);

    const loadFuncionariosAcao = useCallback(async () => {
        if (!id) return;
        try {
            const response = await api.get(`/acoes/${id}/funcionarios`);
            setFuncionariosAcao(response.data);
        } catch (error: any) {
            enqueueSnackbar(error.response?.data?.error || 'Erro ao carregar funcionários', { variant: 'error' });
        }
    }, [id, enqueueSnackbar]);

    const loadFuncionariosDisponiveis = useCallback(async () => {
        try {
            const response = await api.get('/funcionarios');
            setFuncionariosDisponiveis(response.data.filter((f: any) => f.ativo === true));
        } catch (error: any) {
            enqueueSnackbar('Erro ao carregar funcionários disponíveis', { variant: 'error' });
        }
    }, [enqueueSnackbar]);

    const handleAddFuncionario = async () => {
        if (!selectedFuncionario) return;
        try {
            await api.post(`/acoes/${id}/funcionarios`, { funcionario_id: selectedFuncionario });
            setOpenFuncionarioDialog(false);
            setSelectedFuncionario('');
            loadFuncionariosAcao();
            loadData();
            enqueueSnackbar('Funcion�rio adicionado com sucesso!', { variant: 'success' });
        } catch (error: any) {
            enqueueSnackbar(error.response?.data?.error || 'Erro ao adicionar funcionário', { variant: 'error' });
        }
    };

    const handleRemoveFuncionario = async (funcionario_id: string) => {
        if (!window.confirm('Deseja realmente remover este funcionário da ação?')) return;
        try {
            await api.delete(`/acoes/${id}/funcionarios/${funcionario_id}`);
            loadFuncionariosAcao();
            loadData();
            enqueueSnackbar('Funcion�rio removido com sucesso!', { variant: 'success' });
        } catch (error: any) {
            enqueueSnackbar(error.response?.data?.error || 'Erro ao remover funcionário', { variant: 'error' });
        }
    };

    const loadCustos = useCallback(async () => {
        if (!id) return;

        try {
            // Buscar abastecimentos (tem campo litros)
            const abastecimentosRes = await api.get(`/acoes/${id}/abastecimentos`);
            const abastecimentos = abastecimentosRes.data.map((a: any) => ({
                ...a,
                tipo_conta: 'abastecimento'
            }));

            // Buscar outras contas a pagar (funcionários, despesas gerais, etc)
            const contasRes = await api.get(`/contas-pagar`, {
                params: { acao_id: id, limit: 1000 }
            });

            const contas = contasRes.data.contas || contasRes.data || [];

            // Filtrar apenas contas que NÃO são abastecimentos
            const outrasContas = contas.filter((c: any) => c.tipo_conta !== 'abastecimento');

            // Combinar abastecimentos com outras contas
            const todosCustos = [...abastecimentos, ...outrasContas];
            setCustos(todosCustos);
        } catch (error: any) {
            console.error('❌ Erro ao carregar custos:', error);
            enqueueSnackbar(
                error.response?.data?.error || 'Erro ao carregar custos',
                { variant: 'error' }
            );
        }
    }, [id, enqueueSnackbar]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await api.put(`/acoes/${id}`, formData);
            enqueueSnackbar('Ação atualizada com sucesso!', { variant: 'success' });
            navigate('/admin/acoes');
        } catch (error: any) {
            enqueueSnackbar(
                error.response?.data?.error || 'Erro ao atualizar ação',
                { variant: 'error' }
            );
        }
    };

    const handleExcluir = async () => {
        if (!window.confirm('Tem certeza que deseja excluir esta ação?')) {
            return;
        }

        try {
            await api.delete(`/acoes/${id}`);
            enqueueSnackbar('Ação excluída com sucesso!', { variant: 'success' });
            navigate('/admin/acoes');
        } catch (error: any) {
            enqueueSnackbar(
                error.response?.data?.error || 'Erro ao excluir ação',
                { variant: 'error' }
            );
        }
    };

    const handleAbastecimentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setAbastecimentoForm((prev) => ({
            ...prev,
            [name]: name === 'litros' || name === 'valor_total' ? parseFloat(value) || 0 : value,
        }));
    };

    const handleAddAbastecimento = async () => {
        try {
            if (!abastecimentoForm.caminhao_id) {
                enqueueSnackbar('Selecione um caminhão', { variant: 'warning' });
                return;
            }

            await api.post(`/acoes/${id}/abastecimentos`, abastecimentoForm);

            enqueueSnackbar('Abastecimento registrado com sucesso!', { variant: 'success' });
            setOpenAbastecimentoDialog(false);
            setAbastecimentoForm({
                caminhao_id: '',
                data_abastecimento: new Date().toISOString().split('T')[0],
                litros: 0,
                valor_total: 0,
                observacoes: '',
            });
            loadCustos();
        } catch (error: any) {
            enqueueSnackbar(
                error.response?.data?.error || 'Erro ao registrar abastecimento',
                { variant: 'error' }
            );
        }
    };

    const handleDeleteAbastecimento = async (abastecimentoId: string) => {
        if (!window.confirm('Deseja realmente excluir este abastecimento?')) return;

        try {
            await api.delete(`/acoes/${id}/abastecimentos/${abastecimentoId}`);
            enqueueSnackbar('Abastecimento excluído com sucesso!', { variant: 'success' });
            loadCustos();
        } catch (error: any) {
            enqueueSnackbar(
                error.response?.data?.error || 'Erro ao excluir abastecimento',
                { variant: 'error' }
            );
        }
    };

    // Handlers para Despesa Geral
    const handleDespesaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setDespesaGeral(prev => ({ ...prev, [name]: value }));
    };

    const handleAddDespesaGeral = async () => {
        try {
            if (!despesaGeral.descricao || !despesaGeral.valor || !despesaGeral.data_vencimento) {
                enqueueSnackbar('Preencha todos os campos obrigatórios', { variant: 'warning' });
                return;
            }

            await api.post('/contas-pagar', {
                tipo_conta: 'espontaneo',
                descricao: despesaGeral.descricao,
                valor: parseFloat(despesaGeral.valor),
                data_vencimento: despesaGeral.data_vencimento,
                status: 'pendente',
                recorrente: false,
                observacoes: despesaGeral.observacoes || null,
                acao_id: id,
                cidade: formData.municipio,
            });

            enqueueSnackbar('Despesa registrada com sucesso!', { variant: 'success' });

            // Recarregar lista de custos ANTES de fechar o modal
            await loadCustos();

            // Fechar modal e limpar formulário
            setOpenDespesaDialog(false);
            setDespesaGeral({
                descricao: '',
                valor: '',
                data_vencimento: new Date().toISOString().split('T')[0],
                observacoes: ''
            });
        } catch (error: any) {
            console.error('Erro ao registrar despesa:', error);
            enqueueSnackbar(error.response?.data?.error || 'Erro ao registrar despesa', { variant: 'error' });
        }
    };

    const loadRecursos = useCallback(async () => {
        if (!id) return;

        try {
            const [caminhoesRes, cursosExamesRes, acaoRes] = await Promise.all([
                api.get('/caminhoes'),
                api.get('/cursos-exames'),
                api.get(`/acoes/${id}`),
            ]);

            setCaminhoes(caminhoesRes.data);
            setCursosExames(cursosExamesRes.data);
            setCaminhoesVinculados(acaoRes.data.caminhoes || []);
            setCursosExamesVinculados(acaoRes.data.cursos_exames || []);
        } catch (error: any) {
            enqueueSnackbar(
                error.response?.data?.error || 'Erro ao carregar recursos',
                { variant: 'error' }
            );
        }
    }, [id, enqueueSnackbar]);

    // Load all data on component mount
    useEffect(() => {
        loadRecursos();
        loadInscricoes();
        loadCustos();
        loadFuncionariosAcao();
    }, [loadRecursos, loadInscricoes, loadCustos, loadFuncionariosAcao]);

    const handleAddCaminhao = async () => {
        try {
            if (!selectedCaminhaoId) {
                enqueueSnackbar('Selecione um caminhão', { variant: 'warning' });
                return;
            }

            await api.post(`/acoes/${id}/caminhoes`, {
                caminhao_id: selectedCaminhaoId,
            });

            enqueueSnackbar('Caminhão vinculado com sucesso!', { variant: 'success' });
            setOpenAddCaminhaoDialog(false);
            setSelectedCaminhaoId('');
            loadRecursos();
        } catch (error: any) {
            enqueueSnackbar(
                error.response?.data?.error || 'Erro ao vincular caminhão',
                { variant: 'error' }
            );
        }
    };

    const handleRemoveCaminhao = async (caminhaoId: string) => {
        try {
            await api.delete(`/acoes/${id}/caminhoes/${caminhaoId}`);
            enqueueSnackbar('Caminhão desvinculado com sucesso!', { variant: 'success' });
            loadRecursos();
        } catch (error: any) {
            enqueueSnackbar(
                error.response?.data?.error || 'Erro ao desvincular caminhão',
                { variant: 'error' }
            );
        }
    };

    const handleAddCursoExame = async () => {
        try {
            if (!selectedCursoExameId) {
                enqueueSnackbar('Selecione um curso/exame', { variant: 'warning' });
                return;
            }

            if (vagasCursoExame <= 0) {
                enqueueSnackbar('Número de vagas deve ser maior que zero', { variant: 'warning' });
                return;
            }

            // Validar se a soma das vagas não excede as vagas disponíveis da ação
            const vagasJaOferecidas = cursosExamesVinculados.reduce((total, ce) => total + ce.vagas, 0);
            const totalVagasComNovo = vagasJaOferecidas + vagasCursoExame;
            const vagasDisponiveis = Number(formData.vagas_disponiveis) || 0;

            if (totalVagasComNovo > vagasDisponiveis) {
                enqueueSnackbar(
                    `Erro: Total de vagas (${totalVagasComNovo}) excede as vagas disponíveis da ação (${vagasDisponiveis}). Vagas já oferecidas: ${vagasJaOferecidas}`,
                    { variant: 'error' }
                );
                return;
            }

            // Validar se o tipo do curso/exame é compatível com o tipo da ação
            const cursoExameSelecionado = cursosExames.find(ce => ce.id === selectedCursoExameId);
            if (cursoExameSelecionado) {
                const tipoAcao = formData.tipo.toLowerCase();
                const tipoCursoExame = cursoExameSelecionado.tipo.toLowerCase();

                if (tipoAcao === 'saude' && tipoCursoExame !== 'exame') {
                    enqueueSnackbar(
                        'Erro: Ações de SAÚDE só podem ter EXAMES vinculados',
                        { variant: 'error' }
                    );
                    return;
                }

                if (tipoAcao === 'curso' && tipoCursoExame !== 'curso') {
                    enqueueSnackbar(
                        'Erro: Ações de CURSO só podem ter CURSOS vinculados',
                        { variant: 'error' }
                    );
                    return;
                }
            }

            await api.post(`/acoes/${id}/cursos-exames`, {
                curso_exame_id: selectedCursoExameId,
                vagas: vagasCursoExame,
            });

            enqueueSnackbar('Curso/Exame vinculado com sucesso!', { variant: 'success' });
            setOpenAddCursoExameDialog(false);
            setSelectedCursoExameId('');
            setVagasCursoExame(10);
            loadRecursos();
        } catch (error: any) {
            enqueueSnackbar(
                error.response?.data?.error || 'Erro ao vincular curso/exame',
                { variant: 'error' }
            );
        }
    };

    const handleRemoveCursoExame = async (acaoCursoExameId: string) => {
        try {
            await api.delete(`/acoes/${id}/cursos-exames/${acaoCursoExameId}`);
            enqueueSnackbar('Curso/Exame desvinculado com sucesso!', { variant: 'success' });
            loadRecursos();
        } catch (error: any) {
            enqueueSnackbar(
                error.response?.data?.error || 'Erro ao desvincular curso/exame',
                { variant: 'error' }
            );
        }
    };

    const handleBuscarCidadao = async () => {
        if (!cpfBusca) {
            enqueueSnackbar('Digite um CPF para buscar', { variant: 'warning' });
            return;
        }

        setBuscandoCidadao(true);
        try {
            const response = await api.get(`/cidadaos/buscar-cpf/${cpfBusca.replace(/\D/g, '')}`);
            setCidadaoEncontrado(response.data);
            enqueueSnackbar('Cidadão encontrado!', { variant: 'success' });
        } catch (error: any) {
            enqueueSnackbar('Cidadão não encontrado', { variant: 'warning' });
            setCidadaoEncontrado(null);
        } finally {
            setBuscandoCidadao(false);
        }
    };

    const handleInscreverCidadao = async () => {
        try {
            if (!cidadaoEncontrado) {
                enqueueSnackbar('Busque um cidadão primeiro', { variant: 'warning' });
                return;
            }

            if (!selectedAcaoCursoId) {
                enqueueSnackbar('Selecione um curso/exame', { variant: 'warning' });
                return;
            }

            await api.post(`/inscricoes/acoes/${id}/inscricoes`, {
                cidadao_id: cidadaoEncontrado.id,
                acao_curso_id: selectedAcaoCursoId,
            });

            enqueueSnackbar('Cidadão inscrito com sucesso!', { variant: 'success' });
            setOpenInscricaoDialog(false);
            setCpfBusca('');
            setCidadaoEncontrado(null);
            setSelectedAcaoCursoId('');
            loadInscricoes();
        } catch (error: any) {
            enqueueSnackbar(
                error.response?.data?.error || 'Erro ao inscrever cidadão',
                { variant: 'error' }
            );
        }
    };

    // Helper para mapear status para exibição
    const getStatusDisplay = (inscricao: any): string => {
        return inscricao.status || 'pendente';
    };

    // Handler para atualizar status da inscrição
    const handleAtualizarStatus = async () => {
        try {
            if (!inscricaoSelecionada) return;

            console.log('🔄 Iniciando atualização de status...', {
                inscricaoId: inscricaoSelecionada.id,
                novoStatus: novoStatus
            });

            await api.put(`/inscricoes/${inscricaoSelecionada.id}/status`, {
                status: novoStatus,
            });

            console.log('✅ Requisição enviada com sucesso!');

            enqueueSnackbar('Status atualizado com sucesso!', { variant: 'success' });
            setOpenEditStatusDialog(false);
            setInscricaoSelecionada(null);
            await loadInscricoes();
        } catch (error: any) {
            console.error('❌ Erro ao atualizar status:', error);
            enqueueSnackbar(
                error.response?.data?.error || 'Erro ao atualizar status',
                { variant: 'error' }
            );
        }
    };

    const handleOpenEditStatus = (inscricao: any) => {
        setInscricaoSelecionada(inscricao);
        setNovoStatus(getStatusDisplay(inscricao));
        setOpenEditStatusDialog(true);
    };

    const handleExportarCSV = async () => {
        try {
            const response = await api.get(`/acoes/${id}/export/inscritos?format=csv`, {
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `inscricoes_${id}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            enqueueSnackbar('CSV exportado com sucesso!', { variant: 'success' });
        } catch (error: any) {
            enqueueSnackbar(
                error.response?.data?.error || 'Erro ao exportar CSV',
                { variant: 'error' }
            );
        }
    };

    const handleExportarPDF = async () => {
        try {
            const response = await api.get(`/acoes/${id}/export/inscritos?format=pdf`, {
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `inscricoes_${id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            enqueueSnackbar('PDF exportado com sucesso!', { variant: 'success' });
        } catch (error: any) {
            enqueueSnackbar(
                error.response?.data?.error || 'Erro ao exportar PDF',
                { variant: 'error' }
            );
        }
    };

    const handleExportarExcel = async () => {
        try {
            const response = await api.get(`/acoes/${id}/export/inscritos?format=csv`, {
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `inscricoes_acao_${id}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            enqueueSnackbar('Excel exportado com sucesso!', { variant: 'success' });
        } catch (error: any) {
            enqueueSnackbar(
                error.response?.data?.error || 'Erro ao exportar Excel',
                { variant: 'error' }
            );
        }
    };

    useEffect(() => {
        if (activeTab === 1) {
            loadRecursos();
        }
    }, [activeTab, loadRecursos]);

    useEffect(() => {
        if (activeTab === 2) {
            loadInscricoes();
        }
    }, [activeTab, loadInscricoes]);

    useEffect(() => {
        if (activeTab === 3) {
            loadCustos();
        }
    }, [activeTab, loadCustos]);

    const estados = [
        'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
        'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
        'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
    ];

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            {/* Header com Gradiente */}
            <Box sx={{
                background: 'linear-gradient(135deg, #4682b4 0%, #5b9bd5 100%)',
                borderRadius: '8px',
                p: 1.5,
                mb: 2,
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(70, 130, 180, 0.15)'
            }}>
                <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(10px)'
                }} />
                <Box sx={{
                    position: 'relative',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <Typography variant="h6" sx={{
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: '1.25rem',
                        textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}>
                        {formData.nome || 'Nova Ação'}
                    </Typography>
                    <IconButton
                        onClick={handleExcluir}
                        size="small"
                        sx={{
                            color: '#ef4444',
                            background: 'rgba(255,255,255,0.15)',
                            '&:hover': {
                                background: 'rgba(239, 68, 68, 0.2)',
                                transform: 'scale(1.05)'
                            },
                            transition: 'all 0.2s ease'
                        }}
                        title="Excluir Ação"
                    >
                        <Trash2 size={16} />
                    </IconButton>
                </Box>
            </Box>

            {/* Tabs Modernas */}
            <Box sx={{
                display: 'flex',
                gap: 0.5,
                mb: 2,
                background: 'rgba(70, 130, 180, 0.05)',
                borderRadius: '8px',
                p: 0.5,
                border: '1px solid rgba(70, 130, 180, 0.1)'
            }}>
                {['Informações Básicas', 'Recursos', 'Inscrições', 'Custos'].map((label, index) => (
                    <Box
                        key={index}
                        onClick={() => setActiveTab(index)}
                        sx={{
                            flex: 1,
                            py: 0.75,
                            px: 1.25,
                            borderRadius: '6px',
                            cursor: 'pointer',
                            textAlign: 'center',
                            background: activeTab === index
                                ? 'linear-gradient(135deg, #4682b4 0%, #5b9bd5 100%)'
                                : 'transparent',
                            color: activeTab === index ? '#fff' : '#4682b4',
                            fontSize: '0.875rem',
                            fontWeight: activeTab === index ? 600 : 500,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                background: activeTab === index
                                    ? 'linear-gradient(135deg, #4682b4 0%, #5b9bd5 100%)'
                                    : 'rgba(70, 130, 180, 0.08)',
                                transform: 'translateY(-1px)'
                            }
                        }}
                    >
                        {label}
                    </Box>
                ))}
            </Box>

            <Paper elevation={0} sx={{
                background: 'transparent',
                p: 0
            }}>

                {activeTab === 0 && (
                    <Box sx={{
                        background: 'rgba(70, 130, 180, 0.03)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '12px',
                        border: '1px solid rgba(70, 130, 180, 0.1)',
                        p: 3,
                        mb: 2
                    }}>
                        <Box component="form" onSubmit={handleSubmit}>
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <TextField
                                        required
                                        fullWidth
                                        label="Nome da Ação"
                                        name="nome"
                                        value={formData.nome || ''}
                                        onChange={handleChange}
                                        placeholder="Ex: Campanha de Hemograma"
                                        helperText="Nome que identificará esta ação"
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        required
                                        fullWidth
                                        select
                                        label="Instituição"
                                        name="instituicao_id"
                                        value={formData.instituicao_id}
                                        onChange={handleChange}
                                    >
                                        {instituicoes.map((inst) => (
                                            <MenuItem key={inst.id} value={inst.id}>
                                                {inst.razao_social}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        required
                                        fullWidth
                                        select
                                        label="Tipo"
                                        name="tipo"
                                        value={formData.tipo}
                                        onChange={handleChange}
                                    >
                                        <MenuItem value="curso">Curso</MenuItem>
                                        <MenuItem value="saude">Saúde</MenuItem>
                                        <MenuItem value="documentacao">Documentação</MenuItem>
                                        <MenuItem value="assistencia_social">Assistência Social</MenuItem>
                                    </TextField>
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        required
                                        fullWidth
                                        select
                                        label="Status"
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                    >
                                        <MenuItem value="planejada">Planejada</MenuItem>
                                        <MenuItem value="ativa">Ativa</MenuItem>
                                        <MenuItem value="concluida">Concluída</MenuItem>
                                    </TextField>
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        required
                                        fullWidth
                                        label="Município"
                                        name="municipio"
                                        value={formData.municipio}
                                        onChange={handleChange}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        required
                                        fullWidth
                                        select
                                        label="Estado"
                                        name="estado"
                                        value={formData.estado}
                                        onChange={handleChange}
                                    >
                                        {estados.map((estado) => (
                                            <MenuItem key={estado} value={estado}>
                                                {estado}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        required
                                        fullWidth
                                        type="date"
                                        label="Data de Início"
                                        name="data_inicio"
                                        value={formData.data_inicio}
                                        onChange={handleChange}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        required
                                        fullWidth
                                        type="date"
                                        label="Data de Fim"
                                        name="data_fim"
                                        value={formData.data_fim}
                                        onChange={handleChange}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        required
                                        fullWidth
                                        label="Local de Execução"
                                        name="local_execucao"
                                        value={formData.local_execucao}
                                        onChange={handleChange}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Vagas Disponíveis"
                                        name="vagas_disponiveis"
                                        value={formData.vagas_disponiveis}
                                        onChange={handleChange}
                                        onFocus={e => e.target.select()}
                                        inputProps={{ min: 0 }}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Distância (km)"
                                        name="distancia_km"
                                        value={formData.distancia_km}
                                        onChange={handleChange}
                                        onFocus={e => e.target.select()}
                                        inputProps={{ min: 0, step: 0.1 }}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Preço Combustível Referência (R$/L)"
                                        name="preco_combustivel_referencia"
                                        value={formData.preco_combustivel_referencia}
                                        onChange={handleChange}
                                        onFocus={e => e.target.select()}
                                        inputProps={{ min: 0, step: 0.01 }}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={4}
                                        label="Descrição"
                                        name="descricao"
                                        value={formData.descricao}
                                        onChange={handleChange}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                                        <Button
                                            variant="outlined"
                                            onClick={() => navigate('/admin/acoes')}
                                            sx={{
                                                borderColor: '#4682b4',
                                                color: '#4682b4',
                                                '&:hover': {
                                                    borderColor: '#5b9bd5',
                                                    background: 'rgba(70, 130, 180, 0.05)'
                                                }
                                            }}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            type="submit"
                                            variant="contained"
                                            startIcon={<CheckCircle size={18} />}
                                            sx={{
                                                background: 'linear-gradient(135deg, #4682b4 0%, #5b9bd5 100%)',
                                                color: '#fff',
                                                fontWeight: 600,
                                                '&:hover': {
                                                    background: 'linear-gradient(135deg, #5b9bd5 0%, #4682b4 100%)',
                                                    transform: 'translateY(-1px)',
                                                    boxShadow: '0 4px 12px rgba(70, 130, 180, 0.3)'
                                                },
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            Salvar Alterações
                                        </Button>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Box>
                    </Box>
                )}

                {activeTab === 1 && (
                    <Box sx={{
                        background: 'rgba(70, 130, 180, 0.03)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '12px',
                        border: '1px solid rgba(70, 130, 180, 0.1)',
                        p: 3,
                        mb: 2
                    }}>
                        {/* Seção de Caminhões */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                            <Typography variant="h6" sx={{
                                color: '#4682b4',
                                fontWeight: 600,
                                fontSize: '1.1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                            }}>
                                <Truck size={20} />
                                Caminhões Vinculados ({caminhoesVinculados.length})
                            </Typography>
                            <Button
                                variant="contained"
                                startIcon={<Plus size={18} />}
                                onClick={() => setOpenAddCaminhaoDialog(true)}
                                sx={{
                                    background: 'linear-gradient(135deg, #4682b4 0%, #5b9bd5 100%)',
                                    color: '#fff',
                                    fontWeight: 600,
                                    textTransform: 'none',
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #5b9bd5 0%, #4682b4 100%)',
                                        transform: 'translateY(-1px)',
                                        boxShadow: '0 4px 12px rgba(70, 130, 180, 0.3)'
                                    },
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                Adicionar Caminhão
                            </Button>
                        </Box>

                        {caminhoesVinculados.length === 0 ? (
                            <Box sx={{
                                background: 'rgba(70, 130, 180, 0.05)',
                                borderRadius: '8px',
                                p: 3,
                                textAlign: 'center',
                                border: '1px dashed rgba(70, 130, 180, 0.2)'
                            }}>
                                <Typography variant="body2" sx={{ color: '#4682b4' }}>
                                    Nenhum caminhão vinculado ainda.
                                </Typography>
                            </Box>
                        ) : (
                            <TableContainer component={Paper} sx={{
                                borderRadius: '8px',
                                overflow: 'hidden',
                                boxShadow: 'none',
                                border: '1px solid rgba(70, 130, 180, 0.1)'
                            }}>
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{
                                            background: 'linear-gradient(135deg, #4682b4 0%, #5b9bd5 100%)'
                                        }}>
                                            <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Placa</TableCell>
                                            <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Modelo</TableCell>
                                            <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Status</TableCell>
                                            <TableCell align="right" sx={{ color: '#fff', fontWeight: 600 }}>Ações</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {caminhoesVinculados.map((caminhao: any) => (
                                            <TableRow key={caminhao.id}>
                                                <TableCell>{caminhao.placa}</TableCell>
                                                <TableCell>{caminhao.modelo}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={
                                                            caminhao.status === 'disponivel' ? 'Disponível' :
                                                                caminhao.status === 'em_manutencao' ? 'Em Manutenção' :
                                                                    'Em Ação'
                                                        }
                                                        color={
                                                            caminhao.status === 'disponivel' ? 'success' :
                                                                caminhao.status === 'em_manutencao' ? 'warning' :
                                                                    'info'
                                                        }
                                                        size="small"
                                                    />
                                                </TableCell>
                                                <TableCell align="right">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleRemoveCaminhao(caminhao.id)}
                                                        sx={{
                                                            color: '#ef4444',
                                                            '&:hover': {
                                                                background: 'rgba(239, 68, 68, 0.1)'
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}

                        <Dialog
                            open={openAddCaminhaoDialog}
                            onClose={() => setOpenAddCaminhaoDialog(false)}
                            maxWidth="sm"
                            fullWidth
                        >
                            <DialogTitle>Adicionar Caminhão</DialogTitle>
                            <DialogContent>
                                <Box sx={{ pt: 2 }}>
                                    <TextField
                                        required
                                        select
                                        fullWidth
                                        label="Selecione o Caminhão"
                                        value={selectedCaminhaoId}
                                        onChange={(e) => setSelectedCaminhaoId(e.target.value)}
                                    >
                                        {caminhoes
                                            .filter(c => !caminhoesVinculados.find(cv => cv.id === c.id))
                                            .map((caminhao: any) => (
                                                <MenuItem key={caminhao.id} value={caminhao.id}>
                                                    {caminhao.placa} - {caminhao.modelo} ({caminhao.status === 'disponivel' ? 'Disponível' : caminhao.status === 'em_manutencao' ? 'Em Manutenção' : 'Em Ação'})
                                                </MenuItem>
                                            ))}
                                    </TextField>
                                </Box>
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={() => setOpenAddCaminhaoDialog(false)}>
                                    Cancelar
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={handleAddCaminhao}
                                    disabled={!selectedCaminhaoId}
                                >
                                    Adicionar
                                </Button>
                            </DialogActions>
                        </Dialog>

                        {/* Seção de Cursos/Exames */}
                        <Box sx={{ mt: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                                <Typography variant="h6" sx={{
                                    color: '#4682b4',
                                    fontWeight: 600,
                                    fontSize: '1.1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1
                                }}>
                                    <Stethoscope size={20} />
                                    Exames Vinculados ({cursosExamesVinculados.length})
                                </Typography>
                                <Button
                                    variant="contained"
                                    startIcon={<Plus size={18} />}
                                    onClick={() => setOpenAddCursoExameDialog(true)}
                                    sx={{
                                        background: 'linear-gradient(135deg, #4682b4 0%, #5b9bd5 100%)',
                                        color: '#fff',
                                        fontWeight: 600,
                                        textTransform: 'none',
                                        '&:hover': {
                                            background: 'linear-gradient(135deg, #5b9bd5 0%, #4682b4 100%)',
                                            transform: 'translateY(-1px)',
                                            boxShadow: '0 4px 12px rgba(70, 130, 180, 0.3)'
                                        },
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    Adicionar Exame
                                </Button>
                            </Box>

                            {cursosExamesVinculados.length === 0 ? (
                                <Box sx={{
                                    background: 'rgba(70, 130, 180, 0.05)',
                                    borderRadius: '8px',
                                    p: 3,
                                    textAlign: 'center',
                                    border: '1px dashed rgba(70, 130, 180, 0.2)'
                                }}>
                                    <Typography variant="body2" sx={{ color: '#4682b4' }}>
                                        Nenhum exame vinculado ainda.
                                    </Typography>
                                </Box>
                            ) : (
                                <TableContainer component={Paper} sx={{
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    boxShadow: 'none',
                                    border: '1px solid rgba(70, 130, 180, 0.1)'
                                }}>
                                    <Table>
                                        <TableHead>
                                            <TableRow sx={{
                                                background: 'linear-gradient(135deg, #4682b4 0%, #5b9bd5 100%)'
                                            }}>
                                                <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Nome</TableCell>
                                                <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Tipo</TableCell>
                                                <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Vagas</TableCell>
                                                <TableCell align="right" sx={{ color: '#fff', fontWeight: 600 }}>Ações</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {cursosExamesVinculados.map((acaoCurso: AcaoCursoExame) => (
                                                <TableRow key={acaoCurso.id}>
                                                    <TableCell>{acaoCurso.curso_exame?.nome || '-'}</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={acaoCurso.curso_exame?.tipo === 'curso' ? 'Curso' : 'Exame'}
                                                            color={acaoCurso.curso_exame?.tipo === 'curso' ? 'primary' : 'secondary'}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell>{acaoCurso.vagas}</TableCell>
                                                    <TableCell align="right">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleRemoveCursoExame(acaoCurso.id)}
                                                            sx={{
                                                                color: '#ef4444',
                                                                '&:hover': {
                                                                    background: 'rgba(239, 68, 68, 0.1)'
                                                                }
                                                            }}
                                                        >
                                                            <Trash2 size={16} />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}

                            <Dialog
                                open={openAddCursoExameDialog}
                                onClose={() => setOpenAddCursoExameDialog(false)}
                                maxWidth="sm"
                                fullWidth
                            >
                                <DialogTitle>Adicionar Exame</DialogTitle>
                                <DialogContent>
                                    <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        <TextField
                                            required
                                            select
                                            fullWidth
                                            label="Selecione o Exame"
                                            value={selectedCursoExameId}
                                            onChange={(e) => setSelectedCursoExameId(e.target.value)}
                                        >
                                            {cursosExames
                                                .filter(ce => !cursosExamesVinculados.find(cev => cev.curso_exame_id === ce.id))
                                                .filter(ce => {
                                                    // Filtrar por tipo compatível com a ação
                                                    const tipoAcao = formData.tipo.toLowerCase();
                                                    const tipoCursoExame = ce.tipo.toLowerCase();

                                                    if (tipoAcao === 'saude') return tipoCursoExame === 'exame';
                                                    if (tipoAcao === 'curso') return tipoCursoExame === 'curso';
                                                    return true; // Outros tipos de ação aceitam ambos
                                                })
                                                .map((cursoExame: CursoExame) => (
                                                    <MenuItem key={cursoExame.id} value={cursoExame.id}>
                                                        {cursoExame.nome} ({cursoExame.tipo === 'curso' ? 'Curso' : 'Exame'})
                                                    </MenuItem>
                                                ))}
                                        </TextField>
                                        <TextField
                                            required
                                            fullWidth
                                            type="number"
                                            label="Número de Vagas"
                                            value={vagasCursoExame}
                                            onChange={(e) => setVagasCursoExame(parseInt(e.target.value) || 0)}
                                            onFocus={e => e.target.select()}
                                            inputProps={{ min: 1 }}
                                        />
                                    </Box>
                                </DialogContent>
                                <DialogActions>
                                    <Button onClick={() => setOpenAddCursoExameDialog(false)}>
                                        Cancelar
                                    </Button>
                                    <Button
                                        variant="contained"
                                        onClick={handleAddCursoExame}
                                        disabled={!selectedCursoExameId || vagasCursoExame <= 0}
                                    >
                                        Adicionar
                                    </Button>
                                </DialogActions>
                            </Dialog>
                        </Box>
                    </Box>
                )}

                {activeTab === 2 && (
                    <Box sx={{
                        background: 'rgba(70, 130, 180, 0.03)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '12px',
                        border: '1px solid rgba(70, 130, 180, 0.1)',
                        p: 3,
                        mb: 2
                    }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                            <Typography variant="h6" sx={{
                                color: '#4682b4',
                                fontWeight: 600,
                                fontSize: '1.1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                            }}>
                                <UserPlus size={20} />
                                Inscrições ({inscricoes.length})
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<Download size={16} />}
                                    onClick={handleExportarCSV}
                                    disabled={inscricoes.length === 0}
                                    sx={{
                                        borderColor: '#4682b4',
                                        color: '#4682b4',
                                        textTransform: 'none',
                                        '&:hover': {
                                            borderColor: '#5b9bd5',
                                            background: 'rgba(70, 130, 180, 0.05)'
                                        }
                                    }}
                                >
                                    CSV
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<Download size={16} />}
                                    onClick={handleExportarPDF}
                                    disabled={inscricoes.length === 0}
                                    sx={{
                                        borderColor: '#4682b4',
                                        color: '#4682b4',
                                        textTransform: 'none',
                                        '&:hover': {
                                            borderColor: '#5b9bd5',
                                            background: 'rgba(70, 130, 180, 0.05)'
                                        }
                                    }}
                                >
                                    PDF
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<Download size={16} />}
                                    onClick={handleExportarExcel}
                                    disabled={inscricoes.length === 0}
                                    sx={{
                                        borderColor: '#4682b4',
                                        color: '#4682b4',
                                        textTransform: 'none',
                                        '&:hover': {
                                            borderColor: '#5b9bd5',
                                            background: 'rgba(70, 130, 180, 0.05)'
                                        }
                                    }}
                                >
                                    Excel
                                </Button>
                                <Button
                                    variant="contained"
                                    size="small"
                                    startIcon={<UserPlus size={16} />}
                                    onClick={() => setOpenInscricaoDialog(true)}
                                    disabled={cursosExamesVinculados.length === 0}
                                    sx={{
                                        background: 'linear-gradient(135deg, #4682b4 0%, #5b9bd5 100%)',
                                        color: '#fff',
                                        fontWeight: 600,
                                        textTransform: 'none',
                                        '&:hover': {
                                            background: 'linear-gradient(135deg, #5b9bd5 0%, #4682b4 100%)',
                                            transform: 'translateY(-1px)',
                                            boxShadow: '0 4px 12px rgba(70, 130, 180, 0.3)'
                                        },
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    Inscrever Cidadão
                                </Button>
                            </Box>
                        </Box>

                        {cursosExamesVinculados.length === 0 && (
                            <Alert severity="warning" sx={{ mb: 2 }}>
                                Para inscrever alunos, primeiro adicione cursos/exames na aba "Recursos".
                            </Alert>
                        )}

                        {inscricoes.length === 0 ? (
                            <Box sx={{
                                background: 'rgba(70, 130, 180, 0.05)',
                                borderRadius: '8px',
                                p: 3,
                                textAlign: 'center',
                                border: '1px dashed rgba(70, 130, 180, 0.2)'
                            }}>
                                <Typography variant="body2" sx={{ color: '#4682b4' }}>
                                    Nenhuma inscrição registrada ainda.
                                </Typography>
                            </Box>
                        ) : (
                            <TableContainer component={Paper} sx={{
                                borderRadius: '8px',
                                overflow: 'hidden',
                                boxShadow: 'none',
                                border: '1px solid rgba(70, 130, 180, 0.1)'
                            }}>
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{
                                            background: 'linear-gradient(135deg, #4682b4 0%, #5b9bd5 100%)'
                                        }}>
                                            <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Cidadão</TableCell>
                                            <TableCell sx={{ color: '#fff', fontWeight: 600 }}>CPF</TableCell>
                                            <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Data Inscrição</TableCell>
                                            <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Status</TableCell>
                                            <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Ações</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {inscricoes.map((inscricao: any) => (
                                            <TableRow key={inscricao.id}>
                                                <TableCell>{inscricao.cidadao?.nome_completo || '-'}</TableCell>
                                                <TableCell>{inscricao.cidadao?.cpf || '-'}</TableCell>
                                                <TableCell>
                                                    {new Date(inscricao.data_inscricao).toLocaleDateString('pt-BR')}
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={getStatusDisplay(inscricao).toUpperCase()}
                                                        color={
                                                            getStatusDisplay(inscricao) === 'atendido' ? 'success' :
                                                                getStatusDisplay(inscricao) === 'faltou' ? 'error' :
                                                                    'warning'
                                                        }
                                                        size="small"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleOpenEditStatus(inscricao)}
                                                        title="Editar Status"
                                                        sx={{
                                                            color: '#4682b4',
                                                            '&:hover': {
                                                                background: 'rgba(70, 130, 180, 0.1)'
                                                            }
                                                        }}
                                                    >
                                                        <Edit size={16} />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}

                        <Dialog open={openInscricaoDialog} onClose={() => setOpenInscricaoDialog(false)} maxWidth="sm" fullWidth>
                            <DialogTitle>Inscrever Cidadão</DialogTitle>
                            <DialogContent>
                                <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <TextField
                                        required
                                        select
                                        fullWidth
                                        label="Exame"
                                        value={selectedAcaoCursoId}
                                        onChange={(e) => setSelectedAcaoCursoId(e.target.value)}
                                    >
                                        {cursosExamesVinculados.map((acaoCurso: AcaoCursoExame) => (
                                            <MenuItem key={acaoCurso.id} value={acaoCurso.id}>
                                                {acaoCurso.curso_exame?.nome || '-'} ({acaoCurso.vagas} vagas)
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                    <TextField
                                        fullWidth
                                        label="CPF do Aluno"
                                        value={cpfBusca}
                                        onChange={(e) => setCpfBusca(e.target.value)}
                                        placeholder="000.000.000-00"
                                    />
                                    <Button
                                        variant="outlined"
                                        onClick={handleBuscarCidadao}
                                        disabled={!cpfBusca || buscandoCidadao}
                                    >
                                        {buscandoCidadao ? 'Buscando...' : 'Buscar'}
                                    </Button>

                                    {cidadaoEncontrado && (
                                        <Alert severity="success">
                                            <strong>{cidadaoEncontrado.nome_completo}</strong><br />
                                            CPF: {cidadaoEncontrado.cpf}<br />
                                            Email: {cidadaoEncontrado.email || '-'}
                                        </Alert>
                                    )}
                                </Box>
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={() => {
                                    setOpenInscricaoDialog(false);
                                    setCpfBusca('');
                                    setCidadaoEncontrado(null);
                                    setSelectedAcaoCursoId('');
                                }}>
                                    Cancelar
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={handleInscreverCidadao}
                                    disabled={!cidadaoEncontrado || !selectedAcaoCursoId}
                                >
                                    Inscrever
                                </Button>
                            </DialogActions>
                        </Dialog>
                    </Box>
                )}

                {activeTab === 3 && (
                    <Box sx={{
                        background: 'rgba(70, 130, 180, 0.03)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '12px',
                        border: '1px solid rgba(70, 130, 180, 0.1)',
                        p: 3,
                        mb: 2
                    }}>
                        {/* Custos Estimados */}
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="h6" sx={{
                                color: '#4682b4',
                                fontWeight: 600,
                                fontSize: '1.1rem',
                                mb: 2
                            }}>
                                Custos Estimados
                            </Typography>
                            <Box sx={{
                                background: 'linear-gradient(135deg, rgba(70, 130, 180, 0.05) 0%, rgba(91, 155, 213, 0.05) 100%)',
                                borderRadius: '12px',
                                border: '1px solid rgba(70, 130, 180, 0.15)',
                                p: 3
                            }}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Typography variant="body2" color="text.secondary">
                                            Distância
                                        </Typography>
                                        <Typography variant="h6">
                                            {String(formData.distancia_km)} km
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Typography variant="body2" color="text.secondary">
                                            Preço Combustível
                                        </Typography>
                                        <Typography variant="h6">
                                            R$ {parseFloat(String(formData.preco_combustivel_referencia || 0)).toFixed(2)}/L
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Typography variant="body2" color="text.secondary">
                                            Autonomia Média
                                        </Typography>
                                        <Typography variant="h6">
                                            {(() => {
                                                if (caminhoesVinculados.length === 0) return '0';

                                                let somaAutonomia = 0;
                                                let count = 0;

                                                caminhoesVinculados.forEach((cv: any) => {
                                                    // Campo correto: autonomia_km_litro
                                                    const autonomiaValue = cv.autonomia_km_litro || cv.caminhao?.autonomia_km_litro || 0;
                                                    const autonomia = Number(autonomiaValue);

                                                    if (!isNaN(autonomia) && autonomia > 0) {
                                                        somaAutonomia += autonomia;
                                                        count++;
                                                    }
                                                });

                                                if (count === 0) return '0';
                                                const media = somaAutonomia / count;
                                                return String(media.toFixed(1));
                                            })()} km/L
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Typography variant="body2" color="text.secondary">
                                            Custo Estimado de Combustível
                                        </Typography>
                                        <Typography variant="h6" color="primary">
                                            R$ {(() => {
                                                const distancia = Number(formData.distancia_km) || 0;
                                                const precoCombustivel = Number(formData.preco_combustivel_referencia) || 0;

                                                // Calcular autonomia média
                                                let somaAutonomia = 0;
                                                let count = 0;

                                                caminhoesVinculados.forEach((cv: any) => {
                                                    // Campo correto: autonomia_km_litro
                                                    const autonomiaValue = cv.autonomia_km_litro || cv.caminhao?.autonomia_km_litro || 0;
                                                    const autonomia = Number(autonomiaValue);

                                                    if (!isNaN(autonomia) && autonomia > 0) {
                                                        somaAutonomia += autonomia;
                                                        count++;
                                                    }
                                                });

                                                if (count === 0) return '0.00';

                                                const autonomiaMedia = somaAutonomia / count;

                                                // Cálculo: (distância / autonomia) * preço
                                                const litrosNecessarios = distancia / autonomiaMedia;
                                                const custoEstimado = litrosNecessarios * precoCombustivel;

                                                return custoEstimado.toFixed(2);
                                            })()}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Typography variant="body2" color="text.secondary">
                                            Custo com Funcionários
                                        </Typography>
                                        <Typography variant="h6" sx={{ color: '#4682b4', fontWeight: 600 }}>
                                            R$ {(() => {
                                                const custoFuncionarios = funcionariosAcao.reduce((total: number, func: any) => {
                                                    const valorDiaria = Number(func.valor_diaria) || 0;
                                                    const diasTrabalhados = Number(func.dias_trabalhados) || 1;
                                                    return total + (valorDiaria * diasTrabalhados);
                                                }, 0);
                                                return custoFuncionarios.toFixed(2);
                                            })()}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Box sx={{
                                            background: 'linear-gradient(135deg, #4682b4 0%, #5b9bd5 100%)',
                                            borderRadius: '12px',
                                            p: 3,
                                            mt: 2,
                                            boxShadow: '0 4px 12px rgba(70, 130, 180, 0.3)'
                                        }}>
                                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', mb: 1 }}>
                                                Custo Total Estimado da Ação
                                            </Typography>
                                            <Typography variant="h4" sx={{ color: '#fff', fontWeight: 700, mb: 2 }}>
                                                R$ {(() => {
                                                    // Custo de combustível
                                                    const distancia = Number(formData.distancia_km) || 0;
                                                    const precoCombustivel = Number(formData.preco_combustivel_referencia) || 0;
                                                    let somaAutonomia = 0;
                                                    let count = 0;
                                                    caminhoesVinculados.forEach((cv: any) => {
                                                        const autonomiaValue = cv.autonomia_km_litro || cv.caminhao?.autonomia_km_litro || 0;
                                                        const autonomia = Number(autonomiaValue);
                                                        if (!isNaN(autonomia) && autonomia > 0) {
                                                            somaAutonomia += autonomia;
                                                            count++;
                                                        }
                                                    });
                                                    const autonomiaMedia = count > 0 ? somaAutonomia / count : 0;
                                                    const litrosNecessarios = autonomiaMedia > 0 ? distancia / autonomiaMedia : 0;
                                                    const custoCombustivel = litrosNecessarios * precoCombustivel;

                                                    // Custo de funcionários
                                                    const custoFuncionarios = funcionariosAcao.reduce((total: number, func: any) => {
                                                        const valorDiaria = Number(func.valor_diaria) || 0;
                                                        const diasTrabalhados = Number(func.dias_trabalhados) || 1;
                                                        return total + (valorDiaria * diasTrabalhados);
                                                    }, 0);

                                                    const custoTotal = custoCombustivel + custoFuncionarios;
                                                    return custoTotal.toFixed(2);
                                                })()}
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                                                <Box>
                                                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                                                        • Combustível
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }}>
                                                        R$ {(() => {
                                                            const distancia = Number(formData.distancia_km) || 0;
                                                            const precoCombustivel = Number(formData.preco_combustivel_referencia) || 0;
                                                            let somaAutonomia = 0;
                                                            let count = 0;
                                                            caminhoesVinculados.forEach((cv: any) => {
                                                                const autonomiaValue = cv.autonomia_km_litro || cv.caminhao?.autonomia_km_litro || 0;
                                                                const autonomia = Number(autonomiaValue);
                                                                if (!isNaN(autonomia) && autonomia > 0) {
                                                                    somaAutonomia += autonomia;
                                                                    count++;
                                                                }
                                                            });
                                                            const autonomiaMedia = count > 0 ? somaAutonomia / count : 0;
                                                            const litrosNecessarios = autonomiaMedia > 0 ? distancia / autonomiaMedia : 0;
                                                            const custoCombustivel = litrosNecessarios * precoCombustivel;
                                                            return custoCombustivel.toFixed(2);
                                                        })()}
                                                    </Typography>
                                                </Box>
                                                <Box>
                                                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                                                        • Funcionários
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }}>
                                                        R$ {(() => {
                                                            const custoFuncionarios = funcionariosAcao.reduce((total: number, func: any) => {
                                                                const valorDiaria = Number(func.valor_diaria) || 0;
                                                                const diasTrabalhados = Number(func.dias_trabalhados) || 1;
                                                                return total + (valorDiaria * diasTrabalhados);
                                                            }, 0);
                                                            return custoFuncionarios.toFixed(2);
                                                        })()}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Grid>

                                    {/* NOVO: Custos Reais da Ação */}
                                    <Grid item xs={12}>
                                        <Box sx={{
                                            background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                                            borderRadius: '12px',
                                            p: 3,
                                            boxShadow: '0 4px 12px rgba(40, 167, 69, 0.3)'
                                        }}>
                                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', mb: 1 }}>
                                                Custos Reais Observados da Ação
                                            </Typography>
                                            <Typography variant="h4" sx={{ color: '#fff', fontWeight: 700, mb: 2 }}>
                                                R$ {(() => {
                                                    // Abastecimentos reais
                                                    const custoAbastecimentos = custos
                                                        .filter((c: any) => c.tipo_conta === 'abastecimento')
                                                        .reduce((total: number, abast: any) => total + Number(abast.valor_total || abast.valor || 0), 0);

                                                    // Despesas gerais
                                                    const despesasGerais = custos
                                                        .filter((c: any) => c.tipo_conta === 'espontaneo')
                                                        .reduce((total: number, despesa: any) => total + Number(despesa.valor || 0), 0);

                                                    // Funcionários (usar funcionariosAcao, não custos)
                                                    const custoFuncionarios = funcionariosAcao.reduce((total: number, func: any) => {
                                                        const valorDiaria = Number(func.valor_diaria) || 0;
                                                        const diasTrabalhados = Number(func.dias_trabalhados) || 1;
                                                        return total + (valorDiaria * diasTrabalhados);
                                                    }, 0);

                                                    const custoTotalReal = custoAbastecimentos + despesasGerais + custoFuncionarios;
                                                    return custoTotalReal.toFixed(2);
                                                })()}
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                                                <Box>
                                                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                                                        • Abastecimentos
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }}>
                                                        R$ {(() => {
                                                            const custoAbastecimentos = custos
                                                                .filter((c: any) => c.tipo_conta === 'abastecimento')
                                                                .reduce((total: number, abast: any) => total + Number(abast.valor_total || abast.valor || 0), 0);
                                                            return custoAbastecimentos.toFixed(2);
                                                        })()}
                                                    </Typography>
                                                </Box>
                                                <Box>
                                                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                                                        • Despesas Gerais
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }}>
                                                        R$ {(() => {
                                                            const despesasGerais = custos
                                                                .filter((c: any) => c.tipo_conta === 'espontaneo')
                                                                .reduce((total: number, despesa: any) => total + Number(despesa.valor || 0), 0);
                                                            return despesasGerais.toFixed(2);
                                                        })()}
                                                    </Typography>
                                                </Box>
                                                <Box>
                                                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                                                        • Funcionários
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }}>
                                                        R$ {(() => {
                                                            const custoFuncionarios = funcionariosAcao.reduce((total: number, func: any) => {
                                                                const valorDiaria = Number(func.valor_diaria) || 0;
                                                                const diasTrabalhados = Number(func.dias_trabalhados) || 1;
                                                                return total + (valorDiaria * diasTrabalhados);
                                                            }, 0);
                                                            return custoFuncionarios.toFixed(2);
                                                        })()}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Grid>
                                </Grid>
                                {caminhoesVinculados.length === 0 && (
                                    <Alert severity="info" sx={{ mt: 2 }}>
                                        Adicione caminhões na aba "Recursos" para calcular a autonomia média e o custo estimado.
                                    </Alert>
                                )}
                            </Box>
                        </Box>

                        {/* Custos Reais (Abastecimentos) */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                            <Typography variant="h6" sx={{
                                color: '#4682b4',
                                fontWeight: 600,
                                fontSize: '1.1rem'
                            }}>
                                Custos da Ação ({custos.length})
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<Plus size={16} />}
                                    onClick={() => setOpenDespesaDialog(true)}
                                    sx={{
                                        borderColor: '#5DADE2',
                                        color: '#5DADE2',
                                        fontWeight: 600,
                                        textTransform: 'none',
                                        '&:hover': {
                                            borderColor: '#1B4F72',
                                            backgroundColor: 'rgba(93, 173, 226, 0.05)',
                                            transform: 'translateY(-1px)',
                                            boxShadow: '0 4px 12px rgba(93, 173, 226, 0.2)'
                                        },
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    Despesa Geral
                                </Button>
                                <Button
                                    variant="contained"
                                    size="small"
                                    startIcon={<Plus size={16} />}
                                    onClick={() => setOpenAbastecimentoDialog(true)}
                                    sx={{
                                        background: 'linear-gradient(135deg, #4682b4 0%, #5b9bd5 100%)',
                                        color: '#fff',
                                        fontWeight: 600,
                                        textTransform: 'none',
                                        '&:hover': {
                                            background: 'linear-gradient(135deg, #5b9bd5 0%, #4682b4 100%)',
                                            transform: 'translateY(-1px)',
                                            boxShadow: '0 4px 12px rgba(70, 130, 180, 0.3)'
                                        },
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    Registrar Abastecimento
                                </Button>
                            </Box>
                        </Box>

                        {custos.length === 0 ? (
                            <Box sx={{
                                background: 'rgba(70, 130, 180, 0.05)',
                                borderRadius: '8px',
                                p: 3,
                                textAlign: 'center',
                                border: '1px dashed rgba(70, 130, 180, 0.2)'
                            }}>
                                <Typography variant="body2" sx={{ color: '#4682b4' }}>
                                    Nenhum abastecimento registrado ainda.
                                </Typography>
                            </Box>
                        ) : (
                            <TableContainer component={Paper} sx={{
                                borderRadius: '8px',
                                overflow: 'hidden',
                                boxShadow: 'none',
                                border: '1px solid rgba(70, 130, 180, 0.1)'
                            }}>
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{
                                            background: 'linear-gradient(135deg, #4682b4 0%, #5b9bd5 100%)'
                                        }}>
                                            <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Data</TableCell>
                                            <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Tipo</TableCell>
                                            <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Descrição</TableCell>
                                            <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Valor Total</TableCell>
                                            <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Observações</TableCell>
                                            <TableCell align="center" sx={{ color: '#fff', fontWeight: 600 }}>Ações</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {custos.map((custo: any) => (
                                            <TableRow key={custo.id} sx={{
                                                '&:hover': {
                                                    backgroundColor: 'rgba(70, 130, 180, 0.03)'
                                                }
                                            }}>
                                                <TableCell>
                                                    {new Date(custo.data_vencimento || custo.data_abastecimento || custo.created_at).toLocaleDateString('pt-BR')}
                                                </TableCell>
                                                <TableCell>
                                                    {custo.tipo_conta === 'abastecimento' && `${custo.caminhao?.placa || 'N/A'}`}
                                                    {custo.tipo_conta === 'funcionario' && 'Funcionário'}
                                                    {custo.tipo_conta === 'espontaneo' && 'Despesa Geral'}
                                                    {!['abastecimento', 'funcionario', 'espontaneo'].includes(custo.tipo_conta) && custo.tipo_conta}
                                                </TableCell>
                                                <TableCell>
                                                    {custo.tipo_conta === 'abastecimento' && `${custo.litros || 0}L`}
                                                    {custo.tipo_conta !== 'abastecimento' && custo.descricao}
                                                </TableCell>
                                                <TableCell>R$ {parseFloat(custo.valor_total || custo.valor || 0).toFixed(2)}</TableCell>
                                                <TableCell>{custo.observacoes || '-'}</TableCell>
                                                <TableCell align="center">
                                                    {custo.tipo_conta === 'abastecimento' && (
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleDeleteAbastecimento(custo.id)}
                                                            title="Excluir abastecimento"
                                                            sx={{
                                                                color: '#ef4444',
                                                                '&:hover': {
                                                                    background: 'rgba(239, 68, 68, 0.1)'
                                                                }
                                                            }}
                                                        >
                                                            <Trash2 size={16} />
                                                        </IconButton>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}

                        <Dialog
                            open={openAbastecimentoDialog}
                            onClose={() => setOpenAbastecimentoDialog(false)}
                            maxWidth="sm"
                            fullWidth
                        >
                            <DialogTitle>Registrar Abastecimento</DialogTitle>
                            <DialogContent>
                                <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <TextField
                                        required
                                        select
                                        fullWidth
                                        label="Caminhão"
                                        name="caminhao_id"
                                        value={abastecimentoForm.caminhao_id}
                                        onChange={handleAbastecimentoChange}
                                    >
                                        {caminhoesVinculados.map((caminhao: any) => (
                                            <MenuItem key={caminhao.id} value={caminhao.id}>
                                                {caminhao.placa} - {caminhao.modelo}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                    <TextField
                                        required
                                        fullWidth
                                        type="date"
                                        label="Data do Abastecimento"
                                        name="data_abastecimento"
                                        value={abastecimentoForm.data_abastecimento}
                                        onChange={handleAbastecimentoChange}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                    <TextField
                                        required
                                        fullWidth
                                        type="number"
                                        label="Litros"
                                        name="litros"
                                        value={abastecimentoForm.litros}
                                        onChange={handleAbastecimentoChange}
                                        onFocus={e => e.target.select()}
                                        inputProps={{ min: 0, step: 0.01 }}
                                    />
                                    <TextField
                                        required
                                        fullWidth
                                        type="number"
                                        label="Valor Total (R$)"
                                        name="valor_total"
                                        value={abastecimentoForm.valor_total}
                                        onChange={handleAbastecimentoChange}
                                        onFocus={e => e.target.select()}
                                        inputProps={{ min: 0, step: 0.01 }}
                                    />
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={2}
                                        label="Observações"
                                        name="observacoes"
                                        value={abastecimentoForm.observacoes}
                                        onChange={handleAbastecimentoChange}
                                    />
                                </Box>
                            </DialogContent>
                            <DialogActions>
                                <Button
                                    onClick={() => setOpenAbastecimentoDialog(false)}
                                    sx={{
                                        color: '#4682b4',
                                        borderColor: '#4682b4',
                                        '&:hover': {
                                            borderColor: '#5b9bd5',
                                            background: 'rgba(70, 130, 180, 0.05)'
                                        }
                                    }}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={handleAddAbastecimento}
                                    sx={{
                                        background: 'linear-gradient(135deg, #4682b4 0%, #5b9bd5 100%)',
                                        color: '#fff',
                                        fontWeight: 600,
                                        '&:hover': {
                                            background: 'linear-gradient(135deg, #5b9bd5 0%, #4682b4 100%)',
                                            transform: 'translateY(-1px)',
                                            boxShadow: '0 4px 12px rgba(70, 130, 180, 0.3)'
                                        },
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    Registrar
                                </Button>
                            </DialogActions>
                        </Dialog>

                        {/* Modal Despesa Geral */}
                        <Dialog open={openDespesaDialog} onClose={() => setOpenDespesaDialog(false)} maxWidth="sm" fullWidth>
                            <DialogTitle>Nova Despesa Geral</DialogTitle>
                            <DialogContent>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                                    <TextField
                                        label="Descrição"
                                        name="descricao"
                                        value={despesaGeral.descricao}
                                        onChange={handleDespesaChange}
                                        fullWidth
                                        required
                                    />
                                    <TextField
                                        label="Valor"
                                        name="valor"
                                        type="number"
                                        value={despesaGeral.valor}
                                        onChange={handleDespesaChange}
                                        fullWidth
                                        required
                                        InputProps={{
                                            startAdornment: <Typography sx={{ mr: 1 }}>R$</Typography>
                                        }}
                                    />
                                    <TextField
                                        label="Data de Vencimento"
                                        name="data_vencimento"
                                        type="date"
                                        value={despesaGeral.data_vencimento}
                                        onChange={handleDespesaChange}
                                        fullWidth
                                        required
                                        InputLabelProps={{ shrink: true }}
                                    />
                                    <TextField
                                        label="Observações"
                                        name="observacoes"
                                        value={despesaGeral.observacoes}
                                        onChange={handleDespesaChange}
                                        fullWidth
                                        multiline
                                        rows={3}
                                    />
                                </Box>
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={() => setOpenDespesaDialog(false)}>Cancelar</Button>
                                <Button onClick={handleAddDespesaGeral} variant="contained" color="primary">
                                    Criar Despesa
                                </Button>
                            </DialogActions>
                        </Dialog>

                        {/* Seção de Funcionários */}
                        <Box sx={{ mt: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2.5 }}>
                                <Typography variant="h6" sx={{
                                    color: '#4682b4',
                                    fontWeight: 600,
                                    fontSize: '1.1rem'
                                }}>Funcionários Atribuídos</Typography>
                                <Button
                                    variant="contained"
                                    size="small"
                                    startIcon={<UserPlus size={16} />}
                                    onClick={() => {
                                        loadFuncionariosDisponiveis();
                                        setOpenFuncionarioDialog(true);
                                    }}
                                    sx={{
                                        background: 'linear-gradient(135deg, #4682b4 0%, #5b9bd5 100%)',
                                        color: '#fff',
                                        fontWeight: 600,
                                        textTransform: 'none',
                                        '&:hover': {
                                            background: 'linear-gradient(135deg, #5b9bd5 0%, #4682b4 100%)',
                                            transform: 'translateY(-1px)',
                                            boxShadow: '0 4px 12px rgba(70, 130, 180, 0.3)'
                                        },
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    Adicionar Funcionário
                                </Button>
                            </Box>

                            <TableContainer component={Paper} sx={{
                                borderRadius: '8px',
                                overflow: 'hidden',
                                boxShadow: 'none',
                                border: '1px solid rgba(70, 130, 180, 0.1)'
                            }}>
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{
                                            background: 'linear-gradient(135deg, #4682b4 0%, #5b9bd5 100%)'
                                        }}>
                                            <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Nome</TableCell>
                                            <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Cargo</TableCell>
                                            <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Especialidade</TableCell>
                                            <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Diária (R$)</TableCell>
                                            <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Dias Trab.</TableCell>
                                            <TableCell sx={{ color: '#fff', fontWeight: 600 }}>Custo Total</TableCell>
                                            <TableCell align="center" sx={{ color: '#fff', fontWeight: 600 }}>Ações</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {funcionariosAcao.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} align="center">
                                                    Nenhum funcionário atribuído a esta ação
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            funcionariosAcao.map((af: any) => (
                                                <TableRow key={af.id}>
                                                    <TableCell>{af.nome || 'N/A'}</TableCell>
                                                    <TableCell>{af.cargo || 'N/A'}</TableCell>
                                                    <TableCell>{af.especialidade || '-'}</TableCell>
                                                    <TableCell>R$ {Number(af.valor_diaria || 0).toFixed(2)}</TableCell>
                                                    <TableCell>
                                                        <TextField
                                                            type="number"
                                                            size="small"
                                                            defaultValue={af.dias_trabalhados || 1}
                                                            onBlur={async (e) => {
                                                                const newDias = Number(e.target.value);
                                                                // Se vazio, restaura para 1
                                                                if (e.target.value === '' || newDias < 1) {
                                                                    e.target.value = '1';
                                                                    return;
                                                                }
                                                                // Valida se é inteiro
                                                                if (!Number.isInteger(newDias)) {
                                                                    enqueueSnackbar('Dias trabalhados deve ser um número inteiro', { variant: 'error' });
                                                                    e.target.value = String(af.dias_trabalhados || 1);
                                                                    return;
                                                                }
                                                                // Se diferente do valor atual, atualiza
                                                                if (newDias !== af.dias_trabalhados) {
                                                                    try {
                                                                        await api.put(`/acoes/${id}/funcionarios/${af.id}`, {
                                                                            dias_trabalhados: newDias
                                                                        });
                                                                        loadFuncionariosAcao();
                                                                        enqueueSnackbar('Dias trabalhados atualizado!', { variant: 'success' });
                                                                    } catch (error: any) {
                                                                        enqueueSnackbar(error.response?.data?.error || 'Erro ao atualizar', { variant: 'error' });
                                                                        e.target.value = String(af.dias_trabalhados || 1);
                                                                    }
                                                                }
                                                            }}
                                                            onKeyDown={(e) => {
                                                                // Permite Enter para salvar
                                                                if (e.key === 'Enter') {
                                                                    e.currentTarget.blur();
                                                                }
                                                            }}
                                                            inputProps={{ min: 1, step: 1 }}
                                                            sx={{ width: '70px' }}
                                                        />
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: 600, color: '#4682b4' }}>
                                                        R$ {(Number(af.valor_diaria || 0) * Number(af.dias_trabalhados || 1)).toFixed(2)}
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleRemoveFuncionario(af.id)}
                                                            title="Remover funcionário"
                                                            sx={{
                                                                color: '#ef4444',
                                                                '&:hover': {
                                                                    background: 'rgba(239, 68, 68, 0.1)'
                                                                }
                                                            }}
                                                        >
                                                            <Trash2 size={16} />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>

                        {/* Dialog para Adicionar Funcionário */}
                        <Dialog
                            open={openFuncionarioDialog}
                            onClose={() => {
                                setOpenFuncionarioDialog(false);
                                setSelectedFuncionario('');
                            }}
                            maxWidth="sm"
                            fullWidth
                        >
                            <DialogTitle>Adicionar Funcionário à Ação</DialogTitle>
                            <DialogContent>
                                <TextField
                                    select
                                    fullWidth
                                    label="Selecione o Funcionário"
                                    margin="normal"
                                    value={selectedFuncionario}
                                    onChange={(e) => setSelectedFuncionario(e.target.value)}
                                >
                                    {funcionariosDisponiveis
                                        .filter((f: any) => !funcionariosAcao.some((af: any) => af.funcionario_id === f.id))
                                        .map((f: any) => (
                                            <MenuItem key={f.id} value={f.id}>
                                                {f.nome} - {f.cargo} (R$ {Number(f.custo_diaria || 0).toFixed(2)})
                                            </MenuItem>
                                        ))
                                    }
                                </TextField>
                            </DialogContent>
                            <DialogActions>
                                <Button
                                    onClick={() => {
                                        setOpenFuncionarioDialog(false);
                                        setSelectedFuncionario('');
                                    }}
                                    sx={{
                                        color: '#4682b4',
                                        borderColor: '#4682b4',
                                        '&:hover': {
                                            borderColor: '#5b9bd5',
                                            background: 'rgba(70, 130, 180, 0.05)'
                                        }
                                    }}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleAddFuncionario}
                                    variant="contained"
                                    disabled={!selectedFuncionario}
                                    sx={{
                                        background: 'linear-gradient(135deg, #4682b4 0%, #5b9bd5 100%)',
                                        color: '#fff',
                                        fontWeight: 600,
                                        '&:hover': {
                                            background: 'linear-gradient(135deg, #5b9bd5 0%, #4682b4 100%)',
                                            transform: 'translateY(-1px)',
                                            boxShadow: '0 4px 12px rgba(70, 130, 180, 0.3)'
                                        },
                                        '&:disabled': {
                                            background: 'rgba(0, 0, 0, 0.12)',
                                            color: 'rgba(0, 0, 0, 0.26)'
                                        },
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    Adicionar
                                </Button>
                            </DialogActions>
                        </Dialog>
                    </Box>
                )}
            </Paper>

            {/* Dialog: Editar Status da Inscrição */}
            <Dialog
                open={openEditStatusDialog}
                onClose={() => setOpenEditStatusDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Editar Status da Inscrição</DialogTitle>
                <DialogContent>
                    {inscricaoSelecionada && (
                        <>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Cidadão: <strong>{inscricaoSelecionada.cidadao?.nome_completo}</strong>
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
                                CPF: <strong>{inscricaoSelecionada.cidadao?.cpf}</strong>
                            </Typography>

                            <FormControl component="fieldset">
                                <FormLabel component="legend">Novo Status</FormLabel>
                                <RadioGroup
                                    value={novoStatus}
                                    onChange={(e) => setNovoStatus(e.target.value)}
                                >
                                    <FormControlLabel
                                        value="pendente"
                                        control={<Radio />}
                                        label="Pendente"
                                    />
                                    <FormControlLabel
                                        value="atendido"
                                        control={<Radio />}
                                        label="Atendido"
                                    />
                                    <FormControlLabel
                                        value="faltou"
                                        control={<Radio />}
                                        label="Faltou"
                                    />
                                </RadioGroup>
                            </FormControl>
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenEditStatusDialog(false)}>
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleAtualizarStatus}
                    >
                        Salvar
                    </Button>
                </DialogActions>
            </Dialog>

        </Container >
    );
};

export default GerenciarAcao;
