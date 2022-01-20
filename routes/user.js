import routerx from 'express-promise-router';
import userController from '../controllers/UserController';

const router = routerx();

router.post('/check_email', userController.check_email);
router.post('/verify_email', userController.verify_email);
router.post('/register', userController.register);
router.get('/verify_account/:token', userController.verify_account);
router.post('/fail_password', userController.fail_password);
router.post('/reset_password', userController.reset_password);
router.get('/reset_confirm/:token', userController.reset_confirm);
router.post('/recover_password', userController.recover_password);
router.post('/login', userController.login);

export default router;