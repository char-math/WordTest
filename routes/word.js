const express = require('express');
const Word = require('../models/Word');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// 获取单词列表（支持按阶段和级别筛选）
router.get('/', async (req, res) => {
  try {
    const { stage, level } = req.query;
    const where = {};
    
    if (stage) {
      where.stage = stage;
    }
    
    if (level) {
      where.level = level;
    }
    
    const words = await Word.findAll({ where });
    res.status(200).json({ words });
  } catch (error) {
    console.error('获取单词列表失败:', error);
    res.status(500).json({ message: '获取单词列表失败' });
  }
});

// 获取单个单词详情
router.get('/:id', async (req, res) => {
  try {
    const word = await Word.findByPk(req.params.id);
    if (!word) {
      return res.status(404).json({ message: '单词不存在' });
    }
    res.status(200).json({ word });
  } catch (error) {
    console.error('获取单词详情失败:', error);
    res.status(500).json({ message: '获取单词详情失败' });
  }
});

// 添加单词（管理员）
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { word, meaning, phonetic, stage, level } = req.body;
    
    if (!word || !meaning || !stage || !level) {
      return res.status(400).json({ message: '缺少必要参数' });
    }
    
    const newWord = await Word.create({
      word,
      meaning,
      phonetic,
      stage,
      level
    });
    
    res.status(201).json({ message: '单词添加成功', word: newWord });
  } catch (error) {
    console.error('添加单词失败:', error);
    res.status(500).json({ message: '添加单词失败' });
  }
});

// 更新单词（管理员）
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { word, meaning, phonetic, stage, level } = req.body;
    const existingWord = await Word.findByPk(req.params.id);
    
    if (!existingWord) {
      return res.status(404).json({ message: '单词不存在' });
    }
    
    // 更新单词信息
    await existingWord.update({
      word: word || existingWord.word,
      meaning: meaning || existingWord.meaning,
      phonetic: phonetic || existingWord.phonetic,
      stage: stage || existingWord.stage,
      level: level || existingWord.level
    });
    
    res.status(200).json({ message: '单词更新成功', word: existingWord });
  } catch (error) {
    console.error('更新单词失败:', error);
    res.status(500).json({ message: '更新单词失败' });
  }
});

// 删除单词（管理员）
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const word = await Word.findByPk(req.params.id);
    if (!word) {
      return res.status(404).json({ message: '单词不存在' });
    }
    
    await word.destroy();
    res.status(200).json({ message: '单词删除成功' });
  } catch (error) {
    console.error('删除单词失败:', error);
    res.status(500).json({ message: '删除单词失败' });
  }
});

module.exports = router;