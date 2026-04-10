const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dns = require('dns');
const http = require('http');
const { Server } = require("socket.io");
require('dotenv').config();

// Fix for MongoDB Atlas DNS resolution issues
dns.setServers(['8.8.8.8', '8.8.4.4']);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// Middleware
app.use(express.json());
app.use(cors());

// Consolidated Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/vault', require('./routes/vault'));
app.use('/api/entity', require('./routes/entity'));
app.use('/api/public', require('./routes/public'));
app.use('/api/verify', require('./routes/verify'));
app.use('/api/kyc', require('./routes/kyc'));
app.use('/api/proof', require('./routes/proof'));
app.use('/api/admin', require('./routes/admin'));

const { router: ledgerRouter, startLedgerPolling } = require('./routes/ledger');
app.use('/api/ledger', ledgerRouter);

// Pass io to others if needed globally
app.set('io', io);

// Root route
app.get('/', (req, res) => {
    res.send('Decentralized KYC API Running');
});

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('MongoDB Connected');
        startLedgerPolling(io);
        server.listen(PORT, () => console.log(`Server started on port ${PORT}`));
    })
    .catch(err => {
        console.error('Database connection error:', err);
        process.exit(1);
    });

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('CRASH DETECTED:', err.stack);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
});
