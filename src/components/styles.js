export const inputCls =
  'w-full h-[44px] rounded-[8px] border border-lobeans-border bg-lobeans-cream-light px-3.5 text-[13px] text-lobeans-ink placeholder:text-[#9aa596] focus:outline-none focus:border-lobeans-mustard focus:ring-2 focus:ring-lobeans-mustard/20 transition-colors disabled:opacity-60';

const VARIANTS = {
  primary: 'bg-lobeans-mustard text-lobeans-forest hover:bg-lobeans-mustard-hover',
  dark: 'bg-lobeans-forest text-lobeans-cream hover:bg-lobeans-forest-light',
  secondary: 'bg-white text-lobeans-ink border border-lobeans-border hover:bg-[#f3f2ec]',
  ghost: 'text-[#284c35] hover:bg-[#eef0e8]',
  danger: 'bg-white text-red-700 border border-red-200 hover:bg-red-50',
  success: 'bg-[#eaf0e8] text-[#284c35] border border-[#cfdccb] hover:bg-[#dfe9dc]',
};

const SIZES = {
  sm: 'h-8 px-3 text-[11px] rounded-[7px]',
  md: 'h-[40px] px-4 text-[12px] rounded-[8px]',
  lg: 'h-[46px] px-5 text-[13px] rounded-full',
};

export function buttonClass(variant = 'primary', size = 'md') {
  return `inline-flex items-center justify-center gap-1.5 font-medium whitespace-nowrap transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
    VARIANTS[variant] || VARIANTS.primary
  } ${SIZES[size] || SIZES.md}`;
}
