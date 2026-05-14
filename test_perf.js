const http = require('http');

const startTime = Date.now();

const data = JSON.stringify({
    username: 'newuser',
    password: '123456'
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/users/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

console.log('Sending request...');
const req = http.request(options, (res) => {
    const endTime = Date.now();
    console.log(`Response time: ${endTime - startTime}ms`);
    console.log('Status:', res.statusCode);
    let body = '';
    res.on('data', (chunk) => { body += chunk; });
    res.on('end', () => {
        console.log('Response:', body);
    });
});

req.on('error', (e) => {
    console.error('Error:', e.message);
});

req.write(data);
req.end();