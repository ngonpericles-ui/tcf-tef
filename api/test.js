// Simple test endpoint
module.exports = (req, res) => {
  res.json({
    success: true,
    message: 'Backend is working!',
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.url
  });
};