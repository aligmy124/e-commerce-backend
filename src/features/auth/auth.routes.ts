import express from "express"
import { validateBody } from "../../middlewares/validateBody";
import { registerSchema } from "./schema/register.schema";
import { loginController, registerController } from "./auth.controller";
import { loginSchema } from "./schema/login.schema";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
// import { loginLimiter, registerLimiter } from "./rate_limit/auth.limit";
const router = express.Router();

router.post('/register',  validateBody(registerSchema), registerController);
router.post('/login', validateBody(loginSchema), loginController);
// router.post('/register', registerLimiter, validateBody(registerSchema), registerController);
// router.post('/login', loginLimiter, validateBody(loginSchema), loginController);
router.get("/protected", authenticate, (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
});

router.get('/dashboard', authenticate, authorize(['admin']), (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Welcome to the admin page!',
  });
});
export default router;