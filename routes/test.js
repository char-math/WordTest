const express = require('express');
const TestRecord = require('../models/TestRecord');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// 保存测评记录
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { score, vocabulary, level } = req.body;
    
    if (!score || !vocabulary || !level) {
      return res.status(400).json({ message: '缺少必要参数' });
    }
    
    const testRecord = await TestRecord.create({
      userId: req.user.id,
      score,
      vocabulary,
      level
    });
    
    res.status(201).json({ message: '测评记录保存成功', record: testRecord });
  } catch (error) {
    console.error('保存测评记录失败:', error);
    res.status(500).json({ message: '保存测评记录失败' });
  }
});

// 获取用户的历史测评记录
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const records = await TestRecord.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    
    res.status(200).json({ records });
  } catch (error) {
    console.error('获取历史测评记录失败:', error);
    res.status(500).json({ message: '获取历史测评记录失败' });
  }
});

// 获取所有测评记录（管理员）
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const records = await TestRecord.findAll({
      order: [['createdAt', 'DESC']]
    });
    
    res.status(200).json({ records });
  } catch (error) {
    console.error('获取所有测评记录失败:', error);
    res.status(500).json({ message: '获取所有测评记录失败' });
  }
});

// 获取单个测评记录详情
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const record = await TestRecord.findByPk(req.params.id);
    
    if (!record) {
      return res.status(404).json({ message: '测评记录不存在' });
    }
    
    // 检查权限（只能查看自己的记录或管理员）
    if (record.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: '权限不足' });
    }
    
    res.status(200).json({ record });
  } catch (error) {
    console.error('获取测评记录详情失败:', error);
    res.status(500).json({ message: '获取测评记录详情失败' });
  }
});

module.exports = router;