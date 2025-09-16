'use client';

import { io, Socket } from 'socket.io-client';

class SocketManager {
  private static instance: SocketManager;
  private socket: Socket | null = null;
  private isConnecting = false;
  private connectionPromise: Promise<Socket> | null = null;

  private constructor() {}

  static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  async getSocket(): Promise<Socket> {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    if (this.isConnecting && this.connectionPromise) {
      return this.connectionPromise;
    }

    this.isConnecting = true;
    this.connectionPromise = this.createConnection();
    
    try {
      this.socket = await this.connectionPromise;
      return this.socket;
    } finally {
      this.isConnecting = false;
      this.connectionPromise = null;
    }
  }

  private createConnection(): Promise<Socket> {
    return new Promise((resolve, reject) => {
      console.log('🔌 Creating new socket connection...');
      
      const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
        transports: ['polling', 'websocket'],
        autoConnect: true,
        timeout: 30000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 10000,
        forceNew: false,
        upgrade: true,
        rememberUpgrade: true,
      });

      socket.on('connect', () => {
        console.log('✅ Socket connected successfully with transport:', socket.io.engine.transport.name);
        resolve(socket);
      });

      socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
        reject(error);
      });

      socket.on('disconnect', (reason) => {
        console.log('🔌 Socket disconnected:', reason);
        if (reason === 'io client disconnect') {
          this.socket = null;
        }
      });

      socket.on('reconnect', (attemptNumber) => {
        console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
      });

      // Set a timeout for connection
      setTimeout(() => {
        if (!socket.connected) {
          socket.disconnect();
          reject(new Error('Connection timeout'));
        }
      }, 30000);
    });
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 Manually disconnecting socket...');
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export default SocketManager;