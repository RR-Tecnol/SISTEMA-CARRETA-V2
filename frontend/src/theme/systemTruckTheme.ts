// Tema corporativo System Truck
export const systemTruckTheme = {
    colors: {
        // Cores principais
        primary: '#5DADE2',           // Azul ciano (logo, botões, destaques)
        primaryDark: '#1B4F72',       // Azul petróleo (textos importantes, hover)
        primaryLight: '#85C1E9',      // Azul claro (hover suave)

        // Fundos
        background: '#F8F9FA',        // Fundo principal (off-white)
        cardBackground: '#FFFFFF',    // Fundo de cards (branco puro)
        cardHover: '#E8F4F8',         // Fundo de cards no hover (azul muito claro)

        // Bordas e divisores
        border: '#DEE2E6',            // Bordas suaves
        borderLight: '#E9ECEF',       // Bordas mais claras

        // Textos
        text: '#1A1A1A',              // Texto principal (quase preto)
        textSecondary: '#6C757D',     // Texto secundário (cinza)
        textLight: '#ADB5BD',         // Texto claro (cinza claro)

        // Cores de status (funcionais)
        success: '#28A745',           // Verde para sucesso/ativo
        warning: '#FFC107',           // Amarelo para avisos/pendente
        danger: '#DC3545',            // Vermelho para erros/inativo
        error: '#DC3545',             // Vermelho para erros (alias)
        info: '#17A2B8',              // Azul info
    },

    shadows: {
        card: '0 2px 8px rgba(93, 173, 226, 0.1)',
        cardHover: '0 8px 24px rgba(93, 173, 226, 0.2)',
        hover: '0 8px 24px rgba(93, 173, 226, 0.2)',  // Alias para cardHover
        button: '0 4px 12px rgba(93, 173, 226, 0.3)',
        dialog: '0 10px 40px rgba(0, 0, 0, 0.15)',
    },

    gradients: {
        primary: 'linear-gradient(135deg, #5DADE2 0%, #1B4F72 100%)',
        primaryHover: 'linear-gradient(135deg, #6BB8E8 0%, #2A5F82 100%)',
        success: 'linear-gradient(135deg, #28A745 0%, #1E7E34 100%)',
        warning: 'linear-gradient(135deg, #FFC107 0%, #E0A800 100%)',
        error: 'linear-gradient(135deg, #DC3545 0%, #C82333 100%)',
        card: 'linear-gradient(to bottom, #FFFFFF 0%, #F8F9FA 100%)',
    },

    borderRadius: {
        small: '8px',
        medium: '12px',
        large: '16px',
        xlarge: '20px',
    },
};

export type SystemTruckTheme = typeof systemTruckTheme;
