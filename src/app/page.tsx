'use client';

import { useState, useRef } from 'react';
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

// 导出桌面端样式的 class 名
const EXPORT_DESKTOP_CLASS = 'force-desktop';

export default function Home() {
  const [content, setContent] = useState<string>('');
  const [analyzedContent, setAnalyzedContent] = useState<AnalyzedContent | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const bentoRef = useRef<HTMLDivElement>(null);

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
              新视力
            </h1>
            <p className="text-gray-600 text-lg">
              遇见惊喜，创造新视力
            </p>
          </div>

          <div className="card mb-8">
            <InputForm onSubmit={handleSubmit} isLoading={isLoading} placeholder="粘贴链接或输入内容..." hideUrlOption />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-4 mb-8">
              {error}
            </div>
          )}

          {analyzedContent && (
            <div className="card">
              <BentoGrid 
                ref={bentoRef}
                title={analyzedContent.title}
                subtitle={analyzedContent.summary}
                tags={analyzedContent.tags}
                author={analyzedContent.author}
                rawContent={analyzedContent.rawContent}
                sections={Array.isArray(analyzedContent.sections)
                  ? analyzedContent.sections.map((item) =>
                      typeof item === 'string'
                        ? { title: item, items: [] }
                        : item
                    )
                  : []}
                meta={{
                  title: analyzedContent.title,
                  author: analyzedContent.author,
                  url: content && content.startsWith('http') ? content : 'www.ainew.cc'
                }}
              />
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    if (bentoRef.current) {
                      // 临时加桌面端样式
                      bentoRef.current.classList.add(EXPORT_DESKTOP_CLASS);
                      import('html-to-image').then(({ toPng }) => {
                        toPng(bentoRef.current as HTMLElement, { quality: 1.0, pixelRatio: 2 }).then((dataUrl) => {
                          // 导出后移除桌面端样式
                          bentoRef.current && bentoRef.current.classList.remove(EXPORT_DESKTOP_CLASS);
                          const link = document.createElement('a');
                          link.download = '新视力.png';
                          link.href = dataUrl;
                          link.click();
                        }).catch(() => {
                          bentoRef.current && bentoRef.current.classList.remove(EXPORT_DESKTOP_CLASS);
                        });
                      });
                    }
                  }}
                  className="btn-primary mt-4"
                >
                  下载为图片
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
} 