/**
 * utils/socket.ts
 * Singleton do cliente Socket.IO com helpers para a fila de atendimento
 */
import { io, Socket } from 'socket.io-client';

// Em produção, conecta no mesmo origin da página (nginx faz o proxy /socket.io/ → backend)
// Em desenvolvimento, usa REACT_APP_API_URL ou localhost:3001
const SOCKET_URL = (() => {
    if (process.env.REACT_APP_API_URL) {
        return process.env.REACT_APP_API_URL.replace('/api', '').replace(/\/$/, '');
    }
    // Produção sem variável: usar mesmo origin (vai passar pelo nginx)
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
        return window.location.origin;
    }
    return 'http://localhost:3001';
})();

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
