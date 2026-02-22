import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Box, Typography, IconButton, Tooltip, AppBar, Toolbar, Chip } from '@mui/material';
import { LogOut, Stethoscope } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { expressoTheme } from '../../theme/expressoTheme';

const MedicoLayout: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const user = useSelector((state: any) => state.auth?.user);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    return (
        <Box sx={{ minHeight: '100vh', background: expressoTheme.colors.background }}>
            {/* ── Header ── */}
            <AppBar
                position="sticky"
                elevation={0}
                sx={{
                    background: expressoTheme.colors.cardBackground,
                    borderBottom: `1px solid ${expressoTheme.colors.border}`,
                }}
            >
                <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                    {/* Logo / Título */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{
                            display: 'inline-flex', p: 1,
                            borderRadius: expressoTheme.borderRadius.medium,
                            background: expressoTheme.gradients.primary,
                            boxShadow: expressoTheme.shadows.button,
                        }}>
                            <Stethoscope size={20} color="white" />
                        </Box>
                        <Box>
                            <Typography sx={{ fontWeight: 800, color: expressoTheme.colors.primaryDark, fontSize: '1rem', lineHeight: 1.1 }}>
                                Painel Médico
                            </Typography>
                            <Typography sx={{ color: expressoTheme.colors.textSecondary, fontSize: '0.72rem' }}>
                                Sistema Carretas
                            </Typography>
                        </Box>
                    </Box>

                    {/* lado direito */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Chip
                            label={user?.nome || 'Médico'}
                            size="small"
                            sx={{
                                background: expressoTheme.colors.cardHover,
                                color: expressoTheme.colors.primaryDark,
                                border: `1px solid ${expressoTheme.colors.border}`,
                                fontWeight: 600,
                                fontSize: '0.8rem',
                            }}
                        />
                        <Tooltip title="Sair do sistema">
                            <IconButton
                                onClick={handleLogout}
                                size="small"
                                sx={{ color: expressoTheme.colors.danger, '&:hover': { background: '#FEF2F2' } }}
                            >
                                <LogOut size={18} />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Toolbar>
            </AppBar>

            {/* ── Content ── */}
            <Outlet />
        </Box>
    );
};

export default MedicoLayout;
