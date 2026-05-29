import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import { BASE_URL } from './config';

let socket: Socket | null = null;

export async function getSocket(): Promise<Socket> {
    const token = await SecureStore.getItemAsync('authToken');
    if (!token) throw new Error('No auth token');

    if (socket?.connected) return socket;

    if (socket) {
        socket.disconnect();
        socket = null;
    }

    socket = io(`https://${BASE_URL}`, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
    });

    return socket;
}

export function disconnectSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}
