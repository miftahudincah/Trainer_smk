// Toast.jsx - Versi modern dengan animasi

import React, { useEffect, useState } from 'react';
import { AnimateOnMount } from './Animated';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const Toast = ({ message, type = 'info', onClose }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 300);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message || !visible) return null;

  const configs = {
    success: { icon: <CheckCircle size={20} />, color: '#28a745', bg: 'rgba(40, 167, 69, 0.15)' },
    error: { icon: <XCircle size={20} />, color: '#dc3545', bg: 'rgba(220, 53, 69, 0.15)' },
    warning: { icon: <AlertCircle size={20} />, color: '#ffc107', bg: 'rgba(255, 193, 7, 0.15)' },
    info: { icon: <Info size={20} />, color: '#17a2b8', bg: 'rgba(23, 162, 184, 0.15)' },
  };

  const config = configs[type] || configs.info;

  return (
    <AnimateOnMount animation="slide-down" duration={400}>
      <div
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          maxWidth: '400px',
          width: '100%',
          background: '#141a24',
          borderRadius: '16px',
          border: `1px solid ${config.color}`,
          boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
        }}
      >
        <div style={{ color: config.color, flexShrink: 0 }}>{config.icon}</div>
        <div style={{ flex: 1 }}>
          <p style={{ color: '#fff', margin: 0, fontSize: '14px' }}>{message}</p>
        </div>
        <button
          onClick={() => {
            setVisible(false);
            setTimeout(onClose, 300);
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#6c757d',
            padding: '4px',
            cursor: 'pointer',
            borderRadius: '50%',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.target.style.color = '#fff';
            e.target.style.background = 'rgba(255,255,255,0.1)';
          }}
          onMouseLeave={(e) => {
            e.target.style.color = '#6c757d';
            e.target.style.background = 'transparent';
          }}
        >
          <X size={18} />
        </button>
        
        {/* Progress bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: config.color,
            borderRadius: '0 0 16px 16px',
            animation: 'shrinkWidth 5s linear forwards',
          }}
        />
        
        <style>
          {`
            @keyframes shrinkWidth {
              from { width: 100%; }
              to { width: 0%; }
            }
          `}
        </style>
      </div>
    </AnimateOnMount>
  );
};

export default Toast;