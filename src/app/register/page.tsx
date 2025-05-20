'use client'
import { useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) setError(error.message)
    else alert('注册成功，请查收邮箱激活账号！')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">注册</h2>
        <form onSubmit={handleRegister} className="flex flex-col gap-4">
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
            注册
          </button>
        </form>
        {error && <div className="text-red-500 mt-4 text-center">{error}</div>}
        <div className="text-center mt-6 text-gray-500 text-sm">
          已有账号？<a href="/login" className="text-indigo-500 hover:underline">登录</a>
        </div>
      </div>
    </div>
  )
} 