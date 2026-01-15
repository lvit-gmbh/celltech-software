"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <html lang="de">
      <body>
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-center space-y-4 p-6">
            <h2 className="text-2xl font-bold text-foreground">Something went wrong!</h2>
            <p className="text-muted-foreground">
              {error.message || "An unexpected error occurred"}
            </p>
            <button
              onClick={reset}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
