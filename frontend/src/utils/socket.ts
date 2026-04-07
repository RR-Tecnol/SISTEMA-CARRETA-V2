/**
 * utils/socket.ts
 * Singleton do cliente Socket.IO com helpers para a fila de atendimento
 */
import { io, Socket } from 'socket.io-client';

// CRA usa process.env.REACT_APP_* — Vite usaria import.meta.env.VITE_*
const API_URL = (process.env.REACT_APP_API_URL as string) || 'http://localhost:3001/api';
const SOCKET_URL = API_URL.replace('/api', '').replace(/\/$/, '') || 'http://localhost:3001';

let socket: Socket | null = null;

/** Retorna (ou cria) a instância singleton do socket */
export function getSocket(): Socket {
    if (!socket || socket.disconnected) {
        socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            autoConnect: true,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        });

        socket.on('connect', () => {
            console.log(`⚡ Socket conectado: ${socket?.id}`);
        });
        socket.on('disconnect', (reason) => {
            console.warn(`🔌 Socket desconectado: ${reason}`);
        });
        socket.on('connect_error', (err) => {
            console.error('Socket erro de conexão:', err.message);
        });
    }
    return socket;
}

/** Entra na sala de uma ação (necessário para receber eventos dessa ação) */
export function joinAcaoRoom(acao_id: string): Socket {
    const s = getSocket();
    s.emit('join_acao', acao_id);
    return s;
}

/** Sai da sala de uma ação */
export function leaveAcaoRoom(acao_id: string): void {
    if (socket) {
        socket.emit('leave_acao', acao_id);
    }
}

/** Desconecta definitivamente o socket (uso em logout) */
export function disconnectSocket(): void {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}
