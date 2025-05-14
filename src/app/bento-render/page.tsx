'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
  sections: Section[];
  meta?: {
    url?: string;
  };
}

// 分离出使用useSearchParams的组件
function BentoContent() {
  const searchParams = useSearchParams();
  const [analyzedContent, setAnalyzedContent] = useState<AnalyzedContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // 从URL参数中获取数据ID
    const dataId = searchParams.get('id');
    
    if (dataId) {
      try {
        // 从sessionStorage获取数据
        const storedData = sessionStorage.getItem(dataId);
        
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          setAnalyzedContent(parsedData);
        } else {
          setError('无法找到数据，可能会话已过期');
        }
      } catch (error) {
        console.error('解析数据失败:', error);
        setError('数据解析失败');
      }
    } else {
      setError('未提供数据ID参数');
    }
    
    setIsLoading(false);
  }, [searchParams]);
  
  // 页面加载完成后通知父窗口
  useEffect(() => {
    if (!isLoading && analyzedContent) {
      // 向父窗口或截图服务发送渲染完成的消息
      window.parent.postMessage({ type: 'RENDER_COMPLETE' }, '*');
      
      // 设置一个标记，表示页面已准备好截图
      const readyElement = document.createElement('div');
      readyElement.id = 'screenshot-ready';
      readyElement.style.display = 'none';
      document.body.appendChild(readyElement);
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
        <div className="text-white">{error}</div>
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
    <div className="min-h-screen bg-gray-900 py-8">
      <div id="bento-container" style={{ width: 820, margin: '0 auto' }}>
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

// 加载占位符组件
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-white">加载中...</div>
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