// 词库数据导入脚本
const { Sequelize, DataTypes } = require('sequelize');
const fs = require('fs');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite'
});

const Word = sequelize.define('Word', {
  word: { type: DataTypes.STRING, allowNull: false },
  meaning: { type: DataTypes.TEXT, allowNull: false },
  phonetic: { type: DataTypes.STRING },
  stage: { type: DataTypes.STRING, allowNull: false },
  level: { type: DataTypes.INTEGER, allowNull: false }
});

async function importWords() {
  try {
    const filePath = path.join(__dirname, 'embedded_word_data.js');
    let content = fs.readFileSync(filePath, 'utf8');

    content = content.split('\n')
      .filter(line => !line.trim().startsWith('//'))
      .join('\n');

    const startMarker = 'const embeddedWordData = ';
    const startIdx = content.indexOf(startMarker);
    if (startIdx === -1) throw new Error('找不到 embeddedWordData 定义');

    let objStr = content.substring(startIdx + startMarker.length);
    objStr = objStr.trim();
    if (objStr.endsWith(';')) objStr = objStr.slice(0, -1);

    const embeddedWordData = eval('(' + objStr + ')');

    await sequelize.sync();
    await Word.destroy({ where: {} });
    console.log('已清空现有单词数据');

    const bulkCreate = async (words, stage) => {
      const records = words.map((word, i) => ({
        word: word.word,
        meaning: word.meaning,
        phonetic: word.phonetic,
        stage: stage,
        level: Math.floor(i / (words.length / 3)) + 1
      }));
      await Word.bulkCreate(records);
      console.log(`已导入${stage === 'primary' ? '小学' : stage === 'middle' ? '初中' : '高中'}单词: ${words.length}个`);
    };

    await bulkCreate(embeddedWordData.primary, 'primary');
    await bulkCreate(embeddedWordData.middle, 'middle');
    await bulkCreate(embeddedWordData.high, 'high');

    const total = await Word.count();
    console.log(`\n导入完成！共 ${total} 个单词`);

    process.exit(0);
  } catch (error) {
    console.error('导入失败:', error);
    process.exit(1);
  }
}

importWords();
