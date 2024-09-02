const dgram = require('dgram');
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const mysql = require('mysql2');
const path = require('path'); // Necesitamos el módulo path para trabajar con rutas
const app = express();
const port = 80;
const udpPort = 60001;

let data = {
    latitude: 'N/A',
    longitude: 'N/A',
    date: 'N/A',
    time: 'N/A',
    provider: 'N/A'
};

// Configuración de conexión a MySQL
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

// HTTP Server
const server = http.createServer(app);

// WebSocket Server
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log('New WebSocket connection');
    ws.on('message', (message) => {
        console.log('Received:', message);
    });
});

// UDP Server
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

        // Enviar los datos más recientes a todos los clientes WebSocket
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

// Sirviendo archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Iniciar el servidor HTTP
server.listen(port, '0.0.0.0', () => {
    console.log(`HTTP Server running at http://localhost:${port}`);
});