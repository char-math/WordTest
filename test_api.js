const fetch = require('node-fetch').default;

// 测试登录API
async function testLogin() {
    try {
        const response = await fetch('http://localhost:3000/api/users/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username: 'testuser', password: 'password123' })
        });

        const data = await response.json();
        console.log('登录API响应:', data);
        console.log('状态码:', response.status);
    } catch (error) {
        console.error('测试登录API失败:', error);
    }
}

// 运行测试
testLogin();