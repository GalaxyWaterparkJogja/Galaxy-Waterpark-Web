const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const publicController = require('./controllers/publicController');
const { validateReviewQuery } = require('./middlewares/validateQuery');

const app = express();

app.use(express.json());
app.use(cors({ origin: process.env.CLIENT_ORIGIN }));

// Rate Limiter
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, try again later.' }
});

app.use('/api/v1/public', publicLimiter);

// Endpoints
app.get('/public/profile', publicController.getCompanyProfile);
app.get('/public/tickets', publicController.getTicketPrices);
app.get('/public/reviews', validateReviewQuery, publicController.getApprovedReviews);

// Error Handler
app.use((err, req, res, next) => {
  console.error('Internal Error:', err.stack);
  res.status(500).json({ success: false, message: 'Server encountered an error.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend server running on http://localhost:${PORT}`));