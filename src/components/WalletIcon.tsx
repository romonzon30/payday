export default function WalletIcon() {
  return (
    <div
      style={{
        width: 56,
        height: 56,
        backgroundColor: '#111111',
        borderRadius: 14,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      aria-hidden="true"
    >
      <svg
        width="30"
        height="30"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M16 12h.01" strokeWidth="2.5" />
        <path d="M2 10h20" />
      </svg>
    </div>
  )
}
