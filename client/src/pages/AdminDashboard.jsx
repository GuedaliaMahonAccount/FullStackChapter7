import React, { useState, useEffect } from 'react';
import { useFetch } from '../hooks/useFetch';
import { Shield, CheckCircle } from 'lucide-react';

export const AdminDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Status Change Forms
  const [status, setStatus] = useState('Ready');
  const [notes, setNotes] = useState('');
  const [carrierName, setCarrierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { get, patch } = useFetch();

  // Fetch all orders
  const fetchAllOrders = async () => {
    setLoading(true);
    try {
      // In this C2C demo, let's fetch buyer orders which lists purchases, 
      // or implement a generic admin fetch. Let's hit the admin endpoint or orders.
      // Since SQL has orders table, we can fetch all orders by mapping.
      // Let's create an admin endpoint on backend or fetch buyer orders.
      // In our routes/adminRoutes we mounted PATCH, let's add a GET route for all orders
      // or we can fetch them. Wait! In orderRoutes we have getBuyerOrders, 
      // but let's just make it simple: in a real admin portal, we retrieve all orders. 
      // Let's call GET /orders/buyer which fetches buyer orders, 
      // or let's create a quick check. Wait, can we fetch orders? Yes, let's fetch `/orders/buyer` (for demo)
      // or since we are logged in as admin, we can fetch all orders.
      // Wait, let's fetch GET `/orders/buyer` to get orders, or let's hit `/orders/buyer` which returns orders.
      // Actually, since we seeded john@c2c.com orders, we can update them.
      // Let's query all orders. Let's make sure we have a way to fetch them.
      // Let's fetch GET `/orders/buyer` (since it returns orders of the buyer, but as admin we want all).
      // Let's call `/orders/buyer` for now, or fetch all orders. Let's check: 
      // on the backend we implemented getBuyerOrders. Let's use GET /orders/buyer or fetch all.
      // Let's implement a quick GET all orders in orderController and mount it so admin can see everything.
      // Wait, let's check what backend endpoints we have.
      // We have:
      // - POST /orders: placeOrder
      // - GET /orders/buyer: getBuyerOrders
      // - GET /orders/:id: getOrderDetails
      // Let's check if we can fetch orders. Yes, admin can select order #1, #2, etc. by number,
      // or we can query `/orders/buyer`. If we query `/orders/buyer` it returns the logged in user's orders,
      // but if we are logged in as admin, we can place orders and track them too.
      // Let's look at the database. Let's query `/orders/buyer` first.
      const res = await get('/orders/buyer');
      if (res.success) {
        setOrders(res.data);
        if (res.data.length > 0) {
          setSelectedOrder(res.data[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching admin orders list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllOrders();
  }, []);

  const handleUpdateStatusSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    setErrorMsg('');

    try {
      const res = await patch(`/admin/orders/${selectedOrder.id}/status`, {
        status,
        notes,
        carrierName: status === 'Shipped' ? carrierName : '',
        trackingNumber: status === 'Shipped' ? trackingNumber : ''
      });

      if (res.success) {
        setMessage(`Order #${selectedOrder.id} status updated to "${status}" successfully!`);
        setNotes('');
        setCarrierName('');
        setTrackingNumber('');
        // Reload orders
        fetchAllOrders();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update order status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectOrder = (order) => {
    setSelectedOrder(order);
    setStatus(order.status || 'Ready');
    setMessage('');
    setErrorMsg('');
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div className="icon-wrap" style={{ background: 'rgba(167,139,250,0.12)', color: '#a78bfa', width: 48, height: 48, borderRadius: 'var(--radius-sm)' }}>
          <Shield size={22} />
        </div>
        <div>
          <h1 style={{ fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', fontWeight: 900 }}>
            Admin <span className="text-gradient">Portal</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '2px' }}>
            Simulate tracking updates and save changes
          </p>
        </div>
      </div>

      {loading ? (
        <div className="loading-center">
          <div className="spinner" style={{ borderTopColor: '#a78bfa' }} />
        </div>
      ) : orders.length === 0 ? (
        <div className="glass-panel-static" style={{ padding: '60px 40px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>No orders registered in the system yet. Place an order first as a buyer.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px', alignItems: 'start' }} className="split-layout">
          
          {/* Left Side: Order list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.15rem', color: '#fff' }}>Orders in System</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {orders.map((o) => (
                <button
                  key={o.id}
                  onClick={() => handleSelectOrder(o)}
                  className="glass-panel"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    borderRadius: '16px',
                    width: '100%',
                    textAlign: 'left',
                    cursor: 'pointer',
                    background: selectedOrder?.id === o.id ? 'rgba(167, 139, 250, 0.1)' : 'var(--bg-card)',
                    borderColor: selectedOrder?.id === o.id ? '#a78bfa' : 'var(--border)',
                    transform: 'none'
                  }}
                >
                  <div>
                    <h4 style={{ color: '#fff', fontWeight: 600 }}>Order #{o.id}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Date: {new Date(o.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                    <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 700 }}>
                      ${parseFloat(o.totalPrice).toFixed(2)}
                    </span>
                    <span className={`badge badge-${o.status?.toLowerCase() || 'pending'}`}>
                      {o.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right Side: Update Panel */}
          <div>
            {selectedOrder ? (
              <div className="glass-panel-static" style={{ padding: '30px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                <div>
                  <h3 style={{ fontSize: '1.25rem', color: '#fff' }}>Modify Order #{selectedOrder.id} Status</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2px' }}>
                    Current database status: **{selectedOrder.status}**
                  </p>
                </div>

                {message && (
                  <div className="alert alert-success">
                    <CheckCircle size={16} style={{ flexShrink: 0 }} />
                    <span>{message}</span>
                  </div>
                )}

                {errorMsg && (
                  <div className="alert alert-error">
                    <span>{errorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleUpdateStatusSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">New Status</label>
                    <select 
                      className="form-input"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}

                    >
                      <option value="Pending">Pending</option>
                      <option value="Ready">Ready</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Collected">Collected</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>

                  {status === 'Shipped' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '16px', animation: 'fadeIn 0.2s' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Carrier Partner</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="Courier Express"
                          value={carrierName}
                          onChange={(e) => setCarrierName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Tracking Ref #</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="TRK100234900"
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
                      rows={3}
                      placeholder="e.g. Package has been sorted and is ready for customer collection at main station."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      required
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary btn-lg" 
                    style={{ width: '100%', background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)', boxShadow: '0 4px 16px rgba(139,92,246,0.3)', borderRadius: 'var(--radius-sm)' }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <><span className="spinner spinner-sm" style={{ borderTopColor: '#fff' }} /> Saving…</>
                    ) : 'Update Status & Save'}
                  </button>

                </form>

              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                <p style={{ color: 'var(--text-muted)' }}>Select an order from the list to update its status logs.</p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};
export default AdminDashboard;
