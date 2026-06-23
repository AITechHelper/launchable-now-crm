export default function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; color: string }> = {
    Prospect: { bg: '#3a3a5c', color: '#a0a0c0' },
    'Demo Booked': { bg: '#2D1B6E', color: '#7B2FFF' },
    Closed: { bg: '#1B2A6E', color: '#6699FF' },
    Active: { bg: '#003D2B', color: '#00FFB2' },
    Churned: { bg: '#3D1B1B', color: '#FF6666' },
  }

  const style = styles[status] || styles['Prospect']

  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: style.bg, color: style.color }}
    >
      {status}
    </span>
  )
}
