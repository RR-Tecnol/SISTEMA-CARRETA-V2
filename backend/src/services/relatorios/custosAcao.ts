import { Acao } from '../../models/Acao';
import { AcaoFuncionario } from '../../models/AcaoFuncionario';
import { Funcionario } from '../../models/Funcionario';
import { CustoAcao } from '../../models/CustoAcao';
import PDFDocument from 'pdfkit';
import { createObjectCsvStringifier } from 'csv-writer';

export interface RelatorioCustosData {
    acao: any;
    custosFuncionarios: Array<{
        nome: string;
        cargo: string;
        dias: number;
        valorDiaria: number;
        total: number;
    }>;
    custosDiversos: Array<{
        tipo: string;
        descricao: string;
        valor: number;
        data: Date;
        comprovante?: string;
    }>;
    totais: {
        funcionarios: number;
        diversos: number;
        geral: number;
    };
}

export class RelatoriosCustosService {
    /**
     * Gerar dados do relatório de custos de uma ação
     */
    static async gerarDadosRelatorio(acaoId: string): Promise<RelatorioCustosData> {
        // Buscar ação
        const acao = await Acao.findByPk(acaoId);
        if (!acao) {
            throw new Error('Ação não encontrada');
        }

        // Buscar funcionários da ação
        const acaoFuncionarios = await AcaoFuncionario.findAll({
            where: { acao_id: acaoId },
            include: [{
                model: Funcionario,
                as: 'funcionario',
            }],
        });

        const custosFuncionarios = acaoFuncionarios.map((af: any) => ({
            nome: af.funcionario.nome,
            cargo: af.funcionario.cargo,
            dias: af.dias_trabalhados || 1,
            valorDiaria: parseFloat(af.valor_diaria || 0),
            total: (af.dias_trabalhados || 1) * parseFloat(af.valor_diaria || 0),
        }));

        // Buscar custos diversos
        const custos = await CustoAcao.findAll({
            where: { acao_id: acaoId },
            order: [['data_custo', 'ASC']],
        });

        const custosDiversos = custos.map(c => ({
            tipo: c.tipo_custo,
            descricao: c.descricao,
            valor: parseFloat(c.valor.toString()),
            data: c.data_custo,
            comprovante: c.comprovante_url,
        }));

        // Calcular totais
        const totalFuncionarios = custosFuncionarios.reduce((sum, c) => sum + c.total, 0);
        const totalDiversos = custosDiversos.reduce((sum, c) => sum + c.valor, 0);

        return {
            acao,
            custosFuncionarios,
            custosDiversos,
            totais: {
                funcionarios: totalFuncionarios,
                diversos: totalDiversos,
                geral: totalFuncionarios + totalDiversos,
            },
        };
    }

    /**
     * Gerar PDF do relatório de custos
     */
    static async gerarPDF(acaoId: string): Promise<Buffer> {
        const dados = await this.gerarDadosRelatorio(acaoId);

        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50 });
            const chunks: Buffer[] = [];

            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Cabeçalho
            doc.fontSize(20).text('RELATÓRIO DE CUSTOS - AÇÃO', { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text(`Ação #${dados.acao.numero_acao || dados.acao.id.substring(0, 8)}`);
            doc.text(`Município: ${dados.acao.municipio} - ${dados.acao.estado}`);
            doc.text(`Período: ${new Date(dados.acao.data_inicio).toLocaleDateString()} a ${new Date(dados.acao.data_fim).toLocaleDateString()}`);
            doc.moveDown();

            // Custos de Pessoal
            doc.fontSize(14).text('1. CUSTOS DE PESSOAL', { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(10);

            if (dados.custosFuncionarios.length > 0) {
                dados.custosFuncionarios.forEach(f => {
                    doc.text(`- ${f.nome} (${f.cargo}) - ${f.dias} dias x R$ ${f.valorDiaria.toFixed(2)} = R$ ${f.total.toFixed(2)}`);
                });
                doc.moveDown(0.5);
                doc.fontSize(11).text(`Subtotal: R$ ${dados.totais.funcionarios.toFixed(2)}`);
            } else {
                doc.text('Nenhum custo de pessoal registrado');
            }

            doc.moveDown();

            // Custos Diversos
            doc.fontSize(14).text('2. CUSTOS DIVERSOS', { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(10);

            if (dados.custosDiversos.length > 0) {
                // Agrupar por tipo
                const porTipo: { [key: string]: typeof dados.custosDiversos } = {};
                dados.custosDiversos.forEach(c => {
                    if (!porTipo[c.tipo]) porTipo[c.tipo] = [];
                    porTipo[c.tipo].push(c);
                });

                Object.entries(porTipo).forEach(([tipo, custos]) => {
                    const tipoFormatado = tipo.replace(/_/g, ' ').toUpperCase();
                    doc.fontSize(11).text(tipoFormatado);
                    custos.forEach(c => {
                        doc.fontSize(10).text(`  - ${c.descricao} - R$ ${c.valor.toFixed(2)}`);
                    });
                    const subtotal = custos.reduce((sum, c) => sum + c.valor, 0);
                    doc.text(`  Subtotal: R$ ${subtotal.toFixed(2)}`);
                    doc.moveDown(0.3);
                });

                doc.moveDown(0.5);
                doc.fontSize(11).text(`Subtotal: R$ ${dados.totais.diversos.toFixed(2)}`);
            } else {
                doc.text('Nenhum custo diverso registrado');
            }

            doc.moveDown(2);

            // Total Geral
            doc.fontSize(16).text(`TOTAL GERAL: R$ ${dados.totais.geral.toFixed(2)}`, { align: 'right' });

            doc.end();
        });
    }

    /**
     * Gerar CSV do relatório de custos
     */
    static async gerarCSV(acaoId: string): Promise<string> {
        const dados = await this.gerarDadosRelatorio(acaoId);

        const csvStringifier = createObjectCsvStringifier({
            header: [
                { id: 'categoria', title: 'Categoria' },
                { id: 'tipo', title: 'Tipo' },
                { id: 'descricao', title: 'Descrição' },
                { id: 'quantidade', title: 'Quantidade/Dias' },
                { id: 'valorUnitario', title: 'Valor Unitário' },
                { id: 'total', title: 'Total' },
            ]
        });

        const registros: any[] = [];

        // Funcionários
        dados.custosFuncionarios.forEach(f => {
            registros.push({
                categoria: 'Pessoal',
                tipo: f.cargo,
                descricao: f.nome,
                quantidade: f.dias,
                valorUnitario: f.valorDiaria.toFixed(2),
                total: f.total.toFixed(2),
            });
        });

        // Custos diversos
        dados.custosDiversos.forEach(c => {
            registros.push({
                categoria: 'Diversos',
                tipo: c.tipo,
                descricao: c.descricao,
                quantidade: 1,
                valorUnitario: c.valor.toFixed(2),
                total: c.valor.toFixed(2),
            });
        });

        // Totais
        registros.push({
            categoria: '',
            tipo: '',
            descricao: 'TOTAL PESSOAL',
            quantidade: '',
            valorUnitario: '',
            total: dados.totais.funcionarios.toFixed(2),
        });

        registros.push({
            categoria: '',
            tipo: '',
            descricao: 'TOTAL DIVERSOS',
            quantidade: '',
            valorUnitario: '',
            total: dados.totais.diversos.toFixed(2),
        });

        registros.push({
            categoria: '',
            tipo: '',
            descricao: 'TOTAL GERAL',
            quantidade: '',
            valorUnitario: '',
            total: dados.totais.geral.toFixed(2),
        });

        return csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(registros);
    }
}
