import { databases, DATABASE_ID, ID, Query as AppwriteQuery } from './appwrite.js';

class AppwriteModel {
    constructor(collectionName) {
        this.collectionId = collectionName;
    }

    async create(data) {
        const doc = await databases.createDocument(
            DATABASE_ID,
            this.collectionId,
            ID.unique(),
            data
        );
        return this._transform(doc);
    }

    async insertMany(docs, options = {}) {
        const result = await Promise.all(docs.map(d => this.create(d)));
        return result;
    }

    find(filter = {}) {
        return new ModelQuery(this, filter);
    }

    findOne(filter = {}) {
        const query = new ModelQuery(this, filter);
        query.limit(1);
        return query.exec().then(results => results[0] || null);
    }

    async findById(id) {
        if (!id) return null;
        try {
            const doc = await databases.getDocument(DATABASE_ID, this.collectionId, id);
            return this._transform(doc);
        } catch (e) {
            if (e.code === 404) return null;
            throw e;
        }
    }

    async findByIdAndUpdate(id, update, options = {}) {
        let dataToUpdate = {};

        // Handle $inc (requires fetching current doc first to calculate new value)
        if (update.$inc) {
            try {
                const current = await this.findById(id);
                if (current) {
                    for (const [key, val] of Object.entries(update.$inc)) {
                        dataToUpdate[key] = (current[key] || 0) + val;
                    }
                }
            } catch (e) {
                // If fetch fails, we might proceed or fail. 
                // For now assume if we can't read, we can't increment, so we might error out during update.
            }
        }

        // Handle $set
        if (update.$set) {
            Object.assign(dataToUpdate, update.$set);
        }

        // Handle top-level keys
        for (const key of Object.keys(update)) {
            if (!key.startsWith('$')) {
                dataToUpdate[key] = update[key];
            }
        }

        // Remove $setOnInsert if it snuck in (it shouldn't execute on update)
        delete dataToUpdate.$setOnInsert;

        if (Object.keys(dataToUpdate).length === 0) {
            // Nothing to update, return current doc
            return this.findById(id);
        }

        try {
            const doc = await databases.updateDocument(DATABASE_ID, this.collectionId, id, dataToUpdate);
            return this._transform(doc);
        } catch (e) {
            throw e;
        }
    }

    async findOneAndUpdate(filter, update, options = {}) {
        const doc = await this.findOne(filter);
        if (doc) {
            return this.findByIdAndUpdate(doc._id, update, options);
        } else if (options.upsert) {
            const data = { ...filter };

            if (update.$set) Object.assign(data, update.$set);
            if (update.$setOnInsert) Object.assign(data, update.$setOnInsert);

            if (update.$inc) {
                for (const [key, val] of Object.entries(update.$inc)) {
                    data[key] = (data[key] || 0) + val;
                }
            }

            // Handle top-level keys
            for (const key of Object.keys(update)) {
                if (!key.startsWith('$')) {
                    data[key] = update[key];
                }
            }

            return this.create(data);
        }
        return null;
    }

    async updateMany(filter, update, options = {}) {
        const docs = await this.find(filter).exec();
        const result = { matchedCount: docs.length, modifiedCount: 0 };

        const cleanUpdate = update.$set ? { ...update, ...update.$set } : update;
        delete cleanUpdate.$set;
        delete cleanUpdate.$setOnInsert;

        for (const doc of docs) {
            try {
                await databases.updateDocument(DATABASE_ID, this.collectionId, doc._id, cleanUpdate);
                result.modifiedCount++;
            } catch (e) {
                console.error(`Failed to update doc ${doc._id}:`, e.message);
            }
        }
        return result;
    }

    async findByIdAndDelete(id) {
        const doc = await this.findById(id);
        if (doc) {
            await databases.deleteDocument(DATABASE_ID, this.collectionId, id);
        }
        return doc;
    }

    async deleteMany(filter = {}) {
        const docs = await this.find(filter).exec();
        const result = { deletedCount: 0 };
        for (const doc of docs) {
            try {
                await databases.deleteDocument(DATABASE_ID, this.collectionId, doc._id);
                result.deletedCount++;
            } catch (e) {
                console.error(`Failed to delete doc ${doc._id}:`, e.message);
            }
        }
        return result;
    }

    async countDocuments(filter = {}) {
        const query = new ModelQuery(this, filter);
        const queries = query.buildQueries();
        // limit 0 to get total count? Appwrite listDocuments returns total.
        // Default limit is 25. We want just total. 
        queries.push(AppwriteQuery.limit(1));
        const result = await databases.listDocuments(
            DATABASE_ID,
            this.collectionId,
            queries
        );
        return result.total;
    }

    _transform(doc) {
        if (!doc) return null;
        const { $id, $createdAt, $updatedAt, ...rest } = doc;
        return {
            _id: $id,
            id: rest.id || $id, // Use logical ID if present, else doc ID
            ...rest,
            createdAt: $createdAt,
            updatedAt: $updatedAt
        };
    }
}

class ModelQuery {
    constructor(model, filter) {
        this.model = model;
        this.filter = filter || {};
        this.options = {
            limit: 5000, // Default higher limit for 'find all' behavior
            offset: 0,
            sort: []
        };
    }

    sort(criteria) {
        // Mongoose: { field: 1 (asc) or -1 (desc) }
        this.options.sort = criteria;
        return this;
    }

    limit(n) {
        this.options.limit = n;
        return this;
    }

    skip(n) {
        this.options.offset = n;
        return this;
    }

    lean() {
        return this; // No-op for Appwrite wrapper
    }

    async populate(path, select) {
        // Basic population support (assumes single ID reference)
        // This is tricky. We'll store the instruction and run a second query.
        this.options.populate = { path, select };
        return this;
    }

    async exec() {
        // Build Appwrite queries
        const queries = this.buildQueries();
        const result = await databases.listDocuments(
            DATABASE_ID,
            this.model.collectionId,
            queries
        );

        let docs = result.documents.map(d => this.model._transform(d));

        // Handle populate manually
        if (this.options.populate) {
            const { path, select } = this.options.populate;
            // path is field name holding ID (e.g., 'subjectId')
            // Collection name usually inferred or passed? Mongoose knows from Schema.
            // We don't have Schema.
            // We'll have to guess or hardcode mapping for now.
            let relatedCollection = null;
            if (path === 'subjectId') relatedCollection = 'subjects';
            if (path === 'teacherId') relatedCollection = 'teachers';

            if (relatedCollection) {
                const ids = [...new Set(docs.map(d => d[path]).filter(id => id))];
                if (ids.length > 0) {
                    // Fetch related docs
                    // Max query size is limited. Loop if needed.
                    // For simple implementation, fetch individually or batched.
                    // Can't do "WHERE IN" easily in Appwrite 1.5 without specific queries.
                    // Let's iterate.
                    const relatedDocs = {};
                    for (const id of ids) {
                        try {
                            const related = await databases.getDocument(DATABASE_ID, relatedCollection, id);
                            const transformed = this.model._transform(related);
                            // Handle select
                            if (select) {
                                const selectedFields = select.split(' ');
                                const filtered = { _id: transformed._id };
                                selectedFields.forEach(f => {
                                    if (transformed[f] !== undefined) filtered[f] = transformed[f];
                                });
                                relatedDocs[id] = filtered;
                            } else {
                                relatedDocs[id] = transformed;
                            }
                        } catch (e) { console.log('Populate failed for', id, e.message); }
                    }

                    docs = docs.map(d => {
                        if (d[path] && relatedDocs[d[path]]) {
                            d[path] = relatedDocs[d[path]];
                        }
                        return d;
                    });
                }
            }
        }

        return docs;
    }

    // Make awaitable
    then(resolve, reject) {
        return this.exec().then(resolve, reject);
    }

    buildQueries() {
        const q = [];
        // Filter mapping
        for (const [key, value] of Object.entries(this.filter)) {
            if (value instanceof RegExp) {
                // Naive regex support: strip ^ and $ and use search (fuzzy) or equal (exact)
                const str = value.toString(); // "/^name$/i"
                const clean = str.replace(/^\/\^/, '').replace(/\$\/i$/, '').replace(/\/i$/, '').replace(/^\//, '');

                // If it was an exact match regex (^...$), use equal
                if (str.startsWith('/^') && str.endsWith('$/i')) {
                    q.push(AppwriteQuery.equal(key, clean));
                } else {
                    q.push(AppwriteQuery.search(key, clean));
                }
            } else if (typeof value === 'object' && value !== null) {
                if (value.$in) q.push(AppwriteQuery.equal(key, value.$in));
                if (value.$ne) q.push(AppwriteQuery.notEqual(key, value.$ne));
                if (value.$gt) q.push(AppwriteQuery.greaterThan(key, value.$gt));
                if (value.$gte) q.push(AppwriteQuery.greaterThanEqual(key, value.$gte));
                if (value.$lt) q.push(AppwriteQuery.lessThan(key, value.$lt));
                if (value.$lte) q.push(AppwriteQuery.lessThanEqual(key, value.$lte));
            } else {
                q.push(AppwriteQuery.equal(key, value));
            }
        }

        if (this.options.limit) q.push(AppwriteQuery.limit(this.options.limit));
        if (this.options.offset) q.push(AppwriteQuery.offset(this.options.offset));

        if (this.options.sort) {
            // sort can be { field: 1 } or { field: -1 }
            const sorts = this.options.sort;
            for (const [key, dir] of Object.entries(sorts)) {
                // Appwrite uses orderAsc/orderDesc
                if (dir === 1 || dir === 'asc') q.push(AppwriteQuery.orderAsc(key));
                if (dir === -1 || dir === 'desc') q.push(AppwriteQuery.orderDesc(key));
            }
        }

        return q;
    }
}

export default AppwriteModel;
