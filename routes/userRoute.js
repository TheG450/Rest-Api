const express = require('express');
const router = express.Router();
const { Ready, getUsers, redeemKey, getKey, getUserMap, getAccess, resetHwid, deleteUser, resetHwidDisCord, redeemToken } = require('../controllers/usersController')


router.get('/', Ready);
router.get('/get-users', getUsers);
router.post('/redeem', redeemKey);
router.post('/redeemtoken', redeemToken);
router.get('/getkey', getKey);
router.get('/getmaps', getUserMap);
router.get('/getaccess', getAccess);
router.post('/resethwid', resetHwid);
router.post('/deleteuser', deleteUser);
router.post('/resetHwidDiscord', resetHwidDisCord);
//router.put('/edit-user/:username', updateUser);

module.exports = router;
