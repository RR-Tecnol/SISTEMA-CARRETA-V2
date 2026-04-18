const { Cidadao } = require('./src/models/Cidadao');
const { Inscricao } = require('./src/models/Inscricao');
const { FichaAtendimento } = require('./src/models/FichaAtendimento');
const { Acao } = require('./src/models/Acao');

async function checkAdriana() {
    try {
        const adriana = await Cidadao.findOne({ where: { cpf: '20000003853' } });
        if (!adriana) {
            console.log("Adriana não encontrada");
            process.exit(1);
        }
        console.log("Adriana ID:", adriana.id);

        const inscricoes = await Inscricao.findAll({ where: { cidadao_id: adriana.id } });
        console.log("Inscricoes:", inscricoes.length);

        const fichas = await FichaAtendimento.findAll({ where: { cidadao_id: adriana.id }, include: [{model: Acao, as: 'acao'}]});
        console.log("Fichas de Atendimento:", fichas.length);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
checkAdriana();
