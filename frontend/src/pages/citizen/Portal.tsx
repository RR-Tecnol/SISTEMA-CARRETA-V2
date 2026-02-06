import React from 'react';
import { Container, Typography } from '@mui/material';

const Portal: React.FC = () => {
    return (
        <Container>
            <Typography variant="h4">Portal do Cidadão</Typography>
            <Typography variant="body1" sx={{ mt: 2 }}>
                Bem-vindo ao portal!
            </Typography>
        </Container>
    );
};

export default Portal;
