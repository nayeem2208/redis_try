import express from 'express';
import { redisConnect, client } from './redisConnect.js';
import mySqlPool from './sqlConnection.js';

const app = express();
const port = 3001;

redisConnect().then(() => {
    console.log('Connected to Redis');
}).catch(err => {
    console.error('Failed to connect to Redis', err);
});

app.get('/', async (req, res) => {
    try {
        const userId = req.query.id;
        if (!userId) {
            return res.status(400).send('User ID is required');
        }

        // Try to get the user data from Redis
        const userFromRedis = await client.hGetAll(`user-session:${userId}`);
        if (Object.keys(userFromRedis).length > 0) {
            console.log('Data retrieved from Redis');
            const user = {};
            for (const [key, value] of Object.entries(userFromRedis)) {
                user[key] = value;
            }
            console.log(user,'usersssss')
            return res.json(user);
        }

        // If not found in Redis, fetch from MySQL
        const [rows] = await mySqlPool.query('SELECT * FROM registration WHERE rowid = ?', [userId]);
        if (rows.length > 0) {
            const user = rows[0];

            // Flatten the user object for hSet, handling null values
            const userEntries = Object.entries(user).flatMap(([key, value]) => [key, value !== null ? value.toString() : '']);

            // Save user data to Redis
            await client.hSet(`user-session:${userId}`, userEntries);

            console.log('Data retrieved from MySQL and saved to Redis');
            return res.send(user);
        } else {
            return res.status(404).send('User not found');
        }
    } catch (err) {
        console.error(err);
        return res.status(500).send('Server error');
    }
});

// Connect to MySQL and start the server
mySqlPool
    .query('SELECT 1')
    .then(() => {
        console.log('MySQL DB connected');
        app.listen(port, () => {
            console.log(`Server started on port ${port}`);
        });
    })
    .catch((error) => {
        console.error(error);
    });
