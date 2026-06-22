import React from 'react';
import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export const Footer = () => {
  const year = new Date().getFullYear();
  const stack = ['React', 'Express', 'MySQL', 'MongoDB', 'MapLibre'];

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        {/* Brand */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="footer-brand">
            <Compass size={20} style={{ color: 'var(--secondary)' }} />
            <span className="text-gradient">GeoMarket</span>
          </div>
          <p className="footer-copy">
            &copy; {year} GeoMarket C2C — Academic Final Project
          </p>
        </div>

        {/* Stack Badges */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-hint)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Built with</span>
          <div className="footer-stack">
            {stack.map((tech) => (
              <span key={tech} className="footer-pill">{tech}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
