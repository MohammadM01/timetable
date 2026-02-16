import AppwriteModel from '../utils/AppwriteModel.js';

class ClassModel extends AppwriteModel {
	constructor() {
		super('classes');
	}
}

export default new ClassModel();
