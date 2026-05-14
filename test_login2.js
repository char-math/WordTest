const http = require('http');

// 测试多个用户
const testUsers = [
    { username: 'testuser', password: '123456' },
    { username: 'admin', password: 'admin' },
    { username: 'admin', password: '123456' }
];

async function testLogin(user) {
    return new Promise((resolve) => {
        const data = JSON.stringify(user);
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

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => {
                resolve({ user, status: res.statusCode, response: body });
            });
        });

        req.on('error', (e) => {
            resolve({ user, status: -1, response: e.message });
        });

        req.write(data);
        req.end();
    });
}

// 测试所有用户
async function runTests() {
    console.log('Testing login for all users...\n');
    for (const user of testUsers) {
        const result = await testLogin(user);
        console.log(`User: ${user.username}`);
        console.log(`Password: ${user.password}`);
        console.log(`Status: ${result.status}`);
        console.log(`Response: ${result.response}`);
        console.log('-------------------');
    }
}

runTests();