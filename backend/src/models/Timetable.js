import AppwriteModel from '../utils/AppwriteModel.js';

class TimetableModel extends AppwriteModel {
	constructor() {
		super('timetables');
	}

	async create(data) {
		const payload = { ...data };
		// Appwrite doesn't support nested objects, so we stringify them
		if (payload.timetable && typeof payload.timetable === 'object') payload.timetable = JSON.stringify(payload.timetable);
		if (payload.teacherSchedule && typeof payload.teacherSchedule === 'object') payload.teacherSchedule = JSON.stringify(payload.teacherSchedule);
		if (payload.schoolConfig && typeof payload.schoolConfig === 'object') payload.schoolConfig = JSON.stringify(payload.schoolConfig);
		if (payload.stats && typeof payload.stats === 'object') payload.stats = JSON.stringify(payload.stats);
		if (payload.generationLog && typeof payload.generationLog === 'object') payload.generationLog = JSON.stringify(payload.generationLog);

		return super.create(payload);
	}

	_transform(doc) {
		const data = super._transform(doc);
		if (!data) return null;

		try { if (data.timetable && typeof data.timetable === 'string') data.timetable = JSON.parse(data.timetable); } catch (e) { }
		try { if (data.teacherSchedule && typeof data.teacherSchedule === 'string') data.teacherSchedule = JSON.parse(data.teacherSchedule); } catch (e) { }
		try { if (data.schoolConfig && typeof data.schoolConfig === 'string') data.schoolConfig = JSON.parse(data.schoolConfig); } catch (e) { }
		try { if (data.stats && typeof data.stats === 'string') data.stats = JSON.parse(data.stats); } catch (e) { }
		try { if (data.generationLog && typeof data.generationLog === 'string') data.generationLog = JSON.parse(data.generationLog); } catch (e) { }

		return data;
	}
}

export default new TimetableModel();
