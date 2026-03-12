const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/vault', require('./routes/vault'));
app.use('/api/entity', require('./routes/entity'));
app.use('/api/public', require('./routes/public'));
app.use('/api/verify', require('./routes/verify'));

// Root route
app.get('/', (req, res) => {
    res.send('DeKYC Auth API Running');
});

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('MongoDB Connected');
        app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
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
