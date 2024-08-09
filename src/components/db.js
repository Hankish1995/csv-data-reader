import Dexie from 'dexie';

// Define your IndexedDB schema
const db = new Dexie('MyDatabase');
db.version(1).stores({
    data: '++id, csvData'  // Use `id` as the primary key and `csvData` to store the CSV data
});

export default db;
