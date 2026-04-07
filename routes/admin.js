const express = require('express');
const User = require('../models/User');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// 获取所有用户（管理员）
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'role', 'status', 'createdAt']
    });
    res.status(200).json({ users });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({ message: '获取用户列表失败' });
  }
});

// 更新用户状态（管理员）
router.put('/users/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 不能修改管理员账号状态
    if (user.role === 'admin' && req.user.id !== user.id) {
      return res.status(403).json({ message: '不能修改其他管理员账号状态' });
    }
    
    await user.update({ status });
    res.status(200).json({ message: '用户状态更新成功', user });
  } catch (error) {
    console.error('更新用户状态失败:', error);
    res.status(500).json({ message: '更新用户状态失败' });
  }
});

// 初始化管理员账号
router.post('/init-admin', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 检查是否已存在管理员账号
    const existingAdmin = await User.findOne({ where: { role: 'admin' } });
    if (existingAdmin) {
      return res.status(400).json({ message: '管理员账号已存在' });
    }
    
    // 加密密码
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 创建管理员账号
    const admin = await User.create({
      username,
      password: hashedPassword,
      role: 'admin'
    });
    
    res.status(201).json({ message: '管理员账号初始化成功', admin });
  } catch (error) {
    console.error('初始化管理员账号失败:', error);
    res.status(500).json({ message: '初始化管理员账号失败' });
  }
});

module.exports = router;