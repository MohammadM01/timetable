import AppwriteModel from '../utils/AppwriteModel.js';

class PrincipalModel extends AppwriteModel {
	constructor() {
		super('principals');
	}
}

export default new PrincipalModel();
