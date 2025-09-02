import pool from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Stores a message in the conversation history
 * 
 * @param {number} userId - The user ID
 * @param {string} role - Message role ('user', 'assistant', or 'system')
 * @param {string} message - The message content
 * @param {string} [sessionId=null] - Optional conversation session ID
 * @returns {Promise<Object>} - The stored message
 */
export const storeMessage = async (userId, role, message, sessionId = null) => {
    try {
        // If no sessionId is provided, use a fixed value for the user
        const actualSessionId = sessionId || `user_${userId}`;
        
        const query = `
            INSERT INTO conversation_history (user_id, session_id, role, message)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const values = [userId, actualSessionId, role, message];
        const result = await pool.query(query, values);
        return result.rows[0];
    } catch (error) {
        console.error('Error storing message in conversation history:', error);
        throw new Error(`Error storing message: ${error.message}`);
    }
};

/**
 * Retrieves conversation history for a user
 * 
 * @param {number} userId - The user ID
 * @param {number} limit - Maximum number of messages to retrieve
 * @returns {Promise<Array>} - Array of messages
 */
export const getConversationHistory = async (userId, limit = 20) => {
    try {
        const query = `
            SELECT role, message, timestamp
            FROM conversation_history
            WHERE user_id = $1
            ORDER BY timestamp DESC
            LIMIT $2
        `;
        const values = [userId, limit];
        const result = await pool.query(query, values);
        // Return messages in chronological order
        return result.rows.reverse();
    } catch (error) {
        console.error('Error retrieving conversation history:', error);
        throw new Error(`Error retrieving conversation history: ${error.message}`);
    }
};

/**
 * Retrieves conversation history for a specific session
 * @deprecated Use getConversationHistory(userId) instead
 * 
 * @param {number} userId - The user ID
 * @param {string} sessionId - The conversation session ID
 * @param {number} limit - Maximum number of messages to retrieve
 * @returns {Promise<Array>} - Array of messages
 */
export const getSessionConversationHistory = async (userId, sessionId, limit = 10) => {
    try {
        const query = `
            SELECT role, message, timestamp
            FROM conversation_history
            WHERE user_id = $1 AND session_id = $2
            ORDER BY timestamp ASC
            LIMIT $3
        `;
        const values = [userId, sessionId, limit];
        const result = await pool.query(query, values);
        return result.rows;
    } catch (error) {
        console.error('Error retrieving session conversation history:', error);
        throw new Error(`Error retrieving session conversation history: ${error.message}`);
    }
};

/**
 * Creates a new conversation session
 * 
 * @returns {string} - New session ID
 */
export const createNewSession = () => {
    return uuidv4();
};

/**
 * Formats conversation history for AI input
 * 
 * @param {Array} messages - Array of message objects
 * @returns {Array} - Formatted messages for AI input
 */
export const formatHistoryForAI = (messages) => {
    return messages.map(msg => ({
        role: msg.role,
        content: msg.message
    }));
};
