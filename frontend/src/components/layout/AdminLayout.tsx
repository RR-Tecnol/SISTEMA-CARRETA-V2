import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, useNavigate } from 'react-router-dom';
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
} from '@mui/material';
import {
    Person,
    Logout,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { logout } from '../../store/slices/authSlice';
import api from '../../services/api';
import { AdminSidebar } from './AdminSidebar';
import { expressoTheme } from '../../theme/expressoTheme';

const AdminLayout: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [adminFoto, setAdminFoto] = useState<string>('');

    useEffect(() => {
        if (isAuthenticated && user?.tipo === 'admin') {
            api.get('/admins/me')
                .then((response) => {
                    if (response.data.foto_perfil) {
                        setAdminFoto(`${BASE_URL}${response.data.foto_perfil}`);
                    }
                })
                .catch((error) => {
                    console.error('Erro ao buscar foto do admin:', error);
                });
        }
    }, [isAuthenticated, user]);

    if (!isAuthenticated || user?.tipo !== 'admin') {
        return <Navigate to="/" replace />;
    }

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleProfile = () => {
        handleMenuClose();
        navigate('/admin/perfil');
    };

    const handleLogout = () => {
        handleMenuClose();
        dispatch(logout());
        navigate('/');
    };

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', background: expressoTheme.colors.background }}>
            {/* Sidebar Futurista */}
            <AdminSidebar />

            {/* Main Content Area */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    ml: { xs: 0, md: '280px' },
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {/* Top AppBar */}
                <AppBar
                    position="sticky"
                    elevation={0}
                    sx={{
                        background: expressoTheme.colors.cardBackground,
                        borderBottom: `1px solid ${expressoTheme.colors.border}`,
                        color: expressoTheme.colors.text,
                    }}
                >
                    <Toolbar>
                        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600, color: expressoTheme.colors.primaryDark }}>
                            Painel Administrativo
                        </Typography>
                        <IconButton
                            onClick={handleMenuOpen}
                            sx={{
                                p: 0,
                                '&:hover': {
                                    backgroundColor: expressoTheme.colors.cardHover,
                                },
                            }}
                        >
                            <Avatar
                                src={adminFoto}
                                alt={user?.nome || 'Admin'}
                                sx={{
                                    width: 40,
                                    height: 40,
                                    border: `2px solid ${expressoTheme.colors.primary}`,
                                }}
                            >
                                {!adminFoto && user?.nome?.charAt(0).toUpperCase()}
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
                            PaperProps={{
                                sx: {
                                    mt: 1.5,
                                    borderRadius: expressoTheme.borderRadius.medium,
                                    boxShadow: expressoTheme.shadows.dialog,
                                },
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

                {/* Page Content */}
                <Box sx={{ flexGrow: 1 }}>
                    <Outlet />
                </Box>
            </Box>
        </Box>
    );
};

export default AdminLayout;
