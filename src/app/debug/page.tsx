export default function DebugPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Debug Page</h1>
      <div className="space-y-2">
        <p>If you can see this, Next.js is working!</p>
        <p>Check the browser console for any errors.</p>
        <a href="/trailer-orders" className="text-blue-500 underline">
          Go to Trailer Orders
        </a>
      </div>
    </div>
  )
}

