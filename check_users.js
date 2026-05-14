const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.sqlite');

db.all('SELECT * FROM Users', (err, rows) => {
    if (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
    console.log('Users in database:');
    console.log('------------------');
    rows.forEach((row, index) => {
        console.log(`${index + 1}. ID: ${row.id}, Username: ${row.username}, Role: ${row.role}, Status: ${row.status}`);
    });
    if (rows.length === 0) {
        console.log('No users found!');
    }
    db.close();
});