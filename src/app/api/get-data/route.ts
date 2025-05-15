import { NextResponse } from 'next/server';

// 从阿里云获取数据的函数
async function getFromAliCloud(dataId: string): Promise<{success: boolean, data: any}> {
  try {
    // 这里应该使用阿里云OSS的SDK
    // 例如：
    // const OSS = require('ali-oss');
    // const client = new OSS({
    //   region: process.env.ALI_OSS_REGION,
    //   accessKeyId: process.env.ALI_OSS_ACCESS_KEY_ID,
    //   accessKeySecret: process.env.ALI_OSS_ACCESS_KEY_SECRET,
    //   bucket: process.env.ALI_OSS_BUCKET,
    // });
    // const result = await client.get(`bento-data/${dataId}.json`);
    // const data = JSON.parse(result.content.toString());
    
    // 模拟请求到阿里云
    const aliEndpoint = process.env.ALI_CLOUD_ENDPOINT || 'https://xianwenai.com/get-from-oss';
    
    const response = await fetch(`${aliEndpoint}?id=${dataId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.ALI_CLOUD_API_KEY || ''}`
      }
    });
    
    if (!response.ok) {
      throw new Error('阿里云存储服务响应异常');
    }
    
    const data = await response.json();
    
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('从阿里云获取数据出错:', error);
    return {
      success: false,
      data: null
    };
  }
}

export async function GET(request: Request) {
  try {
    // 从URL参数中获取数据ID
    const url = new URL(request.url);
    const dataId = url.searchParams.get('id');
    
    if (!dataId) {
      return NextResponse.json(
        { error: '未提供数据ID' },
        { status: 400 }
      );
    }
    
    // 从阿里云获取数据
    const result = await getFromAliCloud(dataId);
    
    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: '获取数据失败或数据不存在' },
        { status: 404 }
      );
    }
    
    // 返回数据
    return NextResponse.json(result.data);
    
  } catch (error) {
    console.error('处理获取数据请求时出错:', error);
    return NextResponse.json(
      { error: '处理请求时发生错误' },
      { status: 500 }
    );
  }
} 