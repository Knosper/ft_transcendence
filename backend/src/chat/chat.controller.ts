// src/chat/chat.controller.ts
import {
	Controller,
	Post,
	Body,
	Get,
	Param,
	UseGuards,
	Req,
	Query,
	HttpStatus,
	Res,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ChatService } from './chat.service';
import { CreateChatDto } from './create.chat.dto'; // DTO for creating a chat message
import { Response } from 'express';

@Controller('chat')
export class ChatController {
	constructor(private readonly chatService: ChatService) {}

	// Endpoint to send a chat message or friend request
	@UseGuards(JwtAuthGuard)
	@Post('friendrequest')
	async create(@Body() createChatDto: CreateChatDto, @Req() req) {
		//console.log('friendrequest arrived, dto: ', createChatDto);
		return this.chatService.create(createChatDto, req.user);
	}

	// Endpoint to get all pending requests for the logged-in user
	@UseGuards(JwtAuthGuard)
	@Get('requests')
	async findAll(@Req() req) {
		return this.chatService.findAll(req.user.id);
	}

	//TODO: add new friend to User Table of these USers which requests 'eachother'
	//accept a friend-request and save the friendships
	@UseGuards(JwtAuthGuard)
	@Post('accept')
	async acceptRequest(@Query('messageid') messageId: string, @Req() req, @Res() res: Response) {
		//console.log(`Accepting request with messageId: ${messageId}`);
		try {
			await this.chatService.acceptRequest(messageId, req.user);
			return res.status(HttpStatus.OK).send('Friend accepted!');
		} catch (error) {
			return res.status(HttpStatus.NOT_FOUND).json({ error: error.message });
		}
	}

	//decline a friend-request && deletes it
	@UseGuards(JwtAuthGuard)
	@Post('decline')
	async declineRequest(@Query('messageid') messageId: string, @Req() req, @Res() res: Response) {
		try {
			await this.chatService.declineRequest(messageId, req.user);
			return res.status(HttpStatus.NO_CONTENT).send('friend request declined!');
		} catch (error) {
			return res.status(HttpStatus.NOT_FOUND).json({ error: error.message });
		}
	}

	// Endpoint to get a specific chat message
	@UseGuards(JwtAuthGuard)
	@Get(':id')
	async findOne(@Param('id') id: string) {
		//return this.chatService.findOne(id);
	}

	//Debug:
	@Post('all')
	async getAll() {
		return this.chatService.getAllRequests();
	}
}
