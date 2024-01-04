import bodyParser from 'body-parser'
import cors from "cors";
import dotenv from 'dotenv'
import express, { Request, Response } from "express";

import authRoutes from "./routes/authentication.route";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middlewares
app.use(cors());
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Routes
app.use('/api/auth', authRoutes);
app.get('/', (req: Request, res: Response) => {
    res.send("Hello world!!!!!");
});


app.listen(PORT, () => {
    console.log('Listening...');
});
