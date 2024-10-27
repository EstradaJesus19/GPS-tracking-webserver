// Define constansts and call libraries
const dgram = require('dgram');
const express = require('express');
const http = require('http');
const https = require('https');
const WebSocket = require('ws');
const mysql = require('mysql2');
const path = require('path'); 
const fs = require('fs'); 
const app = express();
const httpPort = 80; 
const httpsPort = 443; 
const udpPort = 60001;

require('dotenv').config();

// Define data structure
let data = {
    latitude: 'N/A',
    longitude: 'N/A',
    date: 'N/A',
    time: 'N/A',
    vel: '0',
    rpm: '0',
    fuel: '0'
};

// Connect to MySQL database
const db = mysql.createConnection({
    host: process.env.db_host,
    user: process.env.db_user,
    password: process.env.db_password,
    database: process.env.db_name
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL');
});

// Define WebSocket server
const credentials = {
    key: fs.readFileSync( process.env.https_key ),
    cert: fs.readFileSync( process.env.https_cert )
};

const httpsServer = https.createServer(credentials, app);

const wss = new WebSocket.Server({ server: httpsServer });

wss.on('connection', (ws) => {
    console.log('New WebSocket connection');
    ws.on('message', (message) => {
        console.log('Received:', message);
    });
});

// Create UDP server and sniffer
const udpServer = dgram.createSocket('udp4');

udpServer.on('message', (msg) => {
    const message = msg.toString();
    const regex = /Lat: ([^,]+), Lon: ([^,]+), Date: ([^,]+), Time: ([^,]+), Vel: ([^,]+), RPM: ([^,]+), Fuel: ([^,]+)/;
    const match = message.match(regex);

    if (match) {
        data = {
            latitude: match[1] || 'N/A',
            longitude: match[2] || 'N/A',
            date: match[3] || 'N/A',
            time: match[4] || 'N/A',
            vel: match[5] || '0',
            rpm: match[6] || '0',
            fuel: match[7] || '0'
        };

        const tableName = process.env.db_table; 

        // Insert received data into database
        db.query(`INSERT INTO ?? (latitude, longitude, date, time, vel, rpm, fuel) VALUES (?, ?, ?, ?, ?, ?, ?)`, 
            [tableName, data.latitude, data.longitude, data.date, data.time, data.vel, data.fuel], 
            (err) => {
                if (err) {
                    console.error('Error inserting into database:', err);
                } else {
                    console.log('Data inserted into database:', data);
                }
            }
        );

        // Send data through web socket
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
            }
        });
    } else {
        console.error('Error parsing message:', message);
    }
});

// Close UDP server
udpServer.bind(udpPort);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Get and send API key
app.get('/api/getApiKey', (req, res) => {
    res.json({ apiKey: process.env.api_key });
});

// Get and send server owner
app.get('/api/getOwner', (req, res) => {
    res.json({ owner: process.env.server_owner });
});

// Get all data from database
app.get('/api/getAllData', (req, res) => {
    const tableName = process.env.db_table;
    db.query('SELECT latitude, longitude, date, time, vel, rpm, fuel FROM ??', [tableName], (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            res.status(500).json({ error: 'Error fetching data' });
        } else {
            res.json(results);
        }
    });
});

// Time filtering query
app.get('/api/filterDataByTime', (req, res) => {
    const { startTime, endTime } = req.query; 
    const tableName = process.env.db_table;

    const query = `SELECT latitude, longitude, date, time
        FROM ?? 
        WHERE CONCAT(date, ' ', time) BETWEEN ? AND ?
    `;

    db.query(query, [tableName, startTime, endTime],
        (err, results) => {
            if (err) {
                console.error('Error fetching filtered data:', err);
                res.status(500).json({ error: 'Error fetching filtered data' });
            } else {
                res.json(results);
            }
        }
    );
});

// Position filtering query
app.get('/api/filterDataByPosition', (req, res) => {
    const { startTime, endTime, latitude, longitude, radius } = req.query;
    const tableName = process.env.db_table;

    const query = `
        SELECT latitude, longitude, date, time 
        FROM ?? 
        WHERE CONCAT(date, ' ', time) BETWEEN ? AND ? 
        AND ST_Distance_Sphere(point(longitude, latitude), point(?, ?)) <= ?;
    `;

    db.query(query, [tableName, startTime, endTime, longitude, latitude, radius], (err, results) => {
        if (err) {
            console.error('Error fetching data by position:', err);
            res.status(500).json({ error: 'Error fetching data by position' });
        } else {
            res.json(results);
        }
    });
});


// Enable HTTP and HTTPS servers
httpsServer.listen(httpsPort, '0.0.0.0', () => {
    console.log(`HTTPS Server running at https://localhost:${httpsPort}`);
});

const httpApp = express();
httpApp.use((req, res) => {
    res.redirect(`https://${req.headers.host}${req.url}`);
});

const httpServer = http.createServer(httpApp);
httpServer.listen(httpPort, '0.0.0.0', () => {
    console.log(`HTTP Server running at http://localhost:${httpPort} and redirecting to HTTPS`);
});