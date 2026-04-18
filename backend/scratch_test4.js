const { Sequelize, Op } = require('sequelize');
const { FichaAtendimento, Cidadao, EstacaoExame, Inscricao, CursoExame } = require('./src/models');
const { initDatabase } = require('./src/config/database');

async function test() {
  await initDatabase();
  try {
    const ficha = await FichaAtendimento.findOne({
      where: { status: { [Op.in]: ['pendente', 'aguardando', 'chamado'] } },
      include: [
        { model: Cidadao, as: 'cidadao', attributes: ['nome_completo', 'email', 'telefone'] },
        { model: EstacaoExame, as: 'estacao', attributes: ['nome'] },
        { model: Inscricao, as: 'inscricao', include: [{ model: CursoExame, as: 'curso_exame', attributes: ['nome'] }] }
      ]
    });
    console.log('SUCCESS', ficha ? ficha.id : 'No ficha');
  } catch (err) {
    console.error('ERROR:', err);
  }
  process.exit(0);
}
test();
