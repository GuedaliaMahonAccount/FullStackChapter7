const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Product } = require('../models/sql');

const createPaymentIntent = async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Cart items are required.'
      });
    }

    let totalPrice = 0;

    // Calculate total price securely from database records and convert all currencies to USD
    const rates = { USD: 1.0, ILS: 0.27, EUR: 1.08 };

    for (const item of items) {
      const product = await Product.findByPk(item.productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product with ID ${item.productId} not found.`
        });
      }

      const rate = rates[product.currency || 'USD'] || 1.0;
      totalPrice += parseFloat(product.price) * rate * item.quantity;
    }

    if (totalPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Total price must be greater than zero.'
      });
    }

    // Create a PaymentIntent with the order details
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalPrice * 100), // amount in cents
      currency: 'usd',
      metadata: {
        buyerId: req.user.id
      }
    });

    res.status(200).json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        totalPrice
      }
    });
  } catch (error) {
    console.error('Error creating Stripe PaymentIntent:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment intent.',
      error: error.message
    });
  }
};

const getPublishableKey = (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
    }
  });
};

module.exports = {
  createPaymentIntent,
  getPublishableKey
};
