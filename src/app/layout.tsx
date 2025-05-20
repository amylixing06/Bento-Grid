import './globals.css';
import { Inter } from 'next/font/google';
import { StagewiseToolbar } from '@stagewise/toolbar-next';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: '新视力',
  description: '将文章或链接一键生成结构化Bento Grid卡片，支持微信文章，极致美观导出图片',
};

const stagewiseConfig = {
  plugins: []
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch('/api/user/me').then(res => res.json()).then(setUser);
  }, []);

  const handleGenerate = async () => {
    // ...生成新视力的逻辑
    await fetch('/api/visionRecord/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: '新视力内容' })
    });
    // 保存成功后跳转
    router.push('/user');
  };

  return (
    <html lang="zh">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=900, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body className={inter.className}>
        {children}
        {process.env.NODE_ENV === 'development' && (
          <StagewiseToolbar config={stagewiseConfig} />
        )}
      </body>
    </html>
  );
}
