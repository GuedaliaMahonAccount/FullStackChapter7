const productService = require('../services/productService');

const getProducts = async (req, res, next) => {
  try {
    const { categoryId, search, minPrice, maxPrice } = req.query;
    const products = await productService.getAllProducts({ categoryId, search, minPrice, maxPrice });
    res.status(200).json({
      success: true,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

const getProductDetail = async (req, res, next) => {
  try {
    const product = await productService.getProductById(req.params.id);
    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const { title, description, price, stockQuantity, categoryId, latitude, longitude, address, currency, imageUrl: bodyImageUrl, barcode } = req.body;
    
    // Check if image file is uploaded or remote imageUrl is provided
    let imageUrl = '';
    if (req.file) {
      // Store relative path. The client will prefix with server URL.
      imageUrl = `/uploads/${req.file.filename}`;
    } else if (bodyImageUrl && (bodyImageUrl.startsWith('http://') || bodyImageUrl.startsWith('https://'))) {
      imageUrl = bodyImageUrl;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Product image file or a valid remote image URL is required.'
      });
    }

    const product = await productService.createProduct({
      title,
      description,
      price: parseFloat(price),
      imageUrl,
      stockQuantity: stockQuantity ? parseInt(stockQuantity, 10) : 1,
      categoryId,
      sellerId: req.user.id,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      address: address || null,
      currency: currency || 'USD',
      barcode: barcode || null
    }, req);

    res.status(201).json({
      success: true,
      message: 'Product listing created successfully.',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

const deleteProductListing = async (req, res, next) => {
  try {
    const result = await productService.deleteProduct(req.params.id, req.user.id, req.user.role, req);
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

const updateProductListing = async (req, res, next) => {
  try {
    const { title, description, price, stockQuantity, categoryId, latitude, longitude, address, currency, barcode } = req.body;
    const updated = await productService.updateProduct(
      req.params.id,
      req.user.id,
      req.user.role,
      { title, description, price, stockQuantity, categoryId, latitude, longitude, address, currency, barcode },
      req
    );
    res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};
const getMyProducts = async (req, res, next) => {
  try {
    const products = await productService.getProductsBySellerId(req.user.id);
    res.status(200).json({
      success: true,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

const suggestDescription = async (req, res, next) => {
  try {
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Product title is required.'
      });
    }

    const prompt = `Write a short, engaging product description in English (1-2 sentences) for a product titled: "${title}". Be concise and focus only on describing the product.`;
    const fallbackDescription = `Available for sale: ${title}. High-quality item in excellent condition. Perfect for daily use. Please contact me for details or to arrange pickup.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const apiKey = process.env.GEMINI_API_KEY;

    try {
      let response;
      if (apiKey) {
        // Use Gemini API
        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }]
          }),
          signal: controller.signal
        });
      } else {
        // Use mlvoca API (fallback)
        response = await fetch('https://mlvoca.com/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'tinyllama',
            prompt: prompt,
            stream: false
          }),
          signal: controller.signal
        });
      }

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }

      const data = await response.json();
      let suggestedText = '';

      if (apiKey) {
        suggestedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } else {
        suggestedText = data.response || '';
      }

      // Clean up thinking process if any
      suggestedText = suggestedText.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

      if (!suggestedText) {
        throw new Error('Empty response from AI API');
      }

      return res.status(200).json({
        success: true,
        data: suggestedText
      });
    } catch (apiError) {
      clearTimeout(timeoutId);
      console.warn('AI generation failed, falling back to generic description:', apiError.message);
      
      // Return 200 with the generic fallback description
      return res.status(200).json({
        success: true,
        data: fallbackDescription,
        isFallback: true
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductDetail,
  createProduct,
  deleteProductListing,
  updateProductListing,
  getMyProducts,
  suggestDescription
};

