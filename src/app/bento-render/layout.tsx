import type { Metadata } from 'next';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Bento Grid - 截图渲染',
  description: '专用于生成Bento Grid图片的渲染页面',
};

export default function BentoRenderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="bento-render-page bg-gray-900">
        {children}
      </body>
    </html>
  );
} 