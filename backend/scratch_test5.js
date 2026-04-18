const { Sequelize, Op } = require('sequelize');
const FichaAtendimento = require('./src/models/FichaAtendimento').FichaAtendimento;
const Cidadao = require('./src/models/Cidadao').Cidadao;
const EstacaoExame = require('./src/models/EstacaoExame').EstacaoExame;
const Inscricao = require('./src/models/Inscricao').Inscricao;
const CursoExame = require('./src/models/CursoExame').CursoExame;
const { initDatabase } = require('./src/config/database');

async function test() {
  await initDatabase();
  try {
    const whereficha = { status: { [Op.in]: ['pendente', 'aguardando', 'chamado'] } };
    whereficha.cidadao_id = 'e767e216-6ba5-48de-b559-d085f6a7ca87';
    whereficha.acao_id = 'd37b091e-431a-49f8-a742-7bbeae5d0660';

    const ficha = await FichaAtendimento.findOne({
        where: whereficha,
        include: [
            { model: Cidadao, as: 'cidadao', attributes: ['nome_completo', 'email', 'telefone'] },
            { model: EstacaoExame, as: 'estacao', attributes: ['nome'] },
            { model: Inscricao, as: 'inscricao', include: [{ model: CursoExame, as: 'curso_exame', attributes: ['nome'] }] }
        ]
    });
    console.log('Ficha:', ficha);
  } catch (err) {
    console.error('SQL ERROR DETECTED:', err.message);
  }
  process.exit(0);
}
test();
