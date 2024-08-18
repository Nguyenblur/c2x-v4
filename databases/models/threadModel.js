const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Thread = sequelize.define('Thread', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
    },
    tid: {
      type: DataTypes.STRING,
      allowNull: false, 
    },
  });

  return Thread;
};