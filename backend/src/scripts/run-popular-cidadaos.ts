import { sequelize } from '../models';
import { popularCidadaos } from './popular-cidadaos';

async function main() {
    try {
        console.log('🔄 Conectando ao banco de dados...');
        await sequelize.authenticate();
        console.log('✅ Conectado ao banco de dados!');

        await popularCidadaos();

        console.log('🎉 Script executado com sucesso!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao executar script:', error);
        process.exit(1);
    }
}

main();
