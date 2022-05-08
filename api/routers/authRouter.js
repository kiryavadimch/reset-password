const Router = require('express');
const router = new Router();

const controller = require('../controllers/auth');

router.post('/register', controller.register);
router.get('/verify/:token', controller.verify)
router.post('/send-reset', controller.sendReset)
router.post('/reset-password/:token', controller.resetPassword)

module.exports = router;
