import bcrypt from "bcrypt";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { v4 } from "uuid";
import { z } from "zod";

import { UserLoginBody, UserRegistrationBody } from "../DTOs/user.dto";
import { User } from "../models/user.model";

let users: User[] = [];
const userValidation = z.object({
  username: z.string(),
  password: z
    .string()
    .min(6)
    .regex(/^[a-zA-Z0-9_]*$/, "Only alpha numeric is allowed"),
});

export const registerController = async (
  req: Request<null, null, UserRegistrationBody>,
  res: Response
) => {
  // Validate the body
  const data = userValidation.safeParse(req.body);
  if (!data.success) {
    res.status(400).json({
      message: "Invalid username or password",
    });
    return;
  }
  const { username, password } = data.data;
  // Hash the password
  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(password, salt);

  // create the user
  const id = v4();
  const user = new User(id, username, hashPassword);

  // save the user
  users = [...users, user];

  // Create and assign token
  console.log(process.env.ACCESS_TOKEN_SECRET);
  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
    },
    process.env.ACCESS_TOKEN_SECRET as string
  );
  res.header("auth-token", token);

  res.json({ users });
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
        message: "Invalid username or password",
      });
      return;
    }
    const { username, password } = data.data;

    // check if user exists
    const userIndex = users.findIndex((user) => user.username === username);
    if (userIndex === -1) {
      res.status(404).json({
        message: "user not found",
      });
      return;
    }

    const user = users[userIndex];
    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) {
      return res.status(400).send({
        message: "Username or Password is wrong",
      });
    }

    // Create and assign token
    console.log(process.env.ACCESS_TOKEN_SECRET);
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
      },
      process.env.ACCESS_TOKEN_SECRET as string
    );
    res.header("auth-token", token);
    res.status(200).json({
      message: "user logged in successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving User",
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
