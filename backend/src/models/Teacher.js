import AppwriteModel from '../utils/AppwriteModel.js';

class TeacherModel extends AppwriteModel {
	constructor() {
		super('teachers');
	}
}

export default new TeacherModel();
