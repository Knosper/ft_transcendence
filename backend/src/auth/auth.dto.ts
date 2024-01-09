import { IsNotEmpty, IsString, Length, IsAlphanumeric } from 'class-validator';

export class AuthCallbackDto {
	@IsNotEmpty({ message: 'Code is required.' })
	@IsString({ message: 'Code must be a string.' })
	@Length(10, 100, { message: 'Code must be between 10 and 100 characters.' }) // Beispielwerte für min und max
	@IsAlphanumeric()
	code: string;
}
