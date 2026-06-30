const { Review, User } = require('../models/sql');
const { logEvent } = require('../utils/logger');

const createReview = async ({ rating, comment, productId, buyerId }, req = null) => {
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
