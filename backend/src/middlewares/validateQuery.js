const { z } = require('zod');

const reviewQuerySchema = z.object({
  limit: z.string().optional().transform((val) => {
    const parsed = parseInt(val, 10);
    return isNaN(parsed) || parsed < 1 ? 5 : Math.min(parsed, 20);
  })
});

const validateReviewQuery = (req, res, next) => {
  try {
    req.query.limit = reviewQuerySchema.parse(req.query).limit;
    next();
  } catch (error) {
    res.status(400).json({ success: false, message: 'Invalid query parameters.' });
  }
};

module.exports = { validateReviewQuery };