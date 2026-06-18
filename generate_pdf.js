const PDFDocument = require('pdfkit');
const fs = require('fs');

const doc = new PDFDocument({ size: 'A4', margin: 50 });

const outputStream = fs.createWriteStream('项目理解文档.pdf');
doc.pipe(outputStream);

doc.registerFont('Helvetica');

function addTitle(text, level = 1) {
    if (level === 1) {
        doc.fontSize(24).font('Helvetica-Bold').fillColor('#1a1a2e');
        doc.text(text, { align: 'center' });
        doc.moveDown(0.5);
    } else if (level === 2) {
        doc.fontSize(18).font('Helvetica-Bold').fillColor('#16213e');
        doc.text(text);
        doc.moveDown(0.3);
    } else {
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#0f3460');
        doc.text(text);
        doc.moveDown(0.2);
    }
    doc.moveDown(0.3);
}

function addParagraph(text) {
    doc.fontSize(11).font('Helvetica').fillColor('#333');
    doc.text(text, { lineGap: 4 });
    doc.moveDown(0.5);
}

function addListItem(text, indent = 0) {
    doc.fontSize(11).font('Helvetica').fillColor('#333');
    doc.text('• ' + text, 50 + indent * 20, doc.y, { continued: false });
    doc.moveDown(0.3);
}

function addCodeBlock(code) {
    doc.fontSize(9).font('Courier').fillColor('#2d3436');
    doc.fillColor('#f8f9fa');
    doc.rect(40, doc.y - 5, 470, code.split('\n').length * 12 + 10).fill();
    doc.fillColor('#2d3436');
    doc.text(code, 50, doc.y - 5, { lineGap: 2 });
    doc.moveDown(0.5);
}

function addSeparator() {
    doc.moveDown(0.5);
    doc.strokeColor('#ddd').lineWidth(0.5).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);
}

doc.fillColor('#666').fontSize(10).text('项目理解文档', 50, 50, { align: 'right' });
doc.moveDown(2);

addTitle('词汇量测评工具');
addTitle('项目理解文档', 2);
addParagraph('一个基于 Node.js + Express + SQLite 的在线词汇量测评系统');

addSeparator();

addTitle('一、项目概述', 2);
addParagraph('本项目是一个面向学生的在线词汇量测评工具，用户可以通过回答单词释义选择题来评估自己的词汇水平。系统支持小学、初中、高中三个难度级别，并提供 AI 对战和用户匹配 PK 功能，增加学习的趣味性。');

addTitle('1.1 项目目标', 3);
addListItem('提供一种有趣、高效的词汇量评估方式');
addListItem('通过 PK 对战增加学习动力和趣味性');
addListItem('记录用户学习轨迹，帮助了解自身进步');
addListItem('支持错题本功能，巩固薄弱知识点');

addTitle('1.2 目标用户', 3);
addListItem('在校学生（小学、初中、高中）');
addListItem('希望扩充英语词汇量的学习者');
addListItem('需要系统评估自身词汇水平的用户');

addSeparator();

addTitle('二、技术架构', 2);

addTitle('2.1 技术栈', 3);

addParagraph('【前端技术】');
addListItem('HTML5 + CSS3 + JavaScript (ES6+)');
addListItem('Bootstrap 5 UI 框架');
addListItem('响应式设计，支持移动端');

addParagraph('【后端技术】');
addListItem('Node.js 运行时');
addListItem('Express.js Web 框架');
addListItem('SQLite 数据库 (通过 Sequelize ORM)');
addListItem('JWT (JSON Web Token) 身份认证');
addListItem('bcrypt 密码加密');

addParagraph('【开发工具】');
addListItem('VS Code 代码编辑器');
addListItem('Git 版本控制');
addListItem('Postman API 测试');

addTitle('2.2 系统架构图', 3);
addParagraph('系统采用前后端分离架构：');
addParagraph('用户浏览器 ←→ HTTP/REST API ←→ Express.js 服务器 ←→ SQLite 数据库');

addTitle('2.3 项目目录结构', 3);
addParagraph('vocabulary-test/');
addListItem('├── app.js              # 应用入口文件');
addListItem('├── vocabulary_test.html # 前端主页面');
addListItem('├── embedded_word_data.js # 词库数据');
addListItem('├── config/             # 配置文件');
addListItem('│   └── database.js    # 数据库配置');
addListItem('├── models/            # 数据模型');
addListItem('│   ├── User.js        # 用户模型');
addListItem('│   ├── Word.js        # 单词模型');
addListItem('│   └── TestRecord.js  # 测试记录模型');
addListItem('├── routes/            # 路由文件');
addListItem('│   ├── user.js        # 用户相关接口');
addListItem('│   ├── word.js        # 单词相关接口');
addListItem('│   ├── test.js        # 测试相关接口');
addListItem('│   ├── admin.js       # 管理员接口');
addListItem('│   └── pk.js          # PK对战接口');
addListItem('├── middleware/         # 中间件');
addListItem('│   └── auth.js        # 认证中间件');
addListItem('├── utils/             # 工具函数');
addListItem('│   └── jwt.js         # JWT工具');
addListItem('└── data/              # 词库数据文件');

addSeparator();

addTitle('三、核心功能模块', 2);

addTitle('3.1 用户认证系统', 3);
addParagraph('实现完整的用户注册、登录、登出功能：');
addListItem('用户注册：支持用户名和密码注册，密码使用 bcrypt 加密存储');
addListItem('用户登录：验证凭证后返回 JWT Token');
addListItem('Token 管理：前端存储在 localStorage，请求时自动携带');
addListItem('自动登录：页面刷新时自动恢复登录状态');
addListItem('权限区分：普通用户和管理员角色');

addTitle('3.2 词汇量测评', 3);
addParagraph('核心测评功能，包含以下特点：');
addListItem('三级词库：小学(505词)、初中(1110词)、高中(1866词)');
addListItem('智能出题：根据用户当前水平动态调整题目难度');
addListItem('多选题形式：每题6个选项(1正确+4干扰+不认识)');
addListItem('实时统计：正确数、错误数、正确率');
addListItem('结束条件：完成50题 / 连续答错4题 / 累计答错7题');
addListItem('词汇量评估：基于正确数计算估算词汇量');

addTitle('3.3 AI 对战模式', 3);
addParagraph('与 AI 对手实时对战：');
addListItem('三档难度：简单、中等、困难');
addListItem('AI 模拟：根据难度呈现不同答题速度和正确率');
addListItem('抢答机制：先答对者得分');
addListItem('限时答题：每题30秒倒计时');
addListItem('实时比分显示');

addTitle('3.4 用户匹配 PK', 3);
addParagraph('真人对战功能：');
addListItem('房间匹配：用户可创建或加入房间');
addListItem('实时同步：题目和时间同步显示');
addListItem('抢答得分机制');
addListItem('胜负判定：答题数和正确率综合评估');

addTitle('3.5 错题本系统', 3);
addParagraph('错题收集与复习：');
addListItem('自动收集：测评过程中答错的单词自动加入错题本');
addListItem('错题复习：支持选词填空模式复习');
addListItem('移除机制：复习正确后自动从错题本移除');
addListItem('本地存储：使用 localStorage 持久化');

addTitle('3.6 个人中心', 3);
addParagraph('用户功能聚合：');
addListItem('个人信息：用户名、角色、等级');
addListItem('测评统计：测评次数、最高词汇量、平均正确率');
addListItem('历史记录：查看历次测评结果');
addListItem('水平变化：词汇量变化趋势图表');
addListItem('错题本管理：查看和复习错题');

addTitle('3.7 管理员后台', 3);
addParagraph('系统管理功能：');
addListItem('用户管理：查看用户列表、禁用/启用账号');
addListItem('词库管理：增删改查单词数据');
addListItem('测试记录：查看所有用户的测评记录');
addListItem('数据统计：系统使用数据统计');

addSeparator();

addTitle('四、数据库设计', 2);

addTitle('4.1 用户表 (Users)', 3);
addParagraph('字段说明：');
addListItem('id: 主键，自增');
addListItem('username: 用户名，唯一');
addListItem('password: 密码(bcrypt加密)');
addListItem('role: 角色(user/admin)');
addListItem('createdAt: 创建时间');
addListItem('updatedAt: 更新时间');

addTitle('4.2 单词表 (Words)', 3);
addParagraph('字段说明：');
addListItem('id: 主键，自增');
addListItem('word: 单词');
addListItem('meaning: 中文释义');
addListItem('level: 难度级别(primary/middle/high)');
addListItem('createdAt: 创建时间');

addTitle('4.3 测试记录表 (TestRecords)', 3);
addParagraph('字段说明：');
addListItem('id: 主键，自增');
addListItem('userId: 外键，关联用户');
addListItem('score: 得分');
addListItem('vocabulary: 估算词汇量');
addListItem('accuracy: 正确率');
addListItem('questionCount: 答题数');
addListItem('createdAt: 创建时间');

addSeparator();

addTitle('五、API 接口文档', 2);

addTitle('5.1 用户接口', 3);
addParagraph('POST /api/users/register - 用户注册');
addParagraph('POST /api/users/login - 用户登录');
addParagraph('GET /api/users/profile - 获取用户信息(需认证)');

addTitle('5.2 单词接口', 3);
addParagraph('GET /api/words - 获取单词列表');
addParagraph('POST /api/words - 添加单词(管理员)');
addParagraph('PUT /api/words/:id - 更新单词(管理员)');
addParagraph('DELETE /api/words/:id - 删除单词(管理员)');

addTitle('5.3 测试接口', 3);
addParagraph('POST /api/tests/submit - 提交测试结果');
addParagraph('GET /api/tests/history - 获取历史记录(需认证)');

addTitle('5.4 管理员接口', 3);
addParagraph('GET /api/admin/users - 用户列表');
addParagraph('PUT /api/admin/users/:id - 更新用户状态');
addParagraph('GET /api/admin/words - 词库管理');
addParagraph('GET /api/admin/tests - 测试记录');

addTitle('5.5 PK 接口', 3);
addParagraph('POST /api/pk/create - 创建PK房间');
addParagraph('POST /api/pk/join - 加入PK房间');
addParagraph('GET /api/pk/status/:id - 获取PK状态');
addParagraph('POST /api/pk/answer - 提交答案');

addSeparator();

addTitle('六、安全设计', 2);

addTitle('6.1 密码安全', 3);
addListItem('使用 bcrypt 算法加密存储密码');
addListItem('加盐处理，防止彩虹表攻击');
addListItem('登录失败次数限制');

addTitle('6.2 身份认证', 3);
addListItem('JWT Token 过期时间：7天');
addListItem('Token 存储在 localStorage');
addListItem('每次请求自动携带 Authorization 头');
addListItem('Token 过期自动跳转登录页');

addTitle('6.3 权限控制', 3);
addListItem('管理员接口需要 admin 角色');
addListItem('用户接口需要有效 Token');
addListItem('防止越权访问其他用户数据');

addSeparator();

addTitle('七、部署说明', 2);

addTitle('7.1 环境要求', 3);
addListItem('Node.js >= 14.x');
addListItem('npm >= 6.x');
addListItem('现代浏览器(Chrome、Firefox、Edge、Safari)');

addTitle('7.2 安装步骤', 3);
addParagraph('1. 克隆项目');
addCodeBlock('git clone https://gitee.com/wang-yuchangabc0/word-test.git\ncd word-test');

addParagraph('2. 安装依赖');
addCodeBlock('npm install');

addParagraph('3. 启动服务');
addCodeBlock('npm start');

addParagraph('4. 访问应用');
addCodeBlock('浏览器打开 http://localhost:3001');

addTitle('7.3 默认账号', 3);
addListItem('管理员：admin / admin123');
addListItem('普通用户：需自行注册');

addSeparator();

addTitle('八、扩展功能建议', 2);

addTitle('8.1 短期优化', 3);
addListItem('添加邮件注册验证');
addListItem('实现用户头像上传');
addListItem('增加更多词汇级别和专业领域');
addListItem('优化移动端体验');

addTitle('8.2 中期规划', 3);
addListItem('WebSocket 实时通信(用于PK对战)');
addListItem('排行榜系统');
addListItem('每日打卡/学习计划功能');
addListItem('多语言支持');

addTitle('8.3 长期愿景', 3);
addListItem('AI 智能推荐学习路径');
addListItem('语音朗读和听写功能');
addListItem('社区互动功能');
addListItem('移动端 App');
addListItem('数据分析仪表盘');

addSeparator();

addTitle('九、常见问题', 2);

addTitle('Q1: 如何重置管理员密码？', 3);
addParagraph('A: 可以通过 Node.js 脚本直接修改数据库中的密码字段，使用 bcrypt 重新加密新密码。');

addTitle('Q2: 如何增加新的单词到词库？', 3);
addParagraph('A: 登录管理员后台，在"词库管理"页面添加新单词，或通过 API 接口批量导入。');

addTitle('Q3: 支持哪些浏览器？', 3);
addParagraph('A: 支持 Chrome、Firefox、Edge、Safari 的最新两个版本。');

addTitle('Q4: 数据存在哪里？', 3);
addParagraph('A: 所有数据存储在 SQLite 数据库文件 database.sqlite 中，可直接备份该文件。');

doc.end();

outputStream.on('finish', () => {
    console.log('PDF文档已生成: 项目理解文档.pdf');
});
