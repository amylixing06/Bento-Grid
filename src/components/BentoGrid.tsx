'use client';

import { useRef, forwardRef, useImperativeHandle } from 'react';
import { toPng } from 'html-to-image';
import { QRCodeCanvas } from 'qrcode.react';
import { FaUserFriends, FaChartLine, FaCogs, FaCheckCircle, FaClock, FaTags, FaChartPie, FaTrophy } from 'react-icons/fa';

export interface SectionItem {
  label: string;
  value: string;
}
export interface Section {
  title: string;
  items: SectionItem[];
}
interface CoreNumber {
  number: string;
  desc: string;
}
interface BentoGridProps {
  title?: string;
  subtitle?: string;
  coreNumbers?: CoreNumber[];
  sections?: Section[];
  tags?: string[];
  cta?: string;
  author?: string;
  rawContent?: string;
  meta?: {
    title?: string;
    author?: string;
    platform?: string;
    date?: string;
    url?: string;
    [key: string]: any;
  };
}

function isHighlightValue(value: string) {
  // 判断是否为数字、单位、百分比、标签
  return /^(\d+[a-zA-Z%\u4e00-\u9fa5]*)$/.test(value) || /[\d\.]+%$/.test(value) || value.length <= 6;
}

function getIconByLabel(label: string) {
  if (/团队|协作|用户|成员/.test(label)) return <FaUserFriends className="text-purple-400 mr-2" />;
  if (/效率|进度|速度|成长/.test(label)) return <FaChartLine className="text-purple-400 mr-2" />;
  if (/系统|工程|架构|流程/.test(label)) return <FaCogs className="text-purple-400 mr-2" />;
  if (/完成|通过|成功|已实现/.test(label)) return <FaCheckCircle className="text-green-400 mr-2" />;
  if (/时间|周期|时长/.test(label)) return <FaClock className="text-blue-400 mr-2" />;
  if (/标签|分类/.test(label)) return <FaTags className="text-pink-400 mr-2" />;
  if (/占比|比例|分布/.test(label)) return <FaChartPie className="text-indigo-400 mr-2" />;
  if (/冠军|第一|最佳/.test(label)) return <FaTrophy className="text-yellow-400 mr-2" />;
  return null;
}

function renderProgressBar(value: string) {
  // 支持"80%"或"进度80%"等
  const match = value.match(/(\d{1,3})%/);
  if (match) {
    const percent = Math.min(100, parseInt(match[1], 10));
    return (
      <div className="w-full bg-purple-100 rounded-full h-2 mt-2">
        <div
          className="bg-gradient-to-r from-purple-400 to-purple-600 h-2 rounded-full"
          style={{ width: `${percent}%` }}
        ></div>
      </div>
    );
  }
  return null;
}

// 智能高亮色选择
function getHighlightClass(label: string, value: string) {
  if (/成功|通过|已实现|第一|冠军/.test(label + value)) return 'bg-gradient-to-r from-green-400 to-green-600 text-white';
  if (/警告|风险|错误|失败/.test(label + value)) return 'bg-gradient-to-r from-orange-400 to-yellow-400 text-white';
  if (/数据|数字|分数|比例|占比|%|\d+/.test(value)) return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-transparent bg-clip-text';
  if (/速度|效率|成长|进度/.test(label + value)) return 'bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text';
  return 'text-yellow-400';
}

const BentoGrid = forwardRef<HTMLDivElement, BentoGridProps>(function BentoGrid({ 
  title,
  subtitle,
  coreNumbers = [],
  sections = [],
  tags = [],
  cta,
  author,
  rawContent,
  meta
}, ref) {
  const gridRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => gridRef.current as HTMLDivElement);

  const handleDownload = async () => {
    if (gridRef.current) {
      try {
        const dataUrl = await toPng(gridRef.current, {
          quality: 1.0,
          pixelRatio: 2,
        });
        const link = document.createElement('a');
        link.download = 'bento-grid.png';
        link.href = dataUrl;
        link.click();
      } catch (error) {
        console.error('Error generating image:', error);
      }
    }
  };

  return (
    <>
      <div ref={gridRef} className="space-y-4 min-h-screen bg-gradient-to-br from-[#232526] to-[#414345] p-4">
        {/* 主标题卡片（始终顶部） */}
        {(title || subtitle) && (
          <div className="card col-span-full py-8 bg-[#18181b] shadow-xl flex flex-col items-center mb-4">
            {title && <h1 className="text-5xl font-extrabold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-2 text-center tracking-wide">{title}</h1>}
            {subtitle && <div className="text-lg text-gray-400 mb-2 text-center font-medium tracking-wide">{subtitle}</div>}
          </div>
        )}
        {/* 大数字卡片 */}
        {coreNumbers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {coreNumbers.map((num, idx) => (
              <div key={idx} className="card bg-[#18181b] shadow-lg flex flex-col items-center py-8">
                <div className="text-5xl font-extrabold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-2">{num.number}</div>
                <div className="text-base text-gray-300">{num.desc}</div>
              </div>
            ))}
          </div>
        )}
        {/* 分区卡片（AIDA横排，主点大副点小，主点加色块/icon） */}
        <div
          className={`grid gap-6 p-6 rounded-2xl justify-items-center ${sections.length === 1 ? 'grid-cols-1' : ''}`}
          style={sections.length === 1
            ? {}
            : { gridTemplateColumns: `repeat(auto-fit, minmax(260px, 1fr))`, margin: '0 auto' }}
        >
          {sections && sections.length > 0 && sections.map((section, idx) => (
            <div className="card py-6 bg-[#18181b] shadow-lg flex flex-col" key={idx} style={sections.length === 1 ? { width: '100%' } : { maxWidth: 340, width: '100%' }}>
              {/* 分区标题 */}
              <div className="text-2xl font-bold text-white mb-6 flex items-center">
                {/* 可加icon：AIDA四步可用不同icon，示例用emoji */}
                {section.title.includes('吸引') && <span className="mr-2">🧲</span>}
                {section.title.includes('激发') && <span className="mr-2">💡</span>}
                {section.title.includes('引导') && <span className="mr-2">🚩</span>}
                {section.title.includes('行动') && <span className="mr-2">⚡</span>}
                {section.title}
              </div>
              <ul className="space-y-6">
                {section.items && section.items.map((item, i) => (
                  <li key={i}>
                    {/* 主点大色块，副点小灰色 */}
                    <div className="font-bold text-lg mb-1 flex items-center">
                      <span className="inline-block px-2 py-1 rounded bg-gradient-to-r from-yellow-400 to-orange-400 text-white mr-2 text-base">
                        {item.label}
                      </span>
                    </div>
                    <div className="text-gray-300 text-base ml-1">{item.value}</div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {/* 标签+二维码+原文信息整合区 */}
        {(tags && tags.length > 0) && (
          <div className="card col-span-full bg-[#18181b] shadow-lg flex flex-row items-center py-4 px-6">
            {/* 左侧二维码及提示 */}
            <div className="flex flex-col items-center mr-6 min-w-[80px]">
              {meta && meta.url && (
                <a href={meta.url.startsWith('http') ? meta.url : `https://${meta.url}`} target="_blank" rel="noopener noreferrer">
                  <QRCodeCanvas value={meta.url.startsWith('http') ? meta.url : `https://${meta.url}`} size={80} />
                </a>
              )}
              {(!meta || !meta.url) && (
                <QRCodeCanvas value={meta && meta.title ? meta.title : '扫码体验'} size={80} />
              )}
              <div className="mt-2 text-xs text-gray-400 whitespace-nowrap">
                {meta && meta.url ? '扫码阅读原文' : '扫码体验'}
              </div>
            </div>
            {/* 右侧内容 */}
            <div className="flex-1 flex flex-col min-w-0">
              <div className="text-xl font-bold text-white mb-2 truncate">{meta && meta.title ? meta.title : '原文标题'}</div>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag) => (
                  <span key={tag} className="tag bg-gradient-to-r from-yellow-100 to-orange-200 text-yellow-700 border-0">{tag}</span>
                ))}
              </div>
              {meta && meta.author && (
                <div className="text-xs text-gray-400">作者：{meta.author}</div>
              )}
            </div>
          </div>
        )}
        {/* 行动号召/结论区 */}
        {cta && (
          <div className="card col-span-full bg-[#18181b] shadow-lg flex flex-col items-center py-6">
            <span className="text-lg font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">{cta}</span>
          </div>
        )}
      </div>
    </>
  );
});

export default BentoGrid; 