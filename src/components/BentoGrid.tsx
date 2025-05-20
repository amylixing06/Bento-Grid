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

  return (
    <>
      <div
        style={{
          display: 'block',
          boxSizing: 'border-box',
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
        {/* 主标题和分区之间的空白 */}
        <div style={{ height: 40 }} />
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
                      <div style={{ fontSize: 22, fontWeight: 700, color: '#aaa', marginBottom: 24, display: 'flex', alignItems: 'center' }}>
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
                            <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 6, background: 'linear-gradient(90deg, #FFD600 0%, #FFB300 100%)', color: '#222', fontWeight: 700, fontSize: 15, marginRight: 8 }}>
                              {item.label}
                            </span>
                          </div>
                          <div style={{ color: '#ccc', fontSize: 13, marginLeft: 4 }}>{item.value}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ));
          })()}
        </div>
        {/* 分区和二维码区之间的空白 */}
        <div style={{ height: 40 }} />
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
                {meta && meta.url && meta.url.startsWith('http') ? (
                  <a href={meta.url} target="_blank" rel="noopener noreferrer">
                    <QRCodeCanvas value={meta.url} size={100} />
                  </a>
                ) : (
                  <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZAAAAGQCAIAAAAP3aGbAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAABcRAAAXEQHKJvM/AAAUtElEQVR42u3df6xX913H8XMvP0phmCYyY8yisbMdNiYmZi4Ls9k/jsQEY2nMYlLI2micI3caN0cVYpypMCVrsLH0arOmxV66tpsDUi4aaA1ILSt01jKalt84GNQCHYxy4d7v93uO//hP0Xs/n8v3zfu8X+c8H3+fnM/78znnvL6f8zn33DNQVVUBAAoG6y4AAHIRWABkEFgAZBBYAGQQWABkEFgAZBBYAGQQWABkEFgAZBBYAGQQWABkEFgAZBBYAGQQWABkEFgAZBBYAGQQWABkEFgAZBBYAGQQWABkzDTb09qBuvtSn1V533ZckzdEq1N727qsOLip7j5Ps2ZD6xcUYxecSjo4UmxdbtAWV4cRu8BCSuZxS57aAb9863k5Wg1jtLaQg1tCYHIBfxzajcACIIPAghpmPS1GYAGQwaK7I8OpQctnGZ7db/lQB8MMC4AMAksQv/loKwILgAwCC2qYYLaY46L7rHnFgrvq7u80jZ0vLp0w2xuL7ord92mLqyOPY2AtuKt4YJ9z9/p1YGOx7f66i2iR6slF6Y2uXbLZ1eXTxfyPJLa56HVBcnXk4c8a/Az8uc2P9cA9I8U9I1NvU72yrnjpQZOSqoccX5U7vTdrBFJlV88uKY6Mpnd06ZRf12CBNSwAMggsNFHL1/iai8ACIIM1rOaymmWIPpJjktVEzLAAyCCwGor5BZqIwAIgg8ACIINF9+Zi0R2NwwwLTURaNRQzLDiptg/5NXbhcN3dxU0RMrB8vjp52+3FimN1d/VmGfjUyuJTK2129RdG05X9G/za+sk7i/eO9N9cdWCk2JzxIVVP7b46uCUEICPkDAtNVGVMngwnD1bNOZeNqTHDAiCDwAIgg8BCE/FnDQ1FYAGQQWABk2OmFgxPCeHF+eJXfDMJKcywAMggsADI4JbQT7V/OGezgV/9QmI/3/9mce1iYi/n3i4+vLD/tmy75qb68Wmbsk+rfSuw6QgsP9W2FTmbpUPk8Gh1YJNJSWaBldG1wb/0Ww0a+ImPVO+8IVc2kggsRw3+Z08B64lWEiywhoUGIqyaisACIIPAAiCDwBLEDQ/aisDSQ16htXhK6IinhC0vCX1jhgVABoGFJmJ61VAEFgAZrGEJunLOak/V0Z3JbQZ+4TNubWU58x/Fz/xKYpsfHbdpC8EQWH4GHzK6UZn3YatbnuqpxcltBv4qo7GcTTLaAqbGLaEgFmjQVgQWABkEFgAZBBYAGSy6S8r5fnqb60FTMcMCIIPAAiCDwAIgg8ACICPkovttt3u0Mnt+3f28Uaxwt1m7r46QgbXiWN0VhBcts6LV02DtvjpCBlaLlesXVucO1V3FB/RWDbi1NWOtTfKVG5dUh0bdum9VNpJYwwqGMx+YHIEFQAaBFQsTLGAKrGHFQ2iZYBibiBkWABkEFgAZBBYAGQRWMKy8mGAYG4pF93i42EwwjE3kGFhj54sDG+vu7zSdfrnuCtAOXB15HAPr0oli2/3+PQQEcHXk4ZbQT+9Ps17Km/HXiZuZ8rll1eub+t9P9eaW8uml/e8ns2tW+8nclcl+qtdHyueWm7QFEyy6A5BBYAGTYuE+Gm4JHVmd/pXprpq6H5NdGQ41LDDDQgMRMk1FYAGQQWABkEFgAZDBorsfw++5W+2qqfuJWRL6xwyrxbgUoYbAAiCDwBLEzCiJIWqogYp79CYqd60rtz+Y3GzmulhHv7sy611Ck7LLf1ld/utan7ZghRkWABk8JWwuxZmBc82KQ9RuzLAAyCCwGoq5A5qIwAIgg8BCWzEJFcSie3MpXpAsumNKzLAAyCCwAMggsADIILAAyAi36N7bPFS9vCFd98OpL8od3tn7h8VuZSfrKYqi++WsF+XcSioPbrEqKaf7WeItuocbogyZNZuUVL4yXP7TCre+M8MCICNeYPGk2Q1DDTXxAssI/zUHaJ7GBhaA5iGw0FbMwQWFe0pYFPG+ex6tXw0uKd5TQknNHUZmWGippoZVsxFYAGQQWAD64DtTJbAAyIi36F419iPj0eoJWJJzPdG6L9ovz+ZcA6s3/Jnq4qnERu+dzNlV92sLE1uMvefZtYDSQzR+OVY9vqpje+ou4UYYDmPOrmb+2dtTb1CdeNmz+66BVU1cqd49ZLMro/3MWh/uRzZZUm9kWfm9Tcn95AxRTvc7f2zz9q/VIbMy8NG7q+N6mWV1WLuPLKpO7u2/noGf/7Xie8+4dZ81LAAyCCy0Vbi5NdIILAAy3J8StvlnzbDvnsPY1DelYpbkWbPgkfWdYSmeH0AjaV6M3BICkEFgAZBBYAnSnMwD/WPRXbPvLLo3tSTPmk12VTV40R0A+mA2w+o9vSy5TXXuSN39vVldm7F8pO4yb1bXmqr6wf66SxCQPEOqk9/1rGegMnrVuvNHWW+czXrEafpYvr2zN5z+kGpOPTlds9pP5q5MlAe29J5Y6laP1TBa6Y2uLnesNdmVZ9meet8eKvekv2qcZDg+3BKirZoZMg1nt+ge8PBHWy1u8BBFa0u3pGiCDREzLAAyCCwAMggsAJMIdj9YEFgAhBBYAGTwlFBwP4Z4SoipBRsiZlgAZBBYAGSE+5BquX+kunQmsdG7R4qfumPqTaqTr9bdlRvUe3FdcpsZv75y6g3Kgy9U77w19TbV2Tet6vHse3Vk98Adn+5/iAxvdqyGKF2z0emRqfrvWF9mKwzfJbTS+9ZQ+W8Gry9lmvV3ft3vfNHmA385ZfdeXFdufdCk+1Zle7aV2VxSuX+k94/LrUoyqTlniKzO6syL0fMiCjfDKviAuE1jZs15lh3w0EcrqcGfoc8Rbw0r2ACh1Vp+NsbrfrzAAoBJEFgAZBBYAGSEC6x4d81ASwW8GCM+JYw4Tor9UnyjKOChj1aS6FlkJNwMCwAmQ2ABkEFgAZBhtoZVvrElZ7PBX74nscXFH9Y4HP10LZTqR6fqLuF6zsOYbK56562Bn/7FxE7e2hGqZm/BFrAKw3cJJ1ZkvQU2+7FEc93nhsrd6deXkvsxlNm1UDX3dq7rbU6/S2hVkucQdVYuqN6/YNKclZyyFc+igLglbKjmntXN7RnSCCwAMggsADIILKjhnrDFQn6EItoZGa2egGW3+8+vG1tzPMywAMggsADIILAAyIgXWNzqA5hEvMACpsZPWovxlFCwnoBl85SwkTXHE+67hN1nh8pdGe8S/r3RS3B/kH7DK6etnP2I8hxqq5I6G5ZU3x/tfz+9V0d6T/p9l9Ck74YyL0bPmrklBCCDwEITxbptgBkCC4CMiB+hUPw2erCVwIhEv7He8iMbrfvMsADIiBdYwRIdaK94F2O8wAKASRBYwOTiTTFaLuKiu+SfaHNmJ4n+NXzLj2yw7jPDQhMFu8xghcACIMPslnD897PeFLvl8Vi/fTn1ZHZNru/l61s6w0tNdpUzRFbdn/jSArfmZnxy2YxPLjMp2+osstL5m0Xlsb3JzZLD2Ns93N20wq1sZlhAK8X69cxFYLWX5hmLYHxPo3j/D6uKdyVFqydg15wf7CoekYA1Cx59ZlhAGwXMzxwEFgAZBBbEiE4NYILAAiAj3qK77a4aWU/Arom+dtPmmg2fXbDoDkwq2pUPRwQWABkEFgAZZt8lHP+9vHcJv2HQXG/XcHfE7/WlnJozux+NyeHIZDhEJmV3N6/uja71aStTzhB51pMj52I0rJkZFgAZIZ8SBmxOrp6AAg5RtJKi1ROvbM0ZluhxRSicRSZ8h1EzsAC0EoEFQAaBBUCG2aK76IfIm1pPQAGHKFpJ0eoJWDYzLAAyCCwAMggsADIILAAywv2le2dkqPfShuRmc55MtFe+uXPi64v7309RFNcesHkJLqet8VULq7OH+t9Vd/u67rceNCnbs/tWbeWYee+amfeucWsup2vOQ5RsLvNi9MQMC4AMAisYzQfbgA8CC4AMAguADAILgIxwTwmtdlVpfhTEsrlo+4nWljPFw+HfXEq8GVawAQLaK97FGC+wWi7eKQLEQWABkEFgAZDR2EX3iPvxbE70mUOD74gVD4d/cyl2gZXn2tCCxBZjF232M3HVuWsGNRdFcSWr+0nlod1mJXl232pXVy8Xt85PbDM+VtwyN9nWnEfPOwxObr98lYf21F3C9cwCa87GdBRPPLSoPLrXpr3LF27amNxI1659LuOV1Lyac5pLGvzYp8s3tpuUZFJPkTlEmXJGMmcbx181q7PI7GzMMPixu3unDtz8sZlOSXUXAAC5XAMr2O0wADHMsADI8F50b+wsK2C/opUUrZ6Aoj1JNHzWbIQZFgAZvoEVLK0BaGGGBUAGgQVAhveiu+jHuBX7Fa2kaPUEZDVEhkMd7agxw2qoYOcZYMJshjXx8JLkNtWZt+ru742UHU3nmS9VZw9PvU154rW6y2yRnLNo9pe31V3mtJXH9tVdwvXMAqv3n6M5m936tMFPf/el4c5TKzzLNunX1eU2b3hVl971LNuK4RAldzXx8JKcIbLqvtXhiGbwo58oj++vu4oPllR3AQCiirewEPL/YQVsLlrNit337Jfzn2gH/Av1aF0zwgwLgAwCC4AMzcAKNk0F4EMzsAC0EoEFQAZPCQVrjvdfisyIPt6K9nRPdBgzMMMCIIPAQhMFmxeoijeM3v+tofP86uQ2sz67ZuoNqlMHncs26ZeV6uyhaGUnD5mzzAvN5GzMZDXUnmdaQAOV4/+PGP/qovJI+ruEt25KlNR9cbjzpM27hDmS9RRFcfU+s4/uJZubeGxZ79839b+f3mtbJtYvdRuiaDrPr+5uXevWtZwzxOpMUzwcmWQ/QhHtiIg+c4g2jM7avDCviTUsADL4CAUAGcywBJH7aCsCq8UIPqhh0V2znqYOo6eW/88sTZozrHYfM6C1NAMLQCsRWABk8GcNAGSYLbp394wkt6kun6u7vzera56qC6frLuF6OUM08+5ldZd5s7qm2JaV8uir5dkjU29jeOjN3iUc+52sl+nmPus0y+od2Dm+drFJPZlds5IsaWLDsu6e9LuEbkNd5A2RZz1WuntGJjYsr7uKafMc6u7O4YknEi/2GtbDGpYgvQsfsEFgAZBBYAGQQWABkCH7EQrPkhrctabWQ9c8OQ4RMywAMggsADIILAB98L1lJrAEsaqCtiKw9JBXaC2eEra7a02th655chwi1+8SttzYZ13fScwx9/mMVykzys7ZTw7DIUqW1Hl2dec76e8SmrRlyPNw5OjuGJ74RupdQrt6uCUEIIPAAiCDwEJbsRYiyP2rOW0meoUoflomZnNNrZlXc4CbLeCFjyQCC4AMAguADAILgAwW3R2Jrpqw6B5KsJqrikV3APj/2M2w1oZ778TPqmC/ekBDcUvoZ+6307l29Q8XVmcO+TTX3bdl7LczXkzLKDtnP1ZDNPbAguLyBZPmPFkNtZVrqxeVh/bWOSI3hFtCtFXLp8Wa3SewAMjgljAcz//3Y9WW8/8oUiw7YM2K/1mKGVaLCZ6vaDkCKxhCBJgcgQU1ZHqLEVgAZLDoHo/iqzCir9S0eah9X6mxwgwLgAzHGdasecWCu+ru7zSNnS8unai7CAD/yzGwFtxVPLCv7v5O04GNxbb76y4CHxTt3gqOWMPyc+XerBfu5n3H4ErqbF6X2VwonjXPvm/N7PvWTL1Nd/fI+CPLTZozOayG5nztlbpLuBGsYQGQwQzLkeijtGhtOYvWtWj1+GKGBUAGgQVABoEFQAaBBUAGi+6OWHSXE/D9lWj1+GKG1VDtPq3RVAQWABkEFgAZBBYAGSEX3X2+yXrb7cWKY679MlpXGl+/rLtrU3KzeVv91rHmbUm3deW3zA6rZ9dyjpph10xk1pMcxvHHh7qjG/qvx/B4McMCIIPAAiCDwBLEnyygrQgsPeQVnMQ71QgsADJCPiVsqJZ/ZFyxZt2ym9p9ZlgAZBBYAGQQWMCkgt0PgcACpkBiBcOiuyPDs1/xQlKsWbfshnafwPLzoReMDr7Rbrrf3XJtzVK/su28/5s27+55ds2qLau+57jl84/e8vlH3ZrLwS0hABkEVouFmzkBCQQWABmsYWmymhzxoQq5sqPV44sZFgAZBBYAGQQWABkElqB2r2KgzQgsADJ4SqiJp4StLTtaPb6YYQGQwQzLz9ifLMrZbO7XX5l6g/LwPpN6ekdeMyxbUbJr1aVzoeoJqLPjic6OJ6beJnlK5yOw/JRv7TXZz+Cdnyh/eKT//cy44+Mdx7JzfGjU5obn6leX9PaPmnTNqqQcnkNtpjPhWTa3hABkMMNyFPD/YTV4BVexa4o1+5bNDAuADAJLkOjvsCeGqKEILAAyCKwWYxoCNQQWABk8JfQT8FP10T5Ebkixa4o1O5cdMrBuu92jldnz6+4ngOkJGVgrjtVdAYCIQgYWXJT/dbDuEm7E+PAXq9RNSO/Nl+su83rXHhuqu4Rpm9jyt+WZo1NvU550PYsILD/z/9nmXn/OV0bmfGWk//0M/twvWZV9+Tf8vu7Z2fXN6scX3JozK/uFDSb78Twc5ZmjOWVbndg5CKx2E33FR3FxWvRfjwUbav6sAYAMAgtqgv3mwxOBBWAS8X4bCCwAMlh0bzcW3RtZM4vuAFA7AguADMdbwrHzxYGNdfd3mk6H+4NpRLtJgSfHwLp0oth2f939BSCMRfdYJrY/XpS9qbcpD782eOfHE9v84O3Bn12Y2Ob4G3V39/90f9twcpvq6vt1l1mnnCGyUp09blLS7CVfsCppIPkeaa61fm+ThbPK7C7lyu8uLE8dcit8/g6/+6vLi13PkGTXxp9aPfHM2v734yxnGK1qvrZhqLPV4BVIwzFk0R1tFSuIQoo3RARWMPFOESAOAguADAILgAyeEsbT1LvCgP0KWFK0moMNETMsADIILAAyCCwAMgisYIItGQChEFixkFcIJN7paPdqDgDcZMywAMggsADIILAAyCCwAMggsADIILAAyCCwAMggsADIILAAyCCwAMggsADIILAAyCCwAMggsADIILAAyCCwAMggsADIILAAyCCwAMggsADIILAAyCCwAMggsADIILAAyCCwAMggsADIILAAyCCwAMggsADIILAAyCCwAMggsADIILAAyCCwAMggsADIILAAyCCwAMggsADIILAAyCCwAMggsADIILAAyCCwAMggsADIILAAyCCwAMggsADIILAAyCCwAMggsADIILAAyCCwAMggsADIILAAyCCwAMggsADIILAAyCCwAMggsADIILAAyCCwAMggsADIILAAyCCwAMggsADIILAAyCCwAMggsADIILAAyCCwAMggsADIILAAyCCwAMggsADIILAAyCCwAMggsADIILAAyCCwAMggsADIILAAyPgfTpfSbJp4T18AAAAASUVORK5CYII=" width={100} height={100} alt="二维码" style={{ borderRadius: 8 }} />
                )}
                <div style={{ marginTop: 12, fontSize: 14, color: '#aaa', whiteSpace: 'nowrap' }}>
                  {meta && meta.url ? '扫码阅读原文' : '扫码体验'}
                </div>
              </div>
              {/* 右侧内容 */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#aaa', marginBottom: 12, lineHeight: '32px' }}>{meta && meta.title ? meta.title : '原文标题'}</div>
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
    </>
  );
});

export default BentoGrid; 