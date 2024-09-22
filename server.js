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

let data = {
    latitude: 'N/A',
    longitude: 'N/A',
    date: 'N/A',
    time: 'N/A'
};

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

const udpServer = dgram.createSocket('udp4');

udpServer.on('message', (msg) => {
    const message = msg.toString();
    const regex = /Lat: ([^,]+), Lon: ([^,]+), Date: ([^,]+), Time: ([^,]+)/;
    const match = message.match(regex);

    if (match) {
        data = {
            latitude: match[1] || 'N/A',
            longitude: match[2] || 'N/A',
            date: match[3] || 'N/A',
            time: match[4] || 'N/A'
        };

        const tableName = process.env.db_table; 

        db.query(`INSERT INTO ?? (latitude, longitude, date, time) VALUES (?, ?, ?, ?)`, 
            [tableName, data.latitude, data.longitude, data.date, data.time], 
            (err) => {
                if (err) {
                    console.error('Error inserting into database:', err);
                } else {
                    console.log('Data inserted into database:', data);
                }
            }
        );

        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
            }
        });
    } else {
        console.error('Error parsing message:', message);
    }
});

udpServer.bind(udpPort);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/getApiKey', (req, res) => {
    res.json({ apiKey: process.env.api_key });
});

app.get('/api/getOwner', (req, res) => {
    res.json({ owner: process.env.server_owner });
});

app.get('/api/getAllData', (req, res) => {
    const tableName = process.env.db_table;
    db.query('SELECT latitude, longitude, date, time FROM ??', [tableName], (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            res.status(500).json({ error: 'Error fetching data' });
        } else {
            res.json(results);
        }
    });
});

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