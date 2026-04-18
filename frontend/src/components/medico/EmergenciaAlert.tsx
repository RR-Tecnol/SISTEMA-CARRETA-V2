import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Typography, Button } from '@mui/material';

interface EmergenciaAlertProps {
    emergencia: { cidadao_id: string; nome: string; hora: string } | null;
    onDismiss: () => void;
    onAbrirChat: (cidadao_id: string) => void;
    onAbrirFicha?: (cidadao_id: string) => void;
}

const EmergenciaAlert: React.FC<EmergenciaAlertProps> = ({
    emergencia, onDismiss, onAbrirChat, onAbrirFicha,
}) => {
    if (!emergencia) return null;

    return (
        <>
            <style>{`
                @keyframes emergenciaPulse {
                    0%, 100% { box-shadow: 0 8px 40px rgba(220,38,38,0.6); }
                    50% { box-shadow: 0 8px 60px rgba(220,38,38,0.9), 0 0 0 8px rgba(220,38,38,0.2); }
                }
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.4; }
                }
            `}</style>
            <AnimatePresence>
                {emergencia && (
                    <motion.div
                        initial={{ opacity: 0, y: -40, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -40, scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                        style={{
                            position: 'fixed',
                            top: 80,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            zIndex: 9999,
                            background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                            color: 'white',
                            borderRadius: 16,
                            padding: '20px 28px',
                            minWidth: 360,
                            maxWidth: 500,
                            animation: 'emergenciaPulse 0.8s ease-in-out infinite',
                        }}
                    >
                        {/* SOS icon + title */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                            <Typography sx={{
                                fontSize: '2rem', lineHeight: 1,
                                animation: 'blink 0.6s ease-in-out infinite',
                            }}>
                                🆘
                            </Typography>
                            <Box>
                                <Typography sx={{ fontWeight: 900, fontSize: '1.2rem', letterSpacing: 2 }}>
                                    EMERGÊNCIA!
                                </Typography>
                                <Typography sx={{ fontSize: '0.78rem', opacity: 0.9 }}>
                                    Paciente necessita de atendimento urgente
                                </Typography>
                            </Box>
                        </Box>

                        {/* Patient info */}
                        <Box sx={{
                            background: 'rgba(255,255,255,0.15)',
                            borderRadius: '10px', p: 1.5, mb: 2,
                        }}>
                            <Typography sx={{ fontWeight: 700, fontSize: '1rem' }}>
                                {emergencia.nome}
                            </Typography>
                            <Typography sx={{ fontSize: '0.75rem', opacity: 0.8 }}>
                                Horário: {new Date(emergencia.hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </Typography>
                        </Box>

                        {/* Buttons */}
                        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                            {onAbrirFicha && (
                                <Button
                                    variant="contained"
                                    onClick={() => onAbrirFicha(emergencia.cidadao_id)}
                                    sx={{
                                        flex: 1, textTransform: 'none', fontWeight: 700,
                                        borderRadius: '10px',
                                        background: 'white', color: '#1E40AF',
                                        '&:hover': { background: '#DBEAFE' },
                                    }}
                                >
                                    📋 Ver Ficha Clínica
                                </Button>
                            )}
                            <Button
                                variant="contained"
                                onClick={() => onAbrirChat(emergencia.cidadao_id)}
                                sx={{
                                    flex: 1, textTransform: 'none', fontWeight: 700,
                                    borderRadius: '10px',
                                    background: 'white', color: '#dc2626',
                                    '&:hover': { background: '#fee2e2' },
                                }}
                            >
                                💬 Abrir Chat
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={onDismiss}
                                sx={{
                                    textTransform: 'none', fontWeight: 600,
                                    borderRadius: '10px',
                                    borderColor: 'rgba(255,255,255,0.5)',
                                    color: 'white',
                                    '&:hover': { background: 'rgba(255,255,255,0.1)', borderColor: 'white' },
                                }}
                            >
                                ✓ Ok, vi
                            </Button>
                        </Box>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default EmergenciaAlert;
