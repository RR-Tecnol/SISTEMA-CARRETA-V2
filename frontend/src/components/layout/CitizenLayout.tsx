import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BASE_URL } from '../../services/api';
import {
    Box,
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Avatar,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import {
    Menu as MenuIcon,
    X,
    Home,
    Calendar,
    ClipboardList,
    User,
    LogOut,
    ChevronRight,
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { logout } from '../../store/slices/authSlice';
import api from '../../services/api';
import { systemTruckTheme } from '../../theme/systemTruckTheme';

interface MenuItemType {
    text: string;
    icon: React.ElementType;
    path: string;
}

const menuItems: MenuItemType[] = [
    { text: 'Início', icon: Home, path: '/portal' },
    { text: 'Ações Disponíveis', icon: Calendar, path: '/portal/acoes' },
    { text: 'Minhas Inscrições', icon: ClipboardList, path: '/portal/inscricoes' },
];

const sidebarVariants = {
    open: {
        x: 0,
        transition: {
            type: 'spring' as const,
            stiffness: 300,
            damping: 30,
        },
    },
    closed: {
        x: -280,
        transition: {
            type: 'spring' as const,
            stiffness: 300,
            damping: 30,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
        opacity: 1,
        x: 0,
        transition: {
            delay: i * 0.05,
            type: 'spring' as const,
            stiffness: 100,
        },
    }),
};

const CitizenLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [cidadaoFoto, setCidadaoFoto] = useState<string>('');
    const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

    // Check both Redux state AND localStorage as fallback
    const hasToken = isAuthenticated || !!localStorage.getItem('token');

    useEffect(() => {
        const fetchCidadaoFoto = () => {
            if (hasToken) {
                console.log('🔄 Buscando foto do cidadão...');
                api.get('/cidadaos/me')
                    .then((response) => {
                        if (response.data.foto_perfil) {
                            // Add timestamp to force cache refresh
                            const fotoUrl = `${BASE_URL}${response.data.foto_perfil}?t=${Date.now()}`;
                            console.log('✅ Foto atualizada no layout:', fotoUrl);
                            setCidadaoFoto(fotoUrl);
                        }
                    })
                    .catch((error) => {
                        console.error('Erro ao buscar foto do cidadão:', error);
                    });
            }
        };

        fetchCidadaoFoto();

        // Listen for profile update events
        const handleProfileUpdate = () => {
            console.log('🔔 Evento profilePhotoUpdated recebido!');
            fetchCidadaoFoto();
        };

        window.addEventListener('profilePhotoUpdated', handleProfileUpdate);

        return () => {
            window.removeEventListener('profilePhotoUpdated', handleProfileUpdate);
        };
    }, [hasToken, location.pathname]); // Refresh when route changes

    // Close sidebar on mobile when route changes
    useEffect(() => {
        if (isMobile) {
            setSidebarOpen(false);
        }
    }, [location.pathname, isMobile]);

    if (!hasToken) {
        return <Navigate to="/login" replace />;
    }

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleProfile = () => {
        handleMenuClose();
        navigate('/portal/perfil');
    };

    const handleLogout = () => {
        handleMenuClose();
        dispatch(logout());
        navigate('/');
    };

    const isActive = (path: string) => {
        if (path === '/portal') {
            return location.pathname === '/portal';
        }
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    return (
        <>
            {/* Mobile Toggle Button */}
            {isMobile && (
                <IconButton
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    sx={{
                        position: 'fixed',
                        top: 16,
                        left: 16,
                        zIndex: 1300,
                        background: systemTruckTheme.colors.cardBackground,
                        boxShadow: systemTruckTheme.shadows.button,
                        '&:hover': {
                            background: systemTruckTheme.colors.cardHover,
                        },
                    }}
                >
                    {sidebarOpen ? <X size={24} /> : <MenuIcon size={24} />}
                </IconButton>
            )}

            {/* Overlay for mobile */}
            <AnimatePresence>
                {isMobile && sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSidebarOpen(false)}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0, 0, 0, 0.5)',
                            zIndex: 1200,
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.div
                variants={sidebarVariants}
                initial={isMobile ? 'closed' : 'open'}
                animate={sidebarOpen ? 'open' : 'closed'}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    height: '100vh',
                    width: 280,
                    background: systemTruckTheme.colors.cardBackground,
                    borderRight: `1px solid ${systemTruckTheme.colors.border}`,
                    zIndex: 1250,
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '4px 0 24px rgba(0, 0, 0, 0.08)',
                }}
            >
                {/* Logo Section */}
                <Box
                    onClick={() => navigate('/')}
                    sx={{
                        p: 3,
                        borderBottom: `1px solid ${systemTruckTheme.colors.border}`,
                        background: systemTruckTheme.gradients.primary,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            background: 'linear-gradient(135deg, #6BBDE8 0%, #2B5F82 100%)',
                        },
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        whileHover={{ scale: 1.02 }}
                    >
                        <Box sx={{ textAlign: 'center' }}>
                            <Box
                                sx={{
                                    fontSize: '1.5rem',
                                    fontWeight: 700,
                                    color: 'white',
                                    mb: 0.5,
                                    letterSpacing: '0.5px',
                                }}
                            >
                                Portal do Cidadão
                            </Box>
                            <Box sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                                System Truck
                            </Box>
                        </Box>
                    </motion.div>
                </Box>

                {/* Navigation Items */}
                <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
                    {menuItems.map((item, index) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);

                        return (
                            <motion.div
                                key={item.path}
                                custom={index}
                                variants={itemVariants}
                                initial="hidden"
                                animate="visible"
                                whileHover={{ x: 4 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Box
                                    onClick={() => {
                                        navigate(item.path);
                                        if (isMobile) setSidebarOpen(false);
                                    }}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2,
                                        p: 1,
                                        mb: 0.75,
                                        borderRadius: systemTruckTheme.borderRadius.medium,
                                        cursor: 'pointer',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        background: active ? systemTruckTheme.gradients.primary : 'transparent',
                                        color: active ? 'white' : systemTruckTheme.colors.text,
                                        fontWeight: active ? 600 : 500,
                                        '&:hover': {
                                            background: active ? systemTruckTheme.gradients.primary : systemTruckTheme.colors.cardHover,
                                            transform: 'translateX(4px)',
                                        },
                                        '&::before': active
                                            ? {
                                                content: '""',
                                                position: 'absolute',
                                                left: 0,
                                                top: 0,
                                                bottom: 0,
                                                width: 4,
                                                background: 'white',
                                                borderRadius: '0 4px 4px 0',
                                            }
                                            : {},
                                    }}
                                >
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: 32,
                                            height: 32,
                                            borderRadius: systemTruckTheme.borderRadius.small,
                                            background: active ? 'rgba(255,255,255,0.2)' : systemTruckTheme.colors.cardHover,
                                            transition: 'all 0.3s ease',
                                        }}
                                    >
                                        <Icon size={18} />
                                    </Box>

                                    <Box sx={{ flex: 1, fontSize: '0.9rem' }}>{item.text}</Box>

                                    {active && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ type: 'spring', stiffness: 300 }}
                                        >
                                            <ChevronRight size={18} />
                                        </motion.div>
                                    )}
                                </Box>
                            </motion.div>
                        );
                    })}
                </Box>

                {/* Footer */}
                <Box
                    sx={{
                        p: 2,
                        borderTop: `1px solid ${systemTruckTheme.colors.border}`,
                        textAlign: 'center',
                    }}
                >
                    <Box sx={{ fontSize: '0.75rem', color: systemTruckTheme.colors.textSecondary, mb: 1 }}>
                        © 2026 System Truck
                    </Box>
                    <Box sx={{ fontSize: '0.7rem', color: systemTruckTheme.colors.textLight, mb: 1.5 }}>
                        v1.0.0
                    </Box>
                    {/* Developed by com logo */}
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 0.5,
                            opacity: 0.85,
                            transition: 'opacity 0.3s ease',
                            '&:hover': {
                                opacity: 1,
                            },
                        }}
                    >
                        <Box
                            sx={{
                                fontSize: '0.7rem',
                                color: systemTruckTheme.colors.textSecondary,
                                fontWeight: 400,
                                fontStyle: 'italic',
                                letterSpacing: '0.5px',
                            }}
                        >
                            Developed by
                        </Box>
                        <Box
                            component="a"
                            href="https://rrtecnol.com.br"
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ display: 'inline-flex', lineHeight: 0 }}
                        >
                            <Box
                                component="img"
                                src="/assets/rr-tecnol-logo.png"
                                alt="RR Tecnol"
                                sx={{
                                    height: 40,
                                    width: 'auto',
                                    objectFit: 'contain',
                                    filter: 'brightness(0.9)',
                                    transition: 'filter 0.3s ease',
                                    '&:hover': {
                                        filter: 'brightness(1.1)',
                                    },
                                }}
                            />
                        </Box>
                    </Box>
                </Box>
            </motion.div>

            {/* Top AppBar */}
            <AppBar
                position="fixed"
                sx={{
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    background: systemTruckTheme.gradients.primary,
                    boxShadow: '0 4px 20px rgba(93, 173, 226, 0.15)',
                }}
            >
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
                        {menuItems.find(item => isActive(item.path))?.text || 'Portal do Cidadão'}
                    </Typography>
                    <IconButton
                        onClick={handleMenuOpen}
                        sx={{
                            p: 0,
                            '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            },
                        }}
                    >
                        <Avatar
                            src={cidadaoFoto}
                            alt={user?.nome || 'Cidadão'}
                            sx={{
                                width: 40,
                                height: 40,
                                border: '2px solid white',
                            }}
                        >
                            {!cidadaoFoto && user?.nome?.charAt(0).toUpperCase()}
                        </Avatar>
                    </IconButton>
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'right',
                        }}
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'right',
                        }}
                    >
                        <MenuItem onClick={handleProfile}>
                            <ListItemIcon>
                                <User size={20} />
                            </ListItemIcon>
                            <ListItemText>Meu Perfil</ListItemText>
                        </MenuItem>
                        <MenuItem onClick={handleLogout}>
                            <ListItemIcon>
                                <LogOut size={20} />
                            </ListItemIcon>
                            <ListItemText>Sair</ListItemText>
                        </MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            {/* Main Content */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    ml: sidebarOpen && !isMobile ? '280px' : 0,
                    transition: theme.transitions.create(['margin'], {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.leavingScreen,
                    }),
                    minHeight: '100vh',
                    bgcolor: systemTruckTheme.colors.background,
                }}
            >
                <Toolbar /> {/* Spacer for AppBar */}
                <Box sx={{ p: isMobile ? 2 : 3 }}>
                    <Outlet />
                </Box>
            </Box>
        </>
    );
};

export default CitizenLayout;
