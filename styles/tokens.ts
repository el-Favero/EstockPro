// StockPro Design System Tokens

export const colors = {
  bgBase: '#0B1420',
  bgCard: '#142035',
  bgNav: '#0D1929',
  accentBlue: '#378ADD',
  accentBlueDark: '#185FA5',
  accentBlueLight: '#85B7EB',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.45)',
  textHint: 'rgba(255,255,255,0.25)',
  borderSubtle: 'rgba(255,255,255,0.07)',
  statusOk: '#5DCAA5',
  statusWarn: '#EF9F27',
  statusDanger: '#F09595',
  statusOkBg: '#0F2E1A',
  statusWarnBg: '#2D2010',
  statusDangerBg: '#2D1515',
  boxBlue: '#0C3060',
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
  screenTitle: { fontSize: 18, fontWeight: '500' as const },
  sectionLabel: { fontSize: 12, fontWeight: '500' as const },
  body: { fontSize: 13, fontWeight: '400' as const },
  kpiValue: { fontSize: 22, fontWeight: '500' as const },
  badge: { fontSize: 10, fontWeight: '500' as const },
};

export const borderRadius = {
  sm: 8,
  md: 10,
  lg: 12,
  full: 99,
};

export const layout = {
  topbarHeight: 48,
  topbarHeightDesktop: 52,
  sidebarWidth: 200,
  bottomNavHeight: 60,
  contentPadding: 16,
  maxContentWidth: 600,
};

export { colors as default };