import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'tertiary' | 'safety';
type Size = 'sm' | 'md' | 'lg' | 'xl';

const sizeMap: Record<Size, React.CSSProperties> = {
  sm: { minHeight: 32, padding: '0 12px', fontSize: 14 },
  md: { minHeight: 40, padding: '0 16px', fontSize: 16 },
  lg: { minHeight: 48, padding: '0 20px', fontSize: 16 },
  xl: { minHeight: 64, padding: '0 24px', fontSize: 22 },
};

const variantMap: Record<Variant, React.CSSProperties> = {
  primary: {
    background: 'var(--action-primary)',
    color: 'var(--action-on-primary)',
    border: 'none',
  },
  secondary: {
    background: 'var(--bg-glass)',
    color: 'var(--text-primary)',
    border: '1px solid var(--glass-border)',
    backdropFilter: 'blur(16px)',
  },
  tertiary: {
    background: 'transparent',
    color: 'var(--text-secondary)',
    border: 'none',
  },
  safety: {
    background: 'var(--status-safety)',
    color: '#fff',
    border: 'none',
  },
};

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  style,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      {...rest}
      style={{
        borderRadius: 'var(--radius-md)',
        cursor: rest.disabled ? 'not-allowed' : 'pointer',
        opacity: rest.disabled ? 0.5 : 1,
        transition: `transform var(--motion-quick) var(--ease-enter)`,
        ...sizeMap[size],
        ...variantMap[variant],
        ...style,
      }}
    >
      {children}
    </button>
  );
}
