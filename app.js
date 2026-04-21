const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// 导入路由
const userRoutes = require('./routes/user');
const wordRoutes = require('./routes/word');
const testRoutes = require('./routes/test');
const adminRoutes = require('./routes/admin');

// 导入数据库连接
const db = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 静态文件
app.use(express.static('public'));

// 路由
app.use('/api/users', userRoutes);
app.use('/api/words', wordRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/admin', adminRoutes);

// 根路径
app.get('/', (req, res) => {
    res.send('词汇量测评工具后端API');
});

// 数据库连接
db.sync().then(() => {
    console.log('数据库连接成功');
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`服务器运行在 http://0.0.0.0:${PORT}`);
    });
}).catch(err => {
    console.error('数据库连接失败:', err);
});

module.exports = app;