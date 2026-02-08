import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, IconButton, useMediaQuery, useTheme } from '@mui/material';
import {
    BarChart3,
    Activity,
    Building2,
    Truck,
    Users,
    Stethoscope,
    UserCheck,
    FileText,
    Menu,
    X,
    ChevronRight,
    LayoutDashboard,
    DollarSign,
    Package,
} from 'lucide-react';
import { systemTruckTheme } from '../../theme/systemTruckTheme';

interface MenuItem {
    title: string;
    icon: React.ElementType;
    path: string;
}

const menuItems: MenuItem[] = [
    { title: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { title: 'Relatórios e BI', icon: BarChart3, path: '/admin/relatorios' },
    { title: 'Ações', icon: Activity, path: '/admin/acoes' },
    { title: 'Contas a Pagar', icon: DollarSign, path: '/admin/contas-pagar' },
    { title: 'Estoque', icon: Package, path: '/admin/estoque' },
    { title: 'Instituições', icon: Building2, path: '/admin/instituicoes' },
    { title: 'Caminhões', icon: Truck, path: '/admin/caminhoes' },
    { title: 'Funcionários', icon: Users, path: '/admin/funcionarios' },
    { title: 'Exames', icon: Stethoscope, path: '/admin/cursos-exames' },
    { title: 'Cidadãos', icon: UserCheck, path: '/admin/cidadaos' },
    { title: 'Inscrições', icon: FileText, path: '/admin/inscricoes' },
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

export const AdminSidebar: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [isOpen, setIsOpen] = useState(!isMobile);

    const isActive = (path: string) => {
        // Dashboard deve ser ativo apenas em /admin exato
        if (path === '/admin') {
            return location.pathname === '/admin';
        }
        // Outros itens devem ser ativos se o path atual começa com o path do item
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    return (
        <>
            {/* Mobile Toggle Button */}
            {isMobile && (
                <IconButton
                    onClick={() => setIsOpen(!isOpen)}
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
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </IconButton>
            )}

            {/* Overlay for mobile */}
            <AnimatePresence>
                {isMobile && isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
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
                animate={isOpen ? 'open' : 'closed'}
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
                    sx={{
                        p: 3,
                        borderBottom: `1px solid ${systemTruckTheme.colors.border}`,
                        background: systemTruckTheme.gradients.primary,
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
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
                                System Truck
                            </Box>
                            <Box
                                sx={{
                                    fontSize: '0.5rem',
                                    color: 'rgba(255,255,255,0.4)',
                                    fontWeight: 300,
                                    fontStyle: 'italic',
                                    letterSpacing: '0.8px',
                                    mb: 1,
                                    opacity: 0.6,
                                    textAlign: 'right',
                                    transition: 'opacity 0.3s ease',
                                    '&:hover': {
                                        opacity: 0.85
                                    }
                                }}
                            >
                                Developed by RR Tecnol
                            </Box>
                            <Box sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                                Sistema de Gestão
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
                                        if (isMobile) setIsOpen(false);
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

                                    <Box sx={{ flex: 1, fontSize: '0.9rem' }}>{item.title}</Box>

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
                    <Box sx={{ fontSize: '0.75rem', color: systemTruckTheme.colors.textSecondary }}>
                        © 2026 System Truck
                    </Box>
                    <Box sx={{ fontSize: '0.7rem', color: systemTruckTheme.colors.textLight, mt: 0.5 }}>
                        v1.0.0
                    </Box>
                </Box>
            </motion.div>
        </>
    );
};
