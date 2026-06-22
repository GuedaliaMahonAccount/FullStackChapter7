import React, { useState, useEffect, useCallback } from 'react';
import { useFetch } from '../hooks/useFetch';
import { NewProductModal } from '../components/seller/NewProductModal';
import { MyProductsGrid } from '../components/seller/MyProductsGrid';
import { OrdersManager } from '../components/seller/OrdersManager';
import {
  LayoutDashboard, PlusCircle, Package, ShoppingBag,
  DollarSign, TrendingUp, BarChart3
} from 'lucide-react';

export const SellerDashboard = () => {
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [sellerOrders, setSellerOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const { get } = useFetch();

  const fetchMyProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const res = await get('/products/mine');
      if (res.success) setProducts(res.data);
    } catch (err) {
      console.error('Error fetching seller products:', err);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  const fetchMyOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const res = await get('/orders/seller');
      if (res.success) setSellerOrders(res.data);
    } catch (err) {
      console.error('Error fetching seller orders:', err);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyProducts();
    fetchMyOrders();
  }, []);

  // Lock body scroll when modal open
  useEffect(() => {
    document.body.style.overflow = showModal ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showModal]);

  const handleProductSuccess = () => {
    setShowModal(false);
    fetchMyProducts();
  };

  // Stats calculations
  const totalProducts = products.length;
  const totalOrders = sellerOrders.length;
  const totalRevenue = sellerOrders.reduce((sum, o) => sum + parseFloat(o.totalPrice || 0), 0);
  const deliveredOrders = sellerOrders.filter(o => o.status === 'Collected').length;

  const stats = [
    {
      label: 'Active Products',
      value: productsLoading ? '—' : totalProducts,
      icon: <Package size={20} />,
      color: 'var(--primary-light)',
      bg: 'var(--primary-glow)',
    },
    {
      label: 'Total Orders',
      value: ordersLoading ? '—' : totalOrders,
      icon: <ShoppingBag size={20} />,
      color: 'var(--secondary-light)',
      bg: 'var(--secondary-glow)',
    },
    {
      label: 'Revenue',
      value: ordersLoading ? '—' : `$${totalRevenue.toFixed(2)}`,
      icon: <DollarSign size={20} />,
      color: '#fbbf24',
      bg: 'rgba(251, 191, 36, 0.12)',
    },
    {
      label: 'Delivered',
      value: ordersLoading ? '—' : deliveredOrders,
      icon: <TrendingUp size={20} />,
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.12)',
    },
  ];

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 900, marginBottom: '4px' }}>
          <LayoutDashboard size={28} style={{ verticalAlign: 'middle', marginRight: '10px', color: 'var(--secondary)' }} />
          Seller <span className="text-gradient">Dashboard</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Manage your products, track sales, and fulfill orders — all in one place.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="seller-stats-grid">
        {stats.map((s, i) => (
          <div key={i} className="stat-card" style={{ animationDelay: `${i * 0.08}s`, animation: 'slideUp 0.3s ease both' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
              <div style={{ minWidth: 0 }}>
                <div className="stat-value" style={{ color: s.color, fontSize: 'clamp(1.2rem, 3.5vw, 2rem)' }}>{s.value}</div>
                <div className="stat-label" style={{ marginTop: '6px' }}>{s.label}</div>
              </div>
              <div className="stat-icon-wrapper" style={{
                background: s.bg,
                color: s.color,
              }}>
                {s.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Section: My Products */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div className="section-header">
          <h2>
            <BarChart3 size={20} style={{ color: 'var(--primary-light)' }} />
            My Products
            {!productsLoading && (
              <span className="badge badge-primary" style={{ fontSize: '0.7rem', marginLeft: '4px' }}>
                {totalProducts}
              </span>
            )}
          </h2>
          <button
            id="seller-new-product-btn"
            className="btn btn-primary"
            style={{ gap: '6px' }}
            onClick={() => setShowModal(true)}
          >
            <PlusCircle size={17} />
            New Product
          </button>
        </div>

        <MyProductsGrid
          products={products}
          loading={productsLoading}
          onRefresh={fetchMyProducts}
        />
      </div>

      {/* Divider */}
      <div className="divider" />

      {/* Section: Incoming Orders */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div className="section-header">
          <h2>
            <ShoppingBag size={20} style={{ color: 'var(--secondary-light)' }} />
            Incoming Orders
            {!ordersLoading && (
              <span className="badge badge-teal" style={{ fontSize: '0.7rem', marginLeft: '4px' }}>
                {totalOrders}
              </span>
            )}
          </h2>
        </div>

        <OrdersManager />
      </div>

      {/* New Product Modal */}
      <NewProductModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleProductSuccess}
      />
    </div>
  );
};

export default SellerDashboard;
