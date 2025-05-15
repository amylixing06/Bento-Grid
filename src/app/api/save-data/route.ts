import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

interface SaveDataRequest {
  data: any;
}

// 模拟保存数据到阿里云的函数
// 在实际使用中，这里需要使用阿里云SDK或API
async function saveToAliCloud(data: any, dataId: string): Promise<{success: boolean, url: string}> {
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
    // await client.put(`bento-data/${dataId}.json`, JSON.stringify(data));
    
    // 模拟请求到阿里云
    // 替换为你的实际阿里云API端点
    const aliEndpoint = process.env.ALI_CLOUD_ENDPOINT || 'https://xianwenai.com/save-to-oss';
    
    const response = await fetch(aliEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ALI_CLOUD_API_KEY || ''}`
      },
      body: JSON.stringify({
        dataId,
        data
      })
    });
    
    if (!response.ok) {
      throw new Error('阿里云存储服务响应异常');
    }
    
    // 假设阿里云返回了一个URL，可以用于访问该数据
    // 在实际实现中，这应该是OSS对象的URL
    const result = await response.json();
    const dataUrl = result.url || `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/get-data?id=${dataId}`;
    
    return {
      success: true,
      url: dataUrl
    };
  } catch (error) {
    console.error('保存到阿里云出错:', error);
    return {
      success: false,
      url: ''
    };
  }
}

export async function POST(request: Request) {
  try {
    const { data } = await request.json() as SaveDataRequest;
    
    if (!data) {
      return NextResponse.json(
        { error: '没有提供数据' },
        { status: 400 }
      );
    }
    
    // 生成唯一ID
    const dataId = uuidv4();
    
    // 保存到阿里云
    const saveResult = await saveToAliCloud(data, dataId);
    
    if (!saveResult.success) {
      return NextResponse.json(
        { error: '保存到阿里云失败' },
        { status: 500 }
      );
    }
    
    // 返回成功结果
    return NextResponse.json({
      success: true,
      dataId,
      url: saveResult.url
    });
    
  } catch (error) {
    console.error('处理保存请求时出错:', error);
    return NextResponse.json(
      { error: '处理请求时发生错误' },
      { status: 500 }
    );
  }
} 