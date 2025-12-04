/**
 * Enhanced color palette and design system for NeighborNet
 */

import { Platform } from 'react-native';

const tintColorLight = '#6366f1'; // Modern indigo
const tintColorDark = '#818cf8';

export const Colors = {
  light: {
    text: '#1e293b',
    textSecondary: '#64748b',
    textMuted: '#94a3b8',
    background: '#f8fafc',
    backgroundCard: '#ffffff',
    tint: tintColorLight,
    primary: '#6366f1',
    primaryLight: '#818cf8',
    primaryDark: '#4f46e5',
    secondary: '#ec4899',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    icon: '#64748b',
    tabIconDefault: '#94a3b8',
    tabIconSelected: tintColorLight,
    border: '#e2e8f0',
    borderLight: '#f1f5f9',
    shadow: 'rgba(0, 0, 0, 0.1)',
    gradient: ['#6366f1', '#8b5cf6', '#ec4899'],
  },
  dark: {
    text: '#f1f5f9',
    textSecondary: '#cbd5e1',
    textMuted: '#94a3b8',
    background: '#0f172a',
    backgroundCard: '#1e293b',
    tint: tintColorDark,
    primary: '#818cf8',
    primaryLight: '#a5b4fc',
    primaryDark: '#6366f1',
    secondary: '#f472b6',
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    icon: '#cbd5e1',
    tabIconDefault: '#64748b',
    tabIconSelected: tintColorDark,
    border: '#334155',
    borderLight: '#1e293b',
    shadow: 'rgba(0, 0, 0, 0.3)',
    gradient: ['#818cf8', '#a78bfa', '#f472b6'],
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BorderRadius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
