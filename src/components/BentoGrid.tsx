'use client';

import { useRef } from 'react';
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

export default function BentoGrid({ 
  title,
  subtitle,
  coreNumbers = [],
  sections = [],
  tags = [],
  cta,
  author,
  rawContent,
  meta
}: BentoGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);

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
    <div className="space-y-6 min-h-screen bg-gradient-to-br from-[#232526] to-[#414345] p-6">
      {/* 主标题卡片（始终顶部） */}
      {(title || subtitle) && (
        <div className="card col-span-full py-8 bg-[#18181b] shadow-xl flex flex-col items-center mb-4">
          {title && <h1 className="text-5xl font-extrabold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-2 text-center">{title}</h1>}
          {subtitle && <div className="text-lg text-gray-300 mb-2 text-center">{subtitle}</div>}
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
      {/* 分区卡片 */}
      <div
        ref={gridRef}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-10 rounded-2xl"
      >
        {sections && sections.length > 0 && sections.map((section, idx) => (
          <div className="card py-6 bg-[#18181b] shadow-lg" key={idx}>
            {/* 分区标题 */}
            <div className="text-2xl font-bold text-white mb-6">{section.title}</div>
            <ul className="space-y-6">
              {section.items && section.items.map((item, i) => (
                <li key={i}>
                  {/* label 单独一行高亮，value 下方 */}
                  <div className="font-bold text-yellow-400 text-lg mb-1">{item.label}</div>
                  {isHighlightValue(item.value) ? (
                    <div className={`text-2xl font-extrabold inline-block px-3 py-1 rounded-lg ${getHighlightClass(item.label, item.value)}`}>{item.value}</div>
                  ) : (
                    <div className="text-gray-300 text-base">{item.value}</div>
                  )}
                  {renderProgressBar(item.value)}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {/* 标签区 */}
      {tags && tags.length > 0 && (
        <div className="card col-span-full bg-[#18181b] shadow-lg flex flex-wrap gap-2 justify-center py-4">
          {tags.map((tag) => (
            <span key={tag} className="tag bg-gradient-to-r from-yellow-100 to-orange-200 text-yellow-700 border-0">{tag}</span>
          ))}
        </div>
      )}
      {/* 行动号召/结论区 */}
      {cta && (
        <div className="card col-span-full bg-[#18181b] shadow-lg flex flex-col items-center py-6">
          <span className="text-lg font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">{cta}</span>
        </div>
      )}
      {/* 下载为图片按钮 */}
      <div className="flex justify-end">
        <button
          onClick={handleDownload}
          className="btn-primary"
        >
          下载为图片
        </button>
      </div>
      {/* meta 信息底部小字展示和二维码（始终底部单独卡片） */}
      {(meta && (meta.title || meta.author || meta.platform || meta.date || meta.url)) && (
        <div className="card col-span-full bg-[#18181b] shadow-lg flex flex-col items-center text-xs text-gray-500 py-4 mt-4">
          <div>
            {meta.title ? <span>《{meta.title}》</span> : null}
            {meta.author ? <span>　作者：{meta.author}</span> : null}
            {meta.platform ? <span>　平台：{meta.platform}</span> : null}
            {meta.date ? <span>　日期：{meta.date}</span> : null}
          </div>
          {meta.url ? (
            <div className="flex items-center space-x-2 mt-2">
              <QRCodeCanvas value={meta.url} size={48} />
              <span>扫码阅读原文</span>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
} 