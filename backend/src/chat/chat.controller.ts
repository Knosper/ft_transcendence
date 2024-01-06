// src/chat/chat.controller.ts
import {
	Controller,
	Post,
	Body,
	Get,
	UseGuards,
	Req,
	Query,
	HttpStatus,
	Res,
	Delete,
	HttpCode,
	HttpException,
	ForbiddenException,
	BadRequestException,
	NotFoundException,
	InternalServerErrorException,
	UnauthorizedException,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ChatService } from './chat.service';
import { Response } from 'express';
import { UserService } from 'src/user/user.service';
import {
	ChangePasswordDto,
	ClearChatRoomDto,
	CreateChatRoomDto,
	FriendRequestDto,
	InviteRoomDto,
	RoomIdUserIdDTO,
} from './dto/chatRoom.dto';
import * as bcrypt from 'bcryptjs';
import { StatusGuard } from 'src/auth/guards/status.guard';

@Controller('chat')
export class ChatController {
	constructor(
		private readonly chatService: ChatService,
		private userService: UserService,
	) {}

	//########################Mute#############################

	//########################CHatRooms#############################

	//@UseGuards(JwtAuthGuard) //TODO: uncomment before eval!
	@Get('allchatrooms')
	async getChatRooms() {
		return await this.chatService.getAllChatRooms();
	}

	//create a new Chatroom
	@UseGuards(JwtAuthGuard, StatusGuard)
	@Post('chatroom')
	async createChatRoom(@Body() chatRoomData: CreateChatRoomDto, @Req() req) {
		try {
			const userId = req.user.id; // Get the user ID from the request
			const user = await this.userService.findProfileById(userId);

			// Check the number of chat rooms the user already has
			const chatRoomCount = user.chatRooms.length; // Assuming user.chatRooms is an array of chat rooms
			const MAX_CHATROOMS = 5;
			// If the user already has the maximum number of chat rooms, throw an error
			if (chatRoomCount >= MAX_CHATROOMS) {
				throw new ForbiddenException(
					'You have reached the maximum number of chat rooms. You can still join other rooms in the ChatRoomlist',
				);
			}

			const existingChatRoom = await this.chatService.findChatRoomByName(chatRoomData.name);
			if (existingChatRoom) {
				throw new BadRequestException('Chat room name already in use.');
			}

			// Since the user has not reached the maximum, create the new chat room
			chatRoomData.ownerName = user.name;
			const chatRoom = await this.chatService.createChatRoom(chatRoomData);

			// Add the new chat room to the user's chat rooms
			user.chatRooms.push(chatRoom);

			// Save the updated user entity
			await this.userService.updateUser(user);

			return chatRoom;
		} catch (error) {
			// Here, handle specific types of errors as needed
			if (error instanceof ForbiddenException) {
				// Specific handling for ForbiddenException
				throw new HttpException(error.message, HttpStatus.FORBIDDEN);
			} else if (error instanceof BadRequestException) {
				// Specific handling for BadRequestException
				throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
			}
			// For other types of errors
			//console.error('Failed to create chat room:', error);
			throw new HttpException(
				'Internal Server Error: Failed to create chat room due to an unexpected error',
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	//get all Chatrooms of that user
	@UseGuards(JwtAuthGuard, StatusGuard)
	@Get('mychatrooms')
	async myChatRooms(@Req() req, @Res() res) {
		try {
			const user = await this.userService.findProfileById(req.user.id);
			res.status(HttpStatus.OK).json(user.chatRooms);
		} catch (error) {
			// Handle any errors that occur
			res
				.status(HttpStatus.INTERNAL_SERVER_ERROR)
				.json({ message: 'An error occurred while fetching chat rooms.' });
		}
	}

	//delivers the Chathistory of a chatroom.
	@UseGuards(JwtAuthGuard)
	@Get('chatroomhistory')
	async getChatRoomChat(@Req() req, @Query() clearChatRoomDto: ClearChatRoomDto) {
		try {
			const userId = req.user.id;
			const user = await this.userService.findProfileById(userId);
			const chatRoom = await this.chatService.getChatRoomById(clearChatRoomDto.chatroomId);

			// Ensure the user is a member of the chat room
			if (!chatRoom.users.some((u) => u.id === userId)) {
				throw new ForbiddenException('User is not a member of this chat room.');
			}

			const chatHistory = await this.chatService.findChatRoomChat(clearChatRoomDto.chatroomId);

			// Censor messages from ignored users
			const censoredHistory = chatHistory.map((message) => {
				if (user.ignorelist.some((ignoredUser) => ignoredUser.id === message.senderId)) {
					return { ...message, content: '[Message Hidden]', senderName: '[Ignored User]' };
				}
				return message;
			});

			return censoredHistory;
		} catch (error) {
			throw new HttpException('Failed to retrieve chat history', HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	//clears Chathistory in the Chatroom.
	@UseGuards(JwtAuthGuard)
	@HttpCode(HttpStatus.NO_CONTENT)
	@Delete('clearchatroom')
	async clearChatRoom(@Query() clearChatRoomDto: ClearChatRoomDto, @Req() req) {
		return await this.chatService.clearChatRoom(clearChatRoomDto.chatroomId, req.user.id);
	}

	//delete your ChatROom (only owner)
	@UseGuards(JwtAuthGuard)
	@HttpCode(HttpStatus.NO_CONTENT)
	@Delete('deletechatroom')
	async deleteChatRoom(@Query() clearChatRoomDto: ClearChatRoomDto, @Req() req) {
		try {
			await this.chatService.deleteChatRoom(clearChatRoomDto.chatroomId, req.user.id);
		} catch (error) {
			// If the chatroom exists but the user is not the owner: Forbidden exception
			if (error instanceof HttpException) {
				throw new ForbiddenException('User is not the owner of the chat room.');
			}
			// Re-throw the error if it's not a NotOwnerException
			throw error;
		}
	}

	//adds a player to a chatroom.
	@UseGuards(JwtAuthGuard)
	@Post('invitetoroom')
	async inviteToRoom(@Body() inviteRoomDto: InviteRoomDto, @Req() req): Promise<any> {
		const { roomId, userNameToInvite } = inviteRoomDto;
		//console.log('roomId: ', roomId);
		//console.log('userNameToInvite: ', userNameToInvite);
		try {
			const chatRoom = await this.chatService.getChatRoomById(roomId);
			if (!chatRoom) {
				throw new NotFoundException('Chat room not found.');
			}
			//console.log('User count: ', chatRoom.users.length);
			//limit users in chatroom
			if (chatRoom.users.length >= 10) {
				throw new BadRequestException('Chat room has max users');
			}

			//console.log('OwnerId: ', chatRoom.ownerId);
			//console.log('userID: ', req.user.id);
			if (!chatRoom.adminIds.includes(req.user.id)) {
				throw new UnauthorizedException('No permissions to invite users!');
			}

			//check if Username is a existing user
			const userToInvite = await this.userService.findProfileByName(userNameToInvite);
			if (!userToInvite) {
				throw new NotFoundException('The user you are trying to invite does not exist.');
			}

			//check if user is already in Chatroom
			if (chatRoom.users.some((user) => user.name === userNameToInvite)) {
				throw new BadRequestException(
					'The user you are trying to invite is already in the chat room.',
				);
			}
			// TODO: Add request system here like the friendrequest does, or similiar...
			await this.chatService.addUserToChatRoom(roomId, userToInvite);
			// Return a success response if the invitation was sent
			return { message: 'Invitation sent successfully.' };
		} catch (error) {
			//console.error('Error inviting to room:', error);

			// Rethrow the error if it's a known HTTP exception
			if (error instanceof HttpException) {
				throw error;
			}

			// For other types of errors, throw an InternalServerErrorException
			throw new InternalServerErrorException(
				'An unexpected error occurred while inviting the user to the room.',
			);
		}
	}

	//join a public chatroom + pw if set
	@UseGuards(JwtAuthGuard)
	@Post('joinroom')
	async joinChatRoom(@Req() req, @Body() inviteRoomDto: InviteRoomDto): Promise<any> {
		const userId = req.user.id;
		const roomId = inviteRoomDto.roomId;
		// Get the chat room details
		const chatRoom = await this.chatService.getChatRoomById(roomId);
		if (!chatRoom) {
			throw new NotFoundException('Chat room not found.');
		}
		/*if (chatRoom.ownerName === req.user.name) {
			throw new UnauthorizedException('You are already the owner of that Chatroom!');
		}*/

		if (chatRoom.type === 'private') {
			throw new UnauthorizedException('ChatRoom is private, you will need an invite.');
		}
		if (chatRoom.type === 'public' && chatRoom.password !== '') {
			const isPasswordMatch = await bcrypt.compare(inviteRoomDto.password, chatRoom.password);
			if (!isPasswordMatch) {
				throw new UnauthorizedException('Incorrect password.');
			}
		}
		// Check if the user is already in the chat room
		if (chatRoom.users.some((user) => user.id === userId)) {
			throw new BadRequestException('You are already a member of this room.');
		}

		if (chatRoom.users.length >= 10) {
			throw new BadRequestException('Chat room has max users');
		}
		// Check if the chat room is private and if the user is an admin or invited
		if (
			chatRoom.type === 'private' &&
			!chatRoom.adminIds.includes(userId) &&
			!chatRoom.users.some((user) => user.id === userId)
		) {
			throw new ForbiddenException('You do not have permission to join this room.');
		}

		// Add the user to the room
		try {
			const userToAdd = await this.userService.findProfileById(userId);
			// Add the user to the room
			await this.chatService.addUserToChatRoom(roomId, userToAdd);
			return { message: 'Joined the room successfully.' };
		} catch (error) {
			// Log the error and throw an appropriate exception
			console.error('Error while adding user to chat room:', error);
			throw new InternalServerErrorException('An error occurred while joining the room.');
		}
	}

	//kick a user in a chatroom, if you are owner. //TODO: kick as admin normal members.
	@UseGuards(JwtAuthGuard)
	@Post('kickuser')
	async kickUser(@Body() kickUserDto: RoomIdUserIdDTO, @Req() req) {
		try {
			await this.chatService.kickUserFromRoom(kickUserDto.roomId, kickUserDto.userId, req.user.id);
			return { message: 'User successfully kicked' };
		} catch (error) {
			if (error instanceof NotFoundException) {
				throw new HttpException(error.message, HttpStatus.NOT_FOUND);
			} else if (error instanceof UnauthorizedException) {
				throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
			} else {
				// Log the error for debugging
				//console.log('Failed to kick user:', error);
				throw new HttpException(
					'Failed to kick user due to an unexpected error',
					HttpStatus.INTERNAL_SERVER_ERROR,
				);
			}
		}
	}

	@UseGuards(JwtAuthGuard)
	@Post('upgradeToAdmin')
	async upgradeToAdmin(@Body() roomIdUserIdDto: RoomIdUserIdDTO, @Req() req) {
		try {
			await this.chatService.upgradeToAdmin(
				roomIdUserIdDto.roomId,
				roomIdUserIdDto.userId,
				req.user.id,
			);
			return { message: 'User successfully upgraded to admin' };
		} catch (error) {
			if (error instanceof NotFoundException) {
				throw new HttpException(`Chat room not found: ${error.message}`, HttpStatus.NOT_FOUND);
			} else if (error instanceof UnauthorizedException) {
				throw new HttpException(`Unauthorized: ${error.message}`, HttpStatus.UNAUTHORIZED);
			} else if (error instanceof BadRequestException) {
				throw new HttpException(`Bad request: ${error.message}`, HttpStatus.BAD_REQUEST);
			}
			// Log the error for internal monitoring
			//console.error('Internal Server Error:', error);

			throw new HttpException(
				'Internal Server Error: Failed to upgrade user due to an unexpected error',
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}
	@UseGuards(JwtAuthGuard)
	@Post('revokeadmin')
	async revokeAdmin(@Body() roomIdUserIdDto: RoomIdUserIdDTO, @Req() req) {
		try {
			const chatRoom = await this.chatService.getChatRoomById(roomIdUserIdDto.roomId);
			if (!chatRoom) {
				throw new NotFoundException(`Chat room with ID ${roomIdUserIdDto.roomId} not found.`);
			}

			// Check if the requesting user is the owner of the chat room
			if (chatRoom.ownerId !== req.user.id) {
				throw new ForbiddenException('Only the owner can revoke admin rights.');
			}

			// Check if the user is actually an admin of the chat room
			if (!chatRoom.adminIds.includes(roomIdUserIdDto.userId)) {
				throw new BadRequestException(`User is not an admin.`);
			}

			// Prevent the owner from revoking their own admin status
			if (chatRoom.ownerId === roomIdUserIdDto.userId) {
				throw new ForbiddenException('You cannot revoke your admin status as owner!');
			}

			chatRoom.adminIds = chatRoom.adminIds.filter((adminId) => adminId !== roomIdUserIdDto.userId);
			await this.chatService.updateChatRoom(chatRoom);
			return { message: `Admin rights revoked from user.` };
		} catch (error) {
			if (error instanceof NotFoundException) {
				throw new HttpException(error.message, HttpStatus.NOT_FOUND);
			} else if (error instanceof ForbiddenException) {
				throw new HttpException(error.message, HttpStatus.FORBIDDEN);
			} else if (error instanceof BadRequestException) {
				throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
			} else {
				// Log the error for internal monitoring
				//console.error('Error in revoking admin:', error);
				throw new InternalServerErrorException(
					'Internal Server Error: Failed to revoke admin rights.',
				);
			}
		}
	}

	//change ChatROom password as owner
	@UseGuards(JwtAuthGuard)
	@Post('changepassword')
	async changePassword(@Req() req, @Body() changePasswordDto: ChangePasswordDto) {
		const userId = req.user.id;
		const { roomId, oldPassword, newPassword } = changePasswordDto;

		//TODO: Write seperate function to get Room credits and exclude pw in getChatRoomById
		const chatRoom = await this.chatService.getChatRoomById(roomId);
		if (!chatRoom) {
			throw new NotFoundException('Chat room not found.');
		}

		// Ensure the requesting user is the owner of the chat room
		if (chatRoom.ownerId !== userId) {
			throw new ForbiddenException('Only the owner can change the password of the chat room.');
		}
		//console.log('old: ', chatRoom.password);
		// Check if the old password matches
		if (chatRoom.password.length > 1) {
			const isMatch = chatRoom.password
				? await bcrypt.compare(oldPassword, chatRoom.password)
				: false;
			if (!isMatch) {
				throw new BadRequestException('Old password does not match.');
			}
		}

		// Update the password or remove it
		if (newPassword !== '') {
			const hashedPassword = await bcrypt.hash(newPassword, 10);
			chatRoom.password = hashedPassword;
		} else {
			chatRoom.password = '';
		}
		await this.chatService.updateChatRoom(chatRoom);
		return { message: 'Password has been updated successfully.' };
	}

	//########################CHatMessages#############################

	//delivers chathistory between two friends, or between chatroom and memebers.
	@UseGuards(JwtAuthGuard)
	@Get('history')
	async getFriendChat(@Req() req, @Query('friendId') friendId: string) {
		try {
			const userId = req.user.id;
			return await this.chatService.findFriendChat(userId, friendId);
		} catch (error) {
			throw new HttpException('Failed to retrieve chat history', HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	//deletes chat between two friends.
	@UseGuards(JwtAuthGuard)
	@HttpCode(HttpStatus.NO_CONTENT)
	@Delete('deletechat')
	async deleteMyChats(@Query('friendId') friendId: string, @Req() req) {
		return await this.chatService.deleteChat(friendId, req.user.id);
	}

	//########################FrienRequests#############################

	// Endpoint to send a friendrequest
	@UseGuards(JwtAuthGuard)
	@Post('friendrequest')
	async create(@Body() createChatDto: FriendRequestDto, @Req() req, @Res() res: Response) {
		//console.log('friendrequest arrived, dto: ', createChatDto);
		if (createChatDto.recipient === req.user.name) {
			res.status(HttpStatus.BAD_REQUEST).json({
				statusCode: HttpStatus.BAD_REQUEST,
				message: 'You cannot send a friend request to yourself.',
			});
		} else {
			try {
				const friendRequest = await this.chatService.create(createChatDto, req.user);
				res.status(HttpStatus.CREATED).json(friendRequest);
			} catch (error) {
				res.status(HttpStatus.BAD_REQUEST).json({
					statusCode: HttpStatus.BAD_REQUEST,
					message: '' + error,
				});
			}
		}
	}

	// Endpoint to get all pending requests for the logged-in user
	@UseGuards(JwtAuthGuard)
	@Get('pendingrequests')
	async findAllPending(@Req() req) {
		return this.chatService.findAllPending(req.user.id);
	}

	@UseGuards(JwtAuthGuard)
	@Get('myrequests')
	async MyRequests(@Req() req) {
		return this.chatService.findMyRequests(req.user.id);
	}

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

	//########################Debug#############################	//TODO: delete before eval

	// Endpoint to get all pending Mutes
	@Get('allmutes')
	async getMutes() {
		return await this.chatService.getAllMutes();
	}

	// Endpoint to get all pending requests
	@Get('allrequests')
	async getAll() {
		return await this.chatService.getAllRequests();
	}

	@Get('allchats')
	async findAllChats() {
		return await this.chatService.findAllChats();
	}

	@Delete('allchats')
	@HttpCode(HttpStatus.NO_CONTENT)
	async deleteAllChats() {
		return await this.chatService.deleteAllChats();
	}
}
