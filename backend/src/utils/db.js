
export async function connectToDatabase() {
	console.log('Using Appwrite Backend (Stateless Connection)');
	// No persistent connection needed for Appwrite SDK
	return Promise.resolve();
}
