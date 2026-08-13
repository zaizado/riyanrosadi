import React from 'react';
import FSBN_LOGO_DATA_URL from '../assets/images/fsbnLogoDataUrl';

interface FsbnLogoProps {
  className?: string;
  size?: number | string;
  showText?: boolean;
}

export const FsbnLogo: React.FC<FsbnLogoProps> = ({ 
  className = "w-10 h-10 object-contain rounded-xl", 
  size
}) => {
  return (
    <img 
      src={FSBN_LOGO_DATA_URL} 
      alt="Logo FSBN SBN KASBI PT VCI"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    />
  );
};



