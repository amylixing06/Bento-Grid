// force redeploy for mobile centering fix
'use client';

import { useState, useRef, useEffect } from 'react';
import InputForm from '@/components/InputForm';
import BentoGrid from '@/components/BentoGrid';
import type { Section } from '@/components/BentoGrid';
import dynamic from 'next/dynamic';
import { v4 as uuidv4 } from 'uuid';
import { toPng } from 'html-to-image';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link'
import type { AuthError, User, Session, AuthChangeEvent } from '@supabase/supabase-js';

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

// 默认宣传内容对象
const DEFAULT_ANALYZED_CONTENT: AnalyzedContent = {
  title: '新视力',
  summary: '遇见惊喜，创造新视力',
  keyPoints: [],
  wordCount: 0,
  readingTime: 0,
  tags: ['宣传', '品牌'],
  content: '',
  author: '新视力团队',
  rawContent: '',
  sections: [
    {
      title: '品牌介绍',
      items: [
        { label: '愿景', value: '遇见惊喜，创造新视力' },
        { label: '口号', value: '新视力，发现新世界' }
      ]
    }
  ],
  meta: {}
};

export default function Home() {
  const [content, setContent] = useState<string>('');
  const [analyzedContent, setAnalyzedContent] = useState<AnalyzedContent>(DEFAULT_ANALYZED_CONTENT);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const bentoRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<User | null>(null);

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

  // 只在客户端读取 localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const lastContent = localStorage.getItem('bento_last_content');
        if (lastContent && lastContent.trim()) {
          setContent(lastContent);
        }
        const lastAnalyzed = localStorage.getItem('bento_last_analyzed');
        if (lastAnalyzed) {
          const parsed = JSON.parse(lastAnalyzed);
          // 只要有 title 就恢复，否则清理 localStorage
          if (parsed && typeof parsed === 'object' && parsed.title) {
            setAnalyzedContent(parsed);
          } else {
            localStorage.removeItem('bento_last_analyzed');
            setAnalyzedContent(DEFAULT_ANALYZED_CONTENT);
          }
        }
      } catch (err) {
        localStorage.removeItem('bento_last_analyzed');
        setAnalyzedContent(DEFAULT_ANALYZED_CONTENT);
      }
    }
  }, []);

  // 数据变化时自动保存，增加防御性判断
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // 只保存有效的 content
        if (content && content.trim()) {
          localStorage.setItem('bento_last_content', content);
        }
        
        // 只保存有效的 analyzedContent
        if (analyzedContent && 
            analyzedContent.title && 
            analyzedContent.sections && 
            analyzedContent.sections.length > 0
        ) {
          localStorage.setItem('bento_last_analyzed', JSON.stringify(analyzedContent));
        }
      } catch (err) {
        console.log('保存到 localStorage 出错', err);
      }
    }
  }, [content, analyzedContent]);

  useEffect(() => {
    // 获取当前登录用户
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
    // 监听登录状态变化
    const { data: listener } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user || null);
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  console.log('user', user);
  console.log('analyzedContent', analyzedContent);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* 顶部导航栏 */}
      {/*
      <nav className="w-full flex justify-end items-center px-8 py-4 bg-transparent absolute top-0 left-0 z-10">
        {user ? (
          <div className="flex items-center gap-4">
            <span className="text-gray-700 font-semibold">
              {user.email?.replace(/@.+$/, '') || '用户'}
            </span>
            <button
              onClick={async () => { await supabase.auth.signOut(); }}
              className="text-gray-400 hover:text-red-500 px-3 py-1 rounded transition border border-gray-200 hover:border-red-400"
            >退出</button>
          </div>
        ) : (
          <>
            <Link href="/login" className="text-indigo-600 hover:text-indigo-800 font-semibold px-4 py-2 rounded transition">登录</Link>
            <Link href="/register" className="ml-2 text-white bg-indigo-500 hover:bg-indigo-600 font-semibold px-4 py-2 rounded transition">注册</Link>
          </>
        )}
      </nav>
      */}
      <div className="home-page pt-20">
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
                          // 文件名用标题，过滤非法字符
                          let filename = analyzedContent.title || 'bento-grid';
                          filename = filename.replace(/[/\\?%*:|"<>]/g, '').slice(0, 40) || 'bento-grid';
                          const link = document.createElement('a');
                          link.download = filename + '.png';
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