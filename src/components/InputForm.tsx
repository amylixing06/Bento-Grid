'use client';

import { useState } from 'react';

interface InputFormProps {
  onSubmit: (text: string, isUrl: boolean) => void;
  isLoading: boolean;
}

export default function InputForm({ onSubmit, isLoading }: InputFormProps) {
  const [text, setText] = useState('');
  const [isUrl, setIsUrl] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  const validateUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDebugInfo(null);

    if (isUrl && !validateUrl(text)) {
      setError('请输入有效的 URL');
      return;
    }

    try {
      setDebugInfo('正在发送请求...');
      const response = await fetch('/api/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: text, isUrl }),
      });

      setDebugInfo(`响应状态: ${response.status}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '请求失败');
      }

      const data = await response.json();
      setDebugInfo('请求成功，正在处理数据...');
      onSubmit(text, isUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : '处理内容时出错');
      setDebugInfo(`错误详情: ${err instanceof Error ? err.message : '未知错误'}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-lg font-medium text-gray-700">
            输入内容
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="urlMode"
              checked={isUrl}
              onChange={(e) => setIsUrl(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="urlMode" className="text-sm text-gray-600">
              输入 URL
            </label>
          </div>
        </div>

        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={isUrl ? "输入文章 URL..." : "输入文章内容..."}
            className="input-field h-32 resize-none"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 mt-2">{error}</p>
        )}

        {debugInfo && (
          <p className="text-sm text-gray-500 mt-2">{debugInfo}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading || !text.trim()}
        className={`w-full ${isLoading || !text.trim() ? 'btn-secondary' : 'btn-primary'}`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            处理中...
          </div>
        ) : (
          '生成 Bento Grid'
        )}
      </button>
    </form>
  );
} 