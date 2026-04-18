const bcrypt = require('bcrypt');
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('sistema_carretas', 'postgres', 'postgres', {
  host: 'localhost',
  dialect: 'postgres',
});
async function test() {
  const [results] = await sequelize.query("SELECT id, cpf, senha FROM cidadaos WHERE cpf = '200.000.018-34'");
  if(results.length > 0) {
     const match = await bcrypt.compare('123456', results[0].senha);
     console.log('MATCH 123456:', match);
  } else {
     console.log('User not found');
  }
}
test();
