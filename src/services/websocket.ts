import { WebSocketMessage, WebSocketSubscription } from '../types';
import { API_CONFIG, FEATURE_FLAGS } from '../constants';

type WebSocketEventHandler = (message: WebSocketMessage) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private eventHandlers: Map<string, WebSocketEventHandler[]> = new Map();
  private subscriptions: Set<string> = new Set();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.url = API_CONFIG.WS_URL;
  }

  connect(): Promise<void> {
    if (!FEATURE_FLAGS.ENABLE_WEBSOCKET) {
      console.log('WebSocket disabled by feature flag');
      return Promise.resolve();
    }

    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      this.isConnecting = true;

      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.resubscribe();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.isConnecting = false;
          this.stopHeartbeat();
          
          if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;
          reject(error);
        };

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.stopHeartbeat();
    this.subscriptions.clear();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }

  subscribe(subscription: WebSocketSubscription): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, cannot subscribe');
      return;
    }

    const subscriptionKey = this.getSubscriptionKey(subscription);
    this.subscriptions.add(subscriptionKey);

    this.ws.send(JSON.stringify(subscription));
    console.log('Subscribed to:', subscription);
  }

  unsubscribe(subscription: WebSocketSubscription): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const subscriptionKey = this.getSubscriptionKey(subscription);
    this.subscriptions.delete(subscriptionKey);

    this.ws.send(JSON.stringify({
      action: 'unsubscribe',
      ...subscription,
    }));
    console.log('Unsubscribed from:', subscription);
  }

  on(eventType: string, handler: WebSocketEventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  off(eventType: string, handler: WebSocketEventHandler): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private handleMessage(message: WebSocketMessage): void {
    const handlers = this.eventHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error('Error in WebSocket message handler:', error);
        }
      });
    }
  }

  private getSubscriptionKey(subscription: WebSocketSubscription): string {
    if (subscription.action === 'subscribeArea') {
      return `area:${subscription.geohashPrefix}`;
    } else if (subscription.action === 'subscribeIncident') {
      return `incident:${subscription.incidentId}`;
    }
    return 'unknown';
  }

  private resubscribe(): void {
    this.subscriptions.forEach(subscriptionKey => {
      const [type, value] = subscriptionKey.split(':');
      
      if (type === 'area') {
        this.subscribe({
          action: 'subscribeArea',
          geohashPrefix: value,
        });
      } else if (type === 'incident') {
        this.subscribe({
          action: 'subscribeIncident',
          incidentId: value,
        });
      }
    });
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      this.connect().catch(error => {
        console.error('Reconnect failed:', error);
      });
    }, delay);
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Send ping every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  get connectionState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }
}

// Singleton instance
export const webSocketService = new WebSocketService();

// Export for testing
export { WebSocketService };
