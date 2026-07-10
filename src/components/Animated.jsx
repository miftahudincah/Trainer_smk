// src/components/Animated.jsx
import React, { useEffect, useRef, useState } from 'react';

/**
 * Komponen untuk animasi saat elemen masuk ke viewport
 */
export const AnimateOnScroll = ({ 
  children, 
  animation = 'fade-in-up',
  delay = 0,
  threshold = 0.1,
  once = true,
  className = '',
  ...props 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once && ref.current) {
            observer.unobserve(ref.current);
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [threshold, once]);

  const animationClass = isVisible ? `animate-${animation}` : '';
  const delayStyle = delay ? { animationDelay: `${delay}ms` } : {};

  return (
    <div
      ref={ref}
      className={`${animationClass} ${className}`}
      style={delayStyle}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Komponen untuk animasi staggered (bertahap)
 */
export const StaggerContainer = ({ 
  children, 
  animation = 'fade-in-up',
  staggerDelay = 80,
  className = '',
  ...props 
}) => {
  return (
    <div className={`stagger-children ${className}`} {...props}>
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;
        
        const delay = index * staggerDelay;
        const animationClass = `animate-${animation}`;
        
        return React.cloneElement(child, {
          className: `${child.props.className || ''} ${animationClass}`,
          style: { 
            ...child.props.style, 
            animationDelay: `${delay}ms`,
            animationFillMode: 'forwards'
          },
        });
      })}
    </div>
  );
};

/**
 * Komponen untuk animasi saat mount (masuk halaman)
 */
export const AnimateOnMount = ({ 
  children, 
  animation = 'fade-in-up',
  duration = 500,
  delay = 0,
  className = '',
  ...props 
}) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const animationClass = isMounted ? `animate-${animation}` : '';
  const style = {
    opacity: isMounted ? 1 : 0,
    transition: `all ${duration}ms ease ${delay}ms`,
    ...props.style
  };

  return (
    <div 
      className={`${animationClass} ${className}`} 
      style={style}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Skeleton loading dengan shimmer
 */
export const Skeleton = ({ 
  width = '100%', 
  height = '20px', 
  rounded = '8px',
  className = '',
  ...props 
}) => {
  return (
    <div
      className={`shimmer ${className}`}
      style={{
        width,
        height,
        borderRadius: rounded,
        ...props.style
      }}
    />
  );
};

/**
 * Skeleton untuk card product
 */
export const ProductSkeleton = ({ count = 4 }) => {
  return (
    <div className="row g-3 stagger-children">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="col-6 col-sm-4 col-md-3">
          <div className="bg-dark rounded-3 overflow-hidden" style={{ padding: '12px' }}>
            <Skeleton height="160px" rounded="12px" />
            <Skeleton height="16px" className="mt-2" width="80%" />
            <Skeleton height="20px" className="mt-1" width="60%" />
            <div className="d-flex gap-2 mt-2">
              <Skeleton height="32px" width="60%" />
              <Skeleton height="32px" width="40%" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Floating Action Button dengan animasi
 */
export const FloatingActionButton = ({ 
  icon, 
  onClick, 
  position = 'bottom-right',
  label = '',
  className = '',
  ...props 
}) => {
  const positions = {
    'bottom-right': { bottom: '80px', right: '20px' },
    'bottom-left': { bottom: '80px', left: '20px' },
    'top-right': { top: '80px', right: '20px' },
    'top-left': { top: '80px', left: '20px' },
  };

  return (
    <button
      onClick={onClick}
      className={`btn btn-warning rounded-circle shadow-lg animate-float ${className}`}
      style={{
        position: 'fixed',
        zIndex: 999,
        width: '56px',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
        ...positions[position],
        transition: 'all 0.3s ease',
        ...props.style
      }}
      onMouseEnter={(e) => {
        e.target.style.transform = 'scale(1.1)';
      }}
      onMouseLeave={(e) => {
        e.target.style.transform = 'scale(1)';
      }}
    >
      {icon}
      {label && <span className="visually-hidden">{label}</span>}
    </button>
  );
};

/**
 * Confetti / Celebration effect
 */
export const Confetti = ({ active = false, duration = 3000 }) => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (active) {
      const colors = ['#ff9100', '#ff6b00', '#ffc107', '#28a745', '#17a2b8', '#dc3545', '#6f42c1'];
      const newParticles = Array.from({ length: 50 }).map(() => ({
        id: Math.random().toString(36).substr(2, 9),
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 6 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 720,
        delay: Math.random() * 500,
      }));
      setParticles(newParticles);

      const timer = setTimeout(() => {
        setParticles([]);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [active, duration]);

  if (!active || particles.length === 0) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9999 }}>
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size * 0.6}px`,
            background: p.color,
            borderRadius: '2px',
            transform: `rotate(${p.rotation}deg)`,
            animation: `confetti ${1 + Math.random() * 2}s ease forwards ${p.delay}ms`,
          }}
        />
      ))}
    </div>
  );
};

export default {
  AnimateOnScroll,
  AnimateOnMount,
  StaggerContainer,
  Skeleton,
  ProductSkeleton,
  FloatingActionButton,
  Confetti,
};