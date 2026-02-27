
import { Routes, Route } from 'react-router-dom';
import { GlobalStyles } from '@mui/material';

// Public pages
import Home from './pages/public/Home';
import Acoes from './pages/public/Acoes';
import Cadastro from './pages/public/Cadastro';
import Login from './pages/public/Login';
import EsqueciSenha from './pages/public/EsqueciSenha';
import RedefinirSenha from './pages/public/RedefinirSenha';
import NoticiaDetalhe from './pages/public/NoticiaDetalhe';

// Citizen portal
import Portal from './pages/citizen/Portal';
import MeuPerfil from './pages/citizen/MeuPerfil';
import MinhasInscricoes from './pages/citizen/MinhasInscricoes';
import AcoesDisponiveis from './pages/citizen/AcoesDisponiveis';

// Admin panel
import AdminDashboard from './pages/admin/Dashboard';
import AdminAcoes from './pages/admin/Acoes';
import NovaAcao from './pages/admin/NovaAcao';
import GerenciarAcao from './pages/admin/GerenciarAcao';
import Instituicoes from './pages/admin/Instituicoes';
import NovaInstituicao from './pages/admin/NovaInstituicao';
import Caminhoes from './pages/admin/Caminhoes';
import Funcionarios from './pages/admin/Funcionarios';
import FuncionarioAnotacoes from './pages/admin/FuncionarioAnotacoes';
import Relatorios from './pages/admin/Relatorios';
import CursosExames from './pages/admin/CursosExames';
import Cidadaos from './pages/admin/Cidadaos';
import MeuPerfilAdmin from './pages/admin/MeuPerfil';
import ContasPagar from './pages/admin/ContasPagar';
import Estoque from './pages/admin/Estoque';
import AlertasExames from './pages/admin/AlertasExames';
import ManutencaoCaminhao from './pages/admin/ManutencaoCaminhao';
import MedicoMonitoring from './pages/admin/MedicoMonitoring';
import PrestacaoContas from './pages/admin/PrestacaoContas';
import Noticias from './pages/admin/Noticias';
import MedicoPanel from './pages/medico/MedicoPanel';
import MedicoAcoes from './pages/medico/MedicoAcoes';

// Layout
import PublicLayout from './components/layout/PublicLayout';
import CitizenLayout from './components/layout/CitizenLayout';
import AdminLayout from './components/layout/AdminLayout';
import MedicoLayout from './components/layout/MedicoLayout';

function App() {
    return (
        <>
            <GlobalStyles styles={{
                '*, *::before, *::after': { boxSizing: 'border-box' },
                'html, body': { overflowX: 'hidden', maxWidth: '100vw' },
            }} />
            <Routes>
                {/* Public routes */}
                <Route path="/" element={<PublicLayout />}>
                    <Route index element={<Home />} />
                    <Route path="acoes" element={<Acoes />} />
                    <Route path="cadastro" element={<Cadastro />} />
                    <Route path="login" element={<Login />} />
                    <Route path="recuperar-senha" element={<EsqueciSenha />} />
                    <Route path="redefinir-senha" element={<RedefinirSenha />} />
                    <Route path="noticias/:id" element={<NoticiaDetalhe />} />
                </Route>

                {/* Citizen portal routes */}
                <Route path="/portal" element={<CitizenLayout />}>
                    <Route index element={<Portal />} />
                    <Route path="acoes" element={<AcoesDisponiveis />} />
                    <Route path="perfil" element={<MeuPerfil />} />
                    <Route path="inscricoes" element={<MinhasInscricoes />} />
                </Route>

                {/* Admin routes */}
                <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="perfil" element={<MeuPerfilAdmin />} />
                    <Route path="acoes" element={<AdminAcoes />} />
                    <Route path="acoes/nova" element={<NovaAcao />} />
                    <Route path="acoes/:id" element={<GerenciarAcao />} />
                    <Route path="instituicoes" element={<Instituicoes />} />
                    <Route path="instituicoes/nova" element={<NovaInstituicao />} />
                    <Route path="instituicoes/:id" element={<NovaInstituicao />} />
                    <Route path="caminhoes" element={<Caminhoes />} />
                    <Route path="caminhoes/:id/manutencao" element={<ManutencaoCaminhao />} />
                    <Route path="funcionarios" element={<Funcionarios />} />
                    <Route path="funcionarios/:id/anotacoes" element={<FuncionarioAnotacoes />} />
                    <Route path="relatorios" element={<Relatorios />} />
                    <Route path="cursos-exames" element={<CursosExames />} />
                    <Route path="cidadaos" element={<Cidadaos />} />
                    <Route path="contas-pagar" element={<ContasPagar />} />
                    <Route path="estoque" element={<Estoque />} />
                    <Route path="alertas" element={<AlertasExames />} />
                    <Route path="medicos" element={<MedicoMonitoring />} />
                    <Route path="prestacao-contas" element={<PrestacaoContas />} />
                    <Route path="noticias" element={<Noticias />} />
                </Route>

                {/* Medico panel */}
                <Route path="/medico" element={<MedicoLayout />}>
                    <Route index element={<MedicoAcoes />} />
                    <Route path="acao/:acaoId" element={<MedicoPanel />} />
                </Route>
            </Routes>
        </>
    );
}

export default App;
