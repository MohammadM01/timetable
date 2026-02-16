import AppwriteModel from '../utils/AppwriteModel.js';

class SubjectModel extends AppwriteModel {
	constructor() {
		super('subjects');
	}
}

export default new SubjectModel();
