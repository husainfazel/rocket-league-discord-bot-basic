'use strict';
module.exports = (sequelize, DataTypes) => {
  var Player = sequelize.define('Player', {
    name: DataTypes.STRING,
    bio: DataTypes.TEXT,
    discord_username: DataTypes.STRING,
    rank: DataTypes.STRING,
    division: DataTypes.STRING,
    gamer_id: DataTypes.STRING,
    gamer_platform: DataTypes.ENUM('Playstation', 'Xbox', 'PC', 'Switch'),
    rating: DataTypes.INTEGER,
    registration_status: DataTypes.BOOLEAN,
    wins: DataTypes.INTEGER,
    played: DataTypes.INTEGER,
  },
  {
  	timestamps: false,
  	underscored: true
  });

  return Player;
};