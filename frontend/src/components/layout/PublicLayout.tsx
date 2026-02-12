import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, AppBar, Toolbar, Typography, Button, Container } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

const PublicLayout: React.FC = () => {
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" component={RouterLink} to="/" sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit' }}>
                        System Truck
                    </Typography>

                    <Button color="inherit" component={RouterLink} to="/">
                        Início
                    </Button>

                    {isAuthenticated ? (
                        <Button color="inherit" component={RouterLink} to="/portal">
                            Meu Portal
                        </Button>
                    ) : (
                        <>
                            <Button color="inherit" component={RouterLink} to="/login">
                                Entrar
                            </Button>
                            <Button variant="contained" color="secondary" component={RouterLink} to="/cadastro" sx={{ ml: 1 }}>
                                Cadastrar
                            </Button>
                        </>
                    )}
                </Toolbar>
            </AppBar>

            <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default' }}>
                <Outlet />
            </Box>

            <Box component="footer" sx={{ bgcolor: 'grey.200', p: 3, mt: 'auto' }}>
                <Container>
                    <Typography variant="body2" align="center" color="text.secondary">
                        © {new Date().getFullYear()} System Truck. Todos os direitos reservados.
                    </Typography>
                </Container>
            </Box>
        </Box>
    );
};

export default PublicLayout;
