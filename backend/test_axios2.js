const axios = require('axios');
async function test() {
  try {
    const login = await axios.post('http://localhost:3001/api/auth/login', { cpf: '22423192304', senha: 'Medico@123' });
    const token = login.data.token;
    
    const res = await axios.post('http://localhost:3001/api/medico-monitoring/atendimento/iniciar', { 
         cidadao_id: 'e767e216-6ba5-48de-b559-d085f6a7ca87',
         acao_id: 'd37b091e-431a-49f8-a742-7bbeae5d0660',
         nome_paciente: 'Test'
    }, { headers: { Authorization: `Bearer ${token}` } });
    console.log(res.data);
  } catch (err) {
    if (err.response) console.error('ERROR DATA:', err.response.data);
    else console.error(err);
  }
}
test();
