const http = require('http');

// 创建新用户
const data = JSON.stringify({
    username: 'newuser',
    password: '123456'
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/users/register',
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
        console.log('Register Status:', res.statusCode);
        console.log('Register Response:', body);
        
        // 注册成功后尝试登录
        if (res.statusCode === 201) {
            const loginData = JSON.stringify({
                username: 'newuser',
                password: '123456'
            });
            
            const loginOptions = {
                hostname: 'localhost',
                port: 3000,
                path: '/api/users/login',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': loginData.length
                }
            };
            
            const loginReq = http.request(loginOptions, (loginRes) => {
                let loginBody = '';
                loginRes.on('data', (chunk) => { loginBody += chunk; });
                loginRes.on('end', () => {
                    console.log('\nLogin Status:', loginRes.statusCode);
                    console.log('Login Response:', loginBody);
                });
            });
            
            loginReq.write(loginData);
            loginReq.end();
        }
    });
});

req.on('error', (e) => {
    console.error('Error:', e.message);
});

req.write(data);
req.end();