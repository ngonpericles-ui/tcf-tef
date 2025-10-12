// Force dynamic rendering for 404 page
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function NotFound() {
  return (
    <div style={{ padding: '4rem 1rem', textAlign: 'center' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Page not found</h1>
      <p style={{ marginTop: '0.75rem', color: '#6b7280' }}>
        The page you are looking for doesn't exist or has been moved.
      </p>
    </div>
  )
}
