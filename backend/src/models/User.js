import AppwriteModel from '../utils/AppwriteModel.js';

class UserModel extends AppwriteModel {
	constructor() {
		super('users');
	}
}

export default new UserModel();
