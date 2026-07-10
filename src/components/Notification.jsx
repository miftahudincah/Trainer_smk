// src/components/Notification.jsx
import React, { useState, useEffect } from 'react';
import { AnimateOnMount } from './Animated';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const Notification = ({ message, type = 'info', duration = 5000, onClose }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) setTimeout(onClose, 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!visible || !message) return null;

  const icons = {
    success: <CheckCircle size={20} className="text-success" />,
    error: <XCircle size={20} className="text-danger" />,
    warning: <AlertCircle size={20} className="text-warning" />,
    info: <Info size={20} className="text-info" />,
  };

  const bgColors = {
    success: 'rgba(40, 167, 69, 0.15)',
    error: 'rgba(220, 53, 69, 0.15)',
    warning: 'rgba(255, 193, 7, 0.15)',
    info: 'rgba(23, 162, 184, 0.15)',
  };

  const borderColors = {
    success: '#28a745',
    error: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
  };

  return (
    <AnimateOnMount animation="slide-down" duration={400}>
      <div
        style={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          zIndex: 9999,
          maxWidth: '420px',
          width: '100%',
          background: '#141a24',
          borderRadius: '16px',
          border: `1px solid ${borderColors[type]}`,
          boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
        }}
      >
        <div style={{ flexShrink: 0 }}>{icons[type]}</div>
        <div style={{ flex: 1 }}>
          <p style={{ color: '#fff', margin: 0, fontSize: '14px' }}>{message}</p>
        </div>
        <button
          onClick={() => {
            setVisible(false);
            if (onClose) setTimeout(onClose, 300);
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
        
        {/* Progress bar animasi */}
        {duration > 0 && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: borderColors[type],
              borderRadius: '0 0 16px 16px',
              animation: `shrinkWidth ${duration}ms linear forwards`,
            }}
          />
        )}
      </div>
      
      <style>
        {`
          @keyframes shrinkWidth {
            from { width: 100%; }
            to { width: 0%; }
          }
        `}
      </style>
    </AnimateOnMount>
  );
};

export default Notification;