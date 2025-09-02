import { Router } from "express";
import { check, validationResult } from "express-validator";
import auth from "../middleware/auth.js";
import pool from "../config/database.js";
import { getFinancialAdvice } from "../services/advisor.services.js";

const router = Router();

/**
 * @route   POST /api/advisor/chat
 * @desc    Get financial advice from AI advisor
 * @access  Public (should be protected in production)
 */
router.post('/chat', [
    check('query', 'Query is required').notEmpty()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { query } = req.body;

    try {
        // In a real application with authentication, you would get the user ID from the auth token
        // For now, we'll get the first user (same approach used in transaction routes)
        const userQuery = await pool.query('SELECT id FROM users LIMIT 1');
        if (userQuery.rows.length === 0) {
            return res.status(500).json({ message: "No users found in the database" });
        }
        const userId = userQuery.rows[0].id;

        // Get AI advice with conversation history
        const response = await getFinancialAdvice(userId, query);

        return res.json({
            success: true,
            message: "Financial advice generated successfully",
            advice: response.advice
        });
    } catch (error) {
        console.error("Error getting financial advice:", error);
        return res.status(500).json({ 
            success: false,
            message: "Error getting financial advice", 
            error: error.message 
        });
    }
});

/**
 * @route   GET /api/advisor/health
 * @desc    Check if the advisor service is running
 * @access  Public
 */
router.get('/health', (req, res) => {
    return res.json({
        success: true,
        message: "Financial advisor service is running"
    });
});

/**
 * @route   GET /api/advisor/history
 * @desc    Get conversation history for the current user
 * @access  Public (should be protected in production)
 */
router.get('/history', async (req, res) => {
    try {
        // Get the first user (same approach used in other routes)
        const userQuery = await pool.query('SELECT id FROM users LIMIT 1');
        if (userQuery.rows.length === 0) {
            return res.status(500).json({ message: "No users found in the database" });
        }
        const userId = userQuery.rows[0].id;
        
        // Import the conversation services
        const { getConversationHistory } = await import('../services/conversation.services.js');
        
        // Get history - limit to the most recent 50 messages
        const history = await getConversationHistory(userId, 50);
        
        return res.json({
            success: true,
            history: history
        });
    } catch (error) {
        console.error("Error getting conversation history:", error);
        return res.status(500).json({
            success: false,
            message: "Error getting conversation history",
            error: error.message
        });
    }
});

/**
 * @route   DELETE /api/advisor/history
 * @desc    Clear conversation history for the current user
 * @access  Public (should be protected in production)
 */
router.delete('/history', async (req, res) => {
    try {
        // Get the first user (same approach used in other routes)
        const userQuery = await pool.query('SELECT id FROM users LIMIT 1');
        if (userQuery.rows.length === 0) {
            return res.status(500).json({ message: "No users found in the database" });
        }
        const userId = userQuery.rows[0].id;
        
        // Delete conversation history
        await pool.query('DELETE FROM conversation_history WHERE user_id = $1', [userId]);
        
        return res.json({
            success: true,
            message: "Conversation history cleared successfully"
        });
    } catch (error) {
        console.error("Error clearing conversation history:", error);
        return res.status(500).json({
            success: false,
            message: "Error clearing conversation history",
            error: error.message
        });
    }
});

export default router;
