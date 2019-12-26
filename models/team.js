'use strict';
module.exports = (sequelize, DataTypes) => {
  var Team = sequelize.define('Team', {
    name: DataTypes.STRING,
    logo: DataTypes.STRING,
    player_one_id: DataTypes.INTEGER,
    player_two_id: DataTypes.INTEGER,
    player_three_id: DataTypes.INTEGER,
    rating: DataTypes.INTEGER,
    played: DataTypes.INTEGER,
    wins: DataTypes.INTEGER
  },
  {
  	timestamps: false,
  	underscored: true
  });

  return Team;
};