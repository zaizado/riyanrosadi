import React from 'react';
import logoImg from '../assets/images/fsbn_logo_emblem_1785338169849.jpg';

interface FsbnLogoProps {
  className?: string;
  size?: number | string;
  showText?: boolean;
}

export const FsbnLogo: React.FC<FsbnLogoProps> = ({ 
  className = "w-10 h-10 rounded-xl object-contain", 
  size
}) => {
  return (
    <img 
      src="/assets/branding/logo-fsbn-original.jpg" 
      alt="Logo FSBN Original"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      onError={(e) => {
        // Fallback to imported asset if public folder path fails
        e.currentTarget.onerror = null;
        e.currentTarget.src = logoImg;
      }}
    />
  );
};

