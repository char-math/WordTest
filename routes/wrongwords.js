const express = require('express');
const WrongWord = require('../models/WrongWord');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 获取当前用户的错题本
router.get('/', authMiddleware, async (req, res) => {
  try {
    const words = await WrongWord.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json({ words });
  } catch (error) {
    console.error('获取错题本失败:', error);
    res.status(500).json({ message: '获取错题本失败' });
  }
});

// 保存一个错题
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { word, meaning, phonetic, level } = req.body;
    if (!word || !meaning) {
      return res.status(400).json({ message: '缺少必要参数' });
    }
    const [record, created] = await WrongWord.findOrCreate({
      where: { userId: req.user.id, word },
      defaults: {
        meaning,
        phonetic: phonetic || '',
        level: level || '',
        userId: req.user.id
      }
    });
    if (created) {
      res.status(201).json({ message: '错题保存成功', word: record });
    } else {
      res.status(200).json({ message: '错题已存在', word: record });
    }
  } catch (error) {
    console.error('保存错题失败:', error);
    res.status(500).json({ message: '保存错题失败' });
  }
});

// 批量保存错题
router.post('/batch', authMiddleware, async (req, res) => {
  try {
    const { words } = req.body;
    if (!Array.isArray(words)) {
      return res.status(400).json({ message: '参数格式错误' });
    }
    let added = 0;
    for (const w of words) {
      if (!w.word || !w.meaning) continue;
      const [, created] = await WrongWord.findOrCreate({
        where: { userId: req.user.id, word: w.word },
        defaults: {
          meaning: w.meaning,
          phonetic: w.phonetic || '',
          level: w.level || '',
          userId: req.user.id
        }
      });
      if (created) added++;
    }
    res.status(201).json({ message: `成功保存 ${added} 个错题`, added });
  } catch (error) {
    console.error('批量保存错题失败:', error);
    res.status(500).json({ message: '批量保存错题失败' });
  }
});

// 删除一个错题
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const record = await WrongWord.findByPk(req.params.id);
    if (!record) {
      return res.status(404).json({ message: '错题不存在' });
    }
    if (record.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: '权限不足' });
    }
    await record.destroy();
    res.status(200).json({ message: '错题删除成功' });
  } catch (error) {
    console.error('删除错题失败:', error);
    res.status(500).json({ message: '删除错题失败' });
  }
});

// 清空当前用户错题本
router.delete('/', authMiddleware, async (req, res) => {
  try {
    await WrongWord.destroy({ where: { userId: req.user.id } });
    res.status(200).json({ message: '错题本已清空' });
  } catch (error) {
    console.error('清空错题本失败:', error);
    res.status(500).json({ message: '清空错题本失败' });
  }
});

module.exports = router;
