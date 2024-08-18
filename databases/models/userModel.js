const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
    },
    uid: {
      type: DataTypes.STRING,
      allowNull: false, 
    },
    money: {
      type: DataTypes.INTEGER, 
      allowNull: false,
      defaultValue: 0,
    },
  });

  return User;
};