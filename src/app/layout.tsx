import './globals.css';
import { Inter } from 'next/font/google';
import dynamic from 'next/dynamic';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: '新视力',
  description: '将文章或链接一键生成结构化Bento Grid卡片，支持微信文章，极致美观导出图片',
};

// 动态导入 StagewiseToolbarClient，仅在客户端渲染
const StagewiseToolbarClient = dynamic(() => import('../../StagewiseToolbarClient'), { ssr: false });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=900, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body className={inter.className}>
        {children}
        {process.env.NODE_ENV === 'development' && <StagewiseToolbarClient />}
      </body>
    </html>
  );
}
