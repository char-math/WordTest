﻿﻿﻿﻿﻿const Sequelize = require('sequelize');
const db = require('../config/database');
const User = require('./User');

const WrongWord = db.define('WrongWord', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  word: {
    type: Sequelize.STRING,
    allowNull: false
  },
  meaning: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  phonetic: {
    type: Sequelize.STRING,
    allowNull: true
  },
  level: {
    type: Sequelize.STRING,
    allowNull: true
  },
  createdAt: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW
  }
}, {
  indexes: [
    { unique: true, fields: ['userId', 'word'] }
  ]
});

WrongWord.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(WrongWord, { foreignKey: 'userId' });

module.exports = WrongWord;
