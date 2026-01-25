import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// 文件路径
const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');

// 确保数据目录存在
function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(USERS_FILE)) {
      // 初始化默认管理员账号
      // 密码: admin123 (哈希后)
      const adminSalt = crypto.randomBytes(16).toString('hex');
      const adminHash = crypto.pbkdf2Sync('admin123', adminSalt, 1000, 64, 'sha512').toString('hex');
      
      const adminUser = {
        id: 'admin-001',
        username: 'admin',
        password: `${adminSalt}:${adminHash}`, // 存储 salt:hash
        role: 'admin',
        createdAt: new Date().toISOString()
      };
      fs.writeFileSync(USERS_FILE, JSON.stringify([adminUser], null, 2), 'utf8');
    }
    if (!fs.existsSync(PRODUCTS_FILE)) {
      fs.writeFileSync(PRODUCTS_FILE, '[]', 'utf8');
    }
  } catch (error) {
    console.warn('初始化数据目录失败 (可能是只读环境):', error);
  }
}

// 通用读取函数
export function readJSON(filePath: string) {
  ensureDataDir();
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`读取文件失败: ${filePath}`, error);
    return [];
  }
}

// 通用写入函数
export function writeJSON(filePath: string, data: any) {
  ensureDataDir();
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`写入文件失败: ${filePath}`, error);
    return false;
  }
}

// 用户相关操作
export const users = {
  getAll: () => readJSON(USERS_FILE),
  saveAll: (data: any[]) => writeJSON(USERS_FILE, data),
  find: (username: string) => {
    const all = readJSON(USERS_FILE);
    return all.find((u: any) => u.username === username);
  },
  findById: (id: string) => {
    const all = readJSON(USERS_FILE);
    return all.find((u: any) => u.id === id);
  },
  create: (user: any) => {
    const all = readJSON(USERS_FILE);
    // 简单的密码哈希
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(user.password, salt, 1000, 64, 'sha512').toString('hex');
    
    const newUser = {
      id: Date.now().toString(),
      ...user,
      password: `${salt}:${hash}`,
      role: 'user', // 默认为普通用户
      createdAt: new Date().toISOString()
    };
    
    all.push(newUser);
    writeJSON(USERS_FILE, all);
    return newUser;
  },
  validatePassword: (user: any, inputPassword: string) => {
    const [salt, originalHash] = user.password.split(':');
    const hash = crypto.pbkdf2Sync(inputPassword, salt, 1000, 64, 'sha512').toString('hex');
    return hash === originalHash;
  }
};

// 商品相关操作
export const products = {
  getAll: () => readJSON(PRODUCTS_FILE),
  saveAll: (data: any[]) => writeJSON(PRODUCTS_FILE, data)
};
