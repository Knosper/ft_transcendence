interface ProfileData {
	name: string;
	nickname: string;
	email: string;
	imageUrl: string;
	image: string;
	// ... any other fields that are included in the profile data
}

function FriendProfile({ profile }: { profile: ProfileData }) {
	if (!profile) return null;

	// Default image if imageUrl is not provided
	const imageSrc = profile.image || profile.imageUrl;
	console.log('Imagesrc = ', imageSrc);
	return (
		<div
			style={{ border: '1px solid #ccc', padding: '10px', marginTop: '20px' }}
		>
			{imageSrc && (
				<img
					src={imageSrc}
					alt={`${profile.name}'s profile`}
					style={{ width: '150px', height: '150px' }}
				/>
			)}
			<h2>{profile.name}</h2>
			<p>Nickname: {profile.nickname || 'N/A'}</p>
			<p>Email: {profile.email}</p>
			{/* Render additional fields as needed */}
		</div>
	);
}

export default FriendProfile;