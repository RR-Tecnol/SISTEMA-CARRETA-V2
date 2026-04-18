const bcrypt = require('bcrypt');
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('sistema_carretas', 'postgres', 'postgres', {
  host: 'localhost',
  dialect: 'postgres',
});
async function test() {
  const hash = await bcrypt.hash('123456', 10);
  await sequelize.query(`UPDATE cidadaos SET senha = '${hash}' WHERE cpf = '200.000.018-34'`);
  console.log('Password reset to 123456!');
}
test();
