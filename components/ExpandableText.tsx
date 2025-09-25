import React, { useState } from 'react';

interface ExpandableTextProps {
  text: string;
  maxLength?: number;
  className?: string;
  icon?: React.ReactNode;
  label?: string;
}

const ExpandableText: React.FC<ExpandableTextProps> = ({ 
  text, 
  maxLength = 100, 
  className = "",
  icon,
  label
}) => {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > maxLength;
  const displayText = isLong && !expanded ? text.substring(0, maxLength) + '...' : text;

  return (
    <div className={`bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200 shadow-sm ${className}`}>
      <div className="flex items-center mb-3">
        {icon && (
          <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mr-2">
            {icon}
          </div>
        )}
        {label && (
          <div className="text-xs font-semibold text-purple-800">{label}</div>
        )}
      </div>
      <div className="text-xs text-purple-700 leading-relaxed">
        {displayText}
      </div>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-xs font-medium text-purple-600 hover:text-purple-800 transition-colors"
        >
          {expanded ? 'Ver menos' : 'Ver más'}
        </button>
      )}
    </div>
  );
};

export default ExpandableText;
