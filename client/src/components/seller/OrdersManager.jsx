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
      const res = await get('/orders/seller', { ttl: Infinity }); // Cached infinitely (invalidated on order status updates)
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
        const res = await get(`/orders/${selectedOrderId}`, { ttl: Infinity }); // Cached infinitely (invalidated on order status updates)
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
        const updatedDetails = await get(`/orders/${selectedOrderId}`, { ttl: Infinity }); // Cache the updated details
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
    return <div className="loading-center orders-manager-style-062" ><div className="spinner spinner-lg" /></div>;
  }

  if (orders.length === 0) {
    return (
      <div className="glass-panel-static empty-state orders-manager-style-061" >
        <ShoppingBag size={48} className="empty-state-icon orders-manager-style-060"  />
        <h3 className="orders-manager-style-059">No orders yet</h3>
        <p className="orders-manager-style-058">Nobody has purchased your items yet. Keep sharing your listings!</p>
      </div>
    );
  }

  const getAvailableStatusOptions = (currentStatus) => {
    switch (currentStatus) {
      case 'Pending':
        return ['Pending', 'Ready', 'Cancelled'];
      case 'Ready':
        return ['Ready', 'Shipped', 'Cancelled'];
      case 'Shipped':
        return ['Shipped', 'Collected', 'Cancelled'];
      case 'Collected':
        return ['Collected'];
      case 'Cancelled':
        return ['Cancelled'];
      default:
        return ['Pending', 'Ready', 'Shipped', 'Collected', 'Cancelled'];
    }
  };

  return (
    <div className={`sidebar-layout ${selectedOrderId ? 'order-selected' : 'no-order-selected'}`}>
      
      {/* Left Side: Orders List */}
      <div className="orders-list-col">
        <h3 className="orders-manager-style-057">
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
              <div className="orders-manager-style-056">
                <span className="orders-manager-style-055">Order #{o.id}</span>
                <span className="orders-manager-style-054">
                  {formatPrice(o.totalPrice, o.items?.[0]?.product?.currency || 'USD')}
                </span>
              </div>
              
              <div className="orders-manager-style-053">
                <User size={12} />
                <span>{o.buyer?.fullName || 'Buyer'}</span>
              </div>

              <div className="orders-manager-style-052">
                <span className="orders-manager-style-051">
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
          <div className="glass-panel-static orders-manager-style-050" >
            <div className="spinner" />
          </div>
        ) : orderDetails ? (
          <div className="glass-panel-static order-details-card orders-manager-style-049" >
            
            {/* Mobile Back Button */}
            <button
              className="btn btn-secondary mobile-back-btn orders-manager-style-048"
              onClick={() => setSelectedOrderId(null)}
              
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
                <p className="orders-manager-style-047">
                  Purchased {new Date(orderDetails.createdAt).toLocaleString()}
                </p>
              </div>
              <span className={`badge badge-${orderDetails.tracking?.current_status?.toLowerCase() || 'pending'}`} style={{ padding: '5px 14px', fontSize: '0.82rem' }}>
                {orderDetails.tracking?.current_status || 'Pending'}
              </span>
            </div>

            {/* Progress Stepper */}
            <div className="orders-manager-style-045">
              <div className="orders-manager-style-044">
                <div className="orders-manager-style-043" />
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
                    <div key={step} className="orders-manager-style-042">
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
              <div className="orders-manager-style-041">
                
                {/* Products */}
                <div>
                  <h4 className="orders-manager-style-040">
                    Products Sold
                  </h4>
                  <div className="orders-manager-style-039">
                    {orderDetails.items.map((item) => (
                      <div
                        key={item.id}
                        className="orders-manager-style-038"
                      >
                        <img
                          src={getImageUrl(item.product?.imageUrl)}
                          alt={item.product?.title}
                          className="orders-manager-style-037"
                        />
                        <div className="orders-manager-style-036">
                          <h5 className="orders-manager-style-035">
                            {item.product?.title}
                          </h5>
                          <span className="orders-manager-style-034">
                            Quantity: {item.quantity} × {formatPrice(item.priceAtPurchase, item.product?.currency || 'USD')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Customer Information */}
                <div className="orders-manager-style-033">
                  <div className="orders-manager-style-032">
                    <User size={12} /> Buyer Profile
                  </div>
                  <p className="orders-manager-style-031">{orderDetails.buyer?.fullName}</p>
                  <p className="orders-manager-style-030">{orderDetails.buyer?.email}</p>
                </div>

                {/* Shipping address */}
                <div className="orders-manager-style-029">
                  <div className="orders-manager-style-028">
                    <MapPin size={12} /> Shipping Destination
                  </div>
                  <p className="orders-manager-style-027">{orderDetails.shippingAddress}</p>
                </div>
              </div>

              {/* Right Sub-column: Status Updates & Logs */}
              <div className="orders-manager-style-026">
                
                {/* Status Log Timeline */}
                <div>
                  <h4 className="orders-manager-style-025">
                    History Log
                  </h4>
                  
                  {orderDetails.tracking?.carrier_details?.carrier_name && (
                    <div className="alert alert-info orders-manager-style-024" >
                      <Truck size={16} className="orders-manager-style-023" />
                      <div>
                        <p className="orders-manager-style-022">{orderDetails.tracking.carrier_details.carrier_name}</p>
                        <p className="orders-manager-style-021">
                          Ref: #{orderDetails.tracking.carrier_details.tracking_number}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="orders-manager-style-020">
                    {orderDetails.tracking?.status_history?.map((h, i) => {
                      const isLatest = i === (orderDetails.tracking.status_history.length - 1);
                      return (
                        <div key={i} className="orders-manager-style-019">
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
                          <span className="orders-manager-style-018">
                            {new Date(h.changed_at).toLocaleString()}
                          </span>
                          <span style={{ fontSize: '0.84rem', fontWeight: 700, color: isLatest ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                            {h.status}
                          </span>
                          {h.notes && (
                            <p className="orders-manager-style-017">{h.notes}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>

            {/* Action Update Panel */}
            <div className="orders-manager-style-016">
              <h4 className="orders-manager-style-015">
                Update Fulfillment Status
              </h4>

              {message && (
                <div className="alert alert-success orders-manager-style-014" >
                  <CheckCircle size={16} className="orders-manager-style-013" />
                  <span>{message}</span>
                </div>
              )}

              {errorMsg && (
                <div className="alert alert-error orders-manager-style-012" >
                  <AlertCircle size={16} className="orders-manager-style-011" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleUpdateStatusSubmit} className="orders-manager-style-010">
                <div className="form-group orders-manager-style-009" >
                  <label className="form-label">New Status</label>
                  <select
                    className="form-input orders-manager-style-008"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    
                  >
                    {getAvailableStatusOptions(orderDetails.tracking?.current_status || 'Pending').map(opt => (
                      <option key={opt} value={opt}>
                        {opt === 'Pending' ? 'Pending (Not Started)' :
                         opt === 'Ready' ? 'Ready (Prepared for shipment)' :
                         opt === 'Shipped' ? 'Shipped (In transit)' :
                         opt === 'Collected' ? 'Collected (Delivered / Handed over)' :
                         opt === 'Cancelled' ? 'Cancelled (Aborted)' : opt}
                      </option>
                    ))}
                  </select>
                </div>

                {status === 'Shipped' && (
                  <div className="carrier-info-grid">
                    <div className="form-group orders-manager-style-007" >
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
                    <div className="form-group orders-manager-style-006" >
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

                <div className="form-group orders-manager-style-005" >
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
                  className="btn btn-primary orders-manager-style-004"
                  
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <><span className="spinner spinner-sm orders-manager-style-003"  /> Updating status...</>
                  ) : 'Update Status'}
                </button>
              </form>
            </div>

          </div>
        ) : (
          <div className="glass-panel-static orders-manager-style-002" >
            <p className="orders-manager-style-001">Select an order from the side list to view detail history and perform updates.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default OrdersManager;
