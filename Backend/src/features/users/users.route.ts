
import express from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { fetchUsersController, userProfileController } from './users.controller';
import { validateObjectId } from '../../middlewares/validateObjectId';
const router = express.Router();

router.get('/', authenticate, authorize(['admin']), fetchUsersController);
router.get('/:userId', authenticate, validateObjectId("userId"),userProfileController);
export default router