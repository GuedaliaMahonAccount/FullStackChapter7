import React, { useState, useEffect } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { ShoppingBag, Truck, MapPin, Clock, CheckCircle, Package, User, AlertCircle, ArrowLeft } from 'lucide-react';
import { getImageUrl, formatPrice } from '../../utils/format';

const STATUS_STEPS = ['Pending', 'Ready', 'Shipped', 'Collected'];

const STATUS_ICONS = {
  Pending:   <Clock size={14} />,
  Ready:     <Package size={14} />,
  Shipped:   <Truck size={14} />,
  Collected: <CheckCircle size={14} />,
};

export const OrdersManager = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Status update form states
  const [status, setStatus] = useState('Ready');
  const [notes, setNotes] = useState('');
  const [carrierName, setCarrierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { get, patch } = useFetch();

  // Fetch orders where logged-in user is seller
  const fetchSellerOrders = async (shouldSelectFirst = true) => {
    try {
      const res = await get('/orders/seller');
      if (res.success) {
        setOrders(res.data);
        const isDesktop = window.innerWidth > 768;
        if (shouldSelectFirst && res.data.length > 0 && isDesktop) {
          setSelectedOrderId(res.data[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching seller orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellerOrders(true);
  }, []);

  // Fetch specific order details (including tracking info) when selectedOrderId changes
  useEffect(() => {
    if (!selectedOrderId) {
      setOrderDetails(null);
      return;
    }

    const fetchDetails = async () => {
      setDetailsLoading(true);
      try {
        const res = await get(`/orders/${selectedOrderId}`);
        if (res.success) {
          setOrderDetails(res.data);
          // Set status dropdown to match current status
          setStatus(res.data.tracking?.current_status || 'Ready');
        }
      } catch (err) {
        console.error('Error fetching order details:', err);
      } finally {
        setDetailsLoading(false);
      }
    };
    fetchDetails();
  }, [selectedOrderId]);

  // Handle status update form submission
  const handleUpdateStatusSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    setErrorMsg('');

    try {
      const res = await patch(`/orders/${selectedOrderId}/status`, {
        status,
        notes,
        carrierName: status === 'Shipped' ? carrierName : '',
        trackingNumber: status === 'Shipped' ? trackingNumber : ''
      });

      if (res.success) {
        setMessage(`Order #${selectedOrderId} updated to "${status}" ✓`);
        setNotes('');
        setCarrierName('');
        setTrackingNumber('');
        // Reload list to sync statuses without reset selection
        fetchSellerOrders(false);
        // Refresh local details
        const updatedDetails = await get(`/orders/${selectedOrderId}`);
        if (updatedDetails.success) {
          setOrderDetails(updatedDetails.data);
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update order status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectOrder = (orderId) => {
    setSelectedOrderId(orderId);
    setMessage('');
    setErrorMsg('');
  };

  const currentStepIdx = orderDetails?.tracking
    ? STATUS_STEPS.indexOf(orderDetails.tracking.current_status || 'Pending')
    : 0;

  if (loading) {
    return <div className="loading-center" style={{ height: '40vh' }}><div className="spinner spinner-lg" /></div>;
  }

  if (orders.length === 0) {
    return (
      <div className="glass-panel-static empty-state" style={{ padding: '50px 30px' }}>
        <ShoppingBag size={48} className="empty-state-icon" style={{ color: 'var(--primary)' }} />
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>No orders yet</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Nobody has purchased your items yet. Keep sharing your listings!</p>
      </div>
    );
  }

  return (
    <div className={`sidebar-layout ${selectedOrderId ? 'order-selected' : 'no-order-selected'}`}>
      
      {/* Left Side: Orders List */}
      <div className="orders-list-col">
        <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px' }}>
          Incoming Orders ({orders.length})
        </h3>

        {orders.map((o) => {
          const isSelected = selectedOrderId === o.id;
          return (
            <button
              key={o.id}
              onClick={() => handleSelectOrder(o.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '16px',
                borderRadius: 'var(--radius-sm)',
                width: '100%',
                textAlign: 'left',
                cursor: 'pointer',
                background: isSelected ? 'rgba(20,184,166,0.1)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.borderColor = 'var(--border-hover)'; }}
              onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', wordBreak: 'break-all', flex: 1, minWidth: '120px' }}>Order #{o.id}</span>
                <span style={{ color: 'var(--secondary)', fontWeight: 800, fontSize: '0.9rem', flexShrink: 0 }}>
                  {formatPrice(o.totalPrice, o.items?.[0]?.product?.currency || 'USD')}
                </span>
              </div>
              
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <User size={12} />
                <span>{o.buyer?.fullName || 'Buyer'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginTop: '4px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {new Date(o.createdAt).toLocaleDateString()}
                </span>
                <span className={`badge badge-${o.status?.toLowerCase() || 'pending'}`}>
                  {o.status}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Right Side: Details & Action Panel */}
      <div className="orders-detail-col">
        {detailsLoading ? (
          <div className="glass-panel-static" style={{ padding: '80px', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: 'var(--radius-md)' }}>
            <div className="spinner" />
          </div>
        ) : orderDetails ? (
          <div className="glass-panel-static order-details-card" style={{ borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.2s ease' }}>
            
            {/* Mobile Back Button */}
            <button
              className="btn btn-secondary mobile-back-btn"
              onClick={() => setSelectedOrderId(null)}
              style={{
                alignSelf: 'flex-start',
                gap: '6px',
                fontSize: '0.85rem',
                padding: '6px 12px'
              }}
            >
              <ArrowLeft size={14} />
              Back to Orders
            </button>

            {/* Header */}
            <div className="order-details-header">
              <div>
                <h3 className="order-details-title">
                  Order #{orderDetails.orderId} Details
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  Purchased {new Date(orderDetails.createdAt).toLocaleString()}
                </p>
              </div>
              <span className={`badge badge-${orderDetails.tracking?.current_status?.toLowerCase() || 'pending'}`} style={{ padding: '5px 14px', fontSize: '0.82rem' }}>
                {orderDetails.tracking?.current_status || 'Pending'}
              </span>
            </div>

            {/* Progress Stepper */}
            <div style={{ padding: '8px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 16, left: '8%', right: '8%', height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }} />
                <div style={{
                  position: 'absolute',
                  top: 16,
                  left: '8%',
                  width: `${(currentStepIdx / (STATUS_STEPS.length - 1)) * 84}%`,
                  height: 3,
                  background: 'linear-gradient(90deg, var(--secondary), var(--primary))',
                  borderRadius: 2,
                  transition: 'width 0.6s ease',
                  boxShadow: '0 0 12px rgba(20,184,166,0.5)',
                }} />

                {STATUS_STEPS.map((step, idx) => {
                  const done   = idx <= currentStepIdx;
                  const active = idx === currentStepIdx;
                  return (
                    <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 2, flex: 1 }}>
                      <div style={{
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        background: done ? (active ? 'var(--secondary)' : 'var(--primary)') : 'rgba(255,255,255,0.05)',
                        border: `2px solid ${done ? (active ? 'var(--secondary)' : 'var(--primary)') : 'rgba(255,255,255,0.1)'}`,
                        color: done ? '#fff' : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: active ? '0 0 18px rgba(20,184,166,0.6)' : 'none',
                        transition: 'all 0.35s ease',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                      }}>
                        {STATUS_ICONS[step]}
                      </div>
                      <span className="step-label" style={{ fontWeight: active ? 700 : 500, color: done ? 'var(--text-primary)' : 'var(--text-muted)', textAlign: 'center' }}>
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Main Content Info */}
            <div className="details-grid">
              
              {/* Left Sub-column: Products sold & delivery */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Products */}
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>
                    Products Sold
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {orderDetails.items.map((item) => (
                      <div
                        key={item.id}
                        style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border)' }}
                      >
                        <img
                          src={getImageUrl(item.product?.imageUrl)}
                          alt={item.product?.title}
                          style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h5 style={{ fontSize: '0.86rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '2px' }}>
                            {item.product?.title}
                          </h5>
                          <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                            Quantity: {item.quantity} × {formatPrice(item.priceAtPurchase, item.product?.currency || 'USD')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Customer Information */}
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 14px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border)', fontSize: '0.83rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', marginBottom: '6px', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                    <User size={12} /> Buyer Profile
                  </div>
                  <p style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{orderDetails.buyer?.fullName}</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{orderDetails.buyer?.email}</p>
                </div>

                {/* Shipping address */}
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 14px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border)', fontSize: '0.83rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', marginBottom: '5px', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                    <MapPin size={12} /> Shipping Destination
                  </div>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>{orderDetails.shippingAddress}</p>
                </div>
              </div>

              {/* Right Sub-column: Status Updates & Logs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Status Log Timeline */}
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '12px' }}>
                    History Log
                  </h4>
                  
                  {orderDetails.tracking?.carrier_details?.carrier_name && (
                    <div className="alert alert-info" style={{ fontSize: '0.82rem', padding: '10px 14px', marginBottom: '12px', gap: '10px' }}>
                      <Truck size={16} style={{ flexShrink: 0 }} />
                      <div>
                        <p style={{ fontWeight: 700 }}>{orderDetails.tracking.carrier_details.carrier_name}</p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                          Ref: #{orderDetails.tracking.carrier_details.tracking_number}
                        </p>
                      </div>
                    </div>
                  )}

                  <div style={{ position: 'relative', paddingLeft: '20px', borderLeft: '2px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {orderDetails.tracking?.status_history?.map((h, i) => {
                      const isLatest = i === (orderDetails.tracking.status_history.length - 1);
                      return (
                        <div key={i} style={{ position: 'relative' }}>
                          <div style={{
                            position: 'absolute',
                            left: '-27px',
                            top: 5,
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            background: isLatest ? 'var(--secondary)' : 'var(--text-muted)',
                            boxShadow: isLatest ? '0 0 8px var(--secondary)' : 'none',
                            border: `2px solid ${isLatest ? 'var(--secondary)' : 'transparent'}`,
                          }} />
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>
                            {new Date(h.changed_at).toLocaleString()}
                          </span>
                          <span style={{ fontSize: '0.84rem', fontWeight: 700, color: isLatest ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                            {h.status}
                          </span>
                          {h.notes && (
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.4 }}>{h.notes}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>

            {/* Action Update Panel */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#fff' }}>
                Update Fulfillment Status
              </h4>

              {message && (
                <div className="alert alert-success" style={{ padding: '12px 16px', fontSize: '0.85rem' }}>
                  <CheckCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{message}</span>
                </div>
              )}

              {errorMsg && (
                <div className="alert alert-error" style={{ padding: '12px 16px', fontSize: '0.85rem' }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleUpdateStatusSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">New Status</label>
                  <select
                    className="form-input"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    style={{ background: 'var(--bg-card)' }}
                  >
                    <option value="Pending">Pending (Not Started)</option>
                    <option value="Ready">Ready (Prepared for shipment)</option>
                    <option value="Shipped">Shipped (In transit)</option>
                    <option value="Collected">Collected (Delivered / Handed over)</option>
                    <option value="Cancelled">Cancelled (Aborted)</option>
                  </select>
                </div>

                {status === 'Shipped' && (
                  <div className="carrier-info-grid">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Carrier Company</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. UPS, FedEx, DHL"
                        value={carrierName}
                        onChange={(e) => setCarrierName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Tracking ID / Number</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. 1Z999AA10123456784"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Status Notes / Remarks</label>
                  <textarea
                    className="form-input"
                    rows={2}
                    placeholder="Specify shipping updates or collection details for the buyer."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px', fontWeight: 700, borderRadius: 'var(--radius-sm)' }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <><span className="spinner spinner-sm" style={{ borderTopColor: '#fff', marginRight: '8px' }} /> Updating status...</>
                  ) : 'Update Status'}
                </button>
              </form>
            </div>

          </div>
        ) : (
          <div className="glass-panel-static" style={{ padding: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-md)' }}>
            <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Select an order from the side list to view detail history and perform updates.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default OrdersManager;
