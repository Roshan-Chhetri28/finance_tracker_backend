import e from "express";
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import pool from "./config/database.js";
// router
import router from "./routes/auth.js";
import userRouter from './routes/user.js'
import transactionRouter from './routes/transaction.js'

// Load environment variables
dotenv.config();

const app = e()

const PORT = process.env.PORT || 8080

app.use(e.json());
app.use(e.urlencoded({ extended: true })); 
app.use(cors({
  origin: ['https://finance-tracker-j83b.onrender.com', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true
}));

// Function to initialize the database
const initializeDatabase = async () => {
    try {
        // Create users table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        // Create transactions table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS transactions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                type VARCHAR(20) CHECK (type IN ('income', 'expense')) NOT NULL,
                category VARCHAR(100) NOT NULL,
                amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
                description TEXT,
                transaction_date DATE DEFAULT CURRENT_DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        // Create categories table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS categories (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                type VARCHAR(20) CHECK (type IN ('income', 'expense')) NOT NULL,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        // Create indexes
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);`);
        
        // Insert default categories if they don't exist
        await pool.query(`
            INSERT INTO categories (name, type, user_id) 
            VALUES 
                ('Salary', 'income', NULL),
                ('Freelance', 'income', NULL),
                ('Investment', 'income', NULL),
                ('Other Income', 'income', NULL),
                ('Food & Dining', 'expense', NULL),
                ('Transportation', 'expense', NULL),
                ('Shopping', 'expense', NULL),
                ('Entertainment', 'expense', NULL),
                ('Bills & Utilities', 'expense', NULL),
                ('Healthcare', 'expense', NULL),
                ('Education', 'expense', NULL),
                ('Other Expense', 'expense', NULL)
            ON CONFLICT DO NOTHING;
        `);
        
        console.log('Database schema initialized successfully');
    } catch (error) {
        console.error('Error initializing database schema:', error);
    }
};

// Test database connection and initialize schema
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Database connection failed:', err);
    } else {
        console.log('Database connected successfully');
        // Initialize the database schema
        initializeDatabase();
    }
});

const server = http.createServer(app)

app.use('/api/auth', router)
app.use('/api/user', userRouter)
app.use('/api/transactions', transactionRouter)

server.listen(PORT, ()=>{
    console.info(`Server Started at port ${PORT}`)
})


