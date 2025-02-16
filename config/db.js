const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('s1483_FeariseHUBdb', 'u1483_O5Or2kPlFV', '9OxZ4.+5evC4t@EPIhSv8wPV', {
    host: '157.90.211.250', // หรือ localhost ถ้ารัน local
    dialect: 'mysql',
    define: {
        timestamps: false
    },
    pool: {
        max: 10,        // จำนวน Connection สูงสุดที่สามารถใช้งานได้พร้อมกัน
        min: 0,         // จำนวน Connection ขั้นต่ำ
        acquire: 30000, // ระยะเวลารอ (ms) ก่อน timeout เมื่อขอ Connection ใหม่
        idle: 10000     // ระยะเวลาที่ Connection จะถูกเก็บไว้ก่อนปิด (ms)
    },
    logging: false // ปิด log query เพื่อลดภาระ console (เปิดเป็น true ถ้าต้องการ debug)
});

// กำหนดตัวแปร db
const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// นำเข้าตารางจากโมเดลต่าง ๆ
db.Users = require('../models/user')(sequelize, Sequelize);
db.GameMap = require('../models/GameMap')(sequelize, Sequelize);
db.Token = require('../models/token')(sequelize, Sequelize);

console.log('Users Model:', db.Users);
console.log('GameMap Model:', db.GameMap);
console.log('Token Model:', db.Token);

// กำหนดความสัมพันธ์ระหว่างตาราง User และ GameMap ผ่าน UserGameMaps
db.UserGameMaps = sequelize.define(
    'UserGameMaps', 
    {}, 
    { tableName: 'user_game_maps', timestamps: false }
);

db.Users.belongsToMany(db.GameMap, { through: 'UserGameMaps', foreignKey: 'uid' });
db.GameMap.belongsToMany(db.Users, { through: 'UserGameMaps', foreignKey: 'gameMapId' });

module.exports = db;
