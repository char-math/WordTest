const Sequelize = require('sequelize');
const db = require('../config/database');
const User = require('./User');

const TestRecord = db.define('TestRecord', {
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
  score: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  vocabulary: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  level: {
    type: Sequelize.STRING,
    allowNull: false
  },
  createdAt: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW
  }
});

// 关联关系
TestRecord.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(TestRecord, { foreignKey: 'userId' });

module.exports = TestRecord;