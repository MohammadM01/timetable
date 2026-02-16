import AppwriteModel from '../utils/AppwriteModel.js';

class TeacherSubjectModel extends AppwriteModel {
	constructor() {
		super('teacher_subjects');
	}
}

export default new TeacherSubjectModel();
