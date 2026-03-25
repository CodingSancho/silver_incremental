import { useEffect, useState, useCallback } from 'react'
import { getMe, getCount, getCooldown, increment, logout } from './api'
import type { User } from "./api";

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return [h, m, s].map(n => String(n).padStart(2, '0')).join(':')
}

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [count, setCount] = useState<number>(0)
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [incrementing, setIncrementing] = useState(false)

  const load = useCallback(async () => {
    const [me, currentCount] = await Promise.all([getMe(), getCount()])
    setUser(me)
    setCount(currentCount)

    if (me) {
      const cooldown = await getCooldown()
      setRemainingSeconds(cooldown)
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (remainingSeconds <= 0) return
    const interval = setInterval(() => {
      setRemainingSeconds(s => {
        if (s <= 1) {
          clearInterval(interval)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [remainingSeconds])

  async function handleIncrement() {
    setIncrementing(true)
    try {
      const { count: newCount, remainingSeconds: newCooldown } = await increment()
      setCount(newCount)
      setRemainingSeconds(newCooldown)
    } catch {
      alert('Failed to increment — are you on cooldown?')
    } finally {
      setIncrementing(false)
    }
  }

  async function handleLogout() {
    await logout()
    setUser(null)
    setRemainingSeconds(0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 w-80 space-y-6">
        {user ? (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Signed in as</p>
                <p className="text-sm font-medium text-gray-700">
                  {user.email}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Sign out
              </button>
            </div>

            <div>
              <p className="text-xs text-gray-400">Global count</p>
              <p className="text-4xl font-bold text-gray-900">
                {count.toLocaleString()}
              </p>
            </div>

            <button
              onClick={handleIncrement}
              disabled={remainingSeconds > 0 || incrementing}
              className="w-full bg-gray-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {incrementing ? "Incrementing..." : "+ Increment"}
            </button>

            {remainingSeconds > 0 && (
              <p className="text-xs text-center text-gray-400">
                Next click in {formatTime(remainingSeconds)}
              </p>
            )}
          </>
        ) : (
          <>
            <div>
              <p className="text-sm font-medium text-gray-700">
                Global Counter
              </p>
              <p className="text-xs text-gray-400 mt-1">Sign in to increment</p>
            </div>

            <div>
              <p className="text-xs text-gray-400">Global count</p>
              <p className="text-4xl font-bold text-gray-900">
                {count.toLocaleString()}
              </p>
            </div>

            <a
              href={
                import.meta.env.DEV
                  ? "http://localhost:3000/auth/google"
                  : "/auth/google"
              }
              className="block w-full bg-gray-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-700 transition-colors text-center"
            >
              Sign in with Google
            </a>
          </>
        )}
      </div>
    </div>
  );
}