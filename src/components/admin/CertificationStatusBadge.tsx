import React from 'react';
import {
  HelpCircle,
  Clock,
  Send,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  AlertOctagon
} from 'lucide-react';
import {
  PRODUCER_CERTIFICATION_STATUSES,
  type ProducerCertificationStatus
} from '../../lib/supabase';

export interface CertificationStatusBadgeProps {
  status: ProducerCertificationStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showLabel?: boolean;
  language?: 'fr' | 'en';
  className?: string;
}

const ICON_MAP = {
  HelpCircle,
  Clock,
  Send,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  AlertOctagon
} as const;

export default function CertificationStatusBadge({
  status,
  size = 'md',
  showIcon = true,
  showLabel = true,
  language = 'fr',
  className = ''
}: CertificationStatusBadgeProps) {
  const statusConfig = PRODUCER_CERTIFICATION_STATUSES.find(s => s.value === status) ?? {
    value: status,
    labelFr: status,
    labelEn: status,
    badgeColor: 'bg-gray-100 text-gray-700 border-gray-300',
    iconName: 'HelpCircle'
  };

  const label = language === 'en' ? statusConfig.labelEn : statusConfig.labelFr;
  const IconComponent = ICON_MAP[statusConfig.iconName as keyof typeof ICON_MAP] ?? HelpCircle;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs sm:text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-sm sm:text-base px-3.5 py-1.5 gap-2'
  }[size];

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4'
  }[size];

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${statusConfig.badgeColor} ${sizeClasses} ${className}`}
      title={label}
    >
      {showIcon && <IconComponent className={`${iconSizes} flex-shrink-0`} />}
      {showLabel && <span className="whitespace-nowrap">{label}</span>}
    </span>
  );
}
