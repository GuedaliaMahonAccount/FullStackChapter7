const { Review, User, Product } = require('../models/sql');
const { logEvent } = require('../utils/logger');
const { createNotification } = require('./notificationService');

const createReview = async ({ rating, comment, productId, buyerId }, req = null) => {
  // Prevent user from reviewing their own product
  const product = await Product.findByPk(productId);
  if (!product) {
    throw { statusCode: 404, message: 'Product listing not found.' };
  }
  if (product.sellerId === buyerId) {
    throw { statusCode: 400, message: 'You cannot rate or review your own product.' };
  }

  const buyer = await User.findByPk(buyerId);
  const buyerName = buyer ? buyer.fullName : 'buyer';

  // Check if buyer already reviewed this product
  const existing = await Review.findOne({
    where: { productId, buyerId }
  });
  if (existing) {
    existing.rating = rating;
    existing.comment = comment;
    await existing.save();

    await logEvent({
      eventType: 'PRODUCT_REVIEW_UPDATED',
      userId: buyerId,
      details: { reviewId: existing.id, productId, rating },
      req
    });

    try {
      await createNotification({
        userId: product.sellerId,
        title: 'Review Updated on Your Product',
        message: `${buyerName} updated their review to ${rating} stars for "${product.title}".`,
        type: 'new_review'
      });
    } catch (err) {
      console.error('Error creating review update notification:', err.message);
    }

    return Review.findByPk(existing.id, {
      include: [{ model: User, as: 'buyer', attributes: ['fullName'] }]
    });
  }

  // Create review
  const review = await Review.create({
    rating,
    comment,
    productId,
    buyerId
  });

  // Log creation log event
  await logEvent({
    eventType: 'PRODUCT_REVIEW_CREATED',
    userId: buyerId,
    details: { reviewId: review.id, productId, rating },
    req
  });

  try {
    await createNotification({
      userId: product.sellerId,
      title: 'New Review on Your Product',
      message: `${buyerName} left a ${rating}-star review for "${product.title}".`,
      type: 'new_review'
    });
  } catch (err) {
    console.error('Error creating review creation notification:', err.message);
  }

  return Review.findByPk(review.id, {
    include: [{ model: User, as: 'buyer', attributes: ['fullName'] }]
  });
};

const getProductReviews = async (productId) => {
  const reviews = await Review.findAll({
    where: { productId },
    include: [{ model: User, as: 'buyer', attributes: ['fullName'] }],
    order: [['createdAt', 'DESC']]
  });

  const count = reviews.length;
  const average = count > 0 
    ? parseFloat((reviews.reduce((sum, r) => sum + r.rating, 0) / count).toFixed(1))
    : 0;

  return {
    reviews,
    count,
    average
  };
};

module.exports = {
  createReview,
  getProductReviews
};
