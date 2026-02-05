/* eslint-disable @typescript-eslint/no-explicit-any */
import { io, Socket } from 'socket.io-client';

// Socket event types (matching backend)
export interface PostEvent {
  type: 'insert' | 'update' | 'delete' | 'like';
  post: any;
  userId?: string;
}

export interface CommentEvent {
  type: 'insert' | 'update' | 'delete';
  postId: string;
  comment?: any;
}

export interface ReportEvent {
  type: 'insert' | 'update' | 'delete';
  reportId?: string;
}

export interface StoryEvent {
  type: 'new_story' | 'delete_story' | 'view_story';
  storyId?: string;
  userId: string;
}

export interface PendingPostEvent {
  type: 'insert' | 'update' | 'delete';
  postId?: string;
}

export interface CounterEvent {
  postId: string;
  field: 'likes_count' | 'comments_count' | 'shares_count' | 'views_count';
  value: number;
}

class SocketClient {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  connect(token?: string): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    const serverUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';

    this.socket = io(serverUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    // Re-register event listeners on reconnect
    this.socket.on('connect', () => {
      this.listeners.forEach((callbacks, event) => {
        callbacks.forEach(callback => {
          this.socket?.off(event, callback);
          this.socket?.on(event, callback);
        });
      });
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Subscribe to rooms
  subscribeToPosts(): void {
    this.socket?.emit('subscribe:posts');
  }

  subscribeToComments(postId: string): void {
    this.socket?.emit('subscribe:comments', postId);
  }

  unsubscribeFromComments(postId: string): void {
    this.socket?.emit('unsubscribe:comments', postId);
  }

  subscribeToAdminPending(): void {
    this.socket?.emit('subscribe:admin:pending');
  }

  subscribeToAdminReports(): void {
    this.socket?.emit('subscribe:admin:reports');
  }

  subscribeToStories(): void {
    this.socket?.emit('subscribe:stories');
  }

  subscribeToFeed(): void {
    this.socket?.emit('subscribe:feed');
  }

  // DM subscriptions
  subscribeToDM(conversationId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('subscribe:dm', conversationId);
    } else {
      this.socket?.once('connect', () => {
        this.socket?.emit('subscribe:dm', conversationId);
      });
    }
  }

  unsubscribeFromDM(conversationId: string): void {
    this.socket?.emit('unsubscribe:dm', conversationId);
  }

  subscribeToAllDMs(conversationIds: string[]): void {
    this.socket?.emit('subscribe:all-dms', conversationIds);
  }

  // Presence subscription
  subscribeToPresence(): void {
    this.socket?.emit('subscribe:presence');
  }

  // Room subscriptions
  subscribeToRoom(roomId: string): void {
    if (this.socket?.connected) {
      console.log('[Socket] Subscribing to room:', roomId);
      this.socket.emit('subscribe:room', roomId);
    } else {
      console.log('[Socket] Socket not connected, queuing room subscription:', roomId);
      // Wait for connection then subscribe
      this.socket?.once('connect', () => {
        console.log('[Socket] Connected, now subscribing to room:', roomId);
        this.socket?.emit('subscribe:room', roomId);
      });
    }
  }

  unsubscribeFromRoom(roomId: string): void {
    console.log('[Socket] Unsubscribing from room:', roomId);
    this.socket?.emit('unsubscribe:room', roomId);
  }

  // Room message event listener
  onRoomMessage(callback: (message: any) => void): () => void {
    console.log('[Socket] Adding room:message listener');
    this.on('room:message', callback);
    return () => {
      console.log('[Socket] Removing room:message listener');
      this.off('room:message', callback);
    };
  }

  // Room reaction event listener
  onRoomReaction(callback: (data: { type: 'add' | 'remove'; messageId: string; reaction?: any }) => void): () => void {
    this.on('room:reaction', callback);
    return () => this.off('room:reaction', callback);
  }

  // DM event listeners
  onDMMessage(callback: (event: { type: string; conversationId: string; message?: any; messageId?: string; messageIds?: string[] }) => void): () => void {
    this.on('dm:message', callback);
    return () => this.off('dm:message', callback);
  }

  onDMRead(callback: (event: { conversationId: string; userId: string; readAt: string }) => void): () => void {
    this.on('dm:read', callback);
    return () => this.off('dm:read', callback);
  }

  onNewConversation(callback: (event: { conversationId: string }) => void): () => void {
    this.on('dm:new-conversation', callback);
    return () => this.off('dm:new-conversation', callback);
  }

  // DM reactions
  onDMReaction(callback: (event: { type: 'add' | 'remove'; conversationId: string; messageId: string; reaction?: any }) => void): () => void {
    this.on('dm:reaction', callback);
    return () => this.off('dm:reaction', callback);
  }

  // DM typing indicators
  subscribeToTyping(conversationId: string): void {
    this.socket?.emit('subscribe:typing', conversationId);
  }

  unsubscribeFromTyping(conversationId: string): void {
    this.socket?.emit('unsubscribe:typing', conversationId);
  }

  emitTyping(conversationId: string, username: string): void {
    this.socket?.emit('typing:start', { conversationId, username });
  }

  emitStopTyping(conversationId: string): void {
    this.socket?.emit('typing:stop', { conversationId });
  }

  onTypingStart(callback: (event: { conversationId: string; userId: string; username: string }) => void): () => void {
    this.on('typing:start', callback);
    return () => this.off('typing:start', callback);
  }

  onTypingStop(callback: (event: { conversationId: string; userId: string }) => void): () => void {
    this.on('typing:stop', callback);
    return () => this.off('typing:stop', callback);
  }

  // Unread count update (DM)
  onUnreadCountUpdate(callback: (event: { userId: string; count: number }) => void): () => void {
    this.on('dm:unread-count', callback);
    return () => this.off('dm:unread-count', callback);
  }

  // Notification unread count update
  onNotificationUnreadCount(callback: (event: { userId: string; count: number }) => void): () => void {
    this.on('notification:unread-count', callback);
    return () => this.off('notification:unread-count', callback);
  }

  // Stories updates
  onStoriesUpdate(callback: (event: { type: 'new' | 'delete' | 'view'; userId?: string; storyId?: string }) => void): () => void {
    this.on('stories:update', callback);
    return () => this.off('stories:update', callback);
  }

  // Story emoji button reaction (real-time for story owner)
  onStoryEmojiReaction(callback: (event: { storyId: string; userId: string; emoji: string; isNew: boolean }) => void): () => void {
    this.on('story:emoji-reaction', callback);
    return () => this.off('story:emoji-reaction', callback);
  }

  // Presence event listeners
  onUserOnline(callback: (event: { userId: string }) => void): () => void {
    this.on('user:online', callback);
    return () => this.off('user:online', callback);
  }

  onUserOffline(callback: (event: { userId: string }) => void): () => void {
    this.on('user:offline', callback);
    return () => this.off('user:offline', callback);
  }

  // User status change listener
  onUserStatusChange(callback: (event: { userId: string; status: string }) => void): () => void {
    this.on('user:status-change', callback);
    return () => this.off('user:status-change', callback);
  }

  // Room online count listener
  onRoomOnlineCount(callback: (event: { roomId: string; count: number }) => void): () => void {
    this.on('room:online-count', callback);
    return () => this.off('room:online-count', callback);
  }

  // Event listeners with tracking for reconnection
  on<T>(event: string, callback: (data: T) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback as any);
    this.socket?.on(event, callback);
  }

  off<T>(event: string, callback: (data: T) => void): void {
    this.listeners.get(event)?.delete(callback as any);
    this.socket?.off(event, callback);
  }

  // Convenience methods for specific events
  onPostChange(callback: (event: PostEvent) => void): () => void {
    this.on('post:change', callback);
    return () => this.off('post:change', callback);
  }

  onCommentChange(callback: (event: CommentEvent) => void): () => void {
    this.on('comment:change', callback);
    return () => this.off('comment:change', callback);
  }

  onPendingPostChange(callback: (event: PendingPostEvent) => void): () => void {
    this.on('pending-post:change', callback);
    return () => this.off('pending-post:change', callback);
  }

  onReportChange(callback: (event: ReportEvent) => void): () => void {
    this.on('report:change', callback);
    return () => this.off('report:change', callback);
  }

  onStoryChange(callback: (event: StoryEvent) => void): () => void {
    this.on('story:change', callback);
    return () => this.off('story:change', callback);
  }

  onCounterChange(callback: (event: CounterEvent) => void): () => void {
    this.on('counter:change', callback);
    return () => this.off('counter:change', callback);
  }
}

// Export singleton instance
export const socketClient = new SocketClient();
