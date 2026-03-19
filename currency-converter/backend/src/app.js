const express = require('express');
const cors = require('cors');
const ratesRouter = require('./routes/rates');

const app = express();
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use('/api', ratesRouter);

module.exports = app;