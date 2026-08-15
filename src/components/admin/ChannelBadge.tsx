import React from 'react';
import {
  Mail,
  Globe,
  MessageSquare,
  Phone,
  FileText,
  UserCheck
} from 'lucide-react';
import {
  VERIFICATION_CHANNELS,
  type VerificationChannel
} from '../../lib/supabase';

export interface ChannelBadgeProps {
  channel: VerificationChannel;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  language?: 'fr' | 'en';
  className?: string;
}

const CHANNEL_ICONS = {
  Mail,
  Globe,
  MessageSquare,
  Phone,
  FileText,
  UserCheck
} as const;

export default function ChannelBadge({
  channel,
  size = 'md',
  showLabel = true,
  language = 'fr',
  className = ''
}: ChannelBadgeProps) {
  const config = VERIFICATION_CHANNELS.find(c => c.value === channel) ?? {
    value: channel,
    labelFr: channel,
    labelEn: channel,
    iconName: 'UserCheck',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200'
  };

  const label = language === 'en' ? config.labelEn : config.labelFr;
  const IconComponent = CHANNEL_ICONS[config.iconName as keyof typeof CHANNEL_ICONS] ?? UserCheck;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs sm:text-sm px-2.5 py-1 gap-1.5'
  }[size];

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5'
  }[size];

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${config.badgeColor} ${sizeClasses} ${className}`}
      title={label}
    >
      <IconComponent className={`${iconSizes} flex-shrink-0`} />
      {showLabel && <span className="whitespace-nowrap">{label}</span>}
    </span>
  );
}
