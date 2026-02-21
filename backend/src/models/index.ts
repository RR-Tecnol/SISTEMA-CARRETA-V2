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
};

