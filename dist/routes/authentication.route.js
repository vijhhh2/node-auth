"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const authRoutes = (0, express_1.Router)();
authRoutes.post('/register', user_controller_1.registerController);
authRoutes.post('/login', user_controller_1.loginController);
authRoutes.post('/loggedIn', user_controller_1.loggedInController);
exports.default = authRoutes;
