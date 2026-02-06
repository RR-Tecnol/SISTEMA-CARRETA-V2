import React from 'react';
import { Container, Typography } from '@mui/material';

const Acoes: React.FC = () => {
    return (
        <Container sx={{ py: 4 }}>
            <Typography variant="h4">Ações Disponíveis</Typography>
            <Typography variant="body1" sx={{ mt: 2 }}>
                Página de listagem de ações em desenvolvimento...
            </Typography>
        </Container>
    );
};

export default Acoes;
