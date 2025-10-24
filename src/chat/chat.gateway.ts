import { Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { 
    ConnectedSocket, 
    MessageBody, 
    OnGatewayConnection, 
    OnGatewayDisconnect, 
    OnGatewayInit, 
    SubscribeMessage, 
    WebSocketGateway, 
    WebSocketServer,
    WsException 
} from "@nestjs/websockets";
import { Server, Socket } from 'socket.io';
import { SendMessageDto } from "./dto/send-message.dto";
import { MessageService } from "./services/message.service";

interface AuthenticatedSocket extends Socket {
    userId: string;
}

@WebSocketGateway({
    namespace: '/chat'
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
    
    @WebSocketServer() io: Server;

    private readonly logger = new Logger(ChatGateway.name);
    private userSockets = new Map<string, string>();
    private chatRooms = new Map<string, Set<string>>();

    constructor(
        private readonly jwtService: JwtService,
        private readonly messageService: MessageService
    ) {}

    afterInit(server: Server) {
        this.logger.log('WebSocket Gateway initialized');
    }
    
    async handleConnection(client: AuthenticatedSocket) {
        try {
            const token = client.handshake.auth.token || 
                         client.handshake.headers?.authorization?.replace('Bearer ', '');
            
            if (!token) {
                this.logger.warn(`Client ${client.id} connected without token`);
                client.emit('error', { message: 'Authentication required' });
                client.disconnect();
                return;
            }

            const payload = await this.jwtService.verifyAsync(token);
            client.userId = payload.sub;
            
            this.userSockets.set(payload.sub, client.id);
            
            this.logger.log(`User ${payload.sub} connected with socket ${client.id}`);
            
            client.emit('connected', { 
                userId: payload.sub,
                message: 'Successfully connected to chat'
            });

        } catch (error) {
            this.logger.error('Error authenticating connection:', error.message);
            client.emit('error', { message: 'Invalid token' });
            client.disconnect();
        }
    }

    async handleDisconnect(client: AuthenticatedSocket) {
        if (!client.userId) return;
        this.chatRooms.forEach((users, chatId) => {
            if (users.has(client.userId)) {
                users.delete(client.userId);
                this.io.to(chatId).emit('user-left', {
                    userId: client.userId,
                    chatId
                });
            }
        });

        this.userSockets.delete(client.userId);
        this.logger.log(`User ${client.userId} disconnected`);
    }

    @SubscribeMessage('join-chat')
    async handleJoinChat(
        @MessageBody() data: { chatId: string },
        @ConnectedSocket() client: AuthenticatedSocket
    ) {
        try {
            if (!client.userId) {
                throw new WsException('User not authenticated');
            }

            const { chatId } = data;

            client.join(chatId);

            if (!this.chatRooms.has(chatId)) {
                this.chatRooms.set(chatId, new Set());
            }
            this.chatRooms.get(chatId)!.add(client.userId);

            this.logger.log(`User ${client.userId} joined chat ${chatId}`);

            client.emit('joined-chat', { 
                chatId,
                message: 'Successfully joined chat'
            });

            client.to(chatId).emit('user-joined', {
                userId: client.userId,
                chatId
            });

            const recentMessages = await this.messageService.getRecentMessages(chatId);
            client.emit('chat-history', {
                chatId,
                messages: recentMessages
            });

        } catch (error) {
            this.logger.error('Error joining chat:', error.message);
            client.emit('error', { 
                event: 'join-chat',
                message: error.message 
            });
        }
    }

    @SubscribeMessage('leave-chat')
    async handleLeaveChat(
        @MessageBody() data: { chatId: string },
        @ConnectedSocket() client: AuthenticatedSocket
    ) {
        try {
            if (!client.userId) {
                throw new WsException('User not authenticated');
            }

            const { chatId } = data;

            client.leave(chatId);

            if (this.chatRooms.has(chatId)) {
                this.chatRooms.get(chatId)!.delete(client.userId);
            }

            this.logger.log(`User ${client.userId} left chat ${chatId}`);

            client.emit('left-chat', { chatId });
            client.to(chatId).emit('user-left', {
                userId: client.userId,
                chatId
            });

        } catch (error) {
            this.logger.error('Error leaving chat:', error.message);
            client.emit('error', { 
                event: 'leave-chat',
                message: error.message 
            });
        }
    }

    @SubscribeMessage('send-message')
    async handleSendMessage(
        @MessageBody() dto: SendMessageDto,
        @ConnectedSocket() client: AuthenticatedSocket
    ) {
        try {
            if (!client.userId) {
                throw new WsException('User not authenticated');
            }

            const message = await this.messageService.sendMessage(client.userId, dto);

            this.io.to(dto.chatId).emit('new-message', {
                message,
                chatId: dto.chatId
            });

            client.emit('message-sent', {
                messageId: message.id,
                timestamp: message.createdAt
            });

            this.logger.log(`Message sent by ${client.userId} to chat ${dto.chatId}`);

        } catch (error) {
            this.logger.error('Error sending message:', error.message);
            client.emit('error', { 
                event: 'send-message',
                message: error.message 
            });
        }
    }

    @SubscribeMessage('typing')
    handleTyping(
        @MessageBody() data: { chatId: string, isTyping: boolean },
        @ConnectedSocket() client: AuthenticatedSocket
    ) {
        if (!client.userId) return;

        const { chatId, isTyping } = data;
        
        client.to(chatId).emit('user-typing', {
            userId: client.userId,
            chatId,
            isTyping
        });
    }


    sendToUser(userId: string, event: string, data: any) {
        const socketId = this.userSockets.get(userId);
        if (socketId) {
            this.io.to(socketId).emit(event, data);
            return true;
        }
        return false;
    }

    getOnlineUsersInChat(chatId: string): string[] {
        const users = this.chatRooms.get(chatId);
        return users ? Array.from(users) : [];
    }
}