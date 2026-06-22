const jwt = require('jsonwebtoken');
const { User, Role } = require('../models/sql');
require('dotenv').config();

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access Denied: No authentication token provided.'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_token_for_c2c_marketplace_2026_academic_final_project');
    
    // Fetch user and include their role details
    const user = await User.findByPk(decoded.id, {
      include: [{ model: Role, as: 'role' }]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Access Denied: The user account no longer exists.'
      });
    }

    // Attach user object to request
    req.user = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role.name // 'client' or 'admin'
    };

    next();
  } catch (error) {
    console.error('JWT verification error:', error);
    return res.status(403).json({
      success: false,
      message: 'Access Denied: Invalid or expired authentication token.'
    });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access Denied: Administrator role privileges required.'
    });
  }
};

// Ensures the user is either the owner of the resource or an admin
const isOwnerOrAdmin = (getOwnerIdFn) => {
  return async (req, res, next) => {
    try {
      if (req.user.role === 'admin') {
        return next();
      }
      
      const ownerId = await getOwnerIdFn(req);
      if (String(req.user.id) === String(ownerId)) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'Access Denied: You do not own this resource.'
      });
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  verifyToken,
  isAdmin,
  isOwnerOrAdmin
};
