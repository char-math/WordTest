const { verifyToken } = require('../utils/jwt');

// 用户认证中间件
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: '未提供认证token' });
  }
  
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({ message: '无效的token' });
  }
  
  // 将用户信息存储在请求对象中
  req.user = {
    id: decoded.userId,
    role: decoded.role
  };
  
  next();
};

// 管理员认证中间件
const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: '权限不足，需要管理员权限' });
  }
};

module.exports = {
  authMiddleware,
  adminMiddleware
};