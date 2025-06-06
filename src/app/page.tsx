// force redeploy for mobile centering fix
'use client';

import { useState, useRef, useEffect } from 'react';
import InputForm from '@/components/InputForm';
import BentoGrid from '@/components/BentoGrid';
import type { Section } from '@/components/BentoGrid';
import dynamic from 'next/dynamic';
import { v4 as uuidv4 } from 'uuid';
import { toPng } from 'html-to-image';

const Zoom = dynamic(() => import('react-medium-image-zoom'), { ssr: false });
import 'react-medium-image-zoom/dist/styles.css';

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
  meta?: {
    url?: string;
  };
}

// 导出桌面端样式的 class 名
const EXPORT_DESKTOP_CLASS = 'force-desktop';

export default function Home() {
  const [content, setContent] = useState<string>('');
  const [analyzedContent, setAnalyzedContent] = useState<AnalyzedContent | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const bentoRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (text: string, isUrl: boolean): Promise<void> => {
    setIsLoading(true);
    setError(null);
    setDebugInfo(null);
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
      setDebugInfo('已完成，下滑到底部，可下载高清图片');
    } catch (err) {
      setError(err instanceof Error ? err.message : '处理内容时出错');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="home-page">
        <div className="container mx-auto px-4 py-12" style={{ maxWidth: '900px' }}>
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
              <InputForm onSubmit={handleSubmit} placeholder="粘贴链接或输入内容..." hideUrlOption debugInfo={debugInfo} />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-4 mb-8">
                {error}
              </div>
            )}

            {analyzedContent && (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {/* 图片容器开始 */}
                <div id="image-export-container" style={{ width: 900, minWidth: 900, maxWidth: 900, background: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px 0', boxSizing: 'border-box' }}>
                  <div style={{ width: 820, minWidth: 820, maxWidth: 820, background: '#888883', borderRadius: 12, boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)', padding: '40px', boxSizing: 'border-box', display: 'block', margin: '0 auto' }}>
                    <BentoGrid
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
                        url: analyzedContent.meta?.url || (content && content.startsWith('http') ? content : '')
                      }}
                    />
                  </div>
                </div>
                {/* 图片容器结束 */}
                <div className="flex gap-2 flex-wrap justify-center mt-4" style={{ width: 830, maxWidth: 830, margin: '0 auto', alignSelf: 'center' }}>
                  <button
                    onClick={async () => {
                      const bentoEl = document.querySelector('#bento-container') as HTMLElement | null;
                      if (bentoEl) {
                        try {
                          const dataUrl = await toPng(bentoEl, {
                            quality: 1.0,
                            pixelRatio: 2
                          });
                          const link = document.createElement('a');
                          link.download = 'bento-grid.png';
                          link.href = dataUrl;
                          link.click();
                        } catch (e) {
                          alert('图片导出失败，请手动截图');
                        }
                      }
                    }}
                    className="btn-primary mt-4"
                    style={{
                      borderRadius: 2,
                      fontWeight: 600,
                      padding: '0.75rem 2.5rem',
                      boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)'
                    }}
                  >
                    下载高清图片
                  </button>
                  <button
                    onClick={() => {
                      // 预览高清图片，跳转到 /bento-render?id=xxx
                      const previewId = 'preview-' + Date.now();
                      localStorage.setItem(previewId, JSON.stringify(analyzedContent));
                      const renderUrl = `${window.location.origin}/bento-render?id=${previewId}`;
                      window.open(renderUrl, '_blank');
                    }}
                    className="mt-4"
                    style={{
                      background: '#e0e0e0',
                      color: '#333',
                      borderRadius: 2,
                      fontWeight: 600,
                      padding: '0.75rem 2.5rem',
                      boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)'
                    }}
                  >
                    预览高清图片
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
} 