import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'https://salesiqbackendapis-qw2eh.ondigitalocean.app';
const DEFAULT_COMPANY_ID = '697e03f744d6d61aec26d272';

class SocketService {
    private socket: Socket | null = null;
    private listeners: Map<string, Function[]> = new Map();

    connect() {
        if (this.socket) {
            if (this.socket.connected) {
                // Ensure we join the company room even if already connected
                this.emit('agent-join', DEFAULT_COMPANY_ID);
            }
            return;
        }

        console.log('Initializing Socket Service...');
        this.socket = io(SOCKET_URL);

        this.socket.on('connect', () => {
            console.log('Connected to socket server');
            this.emit('agent-join', DEFAULT_COMPANY_ID);
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from socket server');
        });

        // Forward events to registered listeners
        const events = ['new-message', 'visitor-updated', 'session-updated', 'active-visitors', 'active-sessions'];
        events.forEach(event => {
            this.socket?.on(event, (data: any) => {
                console.log(`[SocketService] Received event: ${event}`, data._id || 'no-id');
                const callbacks = this.listeners.get(event) || [];
                callbacks.forEach(cb => cb(data));
            });
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    emit(event: string, data: any) {
        if (!this.socket) {
            this.connect();
        }
        this.socket?.emit(event, data);
    }

    on(event: string, callback: Function) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)?.push(callback);

        // If socket is already connected and we're adding a listener for an event that might not be forwarded by default logic above (though I added generic forwarding)
        // Actually, the generic forwarding covers it.
        
        // Return off function
        return () => {
            const callbacks = this.listeners.get(event) || [];
            this.listeners.set(event, callbacks.filter(cb => cb !== callback));
        };
    }
}

export const socketService = new SocketService();
