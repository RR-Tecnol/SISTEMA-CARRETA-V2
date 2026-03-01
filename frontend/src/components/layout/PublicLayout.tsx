import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
    Box, Container, Typography, IconButton,
    Drawer, List, ListItemButton, ListItemIcon, ListItemText,
    useMediaQuery, useTheme, Divider,
} from '@mui/material';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { motion } from 'framer-motion';
import { Home, LogIn, UserPlus, LayoutDashboard, Menu as MenuIcon, X } from 'lucide-react';
import { systemTruckTheme } from '../../theme/systemTruckTheme';

const PublicLayout: React.FC = () => {
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);
    const location = useLocation();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [drawerOpen, setDrawerOpen] = useState(false);

    const isActive = (path: string) => location.pathname === path;

    const handleNav = (to: string) => {
        navigate(to);
        setDrawerOpen(false);
    };

    // ── Links para o drawer e para o header desktop ──
    const navLinks = isAuthenticated
        ? [{ label: 'Início', icon: Home, to: '/' }, { label: 'Meu Portal', icon: LayoutDashboard, to: '/portal' }]
        : [{ label: 'Início', icon: Home, to: '/' }, { label: 'Entrar', icon: LogIn, to: '/login' }, { label: 'Cadastrar', icon: UserPlus, to: '/cadastro' }];

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            {/* ── Header ── */}
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
                <Box maxWidth="xl" sx={{ mx: 'auto', px: 0, width: '100%' }}>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            py: 0,
                            px: { xs: 1.5, sm: 3 },
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
                                    ml: 0,
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
                                        height: { xs: 52, sm: 68, md: 80, lg: 96 },
                                        width: 'auto',
                                        maxWidth: { xs: 160, sm: 200, md: 240 },
                                        objectFit: 'contain',
                                        my: -1,
                                        filter: 'drop-shadow(0 2px 8px rgba(93, 173, 226, 0.3))',
                                    }}
                                />
                            </Box>
                        </motion.div>

                        {/* Desktop Navigation Buttons */}
                        {!isMobile && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    {/* Início */}
                                    <Box
                                        component={RouterLink}
                                        to="/"
                                        sx={{
                                            display: 'flex', alignItems: 'center', gap: 0.75,
                                            px: 2, py: 1, borderRadius: '10px', textDecoration: 'none',
                                            color: isActive('/') ? systemTruckTheme.colors.primary : systemTruckTheme.colors.textSecondary,
                                            fontWeight: 600, fontSize: '0.95rem',
                                            background: isActive('/') ? `${systemTruckTheme.colors.primary}15` : 'transparent',
                                            transition: 'all 0.3s ease',
                                            '&:hover': { background: `${systemTruckTheme.colors.primary}15`, color: systemTruckTheme.colors.primary, transform: 'translateY(-2px)' },
                                        }}
                                    >
                                        <Home size={18} />
                                        <span>Início</span>
                                    </Box>

                                    {isAuthenticated ? (
                                        <Box
                                            component={RouterLink} to="/portal"
                                            sx={{
                                                display: 'flex', alignItems: 'center', gap: 0.75,
                                                px: 3, py: 1.25, borderRadius: '12px', textDecoration: 'none',
                                                color: '#fff', fontWeight: 600, fontSize: '0.95rem',
                                                background: `linear-gradient(135deg, ${systemTruckTheme.colors.primary}, ${systemTruckTheme.colors.primaryDark})`,
                                                boxShadow: `0 4px 16px ${systemTruckTheme.colors.primary}40`,
                                                transition: 'all 0.3s ease',
                                                '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 6px 24px ${systemTruckTheme.colors.primary}60` },
                                            }}
                                        >
                                            <LayoutDashboard size={18} />
                                            <span>Meu Portal</span>
                                        </Box>
                                    ) : (
                                        <>
                                            <Box
                                                component={RouterLink} to="/login"
                                                sx={{
                                                    display: 'flex', alignItems: 'center', gap: 0.75,
                                                    px: 2.5, py: 1.25, borderRadius: '12px', textDecoration: 'none',
                                                    color: systemTruckTheme.colors.primary, fontWeight: 600, fontSize: '0.95rem',
                                                    border: `2px solid ${systemTruckTheme.colors.primary}`,
                                                    transition: 'all 0.3s ease',
                                                    '&:hover': { background: `${systemTruckTheme.colors.primary}10`, transform: 'translateY(-2px)', boxShadow: `0 4px 16px ${systemTruckTheme.colors.primary}30` },
                                                }}
                                            >
                                                <LogIn size={18} />
                                                <span>Entrar</span>
                                            </Box>
                                            <Box
                                                component={RouterLink} to="/cadastro"
                                                sx={{
                                                    display: 'flex', alignItems: 'center', gap: 0.75,
                                                    px: 3, py: 1.25, borderRadius: '12px', textDecoration: 'none',
                                                    color: '#fff', fontWeight: 600, fontSize: '0.95rem',
                                                    background: `linear-gradient(135deg, ${systemTruckTheme.colors.primary}, ${systemTruckTheme.colors.primaryDark})`,
                                                    boxShadow: `0 4px 16px ${systemTruckTheme.colors.primary}40`,
                                                    transition: 'all 0.3s ease',
                                                    '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 6px 24px ${systemTruckTheme.colors.primary}60` },
                                                }}
                                            >
                                                <UserPlus size={18} />
                                                <span>Cadastrar</span>
                                            </Box>
                                        </>
                                    )}
                                </Box>
                            </motion.div>
                        )}

                        {/* Mobile Hamburger */}
                        {isMobile && (
                            <IconButton
                                onClick={() => setDrawerOpen(true)}
                                sx={{
                                    color: systemTruckTheme.colors.primary,
                                    background: `${systemTruckTheme.colors.primary}10`,
                                    '&:hover': { background: `${systemTruckTheme.colors.primary}20` },
                                }}
                            >
                                <MenuIcon size={24} />
                            </IconButton>
                        )}
                    </Box>
                </Box>
            </Box>

            {/* ── Mobile Drawer ── */}
            <Drawer
                anchor="right"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                PaperProps={{
                    sx: {
                        width: 260,
                        background: '#fff',
                        borderLeft: `3px solid ${systemTruckTheme.colors.primary}`,
                    },
                }}
            >
                {/* Drawer Header */}
                <Box
                    sx={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        px: 2, py: 1.5,
                        background: `linear-gradient(135deg, ${systemTruckTheme.colors.primary}, ${systemTruckTheme.colors.primaryDark})`,
                    }}
                >
                    <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>
                        System Truck
                    </Typography>
                    <IconButton onClick={() => setDrawerOpen(false)} size="small" sx={{ color: '#fff' }}>
                        <X size={20} />
                    </IconButton>
                </Box>

                <Divider />

                {/* Drawer Links */}
                <List sx={{ pt: 1 }}>
                    {navLinks.map((link) => {
                        const Icon = link.icon;
                        const active = isActive(link.to);
                        return (
                            <ListItemButton
                                key={link.to}
                                onClick={() => handleNav(link.to)}
                                sx={{
                                    mx: 1, mb: 0.5, borderRadius: '10px',
                                    background: active ? `${systemTruckTheme.colors.primary}15` : 'transparent',
                                    '&:hover': { background: `${systemTruckTheme.colors.primary}10` },
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 36, color: active ? systemTruckTheme.colors.primary : systemTruckTheme.colors.textSecondary }}>
                                    <Icon size={20} />
                                </ListItemIcon>
                                <ListItemText
                                    primary={link.label}
                                    primaryTypographyProps={{
                                        fontWeight: active ? 700 : 500,
                                        color: active ? systemTruckTheme.colors.primary : systemTruckTheme.colors.text,
                                        fontSize: '0.95rem',
                                    }}
                                />
                            </ListItemButton>
                        );
                    })}
                </List>
            </Drawer>

            {/* Main Content */}
            <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default' }}>
                <Outlet />
            </Box>

            {/* Footer */}
            <Box
                component="footer"
                sx={{
                    bgcolor: '#f8f9fa',
                    mt: 'auto',
                    borderTop: '1px solid rgba(0, 0, 0, 0.08)',
                    py: 2.5,
                    px: 2,
                }}
            >
                <Container maxWidth="lg">
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexWrap: 'wrap',
                            gap: '10px',
                        }}
                    >
                        <Typography
                            component="span"
                            sx={{
                                fontFamily: "'Montserrat', sans-serif",
                                fontSize: '0.78rem',
                                fontWeight: 400,
                                fontStyle: 'italic',
                                color: 'rgba(0,0,0,0.38)',
                                letterSpacing: '0.04em',
                            }}
                        >
                            Developed by
                        </Typography>

                        <Box
                            component="a"
                            href="https://rrtecnol.com.br"
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ display: 'inline-flex', alignItems: 'baseline', gap: '2px', textDecoration: 'none', cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
                        >
                            <Typography
                                component="span"
                                sx={{
                                    fontFamily: "'Montserrat', sans-serif",
                                    fontSize: '0.9rem',
                                    fontWeight: 800,
                                    color: systemTruckTheme.colors.primary,
                                    letterSpacing: '0.08em',
                                }}
                            >
                                RR
                            </Typography>
                            <Typography
                                component="span"
                                sx={{
                                    fontFamily: "'Montserrat', sans-serif",
                                    fontSize: '0.9rem',
                                    fontWeight: 700,
                                    color: '#1B4F72',
                                    letterSpacing: '0.08em',
                                    position: 'relative',
                                    pb: '1px',
                                    '&::after': {
                                        content: '""',
                                        position: 'absolute',
                                        bottom: -1,
                                        left: 0,
                                        right: 0,
                                        height: '1.5px',
                                        background: `linear-gradient(90deg, ${systemTruckTheme.colors.primary}, transparent)`,
                                        borderRadius: '2px',
                                    },
                                }}
                            >
                                {' '}TECNOL
                            </Typography>
                        </Box>


                        {/* Separador */}
                        <Typography component="span" sx={{ color: 'rgba(0,0,0,0.18)', fontSize: '0.78rem' }}>
                            —
                        </Typography>

                        {/* Todos os direitos */}
                        <Typography
                            component="span"
                            sx={{
                                fontFamily: "'Montserrat', sans-serif",
                                fontSize: '0.75rem',
                                color: 'rgba(0,0,0,0.32)',
                                letterSpacing: '0.02em',
                            }}
                        >
                            Todos os direitos reservados.
                        </Typography>
                    </Box>
                </Container>
            </Box>
        </Box>
    );
};

export default PublicLayout;
