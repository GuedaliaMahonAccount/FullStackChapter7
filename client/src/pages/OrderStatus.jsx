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
      const res = await get('/orders/buyer');
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
      const res = await get(`/orders/${selectedOrder}`);
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
    return <div className="loading-center" style={{ height: '60vh' }}><div className="spinner spinner-lg" /></div>;
  }

  if (orders.length === 0) {
    return (
      <div className="page-container">
        <div className="glass-panel-static empty-state" style={{ padding: '80px 40px' }}>
          <ShoppingBag size={56} className="empty-state-icon" />
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>No orders yet</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>You haven't placed any orders yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', fontWeight: 900 }}>
            Order <span className="text-gradient">Tracking</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Click refresh to check for latest updates
          </p>
        </div>
        <button 
          className="btn btn-secondary" 
          onClick={handleRefresh} 
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '0.88rem', fontWeight: 700, borderRadius: 'var(--radius-sm)' }}
        >
          <RefreshCw size={14} /> Refresh Status
        </button>
      </div>

      {/* Split Layout: orders list + detail */}
      <div className="sidebar-layout">

        {/* Left: Orders List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h2 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px' }}>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Order #{o.id}</span>
                  <span style={{ color: 'var(--secondary)', fontWeight: 800, fontSize: '0.9rem' }}>
                    {formatPrice(o.totalPrice, o.currency || 'USD')}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

        {/* Right: Detail Panel */}
        <div>
          {orderDetails ? (
            <div className="glass-panel-static" style={{ padding: '28px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.2s ease' }}>

              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '18px' }}>
                <div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 900, marginBottom: '4px' }}>
                    Order #{orderDetails.orderId}
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    Placed {new Date(orderDetails.createdAt).toLocaleString()}
                  </p>
                </div>
                <span className={`badge badge-${orderDetails.tracking?.current_status?.toLowerCase() || 'pending'}`} style={{ padding: '5px 14px', fontSize: '0.82rem' }}>
                  {orderDetails.tracking?.current_status || 'Pending'}
                </span>
              </div>

              {/* Progress Stepper */}
              <div style={{ padding: '8px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
                  {/* Track line */}
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    Products
                  </h3>

                  {orderDetails.items.map((item) => (
                    <div
                      key={item.id}
                      style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'rgba(255,255,255,0.025)', padding: '10px 12px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border)' }}
                    >
                      <img
                        src={getImageUrl(item.product?.imageUrl)}
                        alt={item.product?.title}
                        style={{ width: 46, height: 46, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{ fontSize: '0.86rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '2px' }}>
                          {item.product?.title}
                        </h4>
                        <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                          {item.quantity}× {formatPrice(item.priceAtPurchase, item.product?.currency || 'USD')}
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Shipping address */}
                  <div style={{ background: 'rgba(255,255,255,0.025)', padding: '12px 14px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border)', fontSize: '0.83rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', marginBottom: '5px', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                      <MapPin size={12} /> Shipping Address
                    </div>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>{orderDetails.shippingAddress}</p>
                  </div>
                </div>

                {/* Timeline */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    Status Log
                  </h3>

                  {/* Carrier */}
                  {orderDetails.tracking?.carrier_details?.carrier_name && (
                    <div className="alert alert-info" style={{ fontSize: '0.82rem', padding: '10px 14px' }}>
                      <Truck size={16} />
                      <div>
                        <p style={{ fontWeight: 700 }}>{orderDetails.tracking.carrier_details.carrier_name}</p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                          #{orderDetails.tracking.carrier_details.tracking_number}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Timeline */}
                  <div style={{ position: 'relative', paddingLeft: '20px', borderLeft: '2px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {orderDetails.tracking?.status_history?.map((h, i) => {
                      const isLatest = i === orderDetails.tracking.status_history.length - 1;
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
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                            {new Date(h.changed_at).toLocaleString()}
                          </span>
                          <span style={{ fontSize: '0.87rem', fontWeight: 700, color: isLatest ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                            {h.status}
                          </span>
                          {h.notes && (
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>{h.notes}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel-static" style={{ padding: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-md)' }}>
              <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Select an order to view tracking details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderStatus;
