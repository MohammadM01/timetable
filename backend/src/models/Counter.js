import AppwriteModel from '../utils/AppwriteModel.js';

class CounterModel extends AppwriteModel {
	constructor() {
		super('counters');
	}
}

export default new CounterModel();
