import React, { useState, useRef, useEffect } from 'react';
import './InfoTooltip.css';

interface InfoTooltipProps {
  text: string;
  size?: number;
  className?: string;
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({ text, size = 18, className }) => {
  const [visible, setVisible] = useState(false);
  const iconRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Position tooltip smartly
  useEffect(() => {
    if (visible && iconRef.current && tooltipRef.current) {
      const iconRect = iconRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      let top = iconRect.bottom + 8;
      let left = iconRect.left + iconRect.width / 2 - tooltipRect.width / 2;
      // Adjust if out of viewport
      if (left < 8) left = 8;
      if (left + tooltipRect.width > window.innerWidth - 8) left = window.innerWidth - tooltipRect.width - 8;
      if (top + tooltipRect.height > window.innerHeight - 8) top = iconRect.top - tooltipRect.height - 8;
      tooltipRef.current.style.top = `${top}px`;
      tooltipRef.current.style.left = `${left}px`;
    }
  }, [visible]);

  return (
    <div className={`info-tooltip-wrapper ${className || ''}`} style={{ display: 'inline-block', position: 'relative' }}>
      <div
        ref={iconRef}
        className="info-tooltip-icon"
        style={{ width: size, height: size }}
        tabIndex={0}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        onClick={() => setVisible(v => !v)}
        aria-label="Show info"
        role="button"
      >
        <svg width={size} height={size} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="11" fill="#f0f0f0" stroke="#8884d8" strokeWidth="2" />
          <text x="12" y="16" textAnchor="middle" fontSize="14" fontFamily="inherit" fill="#8884d8" fontWeight="bold">?</text>
        </svg>
      </div>
      {visible && (
        <div ref={tooltipRef} className="info-tooltip-bubble">
          <span dangerouslySetInnerHTML={{ __html: text }} />
        </div>
      )}
    </div>
  );
};

export default InfoTooltip;
