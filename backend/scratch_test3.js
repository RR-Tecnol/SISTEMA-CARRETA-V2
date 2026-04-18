const { Sequelize, QueryTypes } = require('sequelize');
const sequelize = new Sequelize('postgres://postgres:postgres@127.0.0.1:5434/sistema_carretas', { logging: false });
async function check() {
  const res = await sequelize.query("SELECT COUNT(*) as c FROM cidadaos", { type: QueryTypes.SELECT });
  console.log(res);
  process.exit(0);
}
check();
