const { Sequelize, QueryTypes } = require('sequelize');
const sequelize = new Sequelize('postgres://postgres:postgres@127.0.0.1:5434/sistema_carretas', { logging: false });
async function check() {
  const res = await sequelize.query("SELECT id, cpf, nome, login_cpf, is_medico, ativo FROM funcionarios", { type: QueryTypes.SELECT });
  console.log(res);
  process.exit(0);
}
check();
