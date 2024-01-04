"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loggedInController = exports.loginController = exports.registerController = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const user_model_1 = require("../models/user.model");
let users = [];
const registerController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    // Hash the password
    const salt = yield bcrypt_1.default.genSalt(10);
    const hashPassword = yield bcrypt_1.default.hash(password, salt);
    // create the user
    const id = (0, uuid_1.v4)();
    const user = new user_model_1.User(id, username, hashPassword);
    // save the user
    users = [...users, user];
    // Create and assign token
    console.log(process.env.ACCESS_TOKEN_SECRET);
    const token = jsonwebtoken_1.default.sign({
        id: user.id,
        username: user.username,
    }, process.env.ACCESS_TOKEN_SECRET);
    res.header("auth-token", token);
    res.json({ users });
});
exports.registerController = registerController;
const loginController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, password } = req.body;
        // check if user exists
        const userIndex = users.findIndex((user) => user.username === username);
        if (userIndex === -1) {
            res.status(404).json({
                message: "user not found",
            });
            return;
        }
        const user = users[userIndex];
        const validPass = yield bcrypt_1.default.compare(password, user.password);
        if (!validPass) {
            return res.status(400).send({
                message: "Username or Password is wrong",
            });
        }
        // Create and assign token
        console.log(process.env.ACCESS_TOKEN_SECRET);
        const token = jsonwebtoken_1.default.sign({
            id: user.id,
            username: user.username,
        }, process.env.ACCESS_TOKEN_SECRET);
        res.header("auth-token", token);
        res.status(200).json({
            message: "user logged in successfully",
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Error retrieving User",
        });
    }
});
exports.loginController = loginController;
const loggedInController = (req, res) => {
    let token = req.header("Authorization");
    if (!token) {
        return res.status(401).send("Access Denied");
    }
    try {
        if (token.startsWith('Bearer ')) {
            // Remove Bearer from string
            token = token.slice(7, token.length).trimStart();
        }
        const user = jsonwebtoken_1.default.verify(token, process.env.ACCESS_TOKEN_SECRET);
        res.status(200).json(user);
    }
    catch (err) {
        res.status(400).json({
            message: "Invalid Token"
        });
    }
};
exports.loggedInController = loggedInController;
