const jwt = require('jsonwebtoken');

// 生成token
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    'your-secret-key', // 实际生产环境中应该使用环境变量
    { expiresIn: '24h' }
  );
};

// 验证token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, 'your-secret-key');
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken
};