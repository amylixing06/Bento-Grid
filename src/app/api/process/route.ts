import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

interface DeepSeekResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

async function extractWechatContent(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error('无法获取微信文章内容');
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    // 提取标题
    const title = $('h1.rich_media_title').text().trim();
    
    // 提取作者
    const author = $('strong.rich_media_meta_text').first().text().trim();
    
    // 提取正文内容
    const content = $('div.rich_media_content')
      .text()
      .replace(/\s+/g, ' ')
      .trim();

    console.log('微信正文内容：', content);

    return {
      title,
      author,
      content: `${title}\n\n作者：${author}\n\n${content}`,
      rawContent: content
    };
  } catch (error) {
    console.error('Error extracting WeChat content:', error);
    throw new Error('无法解析微信文章内容');
  }
}

async function callKimiAPI(content: string): Promise<any> {
  let limitedContent = content.length > 3000 ? content.slice(0, 3000) : content;
  const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.KIMI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'moonshot-v1-8k',
      messages: [
        {
          role: 'system',
          content: `你是顶级产品发布页内容策划师。请根据原文，策划一个现代高端Bento Grid风格的发布页内容，要求如下：\n\n- title：极具冲击力、营销感，10-16字\n- subtitle：一句话总结产品/服务最大亮点\n- coreNumbers：1-3个大数字（如"36T数据""119种语言"），每个配简短说明\n- sections：每区3-5条关键信息，内容精炼有力，禁止长段落/代码/无关内容\n- tags：3-8个关键词，适合胶囊标签展示\n- cta：一句话引导用户体验/关注\n- 只返回如下JSON，不要多余解释：\n{\n  "title": "",\n  "subtitle": "",\n  "coreNumbers": [{"number": "", "desc": ""}],\n  "sections": [{"title": "", "items": [{"label": "", "value": ""}]}],\n  "tags": [],\n  "cta": ""\n}`
        },
        {
          role: 'user',
          content: limitedContent
        }
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Kimi API 错误响应:', errorText);
    throw new Error('Kimi API 调用失败: ' + errorText.slice(0, 200));
  }

  try {
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (e) {
    const errorText = await response.text();
    console.error('Kimi API 返回非 JSON:', errorText);
    throw new Error('Kimi API 返回非 JSON: ' + errorText.slice(0, 200));
  }
}

async function retryWithBackoff(fn: () => Promise<any>, retries = 3, delay = 1000) {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryWithBackoff(fn, retries - 1, delay * 2);
  }
}

export async function POST(request: Request) {
  try {
    const { content, isUrl } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: '内容不能为空' },
        { status: 400 }
      );
    }

    if (!process.env.KIMI_API_KEY) {
      console.error('Kimi API key is not set');
      return NextResponse.json(
        { error: 'Kimi API 密钥未设置' },
        { status: 500 }
      );
    }

    let processedContent = content;
    let title = '';
    let author = '';
    let rawContent = '';

    // 如果是微信文章链接，先提取内容
    if (isUrl && content.includes('mp.weixin.qq.com')) {
      try {
        const extracted = await extractWechatContent(content);
        processedContent = extracted.content;
        title = extracted.title;
        author = extracted.author;
        rawContent = extracted.rawContent;
      } catch (error) {
        return NextResponse.json(
          { error: '无法获取微信文章内容，请确保链接有效且可访问' },
          { status: 400 }
        );
      }
    }

    // 使用重试机制调用 Kimi API
    const completion = await retryWithBackoff(async () => {
      try {
        return await callKimiAPI(processedContent);
      } catch (error: any) {
        console.error('Kimi API 调用失败:', error);
        if (error.code === 'ETIMEDOUT') {
          throw new Error('连接超时，请检查网络连接');
        }
        throw error;
      }
    });

    // 直接解析 Kimi 返回的 JSON 内容，先做容错处理
    let fixed = completion
      .replace(/"/g, '"')
      .replace(/"/g, '"');
    let result: any = {};
    try {
      result = JSON.parse(fixed);
    } catch (e) {
      console.error('Kimi 返回内容依然无法解析为 JSON:', fixed);
      return NextResponse.json(
        { error: 'Kimi 返回内容依然无法解析为 JSON', raw: fixed },
        { status: 500 }
      );
    }
    // 合并微信作者、原始正文内容
    result.author = author;
    result.content = processedContent;
    result.rawContent = rawContent;

    // 自动精简美化 title/subtitle/coreNumbers/sections/cta
    if (result.title && result.title.length > 20) result.title = result.title.slice(0, 20) + '...';
    if (result.subtitle && result.subtitle.length > 40) result.subtitle = result.subtitle.slice(0, 40) + '...';
    if (Array.isArray(result.coreNumbers)) {
      result.coreNumbers = result.coreNumbers.map((n: any) => ({
        number: (n.number || '').toString().slice(0, 8),
        desc: (n.desc || '').toString().slice(0, 20)
      }));
    }
    if (Array.isArray(result.sections)) {
      result.sections = result.sections.map((section: any) => {
        const newSection = { ...section };
        if (Array.isArray(newSection.items)) {
          newSection.items = newSection.items.map((item: any) => {
            let label = item.label || '';
            let value = item.value || '';
            if (label.length > 20) label = label.slice(0, 20) + '...';
            if (value.length > 20) value = value.slice(0, 20) + '...';
            return { label, value };
          });
        }
        return newSection;
      });
    }
    if (result.cta && result.cta.length > 30) result.cta = result.cta.slice(0, 30) + '...';

    // 自动识别并拆分 meta 信息
    const metaKeys = ['标题', '作者', '发布平台', '平台', '发布链接', '链接', '原文链接', '日期', '发布时间'];
    let meta: any = {};
    if (Array.isArray(result.sections)) {
      const newSections: any[] = [];
      result.sections.forEach((section: any) => {
        if (section.title && section.title.includes('主要观点')) {
          // 每个item单独成卡片
          section.items.forEach((item: any) => {
            newSections.push({
              title: item.label,
              items: [{ label: item.label, value: item.value }]
            });
          });
        } else {
          newSections.push(section);
        }
      });
      result.sections = newSections;
    }
    result.meta = meta;

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error processing content:', error);
    return NextResponse.json(
      { 
        error: error.message || '处理内容时出错',
        details: error.cause?.message || error.code || '未知错误'
      },
      { status: 500 }
    );
  }
} 