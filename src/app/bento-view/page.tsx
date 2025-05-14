'use client';

import { useState, useEffect } from 'react';
import BentoGrid from '@/components/BentoGrid';

export default function BentoViewPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // 从URL参数中获取数据
      const urlParams = new URLSearchParams(window.location.search);
      const encodedData = urlParams.get('data');
      
      if (encodedData) {
        const decodedData = JSON.parse(decodeURIComponent(encodedData));
        setData(decodedData);
      } else {
        setError('未提供数据参数');
      }
    } catch (err) {
      setError('数据解析失败');
      console.error('数据解析错误:', err);
    }
  }, []);

  return (
    <div style={{ 
      minHeight: '100vh',
      background: '#1f1f1f',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '0',
      margin: '0'
    }}>
      {error ? (
        <div style={{ color: 'white', textAlign: 'center' }}>
          {error}
        </div>
      ) : !data ? (
        <div style={{ color: 'white', textAlign: 'center' }}>
          加载中...
        </div>
      ) : (
        <div id="bento-container" style={{ padding: '20px 0' }}>
          <BentoGrid 
            title={data.title}
            subtitle={data.subtitle}
            tags={data.tags}
            author={data.author}
            rawContent={data.rawContent}
            sections={data.sections}
            meta={data.meta}
          />
        </div>
      )}
    </div>
  );
}
