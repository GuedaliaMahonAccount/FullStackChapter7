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
              <div className="skeleton my-products-grid-style-022"  />
              <div className="skeleton my-products-grid-style-021"  />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="glass-panel-static empty-state my-products-grid-style-020" >
        <Package size={48} className="empty-state-icon my-products-grid-style-019"  />
        <h3 className="my-products-grid-style-018">No products yet</h3>
        <p className="my-products-grid-style-017">
          Click the <strong>+ New Product</strong> button above to publish your first product.
        </p>
      </div>
    );
  }

  return (
    <div className="my-products-grid-style-016">
      {deleteMsg && (
        <div className="alert alert-success my-products-grid-style-015" >
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
            <div className="product-card-img my-products-grid-style-014" >
              <img
                src={getImageUrl(p.imageUrl)}
                alt={p.title}
                className="my-products-grid-style-013"
              />
              <span
                className="my-products-grid-style-012"
              >
                {formatPrice(p.price, p.currency)}
              </span>
            </div>

            <div className="product-card-body my-products-grid-style-011" >
              <h4 className="my-products-grid-style-010">
                {p.title}
              </h4>

              <div className="my-products-grid-style-009">
                {p.category && (
                  <span className="badge badge-primary my-products-grid-style-008" >
                    {p.category.name}
                  </span>
                )}
                <span className="my-products-grid-style-007">
                  Stock: {p.stockQuantity}
                </span>
              </div>

              <p className="my-products-grid-style-006">
                {p.description}
              </p>
            </div>

            <div className="product-card-static-footer-responsive">
              <span className="product-date my-products-grid-style-005" >
                {new Date(p.createdAt).toLocaleDateString()}
              </span>
              <div className="product-actions my-products-grid-style-004" >
                <button
                  className="btn btn-secondary btn-sm my-products-grid-style-003"
                  
                  onClick={() => setEditProduct(p)}
                >
                  <Pencil size={12} />
                  Edit
                </button>
                <button
                  className="btn btn-danger btn-sm my-products-grid-style-002"
                  
                  onClick={() => handleDelete(p.id)}
                  disabled={deletingId === p.id}
                >
                  {deletingId === p.id ? (
                    <span className="spinner spinner-sm my-products-grid-style-001"  />
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
