import { Router } from "express";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { check, query, validationResult } from "express-validator";
import pool from "../config/database.js";
import auth from "../middleware/auth.js";
const router = Router()

router.post('/', [check('username', 'User name is required field').exists(),
check('email', 'email is required field').isEmail(),
check('password', 'password is a required field').exists()
], async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    const { username, email, password } = req.body

    try {
        // Removed the unused connection variable to prevent connection leaks.

        // check if user already exist
        const userExist = await pool.query(`SELECT * FROM users WHERE email=$1 OR username = $2`, [email, username]);

        if (userExist.rowCount > 0) {
            return res.status(400).json({ message: "User already exist" });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);



        const query = `INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email`;

        const result = await pool.query(query, [username, email, hashedPassword])

        console.log(result)

        const user = result.rows[0]


        const payload = {
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        }

        const token = jwt.sign(payload, process.env.JWT_SECRET)

        res.status(201).json({
            message: "user Created successfully",
            token,
            payload
        })
    } catch (error) {
        console.log(error)
        return res.status(500).send({ message: "Error Creating users" })
    }

})


export default router