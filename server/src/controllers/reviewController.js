const reviewService = require('../services/reviewService');

const addReview = async (req, res, next) => {
  try {
    const { rating, comment, productId } = req.body;
    if (!rating || !productId) {
      return res.status(400).json({
        success: false,
        message: 'Rating and productId are required fields.'
      });
    }

    const review = await reviewService.createReview({
      rating: parseInt(rating, 10),
      comment,
      productId,
      buyerId: req.user.id
    }, req);

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully.',
      data: review
    });
  } catch (error) {
    next(error);
  }
};

const getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const data = await reviewService.getProductReviews(productId);
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addReview,
  getProductReviews
};
