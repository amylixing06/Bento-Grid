'use client';

import { useRef, forwardRef, useImperativeHandle, useState, useEffect } from 'react';
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
  };

  return (
    <>
      <div
        style={{
          width: 820,
          minWidth: 820,
          maxWidth: 820,
          margin: '0 auto',
          display: 'block',
          boxSizing: 'border-box',
          background: '#111827',
          borderRadius: 12,
        }}
        ref={gridRef}
        id="bento-container"
      >
        {/* 主标题卡片（始终顶部） */}
        <div style={{ paddingLeft: 24, paddingRight: 24 }}>
          {(title || subtitle) && (
            <div style={{
              background: '#18181b',
              borderRadius: 12,
              boxShadow: '0 4px 24px 0 rgba(0,0,0,0.18)',
              padding: 32,
              marginBottom: 24,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}>
              {title && <h1 style={{
                fontSize: 40,
                fontWeight: 800,
                background: 'linear-gradient(90deg, #FFD600 0%, #FF9800 100%)',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                marginBottom: 8,
                textAlign: 'center',
                letterSpacing: 2,
              }}>{title}</h1>}
              {subtitle && <div style={{ color: '#bbb', fontSize: 18, marginBottom: 8, textAlign: 'center', fontWeight: 500, letterSpacing: 1 }}>{subtitle}</div>}
            </div>
          )}
        </div>
        {/* 大数字卡片 */}
        {coreNumbers.length > 0 && (
          <div style={{ paddingLeft: 24, paddingRight: 24 }}>
            <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
              {coreNumbers.map((num, idx) => (
                <div key={idx} style={{
                  background: '#18181b',
                  borderRadius: 12,
                  boxShadow: '0 4px 24px 0 rgba(0,0,0,0.18)',
                  padding: 32,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flex: 1,
                  minWidth: 0,
                }}>
                  <div style={{ fontSize: 56, fontWeight: 800, color: '#fff', marginBottom: 12 }}>{num.number}</div>
                  <div style={{ color: '#ccc', fontSize: 18 }}>{num.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* 分区卡片排版 */}
        <div style={{ width: '100%', paddingLeft: 24, paddingRight: 24 }}>
          {(() => {
            if (!sections || sections.length === 0) return null;
            let displaySections = sections.slice(0, 9);
            while (displaySections.length < 3) {
              displaySections.push({ title: '', items: [] });
            }
            const layout = [];
            if (displaySections.length === 3) {
              layout.push([displaySections[0], displaySections[1], displaySections[2]]);
            } else if (displaySections.length === 4) {
              layout.push([displaySections[0], displaySections[1]]);
              layout.push([displaySections[2], displaySections[3]]);
            } else if (displaySections.length === 5) {
              layout.push([displaySections[0], displaySections[1], displaySections[2]]);
              layout.push([displaySections[3], displaySections[4]]);
            } else if (displaySections.length === 6) {
              layout.push([displaySections[0], displaySections[1], displaySections[2]]);
              layout.push([displaySections[3], displaySections[4], displaySections[5]]);
            } else if (displaySections.length === 7) {
              layout.push([displaySections[0], displaySections[1], displaySections[2]]);
              layout.push([displaySections[3], displaySections[4]]);
              layout.push([displaySections[5], displaySections[6]]);
            } else if (displaySections.length === 8) {
              layout.push([displaySections[0], displaySections[1], displaySections[2]]);
              layout.push([displaySections[3], displaySections[4], displaySections[5]]);
              layout.push([displaySections[6], displaySections[7]]);
            } else if (displaySections.length === 9) {
              layout.push([displaySections[0], displaySections[1], displaySections[2]]);
              layout.push([displaySections[3], displaySections[4], displaySections[5]]);
              layout.push([displaySections[6], displaySections[7], displaySections[8]]);
            }
            return layout.map((row, rowIdx) => (
              <div key={rowIdx} style={{ display: 'flex', width: '100%', gap: 24, marginBottom: 24 }}>
                {row.map((section, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: '#18181b',
                      borderRadius: 12,
                      boxShadow: '0 4px 24px 0 rgba(0,0,0,0.18)',
                      padding: 32,
                      display: 'flex',
                      flexDirection: 'column',
                      width: `${100 / row.length}%`,
                      minHeight: 180,
                      minWidth: 0,
                    }}
                  >
                    {/* 分区标题 */}
                    {section.title && (
                      <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 24, display: 'flex', alignItems: 'center' }}>
                        {section.title.includes('吸引') && <span className="mr-2">🧲</span>}
                        {section.title.includes('激发') && <span className="mr-2">💡</span>}
                        {section.title.includes('引导') && <span className="mr-2">🚩</span>}
                        {section.title.includes('行动') && <span className="mr-2">⚡</span>}
                        {section.title}
                      </div>
                    )}
                    <ul style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {section.items && section.items.map((item, i) => (
                        <li key={i}>
                          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4, display: 'flex', alignItems: 'center' }}>
                            <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 6, background: 'linear-gradient(90deg, #FFD600 0%, #FFB300 100%)', color: '#222', fontWeight: 700, fontSize: 16, marginRight: 8 }}>
                              {item.label}
                            </span>
                          </div>
                          <div style={{ color: '#ccc', fontSize: 16, marginLeft: 4 }}>{item.value}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ));
          })()}
        </div>
        {/* 标签+二维码+原文信息整合区 */}
        {(tags && tags.length > 0) && (
          <div style={{ paddingLeft: 24, paddingRight: 24 }}>
            <div style={{
              background: '#18181b',
              borderRadius: 12,
              boxShadow: '0 4px 24px 0 rgba(0,0,0,0.18)',
              padding: 24,
              width: '100%',
              minWidth: 0,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              {/* 左侧二维码及提示 */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 100, marginRight: 32 }}>
                {meta && meta.url && (
                  <a href={meta.url.startsWith('http') ? meta.url : `https://${meta.url}`} target="_blank" rel="noopener noreferrer">
                    <QRCodeCanvas value={meta.url.startsWith('http') ? meta.url : `https://${meta.url}`} size={100} />
                  </a>
                )}
                {(!meta || !meta.url) && (
                  <QRCodeCanvas value={meta && meta.title ? meta.title : '扫码体验'} size={100} />
                )}
                <div style={{ marginTop: 12, fontSize: 14, color: '#aaa', whiteSpace: 'nowrap' }}>
                  {meta && meta.url ? '扫码阅读原文' : '扫码体验'}
                </div>
              </div>
              {/* 右侧内容 */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 12, lineHeight: '32px' }}>{meta && meta.title ? meta.title : '原文标题'}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  {tags.map((tag) => (
                    <span key={tag} style={{ display: 'inline-block', padding: '2px 12px', borderRadius: 16, background: 'linear-gradient(90deg, #FFF9C4 0%, #FFE0B2 100%)', color: '#FF9800', fontSize: 16, fontWeight: 600, marginRight: 8, marginBottom: 8 }}>{tag}</span>
                  ))}
                </div>
                {meta && meta.author && (
                  <div style={{ fontSize: 15, color: '#aaa' }}>作者：{meta.author}</div>
                )}
              </div>
            </div>
          </div>
        )}
        {/* 行动号召/结论区 */}
        {cta && (
          <div style={{ paddingLeft: 24, paddingRight: 24 }}>
            <div style={{
              background: '#18181b',
              borderRadius: 12,
              boxShadow: '0 4px 24px 0 rgba(0,0,0,0.18)',
              padding: 32,
              marginBottom: 24,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 12 }}>{cta}</span>
            </div>
          </div>
        )}
      </div>
      <button onClick={handleDownload} className="btn-primary mt-4">
        下载高清图片
      </button>
    </>
  );
});

export default BentoGrid; 