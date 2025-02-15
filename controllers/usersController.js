const db = require('../config/db');
const { Users, GameMap, UserGameMaps, Token } = db;
db.sequelize.sync();

// Function to generate unique userKey
function generateUserKey() {
    let timestamp = new Date().getTime(); // เวลาปัจจุบันใน milliseconds
    let performanceTime = (typeof performance !== "undefined" && performance.now) ? performance.now() * 1000 : 0;

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        let random = Math.random() * 16; // เลขสุ่มระหว่าง 0-15
        if (timestamp > 0) {
            random = (timestamp + random) % 16 | 0;
            timestamp = Math.floor(timestamp / 16);
        } else {
            random = (performanceTime + random) % 16 | 0;
            performanceTime = Math.floor(performanceTime / 16);
        }
        return (c === 'x' ? random : (random & 0x3) | 0x8).toString(16);
    });
}

async function Ready(req, res) {
    res.send('API Is Running...')
}

// Function to get all users
async function getUsers(req, res) {
    try {
        const users = await Users.findAll({
            include: {
                model: GameMap,
                through: { attributes: [] } // เอาเฉพาะข้อมูล Map ที่ผู้ใช้มี
            }
        });

        res.status(200).send(users);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
}

// Function to redeem key and create or update user
async function redeemKey(req, res) {
    const { discordId, key } = req.body;
    if (!discordId || !key) {
        return res.status(400).send({ error: 'Missing required fields' });
    }

    try {
        // ค้นหาเกมจาก key
        const game = await GameMap.findOne({ where: { key } });
        if (!game) {
            return res.status(400).send({ error: 'Invalid key' });
        }
        
        // ตรวจสอบว่า key ถูกใช้ไปแล้วหรือไม่
        if (game.isactive == 1) {
            return res.status(400).send({ error: 'Key นี้ถูกใช้แล้ว' });
        }

        // ค้นหาหรือสร้าง user ถ้ายังไม่มี
        const [user, userCreated] = await Users.findOrCreate({
            where: { discordId: discordId.toString().substring(0, 255) },
            defaults: {
                userName: `User_${discordId.substring(0, 20)}`, // จำกัดชื่อให้สั้นลง ถ้า discordId ยาว
                isBanned: false,
                hwid: 'N/A',
                token: 5,
                userKey: generateUserKey(),
                discordId: discordId.toString().substring(0, 255) // จำกัดความยาวของ discordId
            }
        });

        // ✅ ดึงรายชื่อเกมทั้งหมดที่ผู้ใช้มี
        const userWithGames = await Users.findOne({
            where: { uid: user.uid },
            include: {
                model: GameMap,
                attributes: ['gameName'], // ดึงเฉพาะชื่อเกม
                through: { attributes: [] }
            }
        });

        // ✅ ตรวจสอบว่า user มีเกมนี้อยู่แล้วหรือไม่
        const existingGames = userWithGames.GameMaps.map(g => g.gameName);
        if (existingGames.includes(game.gameName)) {
            return res.status(400).send({ error: `Game "${game.gameName}" ถูกเพิ่มไปแล้ว` });
        }

        // ✅ เพิ่มข้อมูลเกมใหม่เข้าไป
        await UserGameMaps.create({ uid: user.uid, gameMapId: game.id });
        
        // ✅ อัปเดต isActive ของ key เป็น 1
        await game.update({ isactive: 1 });

        // ✅ อัปเดตรายชื่อเกมทั้งหมดของผู้ใช้
        const updatedUserWithGames = await Users.findOne({
            where: { uid: user.uid },
            include: {
                model: GameMap,
                attributes: ['gameName'], // ดึงเฉพาะชื่อเกม
                through: { attributes: [] }
            }
        });

        // ✅ แปลง GameMaps เป็น "PM, Reaper, ..."
        const updatedGameNames = updatedUserWithGames.GameMaps.map(g => g.gameName).join(', ');

        res.status(200).send({
            message: `Redeem สำเร็จ!`,
            user: {
                uid: user.uid,
                GameMap: updatedGameNames
            }
        });

    } catch (error) {
        res.status(500).send({ error: error.message });
    }
}

async function redeemToken(req, res) {
    const { discordId, key } = req.body;
    
    if (!discordId || !key) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // 🔥 ค้นหา token จาก key
        const tokenData = await Token.findOne({ where: { key } });
        if (!tokenData) {
            return res.status(400).json({ error: 'Invalid key' });
        }

        // 🔥 ค้นหาผู้ใช้จาก discordId
        const user = await Users.findOne({ where: { discordId: discordId.toString() } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // 🔥 อัปเดต token ของ user โดยเพิ่ม token.count เข้าไป
        user.token += tokenData.count;
        await user.save();

        // 🔥 ลบ key ออกจากฐานข้อมูลหลังจาก redeem สำเร็จ
        await tokenData.destroy();

        return res.status(200).json({
            success: true,
            message: `✅ Token ของคุณถูกเพิ่มเรียบร้อยแล้ว! 🎟️`,
            totalToken: user.token
        });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

async function getKey(req, res) {
    const { discordId } = req.query;
    if (!discordId) {
        return res.status(400).send({ error: 'Missing required field: discordId' });
    }
    try {
        const user = await Users.findOne({ where: { discordId: discordId.toString().substring(0, 255) } });
        
        if (!user) {
            return res.status(404).send({ error: 'User not found' });
        }

        res.status(200).send({ userKey: user.userKey });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
}

async function getUserMap(req, res) {
    const { discordId } = req.query;
    if (!discordId) {
        return res.status(400).send({ error: 'Missing required field: discordId' });
    }
    try {
        const user = await Users.findOne({
            where: { discordId: discordId.toString().substring(0, 255) },
            include: {
                model: GameMap,
                attributes: ['gameName'],
                through: { attributes: [] }
            }
        });

        if (!user) {
            return res.status(404).send({ error: 'User not found' });
        }

        const gameNames = user.GameMaps.map(g => g.gameName).join(', ');

        res.status(200).send({ gameName: gameNames });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
}

async function getAccess(req, res) {
    const { userKey } = req.query; // รับ userKey จาก Query Parameters

    if (!userKey) {
        return res.status(400).send({ error: 'Key cannot be null' });
    }

    try {
        const key = await Users.findOne({ where: { userKey: userKey.toString().replace(/"/g, '') } }); // ลบเครื่องหมาย " ออก
        const user = await Users.findOne({
            where: { userKey: userKey.toString().replace(/"/g, '') },
            include: {
                model: GameMap,
                attributes: ['gameName'],
                through: { attributes: [] }
            }
        });

        if (!key && !user) {
            return res.status(404).send({ error: 'Key not found' });
        }
        const gameNames = user.GameMaps.map(g => g.gameName).join(', ');

        return res.status(200).json({ success: true, hwid: key.hwid, gameNames: gameNames, isBanned: key.isBanned });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
}

async function resetHwid(req, res) {
    const { userKey, myHwid } = req.body; // รับ userKey และ myHwid จาก Body (POST)

    if (!userKey || !myHwid) {
        return res.status(400).json({ error: 'userKey and myHwid cannot be null' });
    }

    try {
        // ค้นหาผู้ใช้จาก userKey
        const key = await Users.findOne({ where: { userKey: userKey.toString().replace(/"/g, '') } });

        if (!key) {
            return res.status(404).json({ error: 'Key not found' });
        }

        // ถ้า HWID เป็น "N/A" หรือไม่ตรงกับ myHwid ให้เปลี่ยนเป็น myHwid
        if (key.hwid === "N/A") {
            key.hwid = myHwid;
            await key.save(); // บันทึกการเปลี่ยนแปลง
        }

        return res.status(200).json({ success: true, hwid: key.hwid });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

async function resetHwidDisCord(req, res) {
    const { discordId } = req.body;

    if (!discordId) {
        return res.status(400).json({ error: 'Missing required field: discordId' });
    }

    try {
        const user = await Users.findOne({ where: { discordId: discordId.toString() } });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.token >= 1) {
            user.token -= 1
            user.hwid = "N/A"
            await user.save();
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

async function deleteUser(req, res) {
    const { discordId } = req.body;
    if (!discordId) {
        return res.status(400).json({ error: 'Missing required field: discordId' });
    }
    try {
        // ค้นหา user จาก discordId
        const user = await Users.findOne({ where: { discordId: discordId.toString().substring(0, 255) } });
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // ดึงรายการเกมทั้งหมดของผู้ใช้จาก user_game_maps
        const userGameMaps = await UserGameMaps.findAll({ where: { uid: user.uid } });
        const gameMapIds = userGameMaps.map(entry => entry.gameMapId);
        
        // ลบความสัมพันธ์ระหว่างผู้ใช้และเกมใน user_game_maps
        await UserGameMaps.destroy({ where: { uid: user.uid } });
        
        // ลบเกมใน game_maps ที่เชื่อมโยงกับ user ถ้ามี
        await GameMap.destroy({ where: { id: gameMapIds } });
        
        // ลบผู้ใช้จากตาราง users
        await user.destroy();
        
        res.status(200).json({ message: 'User and related game maps deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}



module.exports = { Ready, getUsers, redeemKey, getKey, getUserMap, getAccess, resetHwid, deleteUser, resetHwidDisCord, redeemToken };
