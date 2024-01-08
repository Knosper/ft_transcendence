//game.service.ts
import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Game } from './game.entity';
import { Brackets, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/user.entity';
import { EventsGateway } from 'src/events/events.gateway';

@Injectable()
export class GameService {
	constructor(
		@InjectRepository(Game)
		private gameRepository: Repository<Game>,
		private eventsGateway: EventsGateway,
	) {}

	async findExistingGame(playerOneId: string, playerTwoId: string): Promise<Game | undefined> {
		return await this.gameRepository
			.createQueryBuilder('game')
			.leftJoinAndSelect('game.playerOne', 'playerOne')
			.leftJoinAndSelect('game.playerTwo', 'playerTwo')
			.where(
				new Brackets((qb) => {
					qb.where('playerOne.id = :playerOneId AND playerTwo.id = :playerTwoId', {
						playerOneId,
						playerTwoId,
					}).orWhere('playerOne.id = :playerTwoId AND playerTwo.id = :playerOneId', {
						playerOneId: playerTwoId,
						playerTwoId: playerOneId,
					});
				}),
			)
			.getOne();
	}

	async createNewGame(playerOne: User, playerTwo: User): Promise<Game> {
		try {
			const existingGame = await this.findExistingGame(playerOne.id, playerTwo.id);
			await console.log('Existing Game: ', existingGame);
			if (!existingGame) {
				const game = this.gameRepository.create({
					playerOne: playerOne,
					playerTwo: playerTwo,
					scorePlayerOne: 0,
					scorePlayerTwo: 0,
					startTime: new Date(),
					winnerId: null,
					accepted: false,
				});

				await this.gameRepository.save(game);
				console.log('game.accepted: ', game.accepted);
				return game;
			} else {
				//TODO join the pending game enemy is waiting for you!

				if (!existingGame.accepted) {
					existingGame.accepted = true;
					await this.gameRepository.save(existingGame);
					console.log('SEND EMIT TO WAITING USER:::', playerTwo.name);

					console.log('ID check:', existingGame.playerOne.id);
					// Emit an event to the specific user letting them know the game is ready
					this.eventsGateway.server.to(`user_${existingGame.playerOne.id}`).emit('gameReady', {
						gameId: existingGame.id,
						message: 'The other player has joined. The game is ready to start.',
					});
				}
				return existingGame;
			}
		} catch (error) {
			console.error(`Failed to create game: ${error.message}`, error.stack);
			throw new InternalServerErrorException(`Failed to create game: ${error.message}`);
		}
	}

	async getAllGames() {
		return await this.gameRepository.find({});
	}

	async getMyGame(userId: string): Promise<Game | undefined> {
		return await this.gameRepository.findOne({
			where: [{ playerOne: { id: userId } }, { playerTwo: { id: userId } }],
			order: {
				startTime: 'DESC',
			},
			relations: ['playerOne', 'playerTwo'],
		});
	}

	async getEnemyGame(enemyName: string): Promise<Game | undefined> {
		return await this.gameRepository.findOne({
			where: [{ playerOne: { name: enemyName } }, { playerTwo: { name: enemyName } }],
			order: {
				startTime: 'DESC',
			},
			relations: ['playerOne', 'playerTwo'],
		});
	}

	async deleteAllGames() {
		const games = await this.gameRepository.find({});
		await this.gameRepository.remove(games);
	}
}
