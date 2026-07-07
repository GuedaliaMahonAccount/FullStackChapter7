import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { ArrowRight } from 'lucide-react';

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#f3f4f6', // Light gray text matching dark mode
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '15px',
      '::placeholder': {
        color: 'rgba(156, 163, 175, 0.6)'
      }
    },
    invalid: {
      color: '#ef4444',
      iconColor: '#ef4444'
    }
  }
};

export const StripeCardForm = ({ onSubmitPayment, isSubmitting, totalPriceFormatted }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!stripe || !elements) {
      return; // Stripe has not loaded yet
    }

    const cardElement = elements.getElement(CardElement);
    onSubmitPayment(stripe, cardElement);
  };

  return (
    <div className="stripe-card-form-style-007">
      <div className="form-group stripe-card-form-style-006" >
        <label className="form-label stripe-card-form-style-005" >
          Card Details (Secured by Stripe)
        </label>
        <div className="stripe-card-form-style-004">
          <div className="stripe-card-form-style-003">
            <CardElement 
              options={CARD_ELEMENT_OPTIONS} 
              onChange={(e) => {
                if (e.error) {
                  setErrorMsg(e.error.message);
                } else {
                  setErrorMsg('');
                }
              }} 
            />
          </div>
        </div>
        {errorMsg && (
          <div className="stripe-card-form-style-002">
            <span>⚠️</span> {errorMsg}
          </div>
        )}
      </div>

      <button
        id="checkout-submit-btn"
        type="submit"
        onClick={handleSubmit}
        className="btn btn-primary btn-lg cart-page-style-001 stripe-card-form-style-001"
        disabled={isSubmitting || !stripe}
        
      >
        {isSubmitting ? (
          <><span className="spinner spinner-sm" /> Processing Secure Payment…</>
        ) : (
          <>Pay & Place Order <ArrowRight size={16} /></>
        )}
      </button>
    </div>
  );
};

export default StripeCardForm;
