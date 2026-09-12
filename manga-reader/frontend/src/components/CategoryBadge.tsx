import React from 'react';
import { BookOpen, Bookmark, CheckCircle, XCircle } from 'lucide-react';
import { LibraryCategory } from '../types/manga';

interface CategoryBadgeProps {
  status?: LibraryCategory | 'none' | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const CATEGORY_CONFIG: Record<
  LibraryCategory,
  {
    label: string;
    bgColor: string;
    textColor: string;
    borderColor: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  reading: {
    label: 'Lendo',
    bgColor: 'bg-emerald-950/70',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-700/50',
    icon: BookOpen,
  },
  plan_to_read: {
    label: 'Pretendo Ler',
    bgColor: 'bg-sky-950/70',
    textColor: 'text-sky-400',
    borderColor: 'border-sky-700/50',
    icon: Bookmark,
  },
  finished: {
    label: 'Concluído',
    bgColor: 'bg-purple-950/70',
    textColor: 'text-purple-400',
    borderColor: 'border-purple-700/50',
    icon: CheckCircle,
  },
  dropped: {
    label: 'Dropado',
    bgColor: 'bg-rose-950/70',
    textColor: 'text-rose-400',
    borderColor: 'border-rose-700/50',
    icon: XCircle,
  },
};

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
}) => {
  if (!status || status === 'none' || !(status in CATEGORY_CONFIG)) {
    return null;
  }

  const config = CATEGORY_CONFIG[status as LibraryCategory];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-medium',
  }[size];

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border backdrop-blur-sm ${config.bgColor} ${config.textColor} ${config.borderColor} ${sizeClasses}`}
    >
      {showIcon && <Icon className={iconSizes} />}
      <span>{config.label}</span>
    </span>
  );
};
