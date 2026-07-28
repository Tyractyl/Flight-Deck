

interface InputErrorProps {
  message?: string;
}

export default function InputError({ message }: InputErrorProps) {
  if (!message) return null;
  
  return (
    <div style={{
      position: 'absolute',
      top: 'calc(100% + 4px)',
      left: 10,
      background: '#DC2626',
      padding: '4px 8px',
      borderRadius: 4,
      color: '#fff',
      fontSize: 6,
      fontFamily: 'var(--font-sans, ui-sans-serif, system-ui, sans-serif)',
      fontWeight: 500,
      zIndex: 20,
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
      animation: 'errorPopIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      transformOrigin: 'top left',
      pointerEvents: 'none'
    }}>
      <style>{`
        @keyframes errorPopIn {
          0% { opacity: 0; transform: translateY(-4px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
      <div style={{
        position: 'absolute',
        top: -2,
        left: 10,
        width: 6,
        height: 6,
        background: '#DC2626',
        transform: 'rotate(45deg)',
        zIndex: -1,
        borderRadius: 1
      }} />
      {message}
    </div>
  );
}
