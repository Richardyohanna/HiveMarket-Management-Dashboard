import { FileEvent, MessageResponse } from '../../src/types/chat';
import { Client, Frame, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { localURL } from "../../../localURL";
import { ReactionResponse } from '../types/products';

const BACKEND_URL = `${localURL}`;

interface FileChunkPayload {
  buyerId: string;
  sellerId: string;
  fileName: string;
  fileType: string;
  chunkIndex: number;
  totalChunks: number;
  chunkData: string;
}

class ChatSocketService {
  private client: Client | null = null;
  private connected: boolean = false;
  private userId: string | null = null;
  
  private messageSubscription: StompSubscription | null = null;
  private fileSubscription: StompSubscription | null = null;

  private subscribers: ((message: any) => void)[] = [];
  private messageCallbacks: ((message: MessageResponse) => void)[] = [];
  private fileCallbacks: ((fileEvent: FileEvent) => void)[] = [];
  private connectionCallbacks: ((connected: boolean) => void)[] = [];
  private sendMessageQueue: { buyerId: string; sellerId: string; message: string }[] = [];
  private productUpdateCallbacks: ((data: ReactionResponse) => void)[] = [];

  /**
   * Initialize the STOMP client with SockJS fallback
   */
  private initializeClient(): void {
    if (this.client) return;

    const socket = new SockJS(`${BACKEND_URL}/ws`);
    
    this.client = new Client({
      webSocketFactory: () => socket as any,
      connectHeaders: {
        login: this.userId || 'guest',
        passcode: 'password',
      },
      debug: (msg: string) => console.log('[ChatSocket]', msg),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = this.handleConnect.bind(this);
    this.client.onDisconnect = this.handleDisconnect.bind(this);
    this.client.onStompError = this.handleError.bind(this);
    this.client.onWebSocketError = this.handleWebSocketError.bind(this);
  }

  /**
   * Handle successful connection
   */
  private handleConnect(frame: Frame): void {
    console.log('✅ WebSocket connected:', frame);
    this.connected = true;
    this.notifyConnectionStatus(true);
    this.subscribeToQueues();
  }

  /**
   * Handle disconnection
   */
  private handleDisconnect(frame: Frame): void {
    console.log('❌ WebSocket disconnected:', frame);
    this.connected = false;
    this.messageSubscription = null;
    this.fileSubscription = null;
    this.notifyConnectionStatus(false);
  }

  /**
   * Handle STOMP errors
   */
  private handleError(frame: Frame): void {
    console.error('❌ STOMP Error:', frame);
  }

  /**
   * Handle WebSocket errors
   */
  private handleWebSocketError(error: Event): void {
    console.error('❌ WebSocket Error:', error);
  }

  /**
   * Subscribe to message and file queues
   */
  private subscribeToQueues(): void {
    if (!this.client || !this.connected || !this.userId) {
      console.warn('⚠️ Client not ready for subscriptions');
      return;
    }

    this.messageSubscription = this.client.subscribe(
      `/user/hivemarket-queue/messages`,
      (message: Frame) => {
        try {
          const body = JSON.parse(message.body);
          console.log('📨 Message received:', body);
          this.notifyMessageCallbacks(body);
        } catch (error) {
          console.error('❌ Failed to parse message:', error);
        }
      }
    );

    this.fileSubscription = this.client.subscribe(
      `/user/hivemarket-queue/files`,
      (message: Frame) => {
        try {
          const body = JSON.parse(message.body);
          console.log('📁 File event received:', body);
          this.notifyFileCallbacks(body);
        } catch (error) {
          console.error('❌ Failed to parse file event:', error);
        }
      }
    );

    console.log(`✅ Subscribed to queues for user: ${this.userId}`);
  }

  /**
   * Connect to the WebSocket server
   */

  public connect(uid: string): Promise<void> {
    return new Promise((resolve, reject) => {


      console.log("Connecting WebSocket for UID", uid);

      const socket = new SockJS(`${BACKEND_URL}/ws?userId=${uid}`);

      this.client = new Client({
        webSocketFactory: () => socket,
        onConnect: () => {
          this.userId = uid;
          this.connected = true;

          console.log("WebSocket connected for userId:", this.userId);

        this.sendMessageQueue.forEach(({ buyerId, sellerId, message }) => {
            this.sendMessage(buyerId, sellerId, message);
          });

        this.sendMessageQueue = [];




       /* this.client?.subscribe(`/user/hivemarket-queue/messages`, (message: IMessage) => {
          const parsedMessage = JSON.parse(message.body);

          console.log("WebSocket Received: ", parsedMessage);
          this.subscribers.forEach(sub => sub(parsedMessage));

          this.notifyMessageCallbacks(parsedMessage);
        }); */


       // this.notifyConnectionStatus(true);
      //  this.subscribeToQueues();

          resolve();
        },

        onDisconnect: () => {
          console.warn("HivegramWebSocket Disconnected");
          this.connected = false;
        },

        onStompError: (frame) => {
          console.error("STOMP Error:", frame.headers["message"], frame.body);
          reject(new Error(frame.headers["message"] || 'STOMP Error'));
        },

        onWebSocketError: (error) => {
          console.error("WebSocket Error:", error);
          reject(error);
        }
      });

      this.client.activate();
    });
  }


  /* public connect(userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.connected && this.userId === userId) {
        resolve();
        return;
      }

      this.userId = userId;
      this.initializeClient();


      if (!this.client) {
        reject(new Error('Failed to initialize client'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 10000);

      const originalOnConnect = this.client.onConnect;
      this.client.onConnect = (frame: Frame) => {
        clearTimeout(timeout);
        originalOnConnect?.call(this, frame);
        resolve();
      };

      this.client.activate();
    });
  } */

  /**
   * Disconnect from the WebSocket server
   */
  public disconnect(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.client || !this.connected) {
        resolve();
        return;
      }

      this.client.deactivate();
      setTimeout(() => {
        this.client = null;
        this.userId = null;
        resolve();
      }, 1000);
    });
  }

  /**
   * Send a text message
   */
  public sendMessage(
    buyerId: string,
    sellerId: string,
    message: string
  ): void {
    if (!this.client || !this.connected) {
      console.error('⚠️ WebSocket not connected');
      this.sendMessageQueue.push({ buyerId, sellerId, message });
      return;
    }

    const payload = {
      buyerId,
      sellerId,
      message,
    };

    this.client.publish({
      destination: '/app/chat.sendMessage',
      body: JSON.stringify(payload),
    });

    console.log('📤 Message sent:', payload);
  }

  /**
   * Send a file in chunks (512 KB each)
   */
  public async sendFile(
    buyerId: string,
    sellerId: string,
    fileName: string,
    fileType: string,
    fileData: Uint8Array
  ): Promise<void> {
    if (!this.client || !this.connected) {
      throw new Error('WebSocket not connected');
    }

    const CHUNK_SIZE = 512 * 1024; // 512 KB
    const totalChunks = Math.ceil(fileData.length / CHUNK_SIZE);

    console.log(
      `📁 Sending file: ${fileName} (${fileData.length} bytes, ${totalChunks} chunks)`
    );

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, fileData.length);
      const chunk = fileData.slice(start, end);

      const base64Chunk = btoa(String.fromCharCode(...chunk));

      const payload: FileChunkPayload = {
        buyerId,
        sellerId,
        fileName,
        fileType,
        chunkIndex,
        totalChunks,
        chunkData: base64Chunk,
      };

      this.client.publish({
        destination: '/app/chat.sendFile',
        body: JSON.stringify(payload),
      });

      console.log(
        `📤 Chunk ${chunkIndex + 1}/${totalChunks} sent (${chunk.length} bytes)`
      );

      if (chunkIndex < totalChunks - 1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    console.log(`✅ File upload complete: ${fileName}`);
  }


  public updateProduct(productId: string, callback: (data: ReactionResponse) => void): void {
    if (!this.client || !this.connected) {
      console.error('⚠️ WebSocket not connected');
      return;
    }

    console.log(`Subscribing to product updates for productId: ${productId}`);

    this.client.subscribe(`/hivemarket-topic/product/${productId}`, (message: IMessage) => {
      const parsedMessage = JSON.parse(message.body);
      console.log("Product update received: ", parsedMessage);
      callback(parsedMessage);
    });

    console.log(`✅ Subscribed to product updates for productId: ${productId}`);
  }

  /**
   * Register callback for incoming messages
   */
  public onMessage(callback: (message: MessageResponse) => void): void {

    console.log("Registering message callback:", callback);

    this.client?.subscribe(`/user/hivemarket-queue/messages`, (message: IMessage) => {
        const parsedMessage = JSON.parse(message.body);

        console.log("WebSocket Received: ", parsedMessage);
        callback(parsedMessage);
  });

    console.log("Success registering message callback:");
  }

  /**
   * Register callback for file events
   */
  public onFileEvent(callback: (fileEvent: FileEvent) => void): () => void {
    this.fileCallbacks.push(callback);
    return () => {
      this.fileCallbacks = this.fileCallbacks.filter((cb) => cb !== callback);
    };
  }

  /**
   * Register callback for connection status changes
   */
  public onConnectionStatus(
    callback: (connected: boolean) => void
  ): () => void {
    this.connectionCallbacks.push(callback);
    return () => {
      this.connectionCallbacks = this.connectionCallbacks.filter(
        (cb) => cb !== callback
      );
    };
  }

  /**
   * Notify all message callbacks
   */
  private notifyMessageCallbacks(message: MessageResponse): void {
    this.messageCallbacks.forEach((callback) => {
      try {
        callback(message);
      } catch (error) {
        console.error('❌ Error in message callback:', error);
      }
    });
  }

  /**
   * Notify all file event callbacks
   */
  private notifyFileCallbacks(fileEvent: FileEvent): void {
    this.fileCallbacks.forEach((callback) => {
      try {
        callback(fileEvent);
      } catch (error) {
        console.error('❌ Error in file callback:', error);
      }
    });
  }

  /**
   * Notify all connection status callbacks
   */
  private notifyConnectionStatus(connected: boolean): void {
    this.connectionCallbacks.forEach((callback) => {
      try {
        callback(connected);
      } catch (error) {
        console.error('❌ Error in connection callback:', error);
      }
    });
  }

  /**
   * Get current connection status
   */
  public isConnected(): boolean {
    return this.connected;
  }

  /**
   * Get current user ID
   */
  public getUserId(): string | null {
    return this.userId;
  }
}

export const chatSocketService = new ChatSocketService();
