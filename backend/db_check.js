const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('sistema_carretas', 'postgres', 'postgres', {
  host: 'localhost',
  dialect: 'postgres',
});
async function test() {
  const [results] = await sequelize.query("SELECT id, cpf, senha FROM cidadaos WHERE cpf LIKE '%200.000.018%' OR cpf LIKE '%200000018%'");
  console.log(results);
}
test();
