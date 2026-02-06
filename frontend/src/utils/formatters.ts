/**
 * Formata CPF para o padrão 000.000.000-00
 * @param cpf - CPF sem formatação (apenas números)
 * @returns CPF formatado
 */
export const formatCPF = (cpf: string): string => {
    if (!cpf) return '';

    // Remove tudo que não é número
    const numbers = cpf.replace(/\D/g, '');

    // Aplica a máscara
    if (numbers.length <= 11) {
        return numbers
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }

    return numbers.slice(0, 11)
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{2})$/, '$1-$2');
};

/**
 * Formata telefone para o padrão (00) 00000-0000 ou (00) 0000-0000
 * @param phone - Telefone sem formatação
 * @returns Telefone formatado
 */
export const formatPhone = (phone: string): string => {
    if (!phone) return '';

    const numbers = phone.replace(/\D/g, '');

    if (numbers.length === 11) {
        return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (numbers.length === 10) {
        return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }

    return phone;
};

/**
 * Formata CEP para o padrão 00000-000
 * @param cep - CEP sem formatação (apenas números)
 * @returns CEP formatado
 */
export const formatCEP = (cep: string): string => {
    if (!cep) return '';

    // Remove tudo que não é número
    const numbers = cep.replace(/\D/g, '');

    // Aplica a máscara
    if (numbers.length <= 8) {
        return numbers.replace(/(\d{5})(\d{1,3})/, '$1-$2');
    }

    return numbers.slice(0, 8).replace(/(\d{5})(\d{3})/, '$1-$2');
};
