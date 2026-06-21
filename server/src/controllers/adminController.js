const orderService = require('../services/orderService');

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
      orderId: parseInt(id, 10),
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

module.exports = {
  updateStatus
};
