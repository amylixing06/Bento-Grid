'use client';

import { useState } from 'react';
import InputForm from '@/components/InputForm';
import BentoGrid from '@/components/BentoGrid';
import type { Section } from '@/components/BentoGrid';

interface AnalyzedContent {
  title: string;
  summary: string;
  keyPoints: string[];
  wordCount: number;
  readingTime: number;
  tags: string[];
  content: string;
  author?: string;
  rawContent: string;
  sections: string[];
}

export default function Home() {
  const [content, setContent] = useState<string>('');
  const [analyzedContent, setAnalyzedContent] = useState<AnalyzedContent | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (text: string, isUrl: boolean) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: text, isUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '内容分析失败');
      }

      const data = await response.json();
      setContent(text);
      setAnalyzedContent(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '处理内容时出错');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold gradient-text mb-4">
              Bento Grid 生成器
            </h1>
            <p className="text-gray-600 text-lg">
              将您的文章或链接转换为精美的 Bento Grid 布局
            </p>
          </div>

          <div className="card mb-8">
            <InputForm onSubmit={handleSubmit} isLoading={isLoading} />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-4 mb-8">
              {error}
            </div>
          )}

          {analyzedContent && (
            <div className="card">
              <BentoGrid 
                summary={analyzedContent.summary}
                tags={analyzedContent.tags}
                author={analyzedContent.author}
                rawContent={analyzedContent.rawContent}
                sections={analyzedContent.sections}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
} 