export interface ThemeDefinition {
  id: string;
  name: string;
  previewColor: string;
  accentColor: string;
  accentRgb: string; // e.g. "6, 182, 212"
  gradient: string;
  bubbleGradientOut: string;
  borderAccent: string;
  glowColor: string;
  textColor: string;
}

export const GLOBAL_THEMES: ThemeDefinition[] = [
  {
    id: 'cyber_cyan',
    name: 'Cyber Cyan',
    previewColor: '#06B6D4',
    accentColor: '#06B6D4',
    accentRgb: '6, 182, 212',
    gradient: 'linear-gradient(135deg, #06B6D4 0%, #10B981 100%)',
    bubbleGradientOut: 'linear-gradient(135deg, rgba(14, 165, 233, 0.25) 0%, rgba(20, 184, 166, 0.3) 100%)',
    borderAccent: 'rgba(45, 212, 191, 0.35)',
    glowColor: 'rgba(6, 182, 212, 0.25)',
    textColor: '#22D3EE'
  },
  {
    id: 'emerald_matrix',
    name: 'Emerald Matrix',
    previewColor: '#10B981',
    accentColor: '#10B981',
    accentRgb: '16, 185, 129',
    gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    bubbleGradientOut: 'linear-gradient(135deg, rgba(16, 185, 129, 0.28) 0%, rgba(5, 150, 105, 0.32) 100%)',
    borderAccent: 'rgba(52, 211, 153, 0.4)',
    glowColor: 'rgba(16, 185, 129, 0.25)',
    textColor: '#34D399'
  },
  {
    id: 'sunset_flame',
    name: 'Sunset Flame',
    previewColor: '#F59E0B',
    accentColor: '#F59E0B',
    accentRgb: '245, 158, 11',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
    bubbleGradientOut: 'linear-gradient(135deg, rgba(245, 158, 11, 0.28) 0%, rgba(239, 68, 68, 0.32) 100%)',
    borderAccent: 'rgba(251, 191, 36, 0.4)',
    glowColor: 'rgba(245, 158, 11, 0.25)',
    textColor: '#FBBF24'
  },
  {
    id: 'royal_amethyst',
    name: 'Royal Amethyst',
    previewColor: '#A855F7',
    accentColor: '#A855F7',
    accentRgb: '168, 85, 247',
    gradient: 'linear-gradient(135deg, #A855F7 0%, #6366F1 100%)',
    bubbleGradientOut: 'linear-gradient(135deg, rgba(168, 85, 247, 0.28) 0%, rgba(99, 102, 241, 0.32) 100%)',
    borderAccent: 'rgba(192, 132, 252, 0.4)',
    glowColor: 'rgba(168, 85, 247, 0.25)',
    textColor: '#C084FC'
  },
  {
    id: 'rose_quartz',
    name: 'Rose Quartz',
    previewColor: '#FB7185',
    accentColor: '#FB7185',
    accentRgb: '251, 113, 133',
    gradient: 'linear-gradient(135deg, #FB7185 0%, #EC4899 100%)',
    bubbleGradientOut: 'linear-gradient(135deg, rgba(251, 113, 133, 0.28) 0%, rgba(236, 72, 153, 0.32) 100%)',
    borderAccent: 'rgba(253, 164, 175, 0.4)',
    glowColor: 'rgba(251, 113, 133, 0.25)',
    textColor: '#FDA4AF'
  },
  {
    id: 'nordic_frost',
    name: 'Nordic Frost',
    previewColor: '#38BDF8',
    accentColor: '#38BDF8',
    accentRgb: '56, 189, 248',
    gradient: 'linear-gradient(135deg, #38BDF8 0%, #818CF8 100%)',
    bubbleGradientOut: 'linear-gradient(135deg, rgba(56, 189, 248, 0.28) 0%, rgba(129, 140, 248, 0.32) 100%)',
    borderAccent: 'rgba(125, 211, 252, 0.4)',
    glowColor: 'rgba(56, 189, 248, 0.25)',
    textColor: '#7DD3FC'
  },
  {
    id: 'tokyo_neon',
    name: 'Tokyo Neon',
    previewColor: '#F43F5E',
    accentColor: '#F43F5E',
    accentRgb: '244, 63, 94',
    gradient: 'linear-gradient(135deg, #F43F5E 0%, #06B6D4 100%)',
    bubbleGradientOut: 'linear-gradient(135deg, rgba(244, 63, 94, 0.28) 0%, rgba(6, 182, 212, 0.32) 100%)',
    borderAccent: 'rgba(251, 113, 133, 0.4)',
    glowColor: 'rgba(244, 63, 94, 0.25)',
    textColor: '#FB7185'
  },
  {
    id: 'golden_hour',
    name: 'Golden Hour',
    previewColor: '#EAB308',
    accentColor: '#EAB308',
    accentRgb: '234, 179, 8',
    gradient: 'linear-gradient(135deg, #EAB308 0%, #CA8A04 100%)',
    bubbleGradientOut: 'linear-gradient(135deg, rgba(234, 179, 8, 0.28) 0%, rgba(202, 138, 4, 0.32) 100%)',
    borderAccent: 'rgba(250, 204, 21, 0.4)',
    glowColor: 'rgba(234, 179, 8, 0.25)',
    textColor: '#FACC15'
  },
  {
    id: 'crimson_velvet',
    name: 'Crimson Velvet',
    previewColor: '#DC2626',
    accentColor: '#DC2626',
    accentRgb: '220, 38, 38',
    gradient: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
    bubbleGradientOut: 'linear-gradient(135deg, rgba(220, 38, 38, 0.28) 0%, rgba(153, 27, 27, 0.32) 100%)',
    borderAccent: 'rgba(248, 113, 113, 0.4)',
    glowColor: 'rgba(220, 38, 38, 0.25)',
    textColor: '#F87171'
  },
  {
    id: 'royal_indigo',
    name: 'Royal Indigo',
    previewColor: '#6366F1',
    accentColor: '#6366F1',
    accentRgb: '99, 102, 241',
    gradient: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
    bubbleGradientOut: 'linear-gradient(135deg, rgba(99, 102, 241, 0.28) 0%, rgba(79, 70, 229, 0.32) 100%)',
    borderAccent: 'rgba(129, 140, 248, 0.4)',
    glowColor: 'rgba(99, 102, 241, 0.25)',
    textColor: '#818CF8'
  },
  {
    id: 'ocean_deep',
    name: 'Ocean Deep',
    previewColor: '#14B8A6',
    accentColor: '#14B8A6',
    accentRgb: '20, 184, 166',
    gradient: 'linear-gradient(135deg, #14B8A6 0%, #0284C7 100%)',
    bubbleGradientOut: 'linear-gradient(135deg, rgba(20, 184, 166, 0.28) 0%, rgba(2, 132, 199, 0.32) 100%)',
    borderAccent: 'rgba(45, 212, 191, 0.4)',
    glowColor: 'rgba(20, 184, 166, 0.25)',
    textColor: '#2DD4BF'
  },
  {
    id: 'espresso_amber',
    name: 'Espresso Amber',
    previewColor: '#D97706',
    accentColor: '#D97706',
    accentRgb: '217, 119, 6',
    gradient: 'linear-gradient(135deg, #D97706 0%, #78350F 100%)',
    bubbleGradientOut: 'linear-gradient(135deg, rgba(217, 119, 6, 0.28) 0%, rgba(120, 53, 15, 0.32) 100%)',
    borderAccent: 'rgba(251, 191, 36, 0.4)',
    glowColor: 'rgba(217, 119, 6, 0.25)',
    textColor: '#FBBF24'
  },
  {
    id: 'aurora_green',
    name: 'Aurora Green',
    previewColor: '#84CC16',
    accentColor: '#84CC16',
    accentRgb: '132, 204, 22',
    gradient: 'linear-gradient(135deg, #84CC16 0%, #10B981 100%)',
    bubbleGradientOut: 'linear-gradient(135deg, rgba(132, 204, 22, 0.28) 0%, rgba(16, 185, 129, 0.32) 100%)',
    borderAccent: 'rgba(163, 230, 53, 0.4)',
    glowColor: 'rgba(132, 204, 22, 0.25)',
    textColor: '#A3E635'
  },
  {
    id: 'stealth_monochrome',
    name: 'Stealth Monochrome',
    previewColor: '#94A3B8',
    accentColor: '#94A3B8',
    accentRgb: '148, 163, 184',
    gradient: 'linear-gradient(135deg, #94A3B8 0%, #475569 100%)',
    bubbleGradientOut: 'linear-gradient(135deg, rgba(148, 163, 184, 0.28) 0%, rgba(71, 85, 105, 0.32) 100%)',
    borderAccent: 'rgba(203, 213, 225, 0.4)',
    glowColor: 'rgba(148, 163, 184, 0.25)',
    textColor: '#CBD5E1'
  },
  {
    id: 'lavender_dream',
    name: 'Lavender Dream',
    previewColor: '#C084FC',
    accentColor: '#C084FC',
    accentRgb: '192, 132, 252',
    gradient: 'linear-gradient(135deg, #C084FC 0%, #E879F9 100%)',
    bubbleGradientOut: 'linear-gradient(135deg, rgba(192, 132, 252, 0.28) 0%, rgba(232, 121, 249, 0.32) 100%)',
    borderAccent: 'rgba(216, 180, 254, 0.4)',
    glowColor: 'rgba(192, 132, 252, 0.25)',
    textColor: '#D8B4FE'
  },
  {
    id: 'synthwave_retro',
    name: 'Synthwave Retro',
    previewColor: '#D946EF',
    accentColor: '#D946EF',
    accentRgb: '217, 70, 239',
    gradient: 'linear-gradient(135deg, #D946EF 0%, #F97316 100%)',
    bubbleGradientOut: 'linear-gradient(135deg, rgba(217, 70, 239, 0.28) 0%, rgba(249, 115, 22, 0.32) 100%)',
    borderAccent: 'rgba(240, 171, 252, 0.4)',
    glowColor: 'rgba(217, 70, 239, 0.25)',
    textColor: '#F0ABFC'
  }
];

export function getThemeById(themeId?: string): ThemeDefinition {
  const match = GLOBAL_THEMES.find(t => t.id === themeId);
  return match || GLOBAL_THEMES[0];
}

export function applyThemeToDocument(theme: ThemeDefinition) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--theme-primary', theme.accentColor);
  root.style.setProperty('--theme-primary-rgb', theme.accentRgb);
  root.style.setProperty('--theme-gradient', theme.gradient);
  root.style.setProperty('--theme-bubble-out', theme.bubbleGradientOut);
  root.style.setProperty('--theme-border', theme.borderAccent);
  root.style.setProperty('--theme-glow', theme.glowColor);
  root.style.setProperty('--theme-text', theme.textColor);
}
