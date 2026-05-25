import mongoose from 'mongoose';

// Map of collection name to Mongoose model to avoid OverwriteModelError
const modelsMap = {};

class AppwriteModel {
    constructor(collectionName) {
        this.collectionId = collectionName;
        
        // Define a schemaless Mongoose model dynamically for the collection
        // Explicitly define 'id' field and set id: false to avoid conflict with Mongoose's built-in 'id' virtual
        const schema = new mongoose.Schema({
            id: { type: mongoose.Schema.Types.Mixed }
        }, { 
            strict: false, 
            timestamps: true, 
            versionKey: false,
            id: false
        });

        // Use capitalized collection name for Mongoose Model name
        const modelName = collectionName.charAt(0).toUpperCase() + collectionName.slice(1);
        
        if (mongoose.models[modelName]) {
            this.model = mongoose.models[modelName];
        } else {
            this.model = mongoose.model(modelName, schema, collectionName);
        }
        
        modelsMap[collectionName] = this.model;
    }

    async create(data) {
        // If the ID is a number or logical string, preserve it
        const doc = await this.model.create(data);
        return this._transform(doc);
    }

    async insertMany(docs, options = {}) {
        const result = await this.model.insertMany(docs, options);
        return result.map(d => this._transform(d));
    }

    find(filter = {}) {
        const cleanFilter = this._cleanFilter(filter);
        return new ModelQuery(this.model.find(cleanFilter), this);
    }

    findOne(filter = {}) {
        const cleanFilter = this._cleanFilter(filter);
        return new ModelQuery(this.model.findOne(cleanFilter), this);
    }

    async findById(id) {
        if (!id) return null;
        try {
            // Check if ID is a valid ObjectId, otherwise search by string _id or logical ID
            let doc;
            if (mongoose.Types.ObjectId.isValid(id)) {
                doc = await this.model.findById(id);
            }
            if (!doc) {
                doc = await this.model.findOne({ _id: id });
            }
            if (!doc && !isNaN(Number(id))) {
                doc = await this.model.findOne({ id: Number(id) });
            }
            return this._transform(doc);
        } catch (e) {
            return null;
        }
    }

    async findByIdAndUpdate(id, update, options = {}) {
        try {
            const cleanUpdate = this._cleanUpdate(update);
            let doc;
            if (mongoose.Types.ObjectId.isValid(id)) {
                doc = await this.model.findByIdAndUpdate(id, cleanUpdate, { new: true, ...options });
            }
            if (!doc) {
                doc = await this.model.findOneAndUpdate({ _id: id }, cleanUpdate, { new: true, ...options });
            }
            if (!doc && !isNaN(Number(id))) {
                doc = await this.model.findOneAndUpdate({ id: Number(id) }, cleanUpdate, { new: true, ...options });
            }
            return this._transform(doc);
        } catch (e) {
            throw e;
        }
    }

    async findOneAndUpdate(filter, update, options = {}) {
        try {
            const cleanFilter = this._cleanFilter(filter);
            const cleanUpdate = this._cleanUpdate(update);
            
            // Check for upsert option
            const opt = { new: true, ...options };
            const doc = await this.model.findOneAndUpdate(cleanFilter, cleanUpdate, opt);
            return this._transform(doc);
        } catch (e) {
            throw e;
        }
    }

    async updateMany(filter, update, options = {}) {
        const cleanFilter = this._cleanFilter(filter);
        const cleanUpdate = this._cleanUpdate(update);
        const result = await this.model.updateMany(cleanFilter, cleanUpdate, options);
        return {
            matchedCount: result.matchedCount,
            modifiedCount: result.modifiedCount
        };
    }

    async findByIdAndDelete(id) {
        try {
            let doc;
            if (mongoose.Types.ObjectId.isValid(id)) {
                doc = await this.model.findByIdAndDelete(id);
            }
            if (!doc) {
                doc = await this.model.findOneAndDelete({ _id: id });
            }
            if (!doc && !isNaN(Number(id))) {
                doc = await this.model.findOneAndDelete({ id: Number(id) });
            }
            return this._transform(doc);
        } catch (e) {
            return null;
        }
    }

    async deleteMany(filter = {}) {
        const cleanFilter = this._cleanFilter(filter);
        const result = await this.model.deleteMany(cleanFilter);
        return {
            deletedCount: result.deletedCount
        };
    }

    async countDocuments(filter = {}) {
        const cleanFilter = this._cleanFilter(filter);
        return await this.model.countDocuments(cleanFilter);
    }

    _cleanFilter(filter) {
        if (!filter) return {};
        const clean = { ...filter };
        
        // If filtering by ID/teacherId, handle casting to number/string dynamically
        if (clean.teacherId !== undefined && typeof clean.teacherId === 'string' && !isNaN(Number(clean.teacherId))) {
            // Appwrite stored some as numeric, some as string. Let's support both
            const num = Number(clean.teacherId);
            clean.$or = [
                { teacherId: clean.teacherId },
                { teacherId: num }
            ];
            delete clean.teacherId;
        }
        
        if (clean.id !== undefined && typeof clean.id === 'string' && !isNaN(Number(clean.id))) {
            const num = Number(clean.id);
            clean.$or = [
                { id: clean.id },
                { id: num }
            ];
            delete clean.id;
        }

        // Standardize string ObjectId regex queries
        for (const [key, value] of Object.entries(clean)) {
            if (value instanceof RegExp) {
                // Keep regex
            } else if (typeof value === 'object' && value !== null) {
                // Leave complex operators alone
            }
        }
        
        return clean;
    }

    _cleanUpdate(update) {
        if (!update) return {};
        
        // Remove MongoDB operators if they are wrapped by AppwriteModel, 
        // otherwise pass natively to Mongoose
        const clean = { ...update };
        return clean;
    }

    _transform(doc) {
        if (!doc) return null;
        const obj = doc.toObject ? doc.toObject() : doc;
        
        // Appwrite-compatible properties
        const stringId = obj._id ? obj._id.toString() : '';
        return {
            ...obj,
            _id: stringId,
            id: obj.id !== undefined ? obj.id : stringId,
            createdAt: obj.createdAt || obj.updatedAt,
            updatedAt: obj.updatedAt || obj.createdAt
        };
    }
}

class ModelQuery {
    constructor(mongooseQuery, modelInstance) {
        this.query = mongooseQuery;
        this.modelInstance = modelInstance;
        this.populateOptions = null;
    }

    sort(criteria) {
        this.query.sort(criteria);
        return this;
    }

    limit(n) {
        this.query.limit(n);
        return this;
    }

    skip(n) {
        this.query.skip(n);
        return this;
    }

    lean() {
        this.query.lean();
        return this;
    }

    populate(path, select) {
        // Mongoose native populate might not work perfectly with schemaless models.
        // We will capture populate instructions and run them manually in exec().
        this.populateOptions = { path, select };
        return this;
    }

    async exec() {
        let results = await this.query.exec();
        
        let transformed;
        if (Array.isArray(results)) {
            transformed = results.map(r => this.modelInstance._transform(r));
        } else if (results) {
            transformed = this.modelInstance._transform(results);
        } else {
            return null;
        }

        // Manually execute populate if requested, ensuring robust population
        if (this.populateOptions && transformed) {
            const { path, select } = this.populateOptions;
            const isArray = Array.isArray(transformed);
            const docs = isArray ? transformed : [transformed];
            
            let relatedCollection = null;
            if (path === 'subjectId') relatedCollection = 'subjects';
            if (path === 'teacherId') relatedCollection = 'teachers';
            
            if (relatedCollection && modelsMap[relatedCollection]) {
                const targetModel = modelsMap[relatedCollection];
                
                // Get unique related IDs
                const relatedIds = [...new Set(docs.map(d => d[path]).filter(id => id))];
                
                if (relatedIds.length > 0) {
                    // Fetch related docs
                    const relatedDocs = await targetModel.find({
                        $or: [
                            { _id: { $in: relatedIds } },
                            { id: { $in: relatedIds.map(id => isNaN(Number(id)) ? id : Number(id)) } }
                        ]
                    }).lean();
                    
                    const relatedMap = {};
                    relatedDocs.forEach(r => {
                        const strId = r._id ? r._id.toString() : '';
                        relatedMap[strId] = { ...r, _id: strId, id: r.id || strId };
                        if (r.id) {
                            relatedMap[r.id.toString()] = { ...r, _id: strId, id: r.id || strId };
                        }
                    });

                    // Stitch them back
                    docs.forEach(d => {
                        const val = d[path];
                        if (val && relatedMap[val.toString()]) {
                            const rawDoc = relatedMap[val.toString()];
                            if (select) {
                                const selectedFields = select.split(' ');
                                const filtered = { _id: rawDoc._id, id: rawDoc.id };
                                selectedFields.forEach(f => {
                                    if (rawDoc[f] !== undefined) filtered[f] = rawDoc[f];
                                });
                                d[path] = filtered;
                            } else {
                                d[path] = rawDoc;
                            }
                        }
                    });
                }
            }
            
            return isArray ? docs : docs[0];
        }

        return transformed;
    }

    // Make awaitable
    then(resolve, reject) {
        return this.exec().then(resolve, reject);
    }
}

export default AppwriteModel;
export { modelsMap };
