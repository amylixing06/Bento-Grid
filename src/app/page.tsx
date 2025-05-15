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
  sections: Section[];
  meta?: {
    url?: string;
  };
}

// 导出桌面端样式的 class 名
const EXPORT_DESKTOP_CLASS = 'force-desktop';

// 默认宣传内容
const DEFAULT_CONTENT = {
  title: "新视力内容营销工具",
  summary: "一键生成结构化Bento卡片，助力品牌内容传播",
  keyPoints: [],
  wordCount: 0,
  readingTime: 0,
  content: '',
  author: "",
  rawContent: "",
  sections: [
    {
      title: "产品亮点",
      items: [
        { label: "官网产品宣传", value: "支持输入品牌或产品URL" },
        { label: "支持博客文章", value: "自动抓取正文、标题等" },
        { label: "智能分析内容", value: "输出多分区卡片结构" }
      ]
    },
    {
      title: "特色功能",
      items: [
        { label: "多分区卡片", value: "智能产品介绍、二维码等展示" },
        { label: "一键营销", value: "高清Bento Grid营销" },
        { label: "社交分享", value: "社交媒体分享与知识内容展示" }
      ]
    },
    {
      title: "下载体验",
      items: [
        { label: "官网体验", value: "www.ainew.cc" },
        { label: "安装应用", value: "支持Chrome应用安装" },
        { label: "部署安装", value: "Github开源克隆" }
      ]
    }
  ],
  tags: ["内容营销", "Bento卡片", "智能分析", "社交分享"],
  meta: {
    title: "新视力内容营销工具",
    url: "https://www.ainew.cc"
  }
};

export default function Home() {
  const [content, setContent] = useState<string>('');
  const [analyzedContent, setAnalyzedContent] = useState<AnalyzedContent | null>(DEFAULT_CONTENT);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const bentoRef = useRef<HTMLDivElement>(null);

  // 自动恢复上次数据
  useEffect(() => {
    const lastContent = localStorage.getItem('bento_last_content');
    const lastAnalyzed = localStorage.getItem('bento_last_analyzed');
    console.log('恢复lastContent:', lastContent);
    console.log('恢复lastAnalyzed:', lastAnalyzed);
    if (lastContent) setContent(lastContent);
    if (lastAnalyzed) {
      setAnalyzedContent(JSON.parse(lastAnalyzed));
    }
  }, []);

  // 数据变化时自动保存
  useEffect(() => {
    if (content) localStorage.setItem('bento_last_content', content);
    if (analyzedContent) localStorage.setItem('bento_last_analyzed', JSON.stringify(analyzedContent));
  }, [content, analyzedContent]);

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
                      const bentoEl = document.getElementById('image-export-container') as HTMLElement | null;
                      if (!bentoEl) {
                        alert('导出容器未找到，请检查DOM结构');
                        return;
                      }
                      try {
                        const dataUrl = await toPng(bentoEl, {
                          quality: 1.0,
                          pixelRatio: 2,
                          backgroundColor: '#fff',
                        });
                        const link = document.createElement('a');
                        link.download = 'bento-grid.png';
                        link.href = dataUrl;
                        link.click();
                      } catch (e) {
                        alert('图片导出失败，请手动截图');
                        console.error('toPng error', e);
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