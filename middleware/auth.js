export const requireAdmin = (req, res, next) => {
  const adminKey = req.query.adminKey;
  
  if (!adminKey) {
    return res.status(401).json({
      success: false,
      error: 'Admin key required'
    });
  }
  
  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(403).json({
      success: false,
      error: 'Invalid admin key'
    });
  }
  
  next();
};
