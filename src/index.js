import e from "express";
import cors from 'cors';
import dotenv from 'dotenv';
import router from "./routes/auth.js";
import http from 'http';
import pool from "./config/database.js";
// import pool from './config/database.js';
pool
// Load environment variables
dotenv.config();

const app = e()

const PORT = process.env.PORT || 8080

app.use(e.json());
app.use(e.urlencoded({ extended: true })); 
app.use(cors())

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Database connection failed:', err);
    } else {
        console.log('Database connected successfully');
    }
});

const server = http.createServer(app)

app.use('/api/auth', router)


server.listen(PORT, ()=>{
    console.info(`Server Started at port ${PORT}`)
})


