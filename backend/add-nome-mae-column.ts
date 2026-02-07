import { sequelize } from './src/config/database';

async function addNomeMaeColumn() {
    try {
        await sequelize.query(`
            ALTER TABLE cidadaos 
            ADD COLUMN IF NOT EXISTS nome_mae VARCHAR(255);
        `);

        console.log('✅ Column nome_mae added successfully');
        process.exit(0);
    } catch (error: any) {
        console.error('❌ Error adding column:', error.message);
        process.exit(1);
    }
}

addNomeMaeColumn();
