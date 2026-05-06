import { Router } from 'express';
import { Cidadao } from '../models';

const router = Router();

// Endpoint temporário para popular gêneros
router.post('/populate-genero', async (req, res) => {
    try {
        // Buscar todos os cidadãos sem gênero
        const cidadaos = await Cidadao.findAll({
            where: {
                genero: null
            }
        });

        console.log(`📊 Encontrados ${cidadaos.length} cidadãos sem gênero`);

        // Atualizar cada cidadão com um gênero aleatório
        for (const cidadao of cidadaos) {
            const genero = Math.random() < 0.5 ? 'masculino' : 'feminino';
            await cidadao.update({ genero });
        }

        // Contar distribuição
        const masculino = await Cidadao.count({ where: { genero: 'masculino' } });
        const feminino = await Cidadao.count({ where: { genero: 'feminino' } });

        res.json({
            success: true,
            message: 'Gêneros populados com sucesso',
            atualizados: cidadaos.length,
            distribuicao: {
                Masculino: masculino,
                Feminino: feminino
            }
        });
    } catch (error) {
        console.error('Erro ao popular gêneros:', error);
        res.status(500).json({ error: 'Erro ao popular gêneros' });
    }
});

// Endpoint para atualizar gênero de um cidadão específico por CPF
router.post('/update-genero-by-cpf', async (req, res) => {
    try {
        const { cpf, genero } = req.body;

        if (!cpf || !genero) {
            return res.status(400).json({ error: 'CPF e gênero são obrigatórios' });
        }

        const cidadao = await Cidadao.findOne({ where: { cpf } });

        if (!cidadao) {
            return res.status(404).json({ error: 'Cidadão não encontrado' });
        }

        await cidadao.update({ genero });

        res.json({
            success: true,
            message: `Gênero atualizado para ${genero}`,
            cidadao: {
                id: cidadao.get('id'),
                nome: cidadao.get('nome'),
                cpf: cidadao.get('cpf'),
                genero: cidadao.get('genero')
            }
        });
    } catch (error) {
        console.error('Erro ao atualizar gênero:', error);
        res.status(500).json({ error: 'Erro ao atualizar gênero' });
    }
});

export default router;
