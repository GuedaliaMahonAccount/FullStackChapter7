const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Role } = require('../models/sql');
const { logEvent } = require('../utils/logger');
require('dotenv').config();

const registerUser = async ({ email, password, fullName }, req = null) => {
  // Check if user already exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw { statusCode: 409, message: 'Email address is already in use.' };
  }

  // Get default 'client' role
  const role = await Role.findOne({ where: { name: 'client' } });
  if (!role) {
    throw { statusCode: 500, message: 'Default client role not configured.' };
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create User
  const user = await User.create({
    email,
    passwordHash,
    fullName,
    roleId: role.id
  });

  // Log registration event to MongoDB
  await logEvent({
    eventType: 'USER_REGISTER',
    userId: user.id,
    details: { email, fullName, role: 'client' },
    req
  });

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: 'client'
  };
};

const loginUser = async ({ email, password }, req = null) => {
  // Find user and include their role
  const user = await User.findOne({
    where: { email },
    include: [{ model: Role, as: 'role' }]
  });

  if (!user) {
    throw { statusCode: 401, message: 'Invalid email or password.' };
  }

  // Verify password
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw { statusCode: 401, message: 'Invalid email or password.' };
  }

  if (user.isBlocked) {
    throw { statusCode: 403, message: 'Access Denied: Your account has been blocked by the administrator.' };
  }

  // Generate JWT token
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role.name
  };

  const secret = process.env.JWT_SECRET || 'super_secret_jwt_token_for_c2c_marketplace_2026_academic_final_project';
  const token = jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });

  // Log login event
  await logEvent({
    eventType: 'USER_LOGIN',
    userId: user.id,
    details: { email: user.email, role: user.role.name },
    req
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role.name,
      savedAddress: user.savedAddress,
      savedCardLast4: user.savedCardLast4,
      savedCardExpiry: user.savedCardExpiry
    }
  };
};

const getUserProfile = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: ['id', 'email', 'fullName', 'avatarUrl', 'createdAt', 'savedAddress', 'savedCardLast4', 'savedCardExpiry'],
    include: [{ model: Role, as: 'role', attributes: ['name'] }]
  });

  if (!user) {
    throw { statusCode: 404, message: 'User profile not found.' };
  }

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
    role: user.role.name,
    createdAt: user.createdAt,
    savedAddress: user.savedAddress,
    savedCardLast4: user.savedCardLast4,
    savedCardExpiry: user.savedCardExpiry
  };
};

const updateUserProfileBilling = async (userId, { savedAddress, savedCardLast4, savedCardExpiry }) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw { statusCode: 404, message: 'User not found.' };
  }
  
  if (savedAddress !== undefined) user.savedAddress = savedAddress;
  if (savedCardLast4 !== undefined) user.savedCardLast4 = savedCardLast4;
  if (savedCardExpiry !== undefined) user.savedCardExpiry = savedCardExpiry;
  
  await user.save();
  
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    savedAddress: user.savedAddress,
    savedCardLast4: user.savedCardLast4,
    savedCardExpiry: user.savedCardExpiry
  };
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfileBilling
};
