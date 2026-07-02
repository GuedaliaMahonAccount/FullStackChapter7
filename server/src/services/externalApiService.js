require('dotenv').config();

/**
 * Simulates card charge with a external payment provider
 */
const processMockPayment = async (amount, cardDetails) => {
  const last4 = cardDetails ? (cardDetails.cardLast4 || 'XXXX') : 'XXXX';
  console.log(`Processing mock payment of $${amount} with card ending in ${last4}`);
  
  // Simulate API network latency (1.5 seconds for visible verification spinner)
  await new Promise(resolve => setTimeout(resolve, 1500));

  // 1. Simulate card expiry check
  if (cardDetails && cardDetails.cardExpiry) {
    const parts = cardDetails.cardExpiry.split('/');
    if (parts.length === 2) {
      const month = parseInt(parts[0], 10);
      const year = parseInt(parts[1], 10) + 2000; // e.g. '24' -> 2024
      
      if (isNaN(month) || month < 1 || month > 12) {
        return { success: false, message: 'Card declined: Invalid expiry month.' };
      }

      const now = new Date();
      const currentMonth = now.getMonth() + 1; // 1-indexed (Jan = 1)
      const currentYear = now.getFullYear();
      
      if (year < currentYear || (year === currentYear && month < currentMonth)) {
        return { success: false, message: 'Card declined: Card has expired.' };
      }
    }
  }

  // 2. Simulate payment decline if card ends in 4444
  if (cardDetails && cardDetails.cardLast4 === '4444') {
    return { success: false, message: 'Card declined: Insufficient funds.' };
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
