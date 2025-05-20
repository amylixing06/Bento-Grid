'use client'
import { useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    else alert('登录成功！')
  }

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">登录</h2>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="邮箱"
            type="email"
            required
          />
          <input
            className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="密码"
            required
          />
          <button
            type="submit"
            className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 rounded transition"
          >
            登录
          </button>
        </form>
        <button
          onClick={handleGoogleLogin}
          className="w-full mt-4 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded transition"
        >
          使用 Google 登录
        </button>
        {error && <div className="text-red-500 mt-4 text-center">{error}</div>}
        <div className="text-center mt-6 text-gray-500 text-sm">
          没有账号？<a href="/register" className="text-indigo-500 hover:underline">注册</a>
        </div>
      </div>
    </div>
  )
} 