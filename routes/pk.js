const express = require('express');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 存储房间状态（内存中，重启后会丢失）
let pkRooms = [];

// 导入词库数据
const wordData = require('../embedded_word_data');

// 生成干扰项
function generateDistractors(correctMeaning, level) {
    const distractors = [];
    const usedMeanings = new Set([correctMeaning]);
    
    // 获取同级别词汇
    const levelWords = wordData[level] || [];
    
    while (distractors.length < 3) {
        const randomIndex = Math.floor(Math.random() * levelWords.length);
        const word = levelWords[randomIndex];
        if (!usedMeanings.has(word.meaning)) {
            distractors.push(word.meaning);
            usedMeanings.add(word.meaning);
        }
    }
    
    return distractors;
}

// 生成PK题目
function generatePkQuestions() {
    const questions = [];
    const pkRound = 10;
    
    const allWords = [];
    wordData.primary.forEach(word => allWords.push({ ...word, level: 'primary' }));
    wordData.middle.forEach(word => allWords.push({ ...word, level: 'middle' }));
    wordData.high.forEach(word => allWords.push({ ...word, level: 'high' }));
    
    while (questions.length < pkRound && allWords.length > 0) {
        const randomIndex = Math.floor(Math.random() * allWords.length);
        const selectedWord = allWords[randomIndex];
        
        // 生成选项
        const correctMeaning = selectedWord.meaning;
        const distractors = generateDistractors(correctMeaning, selectedWord.level);
        const options = [correctMeaning, ...distractors, '不认识'];
        
        // 打乱选项（不认识固定在最后）
        for (let i = options.length - 2; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [options[i], options[j]] = [options[j], options[i]];
        }
        
        questions.push({
            ...selectedWord,
            options: options,
            correctAnswer: correctMeaning
        });
        
        allWords.splice(randomIndex, 1);
    }
    
    return questions;
}

// 获取所有房间列表
router.get('/rooms', authMiddleware, async (req, res) => {
  try {
    res.status(200).json({ rooms: pkRooms });
  } catch (error) {
    console.error('获取房间列表失败:', error);
    res.status(500).json({ message: '获取房间列表失败' });
  }
});

// 创建房间
router.post('/rooms', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: '房间名称不能为空' });
    }
    
    const newRoom = {
      id: Date.now(),
      name,
      host: req.user.username,
      hostId: req.user.id,
      players: 1,
      maxPlayers: 2,
      status: 'waiting',
      playersList: [req.user.username],
      playersIds: [req.user.id],
      createdAt: new Date().toISOString()
    };
    
    pkRooms.push(newRoom);
    
    res.status(201).json({ message: '房间创建成功', room: newRoom });
  } catch (error) {
    console.error('创建房间失败:', error);
    res.status(500).json({ message: '创建房间失败' });
  }
});

// 加入房间
router.post('/rooms/:roomId/join', authMiddleware, async (req, res) => {
  try {
    const roomId = parseInt(req.params.roomId);
    const room = pkRooms.find(r => r.id === roomId);
    
    if (!room) {
      return res.status(404).json({ message: '房间不存在' });
    }
    
    if (room.players >= room.maxPlayers) {
      return res.status(400).json({ message: '房间已满' });
    }
    
    if (room.playersIds.includes(req.user.id)) {
      return res.status(400).json({ message: '你已经在这个房间里了' });
    }
    
    room.players++;
    room.playersList.push(req.user.username);
    room.playersIds.push(req.user.id);
    
    if (room.players >= room.maxPlayers) {
      room.status = 'ready';
      // 生成PK题目（只生成一次）
      room.questions = generatePkQuestions();
      // 初始化答案记录
      room.answers = {};
      room.scores = {};
      room.questionStartTime = {}; // 每题共享的开始时间
      room.playersIds.forEach(id => {
        room.answers[id] = [];
        room.scores[id] = 0;
      });
      room.currentQuestionIndex = 0;
      // 为第0题设置共享开始时间
      room.questionStartTime[0] = Date.now();
      room.isFinished = false;
    }
    
    res.status(200).json({ message: '加入房间成功', room });
  } catch (error) {
    console.error('加入房间失败:', error);
    res.status(500).json({ message: '加入房间失败' });
  }
});

// 离开房间
router.post('/rooms/:roomId/leave', authMiddleware, async (req, res) => {
  try {
    const roomId = parseInt(req.params.roomId);
    const roomIndex = pkRooms.findIndex(r => r.id === roomId);
    
    if (roomIndex === -1) {
      return res.status(404).json({ message: '房间不存在' });
    }
    
    const room = pkRooms[roomIndex];
    const playerIndex = room.playersIds.indexOf(req.user.id);
    
    if (playerIndex === -1) {
      return res.status(400).json({ message: '你不在这个房间里' });
    }
    
    room.players--;
    room.playersList.splice(playerIndex, 1);
    room.playersIds.splice(playerIndex, 1);
    room.status = 'waiting';
    
    if (room.players === 0) {
      pkRooms.splice(roomIndex, 1);
      return res.status(200).json({ message: '房间已解散' });
    }
    
    res.status(200).json({ message: '离开房间成功', room });
  } catch (error) {
    console.error('离开房间失败:', error);
    res.status(500).json({ message: '离开房间失败' });
  }
});

// 获取房间详情
router.get('/rooms/:roomId', authMiddleware, async (req, res) => {
  try {
    const roomId = parseInt(req.params.roomId);
    const room = pkRooms.find(r => r.id === roomId);
    
    if (!room) {
      return res.status(404).json({ message: '房间不存在' });
    }
    
    res.status(200).json({ room });
  } catch (error) {
    console.error('获取房间详情失败:', error);
    res.status(500).json({ message: '获取房间详情失败' });
  }
});

// 提交答案（抢答模式）
router.post('/rooms/:roomId/answer', authMiddleware, async (req, res) => {
  try {
    const roomId = parseInt(req.params.roomId);
    const { questionIndex, isCorrect } = req.body;
    const room = pkRooms.find(r => r.id === roomId);
    
    if (!room) {
      return res.status(404).json({ message: '房间不存在' });
    }
    
    if (!room.playersIds.includes(req.user.id)) {
      return res.status(400).json({ message: '你不在这个房间里' });
    }
    
    if (!room.answers) {
      return res.status(400).json({ message: '游戏还未开始' });
    }
    
    // 确保 answers 数组已初始化
    if (!room.answers[req.user.id]) {
      room.answers[req.user.id] = [];
    }
    
    // 如果当前用户已经答过了，直接返回当前状态
    if (room.answers[req.user.id][questionIndex] !== undefined) {
      const bothAnswered = room.playersIds.every(pId => 
        room.answers[pId] && room.answers[pId][questionIndex] !== undefined
      );
      return res.status(200).json({ 
        message: '答案已提交', 
        bothAnswered,
        scores: room.scores,
        questionIndex,
        currentQuestionIndex: room.currentQuestionIndex
      });
    }
    
    // 记录当前用户的答案
    room.answers[req.user.id][questionIndex] = isCorrect;
    
    // 规则：答对才加分（抢答正确），答错不扣分
    if (isCorrect) {
      room.scores[req.user.id] = (room.scores[req.user.id] || 0) + 1;
    }
    
    // 检查是否双方都答完了当前题
    const bothAnswered = room.playersIds.every(pId => 
      room.answers[pId] && room.answers[pId][questionIndex] !== undefined
    );
    
    // 双方都答完后，自动推进到下一题
    let autoAdvanced = false;
    let nextIndex = room.currentQuestionIndex;
    let isLastQuestion = false;
    
    if (bothAnswered && questionIndex === room.currentQuestionIndex) {
      const total = room.questions?.length || 0;
      if (room.currentQuestionIndex < total - 1) {
        room.currentQuestionIndex++;
        const newQIdx = room.currentQuestionIndex;
        room.questionStartTime[newQIdx] = Date.now();
        nextIndex = room.currentQuestionIndex;
        autoAdvanced = true;
      } else {
        isLastQuestion = true;
        room.isFinished = true;
      }
    }
    
    res.status(200).json({ 
      message: '答案提交成功', 
      bothAnswered,
      scores: room.scores,
      questionIndex,
      currentQuestionIndex: room.currentQuestionIndex,
      isLastQuestion,
      autoAdvanced,
      nextIndex,
      isFinished: room.isFinished
    });
  } catch (error) {
    console.error('提交答案失败:', error);
    res.status(500).json({ message: '提交答案失败' });
  }
});

// 获取游戏状态
router.get('/rooms/:roomId/game', authMiddleware, async (req, res) => {
  try {
    const roomId = parseInt(req.params.roomId);
    const room = pkRooms.find(r => r.id === roomId);
    
    if (!room) {
      return res.status(404).json({ message: '房间不存在' });
    }
    
    if (!room.playersIds.includes(req.user.id)) {
      return res.status(400).json({ message: '你不在这个房间里' });
    }
    
    // 如果还没有题目但房间已满，生成题目
    if (room.status === 'ready' && !room.questions) {
      room.questions = generatePkQuestions();
      room.answers = {};
      room.scores = {};
      room.questionStartTime = {};
      room.playersIds.forEach(id => {
        room.answers[id] = [];
        room.scores[id] = 0;
      });
      room.currentQuestionIndex = 0;
      room.questionStartTime[0] = Date.now();
    }
    
    // 如果房间还没准备好
    if (room.status !== 'ready') {
      return res.status(400).json({ message: '房间还没有准备好，请等待对手加入' });
    }
    
    const qIdx = room.currentQuestionIndex;
    const timeLimit = 15;
    const now = Date.now();
    
    // 计算当前题的共享剩余时间（抢答模式：双方共用一个计时器）
    let sharedRemainingTime = 0;
    let myHasAnswered = false;
    let opponentHasAnswered = false;
    if (room.questionStartTime && room.questionStartTime[qIdx]) {
      const elapsed = Math.floor((now - room.questionStartTime[qIdx]) / 1000);
      sharedRemainingTime = Math.max(0, timeLimit - elapsed);
    }
    
    const myHasAnsweredRaw = room.answers[req.user.id] && room.answers[req.user.id][qIdx] !== undefined;
    myHasAnswered = myHasAnsweredRaw;
    
    const opponentId = room.playersIds.find(id => id !== req.user.id);
    if (opponentId) {
      opponentHasAnswered = room.answers[opponentId] && room.answers[opponentId][qIdx] !== undefined;
    }
    
    // 检查当前题是否双方都答完
    let currentBothAnswered = room.playersIds.every(pId => 
      room.answers[pId] && room.answers[pId][qIdx] !== undefined
    );
    
    // 检查是否超时（共享计时器到点）
    if (!currentBothAnswered && qIdx < (room.questions?.length || 0) - 1) {
      if (room.questionStartTime && room.questionStartTime[qIdx]) {
        const elapsed = (now - room.questionStartTime[qIdx]) / 1000;
        if (elapsed >= timeLimit) {
          // 标记所有未作答玩家为超时（答错）
          for (const pId of room.playersIds) {
            if (!room.answers[pId]) room.answers[pId] = [];
            if (room.answers[pId][qIdx] === undefined) {
              room.answers[pId][qIdx] = false;
            }
          }
          currentBothAnswered = true;
          // 自动推进
          room.currentQuestionIndex = qIdx + 1;
          room.questionStartTime[qIdx + 1] = Date.now();
        }
      }
    }
    
    res.status(200).json({
      questions: room.questions,
      answers: room.answers,
      scores: room.scores,
      currentQuestionIndex: room.currentQuestionIndex,
      playersList: room.playersList,
      playersIds: room.playersIds,
      sharedRemainingTime: sharedRemainingTime,
      myHasAnswered: myHasAnswered,
      opponentHasAnswered: opponentHasAnswered,
      currentBothAnswered: currentBothAnswered,
      totalQuestions: room.questions?.length || 0,
      isFinished: !!room.isFinished
    });
  } catch (error) {
    console.error('获取游戏状态失败:', error);
    res.status(500).json({ message: '获取游戏状态失败: ' + error.message });
  }
});

// 推进到下一题（抢答模式：由客户端在双方都答完后调用）
router.post('/rooms/:roomId/next', authMiddleware, async (req, res) => {
  try {
    const roomId = parseInt(req.params.roomId);
    const { clientQuestionIndex } = req.body || {};
    const room = pkRooms.find(r => r.id === roomId);
    
    if (!room) {
      return res.status(404).json({ message: '房间不存在' });
    }
    
    if (!room.playersIds.includes(req.user.id)) {
      return res.status(400).json({ message: '你不在这个房间里' });
    }
    
    let qIdx = room.currentQuestionIndex;
    const total = room.questions?.length || 0;
    
    // 如果服务端已自动推进（客户端落后），同步即可
    // 否则推进到下一题
    let isFinished = false;
    if (qIdx < total - 1) {
      // 只有当客户端的题目索引与服务端一致时才推进（防止重复推进）
      if (clientQuestionIndex === undefined || clientQuestionIndex === qIdx) {
        room.currentQuestionIndex++;
        qIdx = room.currentQuestionIndex;
        room.questionStartTime[qIdx] = Date.now();
      }
    } else {
      isFinished = true;
    }
    
    res.status(200).json({ 
      message: '已进入下一题',
      currentQuestionIndex: room.currentQuestionIndex,
      totalQuestions: total,
      isFinished: isFinished,
      scores: room.scores,
      answers: room.answers,
      sharedRemainingTime: isFinished ? 0 : 15
    });
  } catch (error) {
    console.error('推进到下一题失败:', error);
    res.status(500).json({ message: '推进到下一题失败' });
  }
});

// 重新开始游戏
router.post('/rooms/:roomId/restart', authMiddleware, async (req, res) => {
  try {
    const roomId = parseInt(req.params.roomId);
    const room = pkRooms.find(r => r.id === roomId);
    
    if (!room) {
      return res.status(404).json({ message: '房间不存在' });
    }
    
    if (!room.playersIds.includes(req.user.id)) {
      return res.status(400).json({ message: '你不在这个房间里' });
    }
    
    // 重新生成题目
    room.questions = generatePkQuestions();
    // 初始化答案记录
    room.answers = {};
    room.scores = {};
    room.questionStartTime = {};
    room.playersIds.forEach(id => {
      room.answers[id] = [];
      room.scores[id] = 0;
    });
    room.currentQuestionIndex = 0;
    room.questionStartTime[0] = Date.now();
    room.status = 'ready';
    
    res.status(200).json({ 
      message: '游戏已重新开始',
      room: room
    });
  } catch (error) {
    console.error('重新开始失败:', error);
    res.status(500).json({ message: '重新开始失败' });
  }
});

module.exports = router;