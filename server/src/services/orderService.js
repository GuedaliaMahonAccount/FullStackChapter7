const { sequelize, Order, OrderItem, Product, User } = require('../models/sql');
const OrderTracking = require('../models/nosql/OrderTracking');
const { logEvent } = require('../utils/logger');
const { createNotification } = require('./notificationService');
const mongoose = require('mongoose');

const placeOrder = async ({ buyerId, shippingAddress, items, paymentIntentId }, req = null) => {
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

      const rates = { USD: 1.0, ILS: 0.27, EUR: 1.08 };
      const rate = rates[product.currency || 'USD'] || 1.0;
      const priceAtPurchase = parseFloat(product.price);
      totalPrice += priceAtPurchase * rate * item.quantity;

      itemsToCreate.push({
        productId: product.id,
        quantity: item.quantity,
        priceAtPurchase,
        sellerId: product.sellerId,
        productTitle: product.title
      });
    }

    // Enforce payment intent ID validation
    if (!paymentIntentId) {
      throw { statusCode: 400, message: 'Validation Error: Stripe paymentIntentId is required to complete checkout.' };
    }

    // Verify payment state with Stripe
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (err) {
      throw { statusCode: 400, message: `Stripe Error: Failed to retrieve payment intent ${paymentIntentId}. ${err.message}` };
    }

    if (paymentIntent.status !== 'succeeded') {
      throw { statusCode: 402, message: `Payment Status: ${paymentIntent.status}. The payment has not completed successfully.` };
    }

    // Ensure the charged amount matches our calculated total to prevent price tampering
    const chargedAmount = paymentIntent.amount / 100;
    if (Math.abs(chargedAmount - totalPrice) > 0.01) {
      throw { statusCode: 400, message: `Validation Error: Stripe charged amount ($${chargedAmount}) does not match order calculation ($${totalPrice}).` };
    }

    // Group items by sellerId
    const itemsBySeller = {};
    for (const item of itemsToCreate) {
      if (!itemsBySeller[item.sellerId]) {
        itemsBySeller[item.sellerId] = [];
      }
      itemsBySeller[item.sellerId].push(item);
    }

    const createdOrders = [];

    // Create separate Order & OrderItems for each seller group
    for (const sellerId of Object.keys(itemsBySeller)) {
      const sellerItems = itemsBySeller[sellerId];
      const sellerTotal = sellerItems.reduce((sum, item) => sum + (item.priceAtPurchase * item.quantity), 0);

      // Create core order record in MySQL
      const order = await Order.create({
        buyerId,
        sellerId,
        totalPrice: sellerTotal,
        shippingAddress,
        paymentStatus: 'paid'
      }, { transaction });

      // Create order items in MySQL
      for (const item of sellerItems) {
        await OrderItem.create({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          priceAtPurchase: item.priceAtPurchase
        }, { transaction });
      }

      createdOrders.push({
        order,
        items: sellerItems,
        sellerId,
        totalPrice: sellerTotal
      });
    }

    // Commit MySQL transaction
    await transaction.commit();

    const buyer = await User.findByPk(buyerId);
    const { sendMockConfirmationEmail } = require('./externalApiService');

    // Run post-commit activities for each created order
    for (const orderData of createdOrders) {
      const { order, items: sellerItems, sellerId, totalPrice: sellerTotal } = orderData;

      // Send email
      if (buyer && buyer.email) {
        try {
          await sendMockConfirmationEmail(buyer.email, order.id, sellerTotal);
        } catch (err) {
          console.error(`Error sending confirmation email for order ${order.id}:`, err.message);
        }
      }

      // Initialize Order Tracking state in MongoDB
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
          console.error(`Error initializing MongoDB order tracking for order ${order.id}:`, err.message);
        }
      }

      // Notify Seller of new purchase
      try {
        await createNotification({
          userId: sellerId,
          title: 'New Order Received!',
          message: `You have received a new order #${order.id} containing ${sellerItems.length} item(s).`,
          type: 'order_status'
        });
      } catch (err) {
        console.error('Error creating seller order notification:', err.message);
      }

      // Log order placement event
      await logEvent({
        eventType: 'ORDER_PLACED',
        userId: buyerId,
        details: { orderId: order.id, totalPrice: sellerTotal, itemCount: sellerItems.length },
        req
      });
    }

    // Return joined order IDs for frontend compatibility
    const joinedOrderIds = createdOrders.map(o => o.order.id).join(', ');

    return {
      orderId: joinedOrderIds,
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
    sellerId: order.sellerId,
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

  let currentStatus = 'Pending';
  let trackingDoc = null;
  if (mongoose.connection.readyState === 1) {
    try {
      trackingDoc = await OrderTracking.findOne({ order_id: orderId });
      if (trackingDoc && trackingDoc.current_status) {
        currentStatus = trackingDoc.current_status;
      }
    } catch (err) {
      console.error('Error fetching MongoDB order status:', err.message);
    }
  }

  // Validate progressive flow transitions
  const statusOrder = ['Pending', 'Ready', 'Shipped', 'Collected'];
  
  if (currentStatus === 'Cancelled') {
    throw { statusCode: 400, message: 'Cannot modify a cancelled order.' };
  }
  if (currentStatus === 'Collected' && status !== 'Collected') {
    throw { statusCode: 400, message: 'Cannot modify a collected order.' };
  }
  
  const allowedStatuses = ['Pending', 'Ready', 'Shipped', 'Collected', 'Cancelled'];

  if (!allowedStatuses.includes(status)) {
    throw { statusCode: 400, message: 'Invalid order status.' };
  }
   
  if (status !== 'Cancelled') {
    const currIndex = statusOrder.indexOf(currentStatus);
    const nextIndex = statusOrder.indexOf(status);
    
    if (currIndex !== -1 && nextIndex !== -1 && nextIndex < currIndex) {
      throw { statusCode: 400, message: `Invalid status transition from ${currentStatus} to ${status}. Statuses can only move forward.` };
    }
  }

  if (mongoose.connection.readyState === 1) {
    try {
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

  // Notify buyer of status update
  try {
    await createNotification({
      userId: order.buyerId,
      title: 'Order Status Updated',
      message: `Your order #${orderId} status has been updated to: ${status}`,
      type: 'order_status'
    });
  } catch (err) {
    console.error('Error creating buyer order status update notification:', err.message);
  }

  return updatePayload;
};

const getSellerOrders = async (sellerId) => {
  const orders = await Order.findAll({
    where: { sellerId },
    include: [
      { model: User, as: 'buyer', attributes: ['id', 'fullName', 'email'] },
      {
        model: OrderItem,
        as: 'items',
        include: [{ model: Product, as: 'product', attributes: ['id', 'title', 'imageUrl'] }]
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  const formattedOrders = [];
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

    formattedOrders.push({
      id: order.id,
      totalPrice: order.totalPrice,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
      buyer: order.buyer,
      status: currentStatus,
      items: order.items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        priceAtPurchase: item.priceAtPurchase,
        product: {
          id: item.product?.id,
          title: item.product?.title,
          imageUrl: item.product?.imageUrl
        }
      }))
    });
  }

  return formattedOrders;
};

const getAllOrders = async () => {
  const orders = await Order.findAll({
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

module.exports = {
  placeOrder,
  getOrderDetails,
  getBuyerOrders,
  updateOrderStatus,
  getSellerOrders,
  getAllOrders
};
