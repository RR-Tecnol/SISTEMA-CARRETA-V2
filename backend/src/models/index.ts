// Import all models
import { Instituicao } from './Instituicao';
import { CursoExame } from './CursoExame';
import { Acao } from './Acao';
import { AcaoCursoExame } from './AcaoCursoExame';
import { Cidadao } from './Cidadao';
import { Inscricao } from './Inscricao';
import { Notificacao } from './Notificacao';
import { Noticia } from './Noticia';
import { ConfiguracaoCampo } from './ConfiguracaoCampo';
import { ConfiguracaoSistema } from './ConfiguracaoSistema';
import { Caminhao } from './Caminhao';
import { Funcionario } from './Funcionario';
import { AcaoCaminhao } from './AcaoCaminhao';
import { AcaoFuncionario } from './AcaoFuncionario';
import { Abastecimento } from './Abastecimento';
import { Exame } from './Exame';
import { Insumo } from './Insumo';
import { MovimentacaoEstoque } from './MovimentacaoEstoque';
import { AcaoInsumo } from './AcaoInsumo';
import { ContaPagar } from './ContaPagar';
import { ResultadoExame } from './ResultadoExame';
import { CustoAcao } from './CustoAcao';
import { ManutencaoCaminhao } from './ManutencaoCaminhao';
import { PontoMedico } from './PontoMedico';
import { AtendimentoMedico } from './AtendimentoMedico';
import { FuncionarioAnotacao } from './FuncionarioAnotacao';
import { FichaAtendimento } from './FichaAtendimento';
import { EstacaoExame } from './EstacaoExame';
import { ConfiguracaoFilaAcao } from './ConfiguracaoFilaAcao';
import { Emergencia } from './Emergencia';

// Define associations
export function setupAssociations(): void {
    // Instituicao <-> Acao (1:N)
    Instituicao.hasMany(Acao, {
        foreignKey: 'instituicao_id',
        as: 'acoes',
    });
    Acao.belongsTo(Instituicao, {
        foreignKey: 'instituicao_id',
        as: 'instituicao',
    });

    // Acao <-> AcaoCursoExame (1:N)
    Acao.hasMany(AcaoCursoExame, {
        foreignKey: 'acao_id',
        as: 'cursos_exames',
    });
    AcaoCursoExame.belongsTo(Acao, {
        foreignKey: 'acao_id',
        as: 'acao',
    });

    // CursoExame <-> AcaoCursoExame (1:N)
    CursoExame.hasMany(AcaoCursoExame, {
        foreignKey: 'curso_exame_id',
        as: 'acoes',
    });
    AcaoCursoExame.belongsTo(CursoExame, {
        foreignKey: 'curso_exame_id',
        as: 'curso_exame',
    });

    // Acao <-> CursoExame (N:M through AcaoCursoExame)
    Acao.belongsToMany(CursoExame, {
        through: AcaoCursoExame,
        foreignKey: 'acao_id',
        otherKey: 'curso_exame_id',
        as: 'cursos',
    });
    CursoExame.belongsToMany(Acao, {
        through: AcaoCursoExame,
        foreignKey: 'curso_exame_id',
        otherKey: 'acao_id',
        as: 'acoesVinculadas',
    });

    // Cidadao <-> Inscricao (1:N)
    Cidadao.hasMany(Inscricao, {
        foreignKey: 'cidadao_id',
        as: 'inscricoes',
    });
    Inscricao.belongsTo(Cidadao, {
        foreignKey: 'cidadao_id',
        as: 'cidadao',
    });

    // Acao <-> Inscricao (1:N)
    Acao.hasMany(Inscricao, {
        foreignKey: 'acao_id',
        as: 'inscricoes',
    });
    Inscricao.belongsTo(Acao, {
        foreignKey: 'acao_id',
        as: 'acao',
    });

    // CursoExame <-> Inscricao (1:N)
    CursoExame.hasMany(Inscricao, {
        foreignKey: 'curso_exame_id',
        as: 'inscricoes',
    });
    Inscricao.belongsTo(CursoExame, {
        foreignKey: 'curso_exame_id',
        as: 'curso_exame',
    });

    // Acao <-> Notificacao (1:N)
    Acao.hasMany(Notificacao, {
        foreignKey: 'acao_id',
        as: 'notificacoes',
    });
    Notificacao.belongsTo(Acao, {
        foreignKey: 'acao_id',
        as: 'acao',
    });

    // Acao <-> Noticia (1:N)
    Acao.hasMany(Noticia, {
        foreignKey: 'acao_id',
        as: 'noticias',
    });
    Noticia.belongsTo(Acao, {
        foreignKey: 'acao_id',
        as: 'acao',
    });

    // Acao <-> Caminhao (N:M through AcaoCaminhao)
    Acao.belongsToMany(Caminhao, {
        through: AcaoCaminhao,
        foreignKey: 'acao_id',
        otherKey: 'caminhao_id',
        as: 'caminhoes',
    });
    Caminhao.belongsToMany(Acao, {
        through: AcaoCaminhao,
        foreignKey: 'caminhao_id',
        otherKey: 'acao_id',
        as: 'acoes',
    });

    // Acao <-> Funcionario (N:M through AcaoFuncionario)
    Acao.belongsToMany(Funcionario, {
        through: AcaoFuncionario,
        foreignKey: 'acao_id',
        otherKey: 'funcionario_id',
        as: 'funcionarios',
    });
    Funcionario.belongsToMany(Acao, {
        through: AcaoFuncionario,
        foreignKey: 'funcionario_id',
        otherKey: 'acao_id',
        as: 'acoes',
    });

    // AcaoFuncionario <-> Funcionario (N:1)
    AcaoFuncionario.belongsTo(Funcionario, {
        foreignKey: 'funcionario_id',
        as: 'funcionario',
    });

    // Acao <-> Abastecimento (1:N)
    Acao.hasMany(Abastecimento, {
        foreignKey: 'acao_id',
        as: 'abastecimentos',
    });
    Abastecimento.belongsTo(Acao, {
        foreignKey: 'acao_id',
        as: 'acao',
    });

    // Caminhao <-> Abastecimento (1:N)
    Caminhao.hasMany(Abastecimento, {
        foreignKey: 'caminhao_id',
        as: 'abastecimentos',
    });
    Abastecimento.belongsTo(Caminhao, {
        foreignKey: 'caminhao_id',
        as: 'caminhao',
    });

    // ContaPagar <-> Caminhao (N:1)
    ContaPagar.belongsTo(Caminhao, {
        foreignKey: 'caminhao_id',
        as: 'caminhao',
    });

    Caminhao.hasMany(ContaPagar, {
        foreignKey: 'caminhao_id',
        as: 'contas_pagar',
    });

    // Acao <-> ContaPagar (1:N)
    Acao.hasMany(ContaPagar, {
        foreignKey: 'acao_id',
        as: 'contas_pagar',
    });

    ContaPagar.belongsTo(Acao, {
        foreignKey: 'acao_id',
        as: 'acao',
    });

    // Acao <-> Insumo (N:M through AcaoInsumo)
    Acao.belongsToMany(Insumo, {
        through: AcaoInsumo,
        foreignKey: 'acao_id',
        otherKey: 'insumo_id',
        as: 'insumos',
    });
    Insumo.belongsToMany(Acao, {
        through: AcaoInsumo,
        foreignKey: 'insumo_id',
        otherKey: 'acao_id',
        as: 'acoes',
    });

    // Insumo <-> MovimentacaoEstoque (1:N)
    Insumo.hasMany(MovimentacaoEstoque, {
        foreignKey: 'insumo_id',
        as: 'movimentacoes',
    });

    // Acao <-> CustoAcao (1:N)
    Acao.hasMany(CustoAcao, {
        foreignKey: 'acao_id',
        as: 'custos',
    });

    // Cidadao <-> ResultadoExame (1:N)
    Cidadao.hasMany(ResultadoExame, {
        foreignKey: 'cidadao_id',
        as: 'resultados_exames',
    });

    // Exame <-> ResultadoExame (1:N)
    Exame.hasMany(ResultadoExame, {
        foreignKey: 'exame_id',
        as: 'resultados',
    });

    // Inscricao <-> ResultadoExame (1:1)
    Inscricao.hasOne(ResultadoExame, {
        foreignKey: 'inscricao_id',
        as: 'resultado_exame',
    });

    // Caminhao <-> ManutencaoCaminhao (1:N)
    Caminhao.hasMany(ManutencaoCaminhao, {
        foreignKey: 'caminhao_id',
        as: 'manutencoes',
        onDelete: 'CASCADE',
    });
    ManutencaoCaminhao.belongsTo(Caminhao, {
        foreignKey: 'caminhao_id',
        as: 'caminhao',
    });

    // Funcionario <-> PontoMedico (1:N)
    Funcionario.hasMany(PontoMedico, {
        foreignKey: 'funcionario_id',
        as: 'pontos',
    });
    PontoMedico.belongsTo(Funcionario, {
        foreignKey: 'funcionario_id',
        as: 'funcionario',
    });

    // Acao <-> PontoMedico (1:N)
    Acao.hasMany(PontoMedico, {
        foreignKey: 'acao_id',
        as: 'pontos_medicos',
    });
    PontoMedico.belongsTo(Acao, {
        foreignKey: 'acao_id',
        as: 'acao',
    });

    // PontoMedico <-> AtendimentoMedico (1:N)
    PontoMedico.hasMany(AtendimentoMedico, {
        foreignKey: 'ponto_id',
        as: 'atendimentos',
    });
    AtendimentoMedico.belongsTo(PontoMedico, {
        foreignKey: 'ponto_id',
        as: 'ponto',
    });

    // Funcionario <-> AtendimentoMedico (1:N)
    Funcionario.hasMany(AtendimentoMedico, {
        foreignKey: 'funcionario_id',
        as: 'atendimentos',
    });
    AtendimentoMedico.belongsTo(Funcionario, {
        foreignKey: 'funcionario_id',
        as: 'funcionario',
    });

    // Cidadao <-> AtendimentoMedico (1:N)
    Cidadao.hasMany(AtendimentoMedico, {
        foreignKey: 'cidadao_id',
        as: 'atendimentos_medicos',
    });
    AtendimentoMedico.belongsTo(Cidadao, {
        foreignKey: 'cidadao_id',
        as: 'cidadao',
    });

    // Acao <-> AtendimentoMedico (1:N)
    Acao.hasMany(AtendimentoMedico, {
        foreignKey: 'acao_id',
        as: 'atendimentos_medicos',
    });
    AtendimentoMedico.belongsTo(Acao, {
        foreignKey: 'acao_id',
        as: 'acao',
    });

    // Funcionario <-> FuncionarioAnotacao (1:N)
    Funcionario.hasMany(FuncionarioAnotacao, {
        foreignKey: 'funcionario_id',
        as: 'anotacoes',
        onDelete: 'CASCADE',
    });
    FuncionarioAnotacao.belongsTo(Funcionario, {
        foreignKey: 'funcionario_id',
        as: 'funcionario',
    });

    // Acao <-> EstacaoExame (1:N)
    Acao.hasMany(EstacaoExame, { foreignKey: 'acao_id', as: 'estacoes' });
    EstacaoExame.belongsTo(Acao, { foreignKey: 'acao_id', as: 'acao' });

    // CursoExame <-> EstacaoExame (1:N)
    CursoExame.hasMany(EstacaoExame, { foreignKey: 'curso_exame_id', as: 'estacoes' });
    EstacaoExame.belongsTo(CursoExame, { foreignKey: 'curso_exame_id', as: 'curso_exame' });

    // Acao <-> FichaAtendimento (1:N)
    Acao.hasMany(FichaAtendimento, { foreignKey: 'acao_id', as: 'fichas' });
    FichaAtendimento.belongsTo(Acao, { foreignKey: 'acao_id', as: 'acao' });

    // Cidadao <-> FichaAtendimento (1:N)
    Cidadao.hasMany(FichaAtendimento, { foreignKey: 'cidadao_id', as: 'fichas' });
    FichaAtendimento.belongsTo(Cidadao, { foreignKey: 'cidadao_id', as: 'cidadao' });

    // Inscricao <-> FichaAtendimento (1:N)
    Inscricao.hasMany(FichaAtendimento, { foreignKey: 'inscricao_id', as: 'fichas' });
    FichaAtendimento.belongsTo(Inscricao, { foreignKey: 'inscricao_id', as: 'inscricao' });

    // EstacaoExame <-> FichaAtendimento (1:N)
    EstacaoExame.hasMany(FichaAtendimento, { foreignKey: 'estacao_id', as: 'fichas' });
    FichaAtendimento.belongsTo(EstacaoExame, { foreignKey: 'estacao_id', as: 'estacao' });

    // Acao <-> ConfiguracaoFilaAcao (1:1)
    Acao.hasOne(ConfiguracaoFilaAcao, { foreignKey: 'acao_id', as: 'configuracao_fila' });
    ConfiguracaoFilaAcao.belongsTo(Acao, { foreignKey: 'acao_id', as: 'acao' });

    // Acao <-> Emergencia (1:N)
    Acao.hasMany(Emergencia, { foreignKey: 'acao_id', as: 'emergencias' });
    Emergencia.belongsTo(Acao, { foreignKey: 'acao_id', as: 'acao' });

    // Cidadao <-> Emergencia (1:N)
    Cidadao.hasMany(Emergencia, { foreignKey: 'cidadao_id', as: 'emergencias' });
    Emergencia.belongsTo(Cidadao, { foreignKey: 'cidadao_id', as: 'cidadao' });

    // Funcionario <-> Emergencia (1:N) — quem atendeu
    Funcionario.hasMany(Emergencia, { foreignKey: 'atendido_por', as: 'emergencias_atendidas' });
    Emergencia.belongsTo(Funcionario, { foreignKey: 'atendido_por', as: 'profissional' });
}


// Export all models
export {
    Instituicao,
    CursoExame,
    Acao,
    AcaoCursoExame,
    Cidadao,
    Inscricao,
    Notificacao,
    Noticia,
    ConfiguracaoCampo,
    ConfiguracaoSistema,
    Caminhao,
    Funcionario,
    AcaoCaminhao,
    AcaoFuncionario,
    Abastecimento,
    Exame,
    Insumo,
    MovimentacaoEstoque,
    AcaoInsumo,
    ContaPagar,
    ResultadoExame,
    CustoAcao,
    ManutencaoCaminhao,
    PontoMedico,
    AtendimentoMedico,
    FuncionarioAnotacao,
    FichaAtendimento,
    EstacaoExame,
    ConfiguracaoFilaAcao,
    Emergencia,
};


