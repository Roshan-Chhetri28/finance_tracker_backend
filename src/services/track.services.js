import pool from '../config/database.js';

// Get all transactions for a user
export const getAllTransactions = async (userId) => {
    try {
        const query = 'SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC';
        const result = await pool.query(query, [userId]);
        return result.rows;
    } catch (error) {
        throw new Error(`Error fetching transactions: ${error.message}`);
    }
};

// Create a new transaction
export const createTransaction = async (transactionData) => {
    const { user_id, type, category, amount, description } = transactionData;
    
    try {
        const query = `
            INSERT INTO transactions (user_id, type, category, amount, description, created_at) 
            VALUES ($1, $2, $3, $4, $5, NOW()) 
            RETURNING *
        `;
        const values = [user_id, type, category, amount, description];
        const result = await pool.query(query, values);
        return result.rows[0];
    } catch (error) {
        throw new Error(`Error creating transaction: ${error.message}`);
    }
};

// Get transaction by ID
export const getTransactionById = async (transactionId, userId) => {
    try {
        const query = 'SELECT * FROM transactions WHERE id = $1 AND user_id = $2';
        const result = await pool.query(query, [transactionId, userId]);
        return result.rows[0];
    } catch (error) {
        throw new Error(`Error fetching transaction: ${error.message}`);
    }
};

// Update transaction
export const updateTransaction = async (transactionId, userId, updateData) => {
    const { type, category, amount, description } = updateData;
    
    try {
        const query = `
            UPDATE transactions 
            SET type = $1, category = $2, amount = $3, description = $4, updated_at = NOW()
            WHERE id = $5 AND user_id = $6 
            RETURNING *
        `;
        const values = [type, category, amount, description, transactionId, userId];
        const result = await pool.query(query, values);
        return result.rows[0];
    } catch (error) {
        throw new Error(`Error updating transaction: ${error.message}`);
    }
};

// Delete transaction
export const deleteTransaction = async (transactionId, userId) => {
    try {
        const query = 'DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING *';
        const result = await pool.query(query, [transactionId, userId]);
        return result.rows[0];
    } catch (error) {
        throw new Error(`Error deleting transaction: ${error.message}`);
    }
};

// Get user's balance summary
export const getBalanceSummary = async (userId) => {
    try {
        const query = `
            SELECT 
                SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
                SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses,
                SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as balance
            FROM transactions 
            WHERE user_id = $1
        `;
        const result = await pool.query(query, [userId]);
        return result.rows[0];
    } catch (error) {
        throw new Error(`Error fetching balance summary: ${error.message}`);
    }
};