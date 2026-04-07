/**
 * Busca endereço pelo CEP usando a API pública ViaCEP
 * Sem necessidade de chave de API — 100% gratuito
 * @param cep - CEP com ou sem formatação
 * @returns Dados do endereço ou null se não encontrado
 */
export const buscarCEP = async (cep: string): Promise<{
    rua: string;
    bairro: string;
    municipio: string;
    estado: string;
    complemento?: string;
} | null> => {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return null;

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        if (!response.ok) return null;
        const data = await response.json();
        if (data.erro) return null;

        return {
            rua: data.logradouro || '',
            bairro: data.bairro || '',
            municipio: data.localidade || '',
            estado: data.uf || '',
            complemento: data.complemento || '',
        };
    } catch {
        return null;
    }
};
