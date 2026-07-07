require('dotenv').config();

/**
 * Simulates sending confirmation email (SMTP mock or nodemailer check)
 */
const sendMockConfirmationEmail = async (email, orderId, amount) => {
  console.log(`[EMAIL SEND] Order Confirmation to ${email} for Order #${orderId} (Amount: $${amount})`);
  return true;
};

module.exports = {
  sendMockConfirmationEmail
};
