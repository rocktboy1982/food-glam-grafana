export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#ffffff',
        color: '#111111',
        fontFamily: 'Georgia, "Times New Roman", serif',
      }}
    >
      {children}
    </div>
  )
}
