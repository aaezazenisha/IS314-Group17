const { migrate } = require('../db');

migrate();
console.log('Database migrations completed successfully.');
