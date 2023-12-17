import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SocketContext } from './context/socketContext';

const listStyles: React.CSSProperties = {
	listStyle: 'none',
	padding: '0',
};

const listItemStyles: React.CSSProperties = {
	marginBottom: '0.5rem',
	cursor: 'pointer',
};

type Friend = {
	id: string;
	name: string;
	status: string;
};

const overlayStyle: React.CSSProperties = {
	position: 'absolute',
	backgroundColor: 'rgba(255, 255, 255, 0.9)',
	padding: '10px',
	borderRadius: '5px',
	boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
	zIndex: 1000,
	minWidth: '150px',
};

const pendingRequestsStyle: React.CSSProperties = {
	backgroundColor: '#007bff',
	color: 'white',
	borderRadius: '50%',
	padding: '0.5em',
	marginLeft: '10px',
	fontSize: '0.8em',
	display: 'inline-block',
	minWidth: '1.5em',
	textAlign: 'center',
	lineHeight: '1.5em',
};

const buttonStyleBase: React.CSSProperties = {
	border: 'none',
	padding: '8px 16px',
	borderRadius: '15px',
	cursor: 'pointer',
	fontWeight: 'bold',
	textTransform: 'uppercase',
	letterSpacing: '0.05em',
	boxShadow: '0 2px 5px rgba(0,0,0,0.2)', // subtle shadow for depth
	margin: '5px',
	transition: 'all 0.3s ease', // smooth transition for hover effects
};

type ChatMessage = {
	id: string;
	senderName: string;
	senderId: string;
	receiverId: string;
	messageType: 'friend_request' | 'system_message';
	content: string;
	status: 'pending' | 'accepted' | 'declined';
};

type SelectedFriend = {
	id: string;
	name: string;
} | null;

export function Chat() {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [pendingRequestCount, setPendingRequestCount] = useState(0);
	const [myRequests, setMyRequests] = useState<ChatMessage[]>([]);
	const [friends, setFriends] = useState<Friend[]>([]);
	const [selectedFriend, setSelectedFriend] = useState<SelectedFriend>(null);
	const [overlayTop, setOverlayTop] = useState(0);
	const [overlayLeft, setOverlayLeft] = useState(0);
	const navigate = useNavigate();
	const socket = useContext(SocketContext);
	useEffect(() => {
		fetchPendingRequests();
		fetchMyRequests();
		fetchFriends();
	}, []);

	const fetchPendingRequests = async () => {
		setIsLoading(true);
		try {
			const response = await fetch('http://localhost:8080/chat/pendingrequests', {
				credentials: 'include',
			});
			if (!response.ok) {
				navigate('/login');
				return;
			}
			const data: ChatMessage[] = await response.json();
			setMessages(data);

			const pendingRequests = data.filter((message) => message.status === 'pending');
			setPendingRequestCount(pendingRequests.length);
		} catch (error) {
			console.error('Error fetching messages:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const fetchMyRequests = async () => {
		setIsLoading(true);
		try {
			const response = await fetch('http://localhost:8080/chat/myrequests', {
				credentials: 'include',
			});
			if (!response.ok) {
				navigate('/login');
				return;
			}
			const data: ChatMessage[] = await response.json();
			setMyRequests(data); // Update state with your own requests
		} catch (error) {
			console.error('Error fetching my requests:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const fetchFriends = async () => {
		setIsLoading(true);
		try {
			// Update the URL with the correct endpoint for fetching friends
			const response = await fetch('http://localhost:8080/user/friends', {
				method: 'GET',
				credentials: 'include', // For session cookies, if required
				headers: {
					'Content-Type': 'application/json',
					// Include other headers if required by your backend
				},
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();
			setFriends(data); // Assuming the API returns an array of friends
		} catch (error) {
			console.error('Error fetching friends:', error);
			// Handle errors as needed, perhaps setting an error state or notifying the user
		} finally {
			setIsLoading(false);
		}
	};

	const handleAction = async (messageId: string, action: string) => {
		try {
			const response = await fetch(`http://localhost:8080/chat/${action}/?messageid=${messageId}`, {
				method: 'POST',
				credentials: 'include',
			});
			if (!response.ok) throw new Error('Failed to update message status');
			fetchPendingRequests();
			fetchFriends();
		} catch (error) {
			console.error('Error updating message:', error);
		}
	};

	type FriendOverlayProps = {
		style: React.CSSProperties;
		selectedFriend: SelectedFriend;
		sendMessage: () => Promise<void>;
		sendInvite: () => Promise<void>;
		closeOverlay: () => void;
	};

	const handleFriendClick = (friend: Friend, event: React.MouseEvent<HTMLLIElement>) => {
		const listItem = event.currentTarget;
		const listItemRect = listItem.getBoundingClientRect();

		// Calculate the position for the overlay
		const desiredOffsetX = -450; // Adjust this value as needed for X axis offset
		const desiredOffsetY = listItem.offsetHeight / 2; // Center it vertically relative to the list item
		setOverlayTop(listItemRect.top + window.scrollY + desiredOffsetY);
		setOverlayLeft(listItemRect.left + listItemRect.width + desiredOffsetX);

		setSelectedFriend({ id: friend.id, name: friend.name });
	};

	// Inside your React component, add:
	const sendMessage = (content) => {
		if (selectedFriend) {
			// Assuming you have a token or credential saved in the current user's state
			// You might have stored it after the user logged in
			socket.emit('sendMessage', {
				receiverId: selectedFriend.id, // The ID of the friend to send the message to
				content: content, // The content of the message
			});
		}
	};

	useEffect(() => {
		socket.on('receiveMessage', (message) => {
			// Handle the received message, e.g., by adding it to the state
			console.log('Message received', message);
		});

		return () => {
			socket.off('receiveMessage');
		};
	}, []);

	// Function to send an invite (placeholder function for now)
	const sendInvite = async () => {
		if (selectedFriend) {
			// Here you would implement the actual logic to send an invite
			console.log(`Send invite to ${selectedFriend.name}`);
			// For now, we'll just reset the selected friend
			setSelectedFriend(null);
		}
	};
	// Overlay component for the selected friend
	const FriendOverlay = ({
		style,
		selectedFriend,
		sendMessage,
		sendInvite,
		closeOverlay,
	}: FriendOverlayProps) => {
		if (!selectedFriend) return null;

		return (
			<div style={{ ...overlayStyle, ...style }}>
				<h3>{selectedFriend.name}</h3>
				<button onClick={sendMessage}>Send Message</button>
				<button onClick={sendInvite}>Invite</button>
				<button onClick={closeOverlay}>Close</button>
			</div>
		);
	};

	const acceptButtonStyle: React.CSSProperties = {
		...buttonStyleBase,
		backgroundColor: '#28a745', // Bootstrap green
	};

	const declineButtonStyle: React.CSSProperties = {
		...buttonStyleBase,
		backgroundColor: '#dc3545', // Bootstrap red
	};

	return (
		<div style={{ position: 'relative' }}>
			<h1>
				Open Requests:{' '}
				{pendingRequestCount > 0 && <span style={pendingRequestsStyle}>{pendingRequestCount}</span>}
			</h1>
			{isLoading ? (
				<p>Loading...</p>
			) : (
				<>
					<div style={{ float: 'left', width: '50%' }}>
						{/* Render messages here */}
						<ul>
							{messages.map((message) => (
								<li key={message.id}>
									{message.messageType === 'friend_request' ? (
										<p>{message.senderName} sent a friend request.</p>
									) : (
										<p>{message.content}</p>
									)}
									{message.messageType === 'friend_request' && (
										<div>
											<button
												style={acceptButtonStyle}
												onClick={() => handleAction(message.id, 'accept')}
											>
												Accept
											</button>
											<button
												style={declineButtonStyle}
												onClick={() => handleAction(message.id, 'decline')}
											>
												Decline
											</button>
										</div>
									)}
								</li>
							))}
						</ul>
						<h2>My Requests:</h2>
						<ul>
							{myRequests.map((request) => (
								<li key={request.id}>
									<p>
										To: {request.receiverId} - {request.content} (Status: {request.status})
									</p>
								</li>
							))}
						</ul>
					</div>
					<div style={{ float: 'right', width: '50%' }}>
						<h2>My Friends:</h2>
						<ul style={listStyles}>
							{friends.map((friend) => (
								<li
									key={friend.id}
									style={listItemStyles}
									onClick={(event) => handleFriendClick(friend, event)}
								>
									{friend.name} - {friend.status}
								</li>
							))}
						</ul>
					</div>
					{selectedFriend && (
						<FriendOverlay
							style={{
								position: 'fixed',
								top: overlayTop,
								left: overlayLeft,
							}}
							selectedFriend={selectedFriend}
							sendMessage={sendMessage}
							sendInvite={sendInvite}
							closeOverlay={() => setSelectedFriend(null)}
						/>
					)}
				</>
			)}
		</div>
	);
}
