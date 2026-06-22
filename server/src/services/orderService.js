const { sequelize, Order, OrderItem, Product, User } = require('../models/sql');
const OrderTracking = require('../models/nosql/OrderTracking');
const { logEvent } = require('../utils/logger');
const mongoose = require('mongoose');

const placeOrder = async ({ buyerId, shippingAddress, items }, req = null) => {
  const transaction = await sequelize.transaction();

  try {
    let totalPrice = 0;
    const itemsToCreate = [];

    // 1. Process items and validate stock
    for (const item of items) {
      const product = await Product.findByPk(item.productId, { transaction });
      if (!product) {
        throw { statusCode: 404, message: `Product with ID ${item.productId} not found.` };
      }

      if (product.stockQuantity < item.quantity) {
        throw { statusCode: 400, message: `Insufficient stock for product "${product.title}". Requested: ${item.quantity}, Available: ${product.stockQuantity}` };
      }

      // Deduct stock
      product.stockQuantity -= item.quantity;
      await product.save({ transaction });

      const priceAtPurchase = parseFloat(product.price);
      totalPrice += priceAtPurchase * item.quantity;

      itemsToCreate.push({
        productId: product.id,
        quantity: item.quantity,
        priceAtPurchase,
        sellerId: product.sellerId,
        productTitle: product.title
      });
    }

    // 2. Create core order record in MySQL
    const order = await Order.create({
      buyerId,
      totalPrice,
      shippingAddress,
      paymentStatus: 'paid' // Auto-set paid for demo purposes
    }, { transaction });

    // 3. Create order items in MySQL
    for (const item of itemsToCreate) {
      await OrderItem.create({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        priceAtPurchase: item.priceAtPurchase
      }, { transaction });
    }

    // Commit MySQL transaction
    await transaction.commit();

    // 4. Initialize Order Tracking state in MongoDB
    if (mongoose.connection.readyState === 1) {
      try {
        await OrderTracking.create({
          order_id: order.id,
          current_status: 'Pending',
          status_history: [{
            status: 'Pending',
            notes: 'Order placed and payment confirmed.'
          }]
        });
      } catch (err) {
        console.error('Error initializing MongoDB order tracking:', err.message);
      }
    }

    // 6. Log order placement event
    await logEvent({
      eventType: 'ORDER_PLACED',
      userId: buyerId,
      details: { orderId: order.id, totalPrice, itemCount: items.length },
      req
    });

    return {
      orderId: order.id,
      totalPrice,
      paymentStatus: 'paid'
    };
  } catch (error) {
    // Rollback MySQL transaction
    await transaction.rollback();
    throw error;
  }
};

const getOrderDetails = async (orderId) => {
  // Fetch from MySQL
  const order = await Order.findByPk(orderId, {
    include: [
      { model: User, as: 'buyer', attributes: ['id', 'fullName', 'email'] },
      {
        model: OrderItem,
        as: 'items',
        include: [{ model: Product, as: 'product', attributes: ['id', 'title', 'imageUrl', 'sellerId'] }]
      }
    ]
  });

  if (!order) {
    throw { statusCode: 404, message: 'Order not found.' };
  }

  // Fetch tracking status history from MongoDB
  let trackingInfo = null;
  if (mongoose.connection.readyState === 1) {
    try {
      trackingInfo = await OrderTracking.findOne({ order_id: orderId });
    } catch (err) {
      console.warn('Could not read order tracking details from MongoDB:', err.message);
    }
  }

  // Fallback if Mongo is offline or missing trackingInfo
  if (!trackingInfo) {
    trackingInfo = {
      current_status: 'Pending',
      status_history: [{
        status: 'Pending',
        changed_at: order.createdAt,
        notes: 'Order registered (tracking history offline).'
      }]
    };
  }

  return {
    orderId: order.id,
    buyer: order.buyer,
    totalPrice: order.totalPrice,
    shippingAddress: order.shippingAddress,
    paymentStatus: order.paymentStatus,
    createdAt: order.createdAt,
    items: order.items,
    tracking: trackingInfo
  };
};

const getBuyerOrders = async (buyerId) => {
  const orders = await Order.findAll({
    where: { buyerId },
    order: [['createdAt', 'DESC']]
  });

  const ordersWithStatus = [];
  for (const order of orders) {
    let currentStatus = 'Pending';
    if (mongoose.connection.readyState === 1) {
      try {
        const tracking = await OrderTracking.findOne({ order_id: order.id }, { current_status: 1 });
        if (tracking) currentStatus = tracking.current_status;
      } catch (err) {
        // ignore
      }
    }
    ordersWithStatus.push({
      id: order.id,
      totalPrice: order.totalPrice,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
      status: currentStatus
    });
  }

  return ordersWithStatus;
};

// Admin order status update
const updateOrderStatus = async ({ orderId, status, notes = '', carrierName = '', trackingNumber = '' }, req = null) => {
  // Validate order existence in SQL
  const order = await Order.findByPk(orderId);
  if (!order) {
    throw { statusCode: 404, message: 'Order not found.' };
  }

  let trackingDoc = null;
  if (mongoose.connection.readyState === 1) {
    try {
      trackingDoc = await OrderTracking.findOne({ order_id: orderId });
      
      if (!trackingDoc) {
        trackingDoc = new OrderTracking({ order_id: orderId });
      }

      trackingDoc.current_status = status;
      
      // Update carrier details if shipped
      if (carrierName) trackingDoc.carrier_details.carrier_name = carrierName;
      if (trackingNumber) trackingDoc.carrier_details.tracking_number = trackingNumber;

      trackingDoc.status_history.push({
        status,
        notes: notes || `Order status updated to ${status}`
      });

      await trackingDoc.save();
    } catch (err) {
      console.error('Error updating MongoDB order tracking:', err.message);
    }
  }

  const updatePayload = {
    orderId,
    status,
    notes,
    carrier_details: trackingDoc ? trackingDoc.carrier_details : { carrier_name: carrierName, tracking_number: trackingNumber },
    changed_at: new Date()
  };

  // Log status change
  await logEvent({
    eventType: 'ORDER_STATUS_CHANGE',
    userId: req && req.user ? req.user.id : null,
    details: { orderId, newStatus: status, notes },
    req
  });

  return updatePayload;
};

const getSellerOrders = async (sellerId) => {
  const orderItems = await OrderItem.findAll({
    include: [
      {
        model: Product,
        as: 'product',
        where: { sellerId }
      },
      {
        model: Order,
        as: 'order',
        include: [
          { model: User, as: 'buyer', attributes: ['id', 'fullName', 'email'] }
        ]
      }
    ]
  });

  const ordersMap = new Map();
  for (const item of orderItems) {
    const order = item.order;
    if (!order) continue;
    if (!ordersMap.has(order.id)) {
      let currentStatus = 'Pending';
      if (mongoose.connection.readyState === 1) {
        try {
          const tracking = await OrderTracking.findOne({ order_id: order.id }, { current_status: 1 });
          if (tracking) currentStatus = tracking.current_status;
        } catch (err) {
          // ignore
        }
      }
      ordersMap.set(order.id, {
        id: order.id,
        totalPrice: order.totalPrice,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
        buyer: order.buyer,
        status: currentStatus,
        items: []
      });
    }

    ordersMap.get(order.id).items.push({
      id: item.id,
      quantity: item.quantity,
      priceAtPurchase: item.priceAtPurchase,
      product: {
        id: item.product.id,
        title: item.product.title,
        imageUrl: item.product.imageUrl
      }
    });
  }

  return Array.from(ordersMap.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

module.exports = {
  placeOrder,
  getOrderDetails,
  getBuyerOrders,
  updateOrderStatus,
  getSellerOrders
};
