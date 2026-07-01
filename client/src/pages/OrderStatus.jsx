import React, { useState, useEffect } from 'react';
import { useFetch } from '../hooks/useFetch';
import { ShoppingBag, Truck, MapPin, Clock, CheckCircle, Package, RefreshCw } from 'lucide-react';
import { getImageUrl, formatPrice } from '../utils/format';

const STATUS_STEPS = ['Pending', 'Ready', 'Shipped', 'Collected'];

const STATUS_ICONS = {
  Pending:   <Clock size={14} />,
  Ready:     <Package size={14} />,
  Shipped:   <Truck size={14} />,
  Collected: <CheckCircle size={14} />,
};

export const OrderStatus = () => {
  const [orders, setOrders]           = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading]         = useState(true);

  const { get }    = useFetch();

  const fetchOrders = async () => {
    try {
      const res = await get('/orders/buyer', { ttl: Infinity }); // Cached infinitely (invalidated on new order/status update)
      if (res.success) {
        setOrders(res.data);
        if (res.data.length > 0) setSelectedOrder(res.data[0].id);
      }
    } catch (err) {
      console.error('Error fetching buyer orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetails = async () => {
    if (!selectedOrder) return;
    try {
      const res = await get(`/orders/${selectedOrder}`, { ttl: Infinity }); // Cached infinitely (invalidated on new order/status update)
      if (res.success) setOrderDetails(res.data);
    } catch (err) {
      console.error('Error fetching order details:', err);
    }
  };



  const handleRefresh = async () => {
    await fetchDetails();
    try {
      const res = await get('/orders/buyer');
      if (res.success) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error('Error refreshing buyer orders:', err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    fetchDetails();
  }, [selectedOrder]);

  const currentStepIdx = orderDetails
    ? STATUS_STEPS.indexOf(orderDetails.tracking?.current_status || 'Pending')
    : 0;

  if (loading) {
    return <div className="loading-center order-status-style-046" ><div className="spinner spinner-lg" /></div>;
  }

  if (orders.length === 0) {
    return (
      <div className="page-container">
        <div className="glass-panel-static empty-state order-status-style-045" >
          <ShoppingBag size={56} className="empty-state-icon" />
          <h2 className="order-status-style-044">No orders yet</h2>
          <p className="order-status-style-043">You haven't placed any orders yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container order-status-style-042" >

      {/* Header */}
      <div className="order-status-style-041">
        <div>
          <h1 className="order-status-style-040">
            Order <span className="text-gradient">Tracking</span>
          </h1>
          <p className="order-status-style-039">
            Click refresh to check for latest updates
          </p>
        </div>
        <button 
          className="btn btn-secondary order-status-style-038" 
          onClick={handleRefresh} 
          
        >
          <RefreshCw size={14} /> Refresh Status
        </button>
      </div>

      {/* Split Layout: orders list + detail */}
      <div className="sidebar-layout">

        {/* Left: Orders List */}
        <div className="order-status-style-037">
          <h2 className="order-status-style-036">
            Your Purchases
          </h2>

          {orders.map((o) => {
            const isSelected = selectedOrder === o.id;
            return (
              <button
                key={o.id}
                onClick={() => setSelectedOrder(o.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  padding: '16px',
                  borderRadius: 'var(--radius-sm)',
                  width: '100%',
                  textAlign: 'left',
                  cursor: 'pointer',
                  background: isSelected ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isSelected ? 'var(--primary-border)' : 'var(--border)'}`,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.borderColor = 'var(--border-hover)'; }}
                onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                <div className="order-status-style-035">
                  <span className="order-status-style-034">Order #{o.id}</span>
                  <span className="order-status-style-033">
                    {formatPrice(o.totalPrice, o.currency || 'USD')}
                  </span>
                </div>
                <div className="order-status-style-032">
                  <span className="order-status-style-031">
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

        {/* Right: Detail Panel */}
        <div>
          {orderDetails ? (
            <div className="glass-panel-static order-status-style-030" >

              {/* Header */}
              <div className="order-status-style-029">
                <div>
                  <h2 className="order-status-style-028">
                    Order #{orderDetails.orderId}
                  </h2>
                  <p className="order-status-style-027">
                    Placed {new Date(orderDetails.createdAt).toLocaleString()}
                  </p>
                </div>
                <span className={`badge badge-${orderDetails.tracking?.current_status?.toLowerCase() || 'pending'}`} style={{ padding: '5px 14px', fontSize: '0.82rem' }}>
                  {orderDetails.tracking?.current_status || 'Pending'}
                </span>
              </div>

              {/* Progress Stepper */}
              <div className="order-status-style-025">
                <div className="order-status-style-024">
                  {/* Track line */}
                  <div className="order-status-style-023" />
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
                      <div key={step} className="order-status-style-022">
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
                        <span style={{ fontSize: '0.78rem', fontWeight: active ? 700 : 500, color: done ? 'var(--text-primary)' : 'var(--text-muted)', textAlign: 'center' }}>
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Content Grid */}
              <div className="details-grid">

                {/* Items */}
                <div className="order-status-style-021">
                  <h3 className="order-status-style-020">
                    Products
                  </h3>

                  {orderDetails.items.map((item) => (
                    <div
                      key={item.id}
                      className="order-status-style-019"
                    >
                      <img
                        src={getImageUrl(item.product?.imageUrl)}
                        alt={item.product?.title}
                        className="order-status-style-018"
                      />
                      <div className="order-status-style-017">
                        <h4 className="order-status-style-016">
                          {item.product?.title}
                        </h4>
                        <span className="order-status-style-015">
                          {item.quantity}× {formatPrice(item.priceAtPurchase, item.product?.currency || 'USD')}
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Shipping address */}
                  <div className="order-status-style-014">
                    <div className="order-status-style-013">
                      <MapPin size={12} /> Shipping Address
                    </div>
                    <p className="order-status-style-012">{orderDetails.shippingAddress}</p>
                  </div>
                </div>

                {/* Timeline */}
                <div className="order-status-style-011">
                  <h3 className="order-status-style-010">
                    Status Log
                  </h3>

                  {/* Carrier */}
                  {orderDetails.tracking?.carrier_details?.carrier_name && (
                    <div className="alert alert-info order-status-style-009" >
                      <Truck size={16} />
                      <div>
                        <p className="order-status-style-008">{orderDetails.tracking.carrier_details.carrier_name}</p>
                        <p className="order-status-style-007">
                          #{orderDetails.tracking.carrier_details.tracking_number}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Timeline */}
                  <div className="order-status-style-006">
                    {orderDetails.tracking?.status_history?.map((h, i) => {
                      const isLatest = i === orderDetails.tracking.status_history.length - 1;
                      return (
                        <div key={i} className="order-status-style-005">
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
                          <span className="order-status-style-004">
                            {new Date(h.changed_at).toLocaleString()}
                          </span>
                          <span style={{ fontSize: '0.87rem', fontWeight: 700, color: isLatest ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                            {h.status}
                          </span>
                          {h.notes && (
                            <p className="order-status-style-003">{h.notes}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel-static order-status-style-002" >
              <p className="order-status-style-001">Select an order to view tracking details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderStatus;
