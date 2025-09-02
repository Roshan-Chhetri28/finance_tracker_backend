import OpenAI from "openai";
import dotenv from "dotenv";
import * as trackServices from "./track.services.js";
import * as conversationServices from "./conversation.services.js";
import pool from "../config/database.js";

dotenv.config();

// Initialize OpenAI client for X.AI API
const openai = new OpenAI({
  apiKey: process.env.X_AI_API_KEY,
  baseURL: "https://api.x.ai/v1"
});

/**
 * Format financial data into a summary for AI context
 * @param {number} userId - User ID
 * @returns {Promise<string>} - Formatted financial summary
 */
export const prepareFinancialContext = async (userId) => {
  try {
    // Get all transactions
    const transactions = await trackServices.getAllTransactions(userId);
    
    // Get balance summary
    const balanceSummary = await trackServices.getBalanceSummary(userId);
    
    // Get categories
    const categoriesQuery = await pool.query(
      "SELECT name, type FROM categories WHERE user_id IS NULL OR user_id = $1",
      [userId]
    );
    const categories = categoriesQuery.rows;
    
    // Recent income transactions (last 5)
    const recentIncomes = transactions
      .filter(t => t.type === "income")
      .slice(0, 5);
      
    // Recent expense transactions (last 5)
    const recentExpenses = transactions
      .filter(t => t.type === "expense")
      .slice(0, 5);
      
    // Monthly stats (this month)
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthlyTransactions = transactions.filter(t => {
      const transDate = new Date(t.transaction_date);
      return transDate >= firstDay && transDate <= today;
    });
    
    const monthlyIncome = monthlyTransactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
    const monthlyExpenses = monthlyTransactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    // Format the context for the AI
    const context = `
FINANCIAL SUMMARY:
Total Income: $${parseFloat(balanceSummary.total_income || 0).toFixed(2)}
Total Expenses: $${parseFloat(balanceSummary.total_expenses || 0).toFixed(2)}
Current Balance: $${parseFloat(balanceSummary.balance || 0).toFixed(2)}

THIS MONTH:
Monthly Income: $${monthlyIncome.toFixed(2)}
Monthly Expenses: $${monthlyExpenses.toFixed(2)}
Monthly Balance: $${(monthlyIncome - monthlyExpenses).toFixed(2)}

RECENT INCOME TRANSACTIONS:
${recentIncomes.map(t => `- ${new Date(t.transaction_date).toLocaleDateString()}: $${parseFloat(t.amount).toFixed(2)} (${t.category}) - ${t.description || 'No description'}`).join('\n')}

RECENT EXPENSE TRANSACTIONS:
${recentExpenses.map(t => `- ${new Date(t.transaction_date).toLocaleDateString()}: $${parseFloat(t.amount).toFixed(2)} (${t.category}) - ${t.description || 'No description'}`).join('\n')}

AVAILABLE CATEGORIES:
Income: ${categories.filter(c => c.type === 'income').map(c => c.name).join(', ')}
Expense: ${categories.filter(c => c.type === 'expense').map(c => c.name).join(', ')}
`;

    return context;
  } catch (error) {
    console.error("Error preparing financial context:", error);
    throw new Error(`Error preparing financial context: ${error.message}`);
  }
};

/**
 * Get financial advice from AI advisor with conversation history
 * @param {number} userId - User ID
 * @param {string} query - User's question
 * @param {string} sessionId - Not used anymore, kept for backwards compatibility
 * @returns {Promise<Object>} - AI response
 */
export const getFinancialAdvice = async (userId, query, sessionId = null) => {
  try {
    // Prepare financial context
    const financialContext = await prepareFinancialContext(userId);
    
    // Prepare system prompt with financial expertise instructions
    const systemPrompt = `
You are an expert financial advisor helping a user with their financial tracking and planning.
You have access to their financial data, which is provided below.
Provide clear, actionable financial advice based on their question and the financial data.
Always be professional, helpful, and focused on improving their financial health.
Do not make up information that isn't in the provided data.
If you need more data to give good advice, suggest what information would be helpful.
Remember the conversation history and maintain context with the user.
every thing is measured in rupees ₹

${financialContext}
`;

    // Store the user's query in conversation history (no sessionId needed)
    await conversationServices.storeMessage(userId, 'user', query);
    
    // Retrieve user's conversation history
    const history = await conversationServices.getConversationHistory(userId);
    
    // Format messages for AI, starting with system message
    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationServices.formatHistoryForAI(history)
    ];
    
    // Call X.AI API with Grok model
    const response = await openai.chat.completions.create({
      model: "grok-3-mini",  // Using X.AI's Grok model
      messages: messages,
      temperature: 0.5,
      max_tokens: 800
    });
    
    const aiResponse = response.choices[0]?.message?.content || 
      "Sorry, I couldn't generate advice at this time.";
    
    // Store the AI's response in conversation history (no sessionId needed)
    await conversationServices.storeMessage(userId, 'assistant', aiResponse);
    
    return {
      advice: aiResponse
    };
  } catch (error) {
    console.error("Error getting financial advice:", error);
    throw new Error(`Error getting financial advice: ${error.message}`);
  }
};
