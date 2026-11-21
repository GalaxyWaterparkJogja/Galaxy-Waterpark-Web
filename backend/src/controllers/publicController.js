const db = require('../config/database');

// GET /api/v1/public/profile
exports.getCompanyProfile = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT name, description, operating_hours, maps_embed_url, whatsapp_number FROM company_profiles LIMIT 1'
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Profile data not found.' });
    }

    res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/public/tickets
exports.getTicketPrices = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT id, category_name, price, height_requirement, description FROM ticket_prices ORDER BY price ASC'
    );
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/public/reviews
exports.getApprovedReviews = async (req, res, next) => {
  try {
    const limit = req.query.limit || 5;
    // Parameterized binding with MySQL ? placeholders
    const [rows] = await db.query(
      'SELECT id, reviewer_name, rating, comment_text, created_at FROM reviews WHERE status = ? ORDER BY created_at DESC LIMIT ?',
      ['approved', Number(limit)]
    );
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
};