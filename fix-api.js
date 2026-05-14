const fs = require('fs');
const path = require('path');

// 读取文件
const filePath = path.join(__dirname, 'vocabulary_test.html');
let content = fs.readFileSync(filePath, 'utf8');

// 替换所有的192.168.1.115为localhost
content = content.replace(/192\.168\.1\.115/g, 'localhost');

// 写回文件
fs.writeFileSync(filePath, content, 'utf8');
console.log('API地址已成功更新');
