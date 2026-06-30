const authService = require('../services/authService');

const register = async (req, res, next) => {
  try {
    const { email, password, fullName } = req.body;
    const user = await authService.registerUser({ email, password, fullName }, req);
    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const session = await authService.loginUser({ email, password }, req);
    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: session
    });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const profile = await authService.getUserProfile(req.user.id);
    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

const updateProfileBilling = async (req, res, next) => {
  try {
    const { savedAddress, savedCardLast4, savedCardExpiry } = req.body;
    const updated = await authService.updateUserProfileBilling(req.user.id, {
      savedAddress,
      savedCardLast4,
      savedCardExpiry
    });
    res.status(200).json({
      success: true,
      message: 'Billing preferences updated successfully.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfileBilling
};
