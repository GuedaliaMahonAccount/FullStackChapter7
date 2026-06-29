import React, { useState, useEffect } from 'react';
import { useFetch } from '../hooks/useFetch';
import { Shield, CheckCircle, Users, FileText, Lock, Unlock, AlertCircle, Calendar, Layers } from 'lucide-react';

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'users' | 'logs'
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Orders Tab States
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [status, setStatus] = useState('Ready');
  const [notes, setNotes] = useState('');
  const [carrierName, setCarrierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Users Tab States
  const [usersList, setUsersList] = useState([]);
  const [blockingUserId, setBlockingUserId] = useState(null);

  // Logs Tab States
  const [logsList, setLogsList] = useState([]);

  const { get, patch } = useFetch();

  // Fetch all orders
  const fetchAllOrders = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await get('/orders/buyer');
      if (res.success) {
        setOrders(res.data);
        if (res.data.length > 0) {
          setSelectedOrder(res.data[0]);
          setStatus(res.data[0].status || 'Ready');
        }
      }
    } catch (err) {
      console.error('Error fetching admin orders list:', err);
      setErrorMsg('Failed to load orders.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all users
  const fetchAllUsers = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await get('/admin/users');
      if (res.success) {
        setUsersList(res.data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setErrorMsg('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all logs
  const fetchAllLogs = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await get('/admin/logs');
      if (res.success) {
        setLogsList(res.data);
      }
    } catch (err) {
      console.error('Error fetching event logs:', err);
      setErrorMsg('Failed to load event logs.');
    } finally {
      setLoading(false);
    }
  };

  // Handle tab switching
  useEffect(() => {
    setSuccessMsg('');
    setErrorMsg('');
    if (activeTab === 'orders') {
      fetchAllOrders();
    } else if (activeTab === 'users') {
      fetchAllUsers();
    } else if (activeTab === 'logs') {
      fetchAllLogs();
    }
  }, [activeTab]);

  // Handle update status
  const handleUpdateStatusSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await patch(`/admin/orders/${selectedOrder.id}/status`, {
        status,
        notes,
        carrierName: status === 'Shipped' ? carrierName : '',
        trackingNumber: status === 'Shipped' ? trackingNumber : ''
      });

      if (res.success) {
        setSuccessMsg(`Order #${selectedOrder.id} status updated to "${status}" successfully!`);
        setNotes('');
        setCarrierName('');
        setTrackingNumber('');
        fetchAllOrders();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update order status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle block/unblock user
  const handleToggleBlock = async (userId, email) => {
    setBlockingUserId(userId);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const res = await patch(`/admin/users/${userId}/block`);
      if (res.success) {
        setSuccessMsg(res.message || `User ${email} block status toggled.`);
        fetchAllUsers();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to change user block status.');
    } finally {
      setBlockingUserId(null);
    }
  };

  const handleSelectOrder = (order) => {
    setSelectedOrder(order);
    setStatus(order.status || 'Ready');
    setSuccessMsg('');
    setErrorMsg('');
  };

  return (
    <div className="page-container flex flex-col gap-24">
      
      {/* Header */}
      <div className="flex items-center gap-12">
        <div className="icon-wrap admin-header-icon">
          <Shield size={22} />
        </div>
        <div>
          <h1 className="admin-title">
            Admin <span className="text-gradient">Portal</span>
          </h1>
          <p className="admin-subtitle">
            System dashboard, user administration, and security audit logs.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="category-chips admin-tabs-container">
        <button
          onClick={() => setActiveTab('orders')}
          className={`chip${activeTab === 'orders' ? ' active' : ''} admin-tab-btn`}
        >
          <Layers size={14} /> Manage Orders
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`chip${activeTab === 'users' ? ' active' : ''} admin-tab-btn`}
        >
          <Users size={14} /> Manage Users
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`chip${activeTab === 'logs' ? ' active' : ''} admin-tab-btn`}
        >
          <FileText size={14} /> System Logs
        </button>
      </div>

      {/* Status Messages */}
      {successMsg && (
        <div className="alert alert-success admin-alert-success">
          <CheckCircle size={16} style={{ flexShrink: 0 }} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="alert alert-error admin-alert-error">
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="loading-center admin-loading">
          <div className="spinner" style={{ borderTopColor: '#a78bfa' }} />
        </div>
      )}

      {/* Content Panels */}
      {!loading && (
        <>
          {/* TAB 1: ORDERS */}
          {activeTab === 'orders' && (
            orders.length === 0 ? (
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
                          Current database status: <strong>{selectedOrder.status}</strong>
                        </p>
                      </div>

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
                            placeholder="e.g. Package has been sorted and is ready for customer collection."
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
            )
          )}

          {/* TAB 2: USERS */}
          {activeTab === 'users' && (
            <div className="glass-panel-static admin-panel-card">
              <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '16px' }}>Manage Users</h3>
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr className="admin-table-header-row">
                      <th className="admin-table-header">Full Name</th>
                      <th className="admin-table-header">Email Address</th>
                      <th className="admin-table-header">Role</th>
                      <th className="admin-table-header">Registered Date</th>
                      <th className="admin-table-header">Account Status</th>
                      <th className="admin-table-header" style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map((user) => (
                      <tr key={user.id} className="admin-table-row">
                        <td className="admin-table-cell-name">{user.fullName}</td>
                        <td className="admin-table-cell">{user.email}</td>
                        <td className="admin-table-cell">
                          <span className={`badge ${user.role?.name === 'admin' ? 'badge-primary' : 'badge-secondary'}`}>
                            {user.role?.name}
                          </span>
                        </td>
                        <td className="admin-table-cell">{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td className="admin-table-cell">
                          {user.isBlocked ? (
                            <span className="badge badge-cancelled badge-log-danger">Blocked</span>
                          ) : (
                            <span className="badge badge-collected badge-log-success">Active</span>
                          )}
                        </td>
                        <td className="admin-table-cell-actions">
                          <button
                            onClick={() => handleToggleBlock(user.id, user.email)}
                            disabled={blockingUserId === user.id}
                            className={`btn ${user.isBlocked ? 'btn-secondary' : 'btn-primary'} admin-block-btn ${user.isBlocked ? 'blocked' : 'active'}`}
                          >
                            {blockingUserId === user.id ? (
                              <span className="spinner spinner-xs" style={{ width: '10px', height: '10px' }} />
                            ) : user.isBlocked ? (
                              <><Unlock size={12} /> Unblock</>
                            ) : (
                              <><Lock size={12} /> Block</>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: LOGS */}
          {activeTab === 'logs' && (
            <div className="glass-panel-static admin-panel-card">
              <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={18} /> System Audit Trail (MongoDB Logs)
              </h3>
              <div style={{ overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr className="admin-table-header-row-sticky">
                      <th className="admin-table-header">Date & Time</th>
                      <th className="admin-table-header">Event Type</th>
                      <th className="admin-table-header">User Email</th>
                      <th className="admin-table-header">IP Address</th>
                      <th className="admin-table-header">Event Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logsList.map((log) => (
                      <tr key={log.id} className="admin-table-row-logs">
                        <td className="admin-table-cell" style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="admin-table-cell">
                          <span 
                            className={`badge badge-log-${
                              log.eventType.includes('BLOCKED') || log.eventType.includes('DELETED') ? 'danger' :
                              log.eventType.includes('CREATED') || log.eventType.includes('REGISTER') ? 'success' : 'info'
                            }`}
                          >
                            {log.eventType}
                          </span>
                        </td>
                        <td className="admin-table-cell" style={{ fontWeight: 600 }}>{log.userEmail}</td>
                        <td className="admin-table-cell" style={{ color: 'var(--text-muted)' }}>{log.ipAddress || '127.0.0.1'}</td>
                        <td className="admin-table-cell admin-log-cell-details" title={JSON.stringify(log.details)}>
                          <code className="admin-log-details-code">
                            {JSON.stringify(log.details)}
                          </code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
};

export default AdminDashboard;
