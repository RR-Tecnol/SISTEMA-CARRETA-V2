import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { API_URL } from '../../services/api';
import {
    Box,
    Drawer,
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Avatar,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    List,
    ListItem,
    ListItemButton,
    Divider,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import {
    Menu as MenuIcon,
    ChevronLeft,
    Home,
    Event,
    Assignment,
    Person,
    Logout,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { logout } from '../../store/slices/authSlice';
import api from '../../services/api';

const drawerWidth = 240;
const drawerWidthClosed = 60;

interface MenuItemType {
    text: string;
    icon: React.ReactElement;
    path: string;
}

const menuItems: MenuItemType[] = [
    { text: 'Início', icon: <Home />, path: '/portal' },
    { text: 'Ações Disponíveis', icon: <Event />, path: '/portal/acoes' },
    { text: 'Minhas Inscrições', icon: <Assignment />, path: '/portal/inscricoes' },
];

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
        if (hasToken) {
            api.get('/cidadaos/me')
                .then((response) => {
                    if (response.data.foto_perfil) {
                        setCidadaoFoto(`${API_URL}${response.data.foto_perfil}`);
                    }
                })
                .catch((error) => {
                    console.error('Erro ao buscar foto do cidadão:', error);
                });
        }
    }, [hasToken]);

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

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const handleNavigate = (path: string) => {
        navigate(path);
    };

    const isActive = (path: string) => {
        if (path === '/portal') {
            return location.pathname === '/portal';
        }
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    const drawer = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Sidebar Header */}
            <Box
                sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: sidebarOpen ? 'space-between' : 'center',
                    minHeight: 64,
                }}
            >
                {sidebarOpen && (
                    <Typography variant="h6" noWrap sx={{ fontWeight: 600, color: 'primary.main' }}>
                        Portal
                    </Typography>
                )}
                <IconButton onClick={toggleSidebar} size="small">
                    {sidebarOpen ? <ChevronLeft /> : <MenuIcon />}
                </IconButton>
            </Box>
            <Divider />

            {/* Menu Items */}
            <List sx={{ flexGrow: 1, pt: 2 }}>
                {menuItems.map((item) => (
                    <ListItem key={item.text} disablePadding sx={{ display: 'block', mb: 0.5 }}>
                        <ListItemButton
                            onClick={() => handleNavigate(item.path)}
                            sx={{
                                minHeight: 48,
                                justifyContent: sidebarOpen ? 'initial' : 'center',
                                px: 2.5,
                                mx: 1,
                                borderRadius: 1,
                                backgroundColor: isActive(item.path) ? 'primary.main' : 'transparent',
                                color: isActive(item.path) ? 'white' : 'text.primary',
                                '&:hover': {
                                    backgroundColor: isActive(item.path) ? 'primary.dark' : 'action.hover',
                                },
                            }}
                        >
                            <ListItemIcon
                                sx={{
                                    minWidth: 0,
                                    mr: sidebarOpen ? 2 : 'auto',
                                    justifyContent: 'center',
                                    color: isActive(item.path) ? 'white' : 'inherit',
                                }}
                            >
                                {item.icon}
                            </ListItemIcon>
                            {sidebarOpen && (
                                <ListItemText
                                    primary={item.text}
                                    primaryTypographyProps={{
                                        fontSize: 14,
                                        fontWeight: isActive(item.path) ? 600 : 400,
                                    }}
                                />
                            )}
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            {/* Top AppBar */}
            <AppBar
                position="fixed"
                sx={{
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    backgroundColor: 'primary.main',
                }}
            >
                <Toolbar>
                    {!sidebarOpen && (
                        <IconButton
                            color="inherit"
                            edge="start"
                            onClick={toggleSidebar}
                            sx={{ mr: 2 }}
                        >
                            <MenuIcon />
                        </IconButton>
                    )}
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Portal do Cidadão
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
                                <Person fontSize="small" />
                            </ListItemIcon>
                            <ListItemText>Meu Perfil</ListItemText>
                        </MenuItem>
                        <MenuItem onClick={handleLogout}>
                            <ListItemIcon>
                                <Logout fontSize="small" />
                            </ListItemIcon>
                            <ListItemText>Sair</ListItemText>
                        </MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            {/* Sidebar Drawer */}
            <Drawer
                variant={isMobile ? 'temporary' : 'permanent'}
                open={sidebarOpen}
                onClose={toggleSidebar}
                sx={{
                    width: sidebarOpen ? drawerWidth : drawerWidthClosed,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: sidebarOpen ? drawerWidth : drawerWidthClosed,
                        boxSizing: 'border-box',
                        transition: theme.transitions.create('width', {
                            easing: theme.transitions.easing.sharp,
                            duration: theme.transitions.duration.enteringScreen,
                        }),
                        overflowX: 'hidden',
                        borderRight: '1px solid',
                        borderColor: 'divider',
                    },
                }}
            >
                <Toolbar /> {/* Spacer for AppBar */}
                {drawer}
            </Drawer>

            {/* Main Content */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: { sm: `calc(100% - ${sidebarOpen ? drawerWidth : drawerWidthClosed}px)` },
                    ml: { xs: 0, md: sidebarOpen ? 0 : `${drawerWidthClosed}px` },
                    transition: theme.transitions.create(['margin', 'width'], {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.leavingScreen,
                    }),
                }}
            >
                <Toolbar /> {/* Spacer for AppBar */}
                <Outlet />
            </Box>
        </Box>
    );
};

export default CitizenLayout;
