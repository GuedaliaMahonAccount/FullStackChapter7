const orderService = require('../services/orderService');
const EventLog = require('../models/nosql/EventLog');
const { User, Role } = require('../models/sql');
const { logEvent } = require('../utils/logger');

const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params; // Order ID
    const { status, notes, carrierName, trackingNumber } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Status string is required.'
      });
    }

    const result = await orderService.updateOrderStatus({
      orderId: id,
      status,
      notes,
      carrierName,
      trackingNumber
    }, req);

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status} successfully.`,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const getLogs = async (req, res, next) => {
  try {
    const logs = await EventLog.find().sort({ created_at: -1 }).limit(100);
    
    // Fetch all users to map user_id to name/email in-memory
    const users = await User.findAll({ attributes: ['id', 'fullName', 'email'] });
    const userMap = users.reduce((acc, u) => {
      acc[u.id] = u;
      return acc;
    }, {});

    const enrichedLogs = logs.map(log => {
      const u = userMap[log.user_id];
      return {
        id: log._id,
        eventType: log.event_type,
        userId: log.user_id,
        userEmail: u ? u.email : 'System/Guest',
        userFullName: u ? u.fullName : 'Guest',
        details: log.details,
        ipAddress: log.ip_address,
        userAgent: log.user_agent,
        createdAt: log.created_at
      };
    });

    res.status(200).json({
      success: true,
      data: enrichedLogs
    });
  } catch (error) {
    next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'fullName', 'email', 'isBlocked', 'createdAt'],
      include: [{ model: Role, as: 'role', attributes: ['name'] }],
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

const toggleBlockUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Prevent blocking oneself (the logged in admin)
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot block your own administrator account.'
      });
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    // Log the event
    const eventType = user.isBlocked ? 'USER_BLOCKED' : 'USER_UNBLOCKED';
    await logEvent({
      eventType,
      userId: req.user.id,
      details: { blockedUserId: user.id, blockedUserEmail: user.email },
      req
    });

    res.status(200).json({
      success: true,
      message: `User ${user.email} has been successfully ${user.isBlocked ? 'blocked' : 'unblocked'}.`,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  updateStatus,
  getLogs,
  getUsers,
  toggleBlockUser
};
