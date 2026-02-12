import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Container, Typography } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { motion } from 'framer-motion';
import { Home, LogIn, UserPlus, LayoutDashboard } from 'lucide-react';
import { systemTruckTheme } from '../../theme/systemTruckTheme';

const PublicLayout: React.FC = () => {
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            {/* Modern Header */}
            <Box
                component="header"
                sx={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 1100,
                    background: '#ffffff',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.08)',
                    borderBottom: '1px solid rgba(93, 173, 226, 0.1)',
                }}
            >
                <Container maxWidth="xl">
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            py: 2.5,
                        }}
                    >
                        {/* Logo */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Box
                                component={RouterLink}
                                to="/"
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    textDecoration: 'none',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        transform: 'scale(1.05)',
                                    },
                                }}
                            >
                                <Box
                                    component="img"
                                    src={`${process.env.PUBLIC_URL}/images/logo-system-truck.png`}
                                    alt="System Truck Logo"
                                    sx={{
                                        height: 140,
                                        width: 'auto',
                                        filter: 'drop-shadow(0 2px 8px rgba(93, 173, 226, 0.3))',
                                    }}
                                />
                            </Box>
                        </motion.div>

                        {/* Navigation Buttons */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                {/* Início Button */}
                                <Box
                                    component={RouterLink}
                                    to="/"
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.75,
                                        px: 2,
                                        py: 1,
                                        borderRadius: '10px',
                                        textDecoration: 'none',
                                        color: isActive('/') ? systemTruckTheme.colors.primary : systemTruckTheme.colors.textSecondary,
                                        fontWeight: 600,
                                        fontSize: '0.95rem',
                                        transition: 'all 0.3s ease',
                                        background: isActive('/') ? `${systemTruckTheme.colors.primary}15` : 'transparent',
                                        '&:hover': {
                                            background: `${systemTruckTheme.colors.primary}15`,
                                            color: systemTruckTheme.colors.primary,
                                            transform: 'translateY(-2px)',
                                        },
                                    }}
                                >
                                    <Home size={18} />
                                    <span>Início</span>
                                </Box>

                                {isAuthenticated ? (
                                    <Box
                                        component={RouterLink}
                                        to="/portal"
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 0.75,
                                            px: 3,
                                            py: 1.25,
                                            borderRadius: '12px',
                                            textDecoration: 'none',
                                            color: '#fff',
                                            fontWeight: 600,
                                            fontSize: '0.95rem',
                                            background: `linear-gradient(135deg, ${systemTruckTheme.colors.primary}, ${systemTruckTheme.colors.primaryDark})`,
                                            boxShadow: `0 4px 16px ${systemTruckTheme.colors.primary}40`,
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                transform: 'translateY(-2px)',
                                                boxShadow: `0 6px 24px ${systemTruckTheme.colors.primary}60`,
                                            },
                                        }}
                                    >
                                        <LayoutDashboard size={18} />
                                        <span>Meu Portal</span>
                                    </Box>
                                ) : (
                                    <>
                                        {/* Entrar Button */}
                                        <Box
                                            component={RouterLink}
                                            to="/login"
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 0.75,
                                                px: 2.5,
                                                py: 1.25,
                                                borderRadius: '12px',
                                                textDecoration: 'none',
                                                color: systemTruckTheme.colors.primary,
                                                fontWeight: 600,
                                                fontSize: '0.95rem',
                                                border: `2px solid ${systemTruckTheme.colors.primary}`,
                                                transition: 'all 0.3s ease',
                                                '&:hover': {
                                                    background: `${systemTruckTheme.colors.primary}10`,
                                                    transform: 'translateY(-2px)',
                                                    boxShadow: `0 4px 16px ${systemTruckTheme.colors.primary}30`,
                                                },
                                            }}
                                        >
                                            <LogIn size={18} />
                                            <span>Entrar</span>
                                        </Box>

                                        {/* Cadastrar Button */}
                                        <Box
                                            component={RouterLink}
                                            to="/cadastro"
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 0.75,
                                                px: 3,
                                                py: 1.25,
                                                borderRadius: '12px',
                                                textDecoration: 'none',
                                                color: '#fff',
                                                fontWeight: 600,
                                                fontSize: '0.95rem',
                                                background: `linear-gradient(135deg, ${systemTruckTheme.colors.primary}, ${systemTruckTheme.colors.primaryDark})`,
                                                boxShadow: `0 4px 16px ${systemTruckTheme.colors.primary}40`,
                                                transition: 'all 0.3s ease',
                                                '&:hover': {
                                                    transform: 'translateY(-2px)',
                                                    boxShadow: `0 6px 24px ${systemTruckTheme.colors.primary}60`,
                                                },
                                            }}
                                        >
                                            <UserPlus size={18} />
                                            <span>Cadastrar</span>
                                        </Box>
                                    </>
                                )}
                            </Box>
                        </motion.div>
                    </Box>
                </Container>
            </Box>

            {/* Main Content */}
            <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default' }}>
                <Outlet />
            </Box>

            {/* Footer */}
            <Box
                component="footer"
                sx={{
                    bgcolor: '#f8f9fa',
                    p: 3,
                    mt: 'auto',
                    borderTop: '1px solid rgba(0, 0, 0, 0.08)',
                }}
            >
                <Container>
                    <Typography
                        variant="body2"
                        align="center"
                        sx={{
                            color: systemTruckTheme.colors.textSecondary,
                            fontWeight: 500,
                        }}
                    >
                        © {new Date().getFullYear()} System Truck. Todos os direitos reservados.
                    </Typography>
                </Container>
            </Box>
        </Box>
    );
};

export default PublicLayout;
