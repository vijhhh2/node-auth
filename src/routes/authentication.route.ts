import { Router } from "express";
import { loggedInController, loginController, registerController } from "../controllers/user.controller";

const authRoutes = Router();

authRoutes.post('/register', registerController);
authRoutes.post('/login', loginController);
authRoutes.post('/loggedIn', loggedInController);

export default authRoutes;

