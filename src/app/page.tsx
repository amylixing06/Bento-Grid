'use client';

import { useState, useRef, useEffect } from 'react';
import InputForm from '@/components/InputForm';
import BentoGrid from '@/components/BentoGrid';
import type { Section } from '@/components/BentoGrid';
import dynamic from 'next/dynamic';
import { v4 as uuidv4 } from 'uuid';

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
  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 700);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
                <div
                  style={
                    isMobile
                      ? {
                          width: 'calc(100vw - 8px)',
                          margin: '0 auto',
                          boxSizing: 'border-box',
                          display: 'block',
                        }
                      : {
                          width: 820,
                          minWidth: 820,
                          maxWidth: 820,
                          margin: '0 auto',
                          display: 'block',
                        }
                  }
                  ref={bentoRef}
                  id="bento-container"
                >
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
                <div 
                  className="flex gap-2 flex-wrap justify-end mt-4" 
                  style={{ 
                    maxWidth: isMobile ? 'calc(100vw - 8px)' : 820,
                    width: '100%',
                    margin: '0 auto',
                    alignSelf: 'center'
                  }}
                >
                  <button
                    onClick={async () => {
                      try {
                        if (!analyzedContent) {
                          alert('没有可用的内容数据');
                          return;
                        }
                        if (bentoRef.current) {
                          // 隐藏按钮
                          bentoRef.current.querySelectorAll('button, .btn-primary, .btn-secondary').forEach(el => {
                            (el as HTMLElement).style.display = 'none';
                          });
                          const { toPng } = await import('html-to-image');
                          const dataUrl = await toPng(bentoRef.current, {
                            quality: 1.0,
                            pixelRatio: 2,
                            skipFonts: false,
                            cacheBust: true,
                            backgroundColor: '#111827'
                          });
                          // 恢复按钮
                          bentoRef.current.querySelectorAll('button, .btn-primary, .btn-secondary').forEach(el => {
                            (el as HTMLElement).style.display = '';
                          });
                          // 下载
                          const link = document.createElement('a');
                          link.download = 'bento-grid.png';
                          link.href = dataUrl;
                          link.click();
                        }
                      } catch (e) {
                        alert('下载图片失败，请稍后重试');
                      }
                    }}
                    className="btn-primary mt-4"
                  >
                    下载高清图片
                  </button>
                  <button
                    onClick={() => {
                      if (!analyzedContent) {
                        alert('没有可用的内容数据');
                        return;
                      }
                      // 生成唯一ID
                      const bentoDataId = uuidv4();
                      // 存数据到localStorage
                      localStorage.setItem(bentoDataId, JSON.stringify(analyzedContent));
                      // 跳转新窗口
                      const renderUrl = `${window.location.origin}/bento-render?id=${bentoDataId}`;
                      window.open(renderUrl, '_blank');
                    }}
                    className="mt-4"
                    style={{
                      background: '#e0e0e0',
                      color: '#333',
                      borderRadius: 16,
                      fontWeight: 600,
                      padding: '0.75rem 2.5rem',
                      boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)'
                    }}
                  >
                    预览图片
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