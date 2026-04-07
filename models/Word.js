const Sequelize = require('sequelize');
const db = require('../config/database');

const Word = db.define('Word', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  word: {
    type: Sequelize.STRING,
    allowNull: false
  },
  meaning: {
    type: Sequelize.STRING,
    allowNull: false
  },
  phonetic: {
    type: Sequelize.STRING,
    allowNull: true
  },
  stage: {
    type: Sequelize.ENUM('primary', 'middle', 'high'),
    allowNull: false
  },
  level: {
    type: Sequelize.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 3
    }
  },
  createdAt: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW
  },
  updatedAt: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW
  }
});

module.exports = Word;