// Play.tsx
import { useState, useEffect, useContext } from 'react';
import { SocketContext } from './context/socketContext';
import { useNavigate } from 'react-router-dom';

export function Play() {
	const [inQueue, setInQueue] = useState(localStorage.getItem('inQueue') === 'true');
	const [queueTime, setQueueTime] = useState(
		parseInt(localStorage.getItem('queueTime') || '0', 10),
	);
	const socket = useContext(SocketContext);
	const [currentMatch, setCurrentMatch] = useState<MatchDetails | null>(null);
	const navigate = useNavigate();

	interface MatchDetails {
		id: string;
		playerOne: {
			name: string;
		};
		playerTwo: {
			name: string;
		};
	}

	useEffect(() => {
		const handleMatchProposal = (matchDetails: MatchDetails) => {
			console.log('Match proposal received:', matchDetails);
			setCurrentMatch(matchDetails);
			// TODO: Implement a modal or some UI element to show the match proposal
		};

		socket.on('matchProposal', handleMatchProposal);
		return () => {
			socket.off('matchProposal', handleMatchProposal);
		};
	}, [socket]);

	// Funktionen, um auf das Match zu antworten
	const acceptMatch = () => {
		if (currentMatch) {
			console.log('Match accepted:', currentMatch.id);
			socket.emit('respondToMatch', { matchId: currentMatch.id, accept: true });
			setCurrentMatch(null);
			// setInQueue(false); // Status sofort aktualisieren
			// localStorage.setItem('inQueue', 'false');
			// setQueueTime(0); // Queue-Zeitzähler zurücksetzen
			// localStorage.setItem('queueTime', '0');
		}
	};

	const rejectMatch = () => {
		if (currentMatch) {
			socket.emit('respondToMatch', { matchId: currentMatch.id, accept: false });
			setCurrentMatch(null);
			setInQueue(false); // Status sofort aktualisieren
			localStorage.setItem('inQueue', 'false');
			setQueueTime(0); // Queue-Zeitzähler zurücksetzen
			localStorage.setItem('queueTime', '0');
		}
	};

	useEffect(() => {
		const handleMatchStart = (data: MatchDetails) => {
			console.log('Match start:', data.id);
			// Navigieren Sie den Benutzer zum Spiel (je nach Implementierung)
			navigate('/spiel');
		};

		const handleRemainInQueue = () => {
			console.log('Remain in queue');
			setInQueue(true);
			localStorage.setItem('inQueue', 'true');
		};

		socket.on('matchStart', handleMatchStart);
		socket.on('remainInQueue', handleRemainInQueue);

		return () => {
			socket.off('matchStart', handleMatchStart);
			socket.off('remainInQueue', handleRemainInQueue);
		};
	}, [socket]);

	useEffect(() => {
		const checkInitialQueueStatus = async () => {
			const userId = localStorage.getItem('userId');
			if (!userId) return;

			try {
				const response = await fetch(`/matchmaking/user-status/${userId}`, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
					},
					credentials: 'include',
				});

				if (!response.ok) {
					throw new Error('Fehler beim Abrufen des Queue-Status');
				}

				const { inQueue, matchStatus } = await response.json();
				if (inQueue) {
					setInQueue(true);
					// Hier setzen wir nicht mehr die Zeit neu, da wir sie aus dem localStorage holen
				} else if (matchStatus.inMatch) {
					// Logik für den Fall, dass bereits ein Match gefunden wurde
					console.log('Match gefunden:', matchStatus.matchDetails);
				}
			} catch (error) {
				console.error('Fehler:', error);
			}
		};

		checkInitialQueueStatus();
	}, []);

	useEffect(() => {
		let interval: NodeJS.Timeout | null = null;
		if (inQueue) {
			interval = setInterval(() => {
				setQueueTime((prevTime) => {
					const newTime = prevTime + 1;
					localStorage.setItem('queueTime', newTime.toString());
					return newTime;
				});
			}, 1000);
		} else {
			clearInterval(interval);
			localStorage.setItem('queueTime', '0');
		}

		return () => clearInterval(interval);
	}, [inQueue]);

	useEffect(() => {
		const intervalId = setInterval(async () => {
			if (inQueue) {
				const userId = localStorage.getItem('userId');
				if (userId) {
					// Überprüfen, ob ein Match gefunden wurde
					const response = await fetch(`/matchmaking/match/${userId}`, {
						method: 'GET',
						headers: {
							'Content-Type': 'application/json',
						},
						credentials: 'include',
					});
					const matchStatus = await response.json();
					if (matchStatus.inMatch) {
						console.log('Match gefunden:', matchStatus.matchDetails);
						clearInterval(intervalId);
						// Weitere Aktionen, wenn ein Match gefunden wurde
					}
				}
			}
		}, 5000); // Überprüfen alle 5 Sekunden

		return () => clearInterval(intervalId);
	}, [inQueue]);

	const joinQueue = async () => {
		console.log('Joining queue...');
		setInQueue(true);
		localStorage.setItem('inQueue', 'true');
		setQueueTime(0);
		localStorage.setItem('queueTime', '0');
		socket.emit('joinQueue');
	};

	const leaveQueue = async () => {
		console.log('Leaving queue...');
		setInQueue(false);
		localStorage.removeItem('inQueue');
		localStorage.setItem('queueTime', '0');
		socket.emit('leaveQueue');
	};

	useEffect(() => {
		socket.on('leftQueue', () => {
			setInQueue(false);
			setQueueTime(0);
		});

		return () => {
			socket.off('leftQueue');
		};
	}, [socket]);

	return (
		<div>
			<h1>Play</h1>
			{!inQueue && <button onClick={joinQueue}>Join Matchmaking Queue</button>}
			{inQueue && <button onClick={leaveQueue}>Leave Matchmaking Queue</button>}
			{inQueue && <p>Time in Queue: {queueTime} seconds</p>}
			{currentMatch && (
				<div>
					<p>Match vorgeschlagen gegen {currentMatch.playerTwo.name}</p>
					<button onClick={acceptMatch}>Annehmen</button>
					<button onClick={rejectMatch}>Ablehnen</button>
				</div>
			)}
		</div>
	);
}
