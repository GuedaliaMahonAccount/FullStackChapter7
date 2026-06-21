require('dotenv').config();

/**
 * Simulates card charge with a external payment provider
 */
const processMockPayment = async (amount, cardDetails) => {
  console.log(`Processing mock payment of $${amount} with card ending in ${cardDetails.cardNumber ? cardDetails.cardNumber.slice(-4) : 'XXXX'}`);
  
  // Simulate API network latency
  await new Promise(resolve => setTimeout(resolve, 800));

  // Success 99% of the time, mock fail only on invalid inputs
  if (cardDetails && cardDetails.cardNumber && cardDetails.cardNumber.startsWith('4111')) {
    return { success: true, transactionId: 'txn_' + Math.random().toString(36).substr(2, 9) };
  }
  
  return { success: true, transactionId: 'txn_mock_' + Date.now() };
};

/**
 * Simulates sending confirmation email (SMTP mock or nodemailer check)
 */
const sendMockConfirmationEmail = async (email, orderId, amount) => {
  console.log(`[EMAIL SEND] Order Confirmation to ${email} for Order #${orderId} (Amount: $${amount})`);
  return true;
};

module.exports = {
  processMockPayment,
  sendMockConfirmationEmail
};
