'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import BentoGrid from '@/components/BentoGrid';
import type { Section } from '@/components/BentoGrid';
import { toPng } from 'html-to-image';

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

// 加载占位符组件
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-white">加载中...</div>
    </div>
  );
}

// 分离出使用useSearchParams的组件
function BentoContent() {
  const searchParams = useSearchParams();
  const [analyzedContent, setAnalyzedContent] = useState<AnalyzedContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // 确保在客户端环境中运行
    if (typeof window !== 'undefined') {
      // 从URL参数中获取数据ID
      const dataId = searchParams.get('id');
      
      if (dataId) {
        try {
          // 从localStorage获取数据
          const storedData = localStorage.getItem(dataId);
          
          if (storedData) {
            const parsedData = JSON.parse(storedData);
            setAnalyzedContent(parsedData);
          } else {
            setError('无法找到数据，可能已过期或已被清理');
            console.error('未找到数据ID:', dataId);
          }
        } catch (error) {
          console.error('解析数据失败:', error);
          setError('数据解析失败');
        }
      } else {
        setError('未提供数据ID参数');
      }
      
      setIsLoading(false);
    }
  }, [searchParams]);
  
  // 页面加载完成后通知父窗口
  useEffect(() => {
    if (!isLoading && analyzedContent && typeof window !== 'undefined') {
      // 向父窗口或截图服务发送渲染完成的消息
      window.parent.postMessage({ type: 'RENDER_COMPLETE' }, '*');
      
      // 设置一个标记，表示页面已准备好截图
      const readyElement = document.createElement('div');
      readyElement.id = 'screenshot-ready';
      readyElement.style.display = 'none';
      document.body.appendChild(readyElement);

      // 自动下载高清图片
      const params = new URLSearchParams(window.location.search);
      if (params.get('download') === '1') {
        setTimeout(async () => {
          const bentoEl = document.getElementById('bento-container');
          if (bentoEl) {
            try {
              const dataUrl = await toPng(bentoEl, {
                quality: 1.0,
                pixelRatio: 2,
                backgroundColor: '#111827',
              });
              const link = document.createElement('a');
              link.download = 'bento-grid.png';
              link.href = dataUrl;
              link.click();
            } catch (e) {
              alert('图片导出失败，请手动截图');
            }
          }
        }, 600); // 等待页面渲染完成
      }
    }
  }, [isLoading, analyzedContent]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-center px-4">
          <div className="mb-4 text-xl">{error}</div>
          <p className="text-sm">请返回主页重新生成</p>
        </div>
      </div>
    );
  }

  if (!analyzedContent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white">没有找到有效数据</div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gray-900 py-8 bento-render-page"
      style={{
        overflow: 'auto',
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-zoom',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
      }}
    >
      <div id="bento-container" style={{ width: 820, minWidth: 820, maxWidth: 820, margin: '0 auto' }}>
        <BentoGrid
          title={analyzedContent.title}
          subtitle={analyzedContent.summary}
          tags={analyzedContent.tags}
          author={analyzedContent.author}
          rawContent={analyzedContent.rawContent}
          sections={analyzedContent.sections}
          meta={{
            title: analyzedContent.title,
            author: analyzedContent.author,
            url: analyzedContent.meta?.url
          }}
        />
      </div>
    </div>
  );
}

// 主页面组件，使用Suspense包装
export default function BentoRender() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <BentoContent />
    </Suspense>
  );
} 