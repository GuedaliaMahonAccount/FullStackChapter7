import React, { useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { EditProductModal } from './EditProductModal';
import { Package, Trash2, CheckCircle, Pencil } from 'lucide-react';
import { getImageUrl, formatPrice } from '../../utils/format';

export const MyProductsGrid = ({ products, loading, onRefresh }) => {
  const [deletingId, setDeletingId] = useState(null);
  const [deleteMsg, setDeleteMsg] = useState('');
  const [editProduct, setEditProduct] = useState(null);
  const { del } = useFetch();

  const handleDelete = async (productId) => {
    if (!confirm('Are you sure you want to remove this product?')) return;
    setDeletingId(productId);
    setDeleteMsg('');
    try {
      const res = await del(`/products/${productId}`);
      if (res.success) {
        setDeleteMsg('Product removed.');
        onRefresh();
      }
    } catch (err) {
      setDeleteMsg(err.message || 'Failed to delete product.');
    } finally {
      setDeletingId(null);
      setTimeout(() => setDeleteMsg(''), 3000);
    }
  };

  if (loading) {
    return (
      <div className="products-grid">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="product-card">
            <div className="product-card-img skeleton" />
            <div className="product-card-body">
              <div className="skeleton" style={{ height: 16, width: '80%' }} />
              <div className="skeleton" style={{ height: 12, width: '50%' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="glass-panel-static empty-state" style={{ padding: '50px 30px' }}>
        <Package size={48} className="empty-state-icon" style={{ color: 'var(--primary)' }} />
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>No products yet</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
          Click the <strong>+ New Product</strong> button above to publish your first product.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {deleteMsg && (
        <div className="alert alert-success" style={{ padding: '10px 14px', fontSize: '0.84rem' }}>
          <CheckCircle size={15} />
          <span>{deleteMsg}</span>
        </div>
      )}

      <div className="products-grid">
        {products.map((p, idx) => (
          <div
            key={p.id}
            className="product-card-static"
            style={{
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              transition: 'all var(--transition-base)',
              animation: 'slideUp 0.3s ease both',
              animationDelay: `${idx * 0.05}s`
            }}
          >
            <div className="product-card-img" style={{ position: 'relative', height: '160px', overflow: 'hidden', flexShrink: 0 }}>
              <img
                src={getImageUrl(p.imageUrl)}
                alt={p.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
              />
              <span
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  background: 'rgba(6,8,15,0.82)',
                  backdropFilter: 'blur(8px)',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-soft)',
                  color: 'var(--secondary)',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                }}
              >
                {formatPrice(p.price, p.currency)}
              </span>
            </div>

            <div className="product-card-body" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              <h4 style={{
                fontSize: '0.92rem',
                fontWeight: 700,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                color: 'var(--text-primary)',
              }}>
                {p.title}
              </h4>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                {p.category && (
                  <span className="badge badge-primary" style={{ fontSize: '0.68rem' }}>
                    {p.category.name}
                  </span>
                )}
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  Stock: {p.stockQuantity}
                </span>
              </div>

              <p style={{
                fontSize: '0.78rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.4,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {p.description}
              </p>
            </div>

            <div className="product-card-static-footer-responsive">
              <span className="product-date" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {new Date(p.createdAt).toLocaleDateString()}
              </span>
              <div className="product-actions" style={{ display: 'flex', gap: '6px' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '5px 10px', gap: '4px', fontSize: '0.75rem' }}
                  onClick={() => setEditProduct(p)}
                >
                  <Pencil size={12} />
                  Edit
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  style={{ padding: '5px 10px', gap: '4px', fontSize: '0.75rem' }}
                  onClick={() => handleDelete(p.id)}
                  disabled={deletingId === p.id}
                >
                  {deletingId === p.id ? (
                    <span className="spinner spinner-sm" style={{ width: 14, height: 14, borderWidth: '2px' }} />
                  ) : (
                    <>
                      <Trash2 size={12} />
                      Remove
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      <EditProductModal
        isOpen={!!editProduct}
        product={editProduct}
        onClose={() => setEditProduct(null)}
        onSuccess={() => {
          setEditProduct(null);
          onRefresh();
        }}
      />
    </div>
  );
};

export default MyProductsGrid;
