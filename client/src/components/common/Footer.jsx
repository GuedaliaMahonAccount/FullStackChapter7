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
        <div className="footer-info-col">
          <div className="footer-brand">
            <Compass size={20} className="footer-brand-logo" />
            <span className="text-gradient">GeoMarket</span>
          </div>
          <p className="footer-copy">
            &copy; {year} GeoMarket C2C — Academic Final Project
          </p>
          <Link to="/api-info" className="footer-link-api">
            ℹ️ System Architecture & APIs
          </Link>
        </div>

        {/* Stack Badges */}
        <div className="footer-tech-col">
          <span className="footer-tech-title">Built with</span>
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
