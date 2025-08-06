import { Router } from "express";
import { check, validationResult } from "express-validator";
import pool from "../config/database.js";
import auth from "../middleware/auth.js";

const router = Router()


// Create transaction (income or expense)
router.post('/transaction', [
    // Validation middleware
    check('type', 'Type is required and must be either income or expense').isIn(['income', 'expense']),
    check('category', 'Category is required').notEmpty(),
    check('amount', 'Amount must be a positive number').isFloat({ gt: 0 }),
    check('description', 'Description is optional').optional()
], async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const user_id = 1;
    const { type, category, amount, description } = req.body;

    try {
        const query = `
            INSERT INTO transactions (user_id, type, category, amount, description, transaction_date) 
            VALUES ($1, $2, $3, $4, $5, CURRENT_DATE) 
            RETURNING *
        `;

        const result = await pool.query(query, [user_id, type, category, amount, description || null]);

        const newTransaction = result.rows[0];

        return res.status(201).json({
            message: `${type.charAt(0).toUpperCase() + type.slice(1)} created successfully`,
            transaction: newTransaction
        });

    } catch (error) {
        console.error("Error creating transaction:", error);
        return res.status(500).json({ message: "Error creating transaction" });
    }
});
// Get all transactions by user (with optional type filter)
router.get('/transactions', async (req, res) => {
    const user_id = 1;
    const { type } = req.query; // Optional query parameter to filter by type

    try {
        let query = `SELECT * FROM transactions WHERE user_id = $1`;
        let params = 1;
        
        // Add type filter if provided
        if (type && ['income', 'expense'].includes(type)) {
            query += ` AND type = $2`;
            params.push(type);
        }
        
        query += ` ORDER BY transaction_date DESC, created_at DESC`;

        const result = await pool.query(query, [params]);

        res.json({
            message: "Transactions retrieved successfully",
            transactions: result.rows,
            total: result.rows.length,
            type: type || 'all'
        });

    } catch (error) {
        console.error("Error fetching transactions:", error);
        return res.status(500).json({ message: "Error fetching transactions" });
    }
});

// Get transaction by id
router.get('/transaction/:id', auth, async (req, res) => {
    const user_id = req.user.id;
    const transaction_id = req.params.id;

    try {
        const query = `SELECT * FROM transactions WHERE id = $1 AND user_id = $2`;

        const result = await pool.query(query, [transaction_id, user_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        res.json({
            message: "Transaction retrieved successfully",
            transaction: result.rows[0]
        });

    } catch (error) {
        console.error("Error fetching transaction:", error);
        return res.status(500).json({ message: "Error fetching transaction" });
    }
});


// Update transaction
router.put('/transaction/:id', [
    check('type', 'Type must be either income or expense').optional().isIn(['income', 'expense']),
    check('category', 'Category is required').optional().notEmpty(),
    check('amount', 'Amount must be a positive number').optional().isFloat({ gt: 0 }),
    check('description', 'Description is optional').optional()
], auth, async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const user_id = req.user.id;
    const transaction_id = req.params.id;
    const { type, category, amount, description } = req.body;

    try {
        const query = `
            UPDATE transactions 
            SET type = $1, category = $2, amount = $3, description = $4, updated_at = CURRENT_TIMESTAMP
            WHERE id = $5 AND user_id = $6
            RETURNING *
        `;

        const result = await pool.query(query, [type, category, amount, description, transaction_id, user_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        res.json({
            message: "Transaction updated successfully",
            transaction: result.rows[0]
        });

    } catch (error) {
        console.error("Error updating transaction:", error);
        return res.status(500).json({ message: "Error updating transaction" });
    }
});

// Delete transaction
router.delete('/transaction/:id', auth, async (req, res) => {
    const user_id = req.user.id;
    const transaction_id = req.params.id;

    try {
        const query = `
            DELETE FROM transactions 
            WHERE id = $1 AND user_id = $2
            RETURNING *
        `;

        const result = await pool.query(query, [transaction_id, user_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        res.json({
            message: "Transaction deleted successfully",
            deletedTransaction: result.rows[0]
        });

    } catch (error) {
        console.error("Error deleting transaction:", error);
        return res.status(500).json({ message: "Error deleting transaction" });
    }
});

export default router;