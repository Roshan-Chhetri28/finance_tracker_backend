import { Router } from "express";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { check, validationResult } from "express-validator";
import pool from "../config/database.js";
import auth from "../middleware/auth.js";

const router = Router();

// Login route
// @desc: post /api/login
router.post('/login', [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    const { email, password } = req.body;

    try {
        // Query to find user by email
        const query = `SELECT * FROM users WHERE email = $1`;
        const userResult = await pool.query(query, [email]);

        // Check if user exists
        if (userResult.rows.length === 0) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const user = userResult.rows[0];

        // Compare the provided password with the stored hash
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Create JWT payload
        const payload = {
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        };

        // Generate JWT token (expires in 5 hours)
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' });

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: "Server error" });
    }
});

// Get user profile (protected route)
router.get('/profile', auth, async (req, res) => {
    try {
        const query = `SELECT id, username, email, created_at FROM users WHERE id = $1`;
        const result = await pool.query(query, [req.user.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({
            user: result.rows[0]
        });

    } catch (error) {
        console.error('Profile error:', error);
        return res.status(500).json({ message: "Server error" });
    }
});

export default router;