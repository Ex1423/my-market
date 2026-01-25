import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 数据文件路径
const dataFilePath = path.join(process.cwd(), 'data', 'products.json');

// 确保数据文件存在
function ensureDataFile() {
  if (!fs.existsSync(dataFilePath)) {
    // 确保目录存在
    const dir = path.dirname(dataFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dataFilePath, '[]', 'utf8');
  }
}

// GET: 获取所有商品
export async function GET() {
  ensureDataFile();
  try {
    const fileContent = fs.readFileSync(dataFilePath, 'utf8');
    const products = JSON.parse(fileContent);
    return NextResponse.json(products);
  } catch (error) {
    console.error('读取数据失败:', error);
    return NextResponse.json([], { status: 500 });
  }
}

// POST: 发布新商品
export async function POST(request: Request) {
  ensureDataFile();
  try {
    const newProduct = await request.json();
    
    // 读取现有数据
    const fileContent = fs.readFileSync(dataFilePath, 'utf8');
    const products = JSON.parse(fileContent);

    // 添加新商品到开头
    products.unshift(newProduct);

    // 写入文件
    fs.writeFileSync(dataFilePath, JSON.stringify(products, null, 2), 'utf8');

    return NextResponse.json({ success: true, product: newProduct });
  } catch (error) {
    console.error('保存数据失败:', error);
    return NextResponse.json({ success: false, error: '保存失败' }, { status: 500 });
  }
}
