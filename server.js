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

let data = {
    latitude: 'NA',
    longitude: 'NA',
    date: 'NA',
    time: 'NA',
    provider: 'NA'
};

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Tr4ckIt_01',
    database: 'tracking_app_db'
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL');
});

db.query('TRUNCATE TABLE location_data', (err) => {
    if (err) {
        console.error('Error truncating table:', err);
    } else {
        console.log('Table truncated');
    }
});

const credentials = {
    key: fs.readFileSync('/etc/letsencrypt/live/trackit03.ddns.net/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/trackit03.ddns.net/fullchain.pem')
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
    const regex = /Lat: ([^,]+), Lon: ([^,]+), Date: ([^,]+), Time: ([^,]+), Provider: (.+)/;
    const match = message.match(regex);

    if (match) {
        data = {
            latitude: match[1] || 'N/A',
            longitude: match[2] || 'N/A',
            date: match[3] || 'N/A',
            time: match[4] || 'N/A',
            provider: match[5] || 'N/A'
        };

        db.query('INSERT INTO location_data (latitude, longitude, date, time, provider) VALUES (?, ?, ?, ?, ?)', 
            [data.latitude, data.longitude, data.date, data.time, data.provider], 
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
