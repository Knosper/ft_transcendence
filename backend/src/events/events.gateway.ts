import { WebSocketGateway, SubscribeMessage, WebSocketServer } from '@nestjs/websockets';
import * as cookie from 'cookie';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { EventsService } from './events.service';

@WebSocketGateway({
	cors: {
		origin: 'http://localhost:5173', // Replace with your frontend's origin
		methods: ['GET', 'POST'], // You can specify the allowed methods
		credentials: true, // Important if you're using credentials like cookies or auth headers
	},
})
export class EventsGateway {
	@WebSocketServer()
	server: Server;

	constructor(private jwtService: JwtService, private eventsService: EventsService) {}

	async handleConnection(client: Socket, ...args: any[]) {
		try {
			const cookies = cookie.parse(client.handshake.headers.cookie || '');
			if (!cookies.token) {
				//console.log('No cookies provided');
				return;
			}

			//console.log('cookies: ', cookies);
			//console.log('token type: ', typeof cookies);
			const token = cookies['token'];
			if (!token) {
				//console.log('No token provided');
				return;
			}

			//console.log('token: ', token);
			//console.log('token type: ', typeof token);

			try {
				const decoded = this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
				client.data.user = decoded;
				//console.log('decoded client data: ', decoded);
				if (decoded) {
					this.eventsService.userConnected(decoded.email);
				}
			} catch (innerError) {
				console.log('JWT decode error:', innerError.message);
			}
		} catch (error) {
			console.log('Error in handleConnection:', error.message);
		}
	}

	handleDisconnect(client: any) {
		//console.log('start handle disconnect');
		if (client.data.user) {
			this.eventsService.userDisconnected(client.data.user.email);
		} else {
			console.log('User without account detected');
		}
	}
}
