const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('s1483_FeariseHUBdb', 'u1483_O5Or2kPlFV', '9OxZ4.+5evC4t@EPIhSv8wPV', { // root, root
    host: '157.90.211.250', //localhost
    dialect: 'mysql',
    define: {
        timestamps: false
    }
});

// กำหนดตัวแปร db
const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.Users = require('../models/user')(sequelize, Sequelize);
db.GameMap = require('../models/GameMap')(sequelize, Sequelize);

console.log('Users Model:', db.Users);
console.log('GameMap Model:', db.GameMap);

db.UserGameMaps = sequelize.define(
  'UserGameMaps', 
  {}, 
  { tableName: 'user_game_maps', timestamps: false }
);

db.Users.belongsToMany(db.GameMap, { through: 'UserGameMaps', foreignKey: 'uid' });
db.GameMap.belongsToMany(db.Users, { through: 'UserGameMaps', foreignKey: 'gameMapId' });

module.exports = db;
