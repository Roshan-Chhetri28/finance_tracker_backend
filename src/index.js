import e from "express";
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import pool from "./config/database.js";
import initializeDatabase from "./database/initdb.js";
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

server.listen(PORT, () => {
    console.info(`Server Started at port ${PORT}`)
})


