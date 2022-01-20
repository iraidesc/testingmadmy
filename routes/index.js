import routerx from 'express-promise-router';
import userRouter from './user';

const router = routerx();

router.use('/user', userRouter);

export default router;
