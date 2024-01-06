import bcrypt from "bcrypt";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { omit } from "lodash";
import { v4 } from "uuid";
import { z } from "zod";

import { UserLoginBody, UserRegistrationBody } from "../DTOs/user.dto";
import { User } from "../models/user.model";
import { checkIfUserIsLockedToLogin, loginAttempt } from "../utils/login-attempat-check";

export interface UserAttempt {
  username: string;
  attempts: number;
  lockedAt?: number;
}

export type UserAttempts = Record<string, UserAttempt>;

let users: User[] = [
  {
    id: v4(),
    username: 'vijay',
    password: 'password'
  }
];
let userAttempts: UserAttempts = {};

const userValidation = z.object({
  username: z.string(),
  password: z
    .string()
    .min(8, "Minimum password length should be 8 alpha numeric characters")
    .regex(/^[a-zA-Z0-9]*$/, "Only alpha numeric is allowed"),
});

export const registerController = async (
  req: Request<null, null, UserRegistrationBody>,
  res: Response
) => {
  // Validate the body
  const data = userValidation.safeParse(req.body);
  if (!data.success) {
    res.status(400).json({
      message: data.error.errors.map(e => {
        console.log(e);
        return e.message;
      }).join('\n')
    });
    return;
  }
  const { username, password } = data.data;

  // check if user exists
  const userIndex = users.findIndex((user) => user.username === username);
  if (userIndex > -1) {
    res.status(400).json({
      message: "user already registered",
    });
    return;
  }

  // Hash the password
  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(password, salt);

  // create the user
  const id = v4();
  const user = new User(id, username, hashPassword);

  // save the user
  users = [...users, user];

  // Create and assign token
  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
    },
    process.env.ACCESS_TOKEN_SECRET as string
  );
  res.header("auth-token", token);

  res.json({message: 'Registered successfully'});
};

export const loginController = async (
  req: Request<null, null, UserLoginBody>,
  res: Response
) => {
  try {
    // Validate the body
    const data = userValidation.safeParse(req.body);
    if (!data.success) {
      res.status(400).json({
        message: data.error.errors.map(e => e.message).join('\n'),
      });
      return;
    }
    const { username, password } = data.data;

    // check if user is locked
    const isLocked = checkIfUserIsLockedToLogin(data.data, userAttempts);
    if (isLocked) {
      return res.status(400).json({
        message: 'User locked please try after 5 mins'
      });
    }

    // check if user exists
    const userIndex = users.findIndex((user) => user.username === username);
    if (userIndex === -1) {
      res.status(404).json({
        message: "user not found",
      });
      loginAttempt(data.data, userAttempts);
      return;
    }

    const user = users[userIndex];

    // Compare passwords
    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) {
      loginAttempt(data.data, userAttempts);
      return res.status(400).send({
        message: "Username or Password is wrong",
      });
    }

    // Create and assign token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
      },
      process.env.ACCESS_TOKEN_SECRET as string
    );
    res.header("auth-token", token);
    res.status(200).json({
      message: "User logged in successfully",
    });
    userAttempts = omit(userAttempts, username);
  } catch (error) {
    res.status(500).json({
      message: "Error logging in user",
    });
  }
};

export const loggedInController = (req: Request, res: Response) => {
  let token = req.header("Authorization");
  if (!token) {
    return res.status(401).send("Access Denied");
  }

  try {
    if (token.startsWith("Bearer ")) {
      // Remove Bearer from string
      token = token.slice(7, token.length).trimStart();
    }
    const user = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET as string
    ) as User;
    res.status(200).json(user);
  } catch (err) {
    res.status(400).json({
      message: "Invalid Token",
    });
  }
};
