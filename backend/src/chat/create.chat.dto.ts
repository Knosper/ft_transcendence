import { IsNotEmpty, IsString } from 'class-validator';

export class CreateChatDto {
	@IsString()
	@IsNotEmpty()
	readonly recipient: string;

	@IsString()
	@IsNotEmpty()
	readonly messageType: 'friend_request' | 'system_message';

	@IsString()
	@IsNotEmpty()
	readonly content: string;
}
