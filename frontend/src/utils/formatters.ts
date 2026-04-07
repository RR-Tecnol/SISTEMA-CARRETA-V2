/**
 * Formata CPF para o padrão 000.000.000-00
 * Aceita entrada parcial (ao digitar) e completa conforme vai digitando
 */
export const formatCPF = (cpf: string): string => {
    if (!cpf) return '';
    const numbers = cpf.replace(/\D/g, '').slice(0, 11);
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return numbers.replace(/(\d{3})(\d{1,3})/, '$1.$2');
    if (numbers.length <= 9) return numbers.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
};

/**
 * Valida CPF com dígito verificador
 * Retorna true se o CPF é matematicamente válido
 */
export const validateCPF = (cpf: string): boolean => {
    const nums = cpf.replace(/\D/g, '');
    if (nums.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(nums)) return false; // todos iguais
    const calc = (n: number) => {
        let sum = 0;
        for (let i = 0; i < n; i++) sum += parseInt(nums[i]) * (n + 1 - i);
        const rem = (sum * 10) % 11;
        return rem >= 10 ? 0 : rem;
    };
    return calc(9) === parseInt(nums[9]) && calc(10) === parseInt(nums[10]);
};

/**
 * Formata telefone para o padrão (00) 00000-0000 ou (00) 0000-0000
 */
export const formatPhone = (phone: string): string => {
    if (!phone) return '';
    const numbers = phone.replace(/\D/g, '').slice(0, 11);
    if (numbers.length <= 2) return numbers.length ? `(${numbers}` : '';
    if (numbers.length <= 7) return numbers.replace(/(\d{2})(\d{1,5})/, '($1) $2');
    if (numbers.length <= 10) return numbers.replace(/(\d{2})(\d{4})(\d{1,4})/, '($1) $2-$3');
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
};

/**
 * Formata CEP para o padrão 00000-000
 */
export const formatCEP = (cep: string): string => {
    if (!cep) return '';
    const numbers = cep.replace(/\D/g, '').slice(0, 8);
    if (numbers.length <= 5) return numbers;
    return numbers.replace(/(\d{5})(\d{1,3})/, '$1-$2');
};

/**
 * Formata CNS — Cartão Nacional de Saúde
 * Padrão: 000 0000 0000 0000 (15 dígitos)
 */
export const formatCNS = (cns: string): string => {
    if (!cns) return '';
    const numbers = cns.replace(/\D/g, '').slice(0, 15);
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return numbers.replace(/(\d{3})(\d{1,4})/, '$1 $2');
    if (numbers.length <= 11) return numbers.replace(/(\d{3})(\d{4})(\d{1,4})/, '$1 $2 $3');
    return numbers.replace(/(\d{3})(\d{4})(\d{4})(\d{1,4})/, '$1 $2 $3 $4');
};

/**
 * Valida CNS — Cartão Nacional de Saúde (15 dígitos)
 */
export const validateCNS = (cns: string): boolean => {
    const nums = cns.replace(/\D/g, '');
    return nums.length === 15;
};

/**
 * Converte string para Title Case (primeira letra de cada palavra maiúscula)
 * Usado para capitalizar automaticamente campos de nome, endereço, etc.
 */
export const toTitleCase = (str: string): string => {
    if (!str) return '';
    return str.replace(/\w\S*/g, (word) =>
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    );
};
