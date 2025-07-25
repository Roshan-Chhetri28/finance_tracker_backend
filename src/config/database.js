import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// Use the connection string based on environment
const connectionString = process.env.NODE_ENV === 'production' 
    ? process.env.psql_prod 
    : process.env.psql_dev;

const pool = new Pool({
    connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

// Test the connection
pool.on('connect', () => {
    console.log('Connected to PostgreSQL database (Neon)');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

export default pool;
