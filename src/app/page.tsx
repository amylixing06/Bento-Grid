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
      setDebugInfo('已完成，请查收');
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
              <div className="card" id="bento-container">
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
                    url: analyzedContent.meta?.url || (content && content.startsWith('http') ? content : '')
                  }}
                />
                <div className="flex flex-col items-end">
                  <div className="flex gap-2 flex-wrap justify-end">
                    <button
                      onClick={async () => {
                        try {
                          if (!analyzedContent) {
                            alert('没有可用的内容数据');
                            return;
                          }

                          // 直接使用html-to-image库在前端截图，不依赖外部服务
                          if (bentoRef.current) {
                            // 确保截图元素可见并样式正确
                            console.log('开始截图...');
                            const element = bentoRef.current;
                            
                            // 截图前先移除可能干扰的元素
                            element.querySelectorAll('button, .btn-primary, .btn-secondary').forEach(el => {
                              (el as HTMLElement).style.display = 'none';
                            });
                            
                            // 使用toPng函数进行截图
                            try {
                              // 导入toPng
                              const { toPng } = await import('html-to-image');
                              
                              // 执行截图
                              const dataUrl = await toPng(element, {
                                quality: 1.0,
                                pixelRatio: 2,
                                skipFonts: false,
                                cacheBust: true,
                                backgroundColor: '#111827'
                              });
                              
                              // 恢复元素样式
                              element.querySelectorAll('button, .btn-primary, .btn-secondary').forEach(el => {
                                (el as HTMLElement).style.display = '';
                              });
                              
                              // 创建下载链接
                              const link = document.createElement('a');
                              link.download = 'bento-grid.png';
                              link.href = dataUrl;
                              link.click();
                              
                              console.log('截图完成，已触发下载');
                            } catch (imgError) {
                              console.error('截图过程出错:', imgError);
                              alert('生成图片失败，请稍后重试');
                              
                              // 恢复元素样式
                              element.querySelectorAll('button, .btn-primary, .btn-secondary').forEach(el => {
                                (el as HTMLElement).style.display = '';
                              });
                            }
                          } else {
                            alert('内容元素未找到，无法截图');
                          }
                        } catch (e) {
                          console.error('下载操作错误:', e);
                          alert('下载图片失败，请稍后重试');
                        }
                      }}
                      className="btn-primary mt-4"
                    >
                      下载为图片
                    </button>
                    
                    <button
                      onClick={() => {
                        if (!analyzedContent) {
                          alert('没有可用的内容数据');
                          return;
                        }
                        
                        // 使用localStorage存储数据
                        const bentoDataId = 'current-bento-data';
                        
                        // 确保使用JSON.stringify处理整个对象
                        const jsonData = JSON.stringify(analyzedContent, (key, value) => {
                          // 这里确保所有函数和特殊对象被正确序列化
                          if (typeof value === 'function') {
                            return undefined; // 忽略函数属性
                          }
                          return value;
                        });
                        
                        // 使用localStorage存储数据
                        localStorage.setItem(bentoDataId, jsonData);
                        console.log('数据已保存到localStorage, ID:', bentoDataId, '数据长度:', jsonData.length);
                        
                        // 构建专门用于截图的页面URL
                        const renderUrl = `${window.location.origin}/bento-render?id=${bentoDataId}`;
                        
                        // 在新窗口打开预览页面
                        window.open(renderUrl, '_blank');
                      }}
                      className="btn-secondary mt-4"
                    >
                      预览页面
                    </button>
                  </div>
                  
                  <p className="text-gray-500 text-xs mt-2">
                    使用专用页面截图，确保更高质量的图片效果
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
} 