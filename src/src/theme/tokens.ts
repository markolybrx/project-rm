export const colors = {
  background: '#F4F3F6',
  surface: '#FFFFFF',
  surfaceAlt: '#ECEBEF',
  surfaceHi: '#E4E2E8',
  outline: '#79747E',
  outlineSoft: '#D9D7DE',
  ink: '#1C1B1F',
  inkVariant: '#49454F',
  inkFaint: '#8E8A93',
  primary: '#FF6A00',
  primaryContainer: '#FFE4CC',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#5A2600',
  error: '#B3261E',
  success: '#3EA847',
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 16,
  pill: 100,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export const typography = {
  title: { fontSize: 18, fontWeight: '500' as const, color: colors.ink },
  body: { fontSize: 13.5, fontWeight: '500' as const, color: colors.ink },
  caption: { fontSize: 11.5, color: colors.inkFaint },
  label: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: colors.inkFaint,
    letterSpacing: 0.3,
    textTransform: 'uppercase' as const,
  },
};
