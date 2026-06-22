const orderService = require('../services/orderService');

const placeOrder = async (req, res, next) => {
  try {
    const { shippingAddress, items } = req.body;
    const buyerId = req.user.id;

    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Shipping address is required.'
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Shopping cart items list is required.'
      });
    }

    const orderResult = await orderService.placeOrder({
      buyerId,
      shippingAddress,
      items
    }, req);

    res.status(201).json({
      success: true,
      message: 'Order placed successfully.',
      data: orderResult
    });
  } catch (error) {
    next(error);
  }
};

const getOrderDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const orderDetails = await orderService.getOrderDetails(id);
    
    // Ensure only the buyer, seller of items, or Admin can see order details
    const isAuthorized = 
      req.user.role === 'admin' || 
      orderDetails.buyer.id === req.user.id || 
      orderDetails.items.some(item => item.product.sellerId === req.user.id);

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: You are not authorized to view this order.'
      });
    }

    res.status(200).json({
      success: true,
      data: orderDetails
    });
  } catch (error) {
    next(error);
  }
};

const getBuyerOrders = async (req, res, next) => {
  try {
    const buyerId = req.user.id;
    const orders = await orderService.getBuyerOrders(buyerId);
    res.status(200).json({
      success: true,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

const getSellerOrders = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const orders = await orderService.getSellerOrders(sellerId);
    res.status(200).json({
      success: true,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

const updateOrderStatusBySeller = async (req, res, next) => {
  try {
    const { id } = req.params; // Order ID
    const { status, notes, carrierName, trackingNumber } = req.body;
    const sellerId = req.user.id;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Status string is required.'
      });
    }

    // Retrieve order details to check if the user is the seller for any of the items
    const orderDetails = await orderService.getOrderDetails(id);
    
    const isSeller = orderDetails.items.some(item => item.product.sellerId === sellerId);
    const isAdmin = req.user.role === 'admin';

    if (!isSeller && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: You are not authorized to update this order.'
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

module.exports = {
  placeOrder,
  getOrderDetails,
  getBuyerOrders,
  getSellerOrders,
  updateOrderStatusBySeller
};

