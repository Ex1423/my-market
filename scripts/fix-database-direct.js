/**
 * 直接修复数据库 - 添加缺失的 User 表字段
 * 使用 SQLite3 直接操作数据库
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// 获取数据库路径
function getDatabasePath() {
  const rootDb = path.join(process.cwd(), 'dev.db');
  const prismaDb = path.join(process.cwd(), 'prisma', 'dev.db');
  
  if (fs.existsSync(rootDb)) {
    return rootDb;
  } else if (fs.existsSync(prismaDb)) {
    return prismaDb;
  } else {
    // 如果都不存在，创建在根目录
    return rootDb;
  }
}

function checkColumnExists(db, tableName, columnName) {
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${tableName})`, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      const exists = rows.some(row => row.name === columnName);
      resolve(exists);
    });
  });
}

function addColumnIfNotExists(db, tableName, columnName, columnDef) {
  return new Promise((resolve, reject) => {
    checkColumnExists(db, tableName, columnName)
      .then(exists => {
        if (exists) {
          console.log(`✓ ${columnName} 字段已存在，跳过`);
          resolve(false);
        } else {
          const sql = `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef}`;
          db.run(sql, (err) => {
            if (err) {
              reject(err);
            } else {
              console.log(`✓ ${columnName} 字段已添加`);
              resolve(true);
            }
          });
        }
      })
      .catch(reject);
  });
}

async function fixDatabase() {
  const dbPath = getDatabasePath();
  console.log('数据库路径:', dbPath);
  console.log('');

  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('无法打开数据库:', err.message);
        reject(err);
        return;
      }

      console.log('已连接到数据库');
      console.log('正在检查并添加缺失字段...');
      console.log('');

      Promise.all([
        addColumnIfNotExists(db, 'User', 'avatar', 'TEXT'),
        addColumnIfNotExists(db, 'User', 'phone', 'TEXT'),
        addColumnIfNotExists(db, 'User', 'notificationSound', "TEXT DEFAULT 'default'")
      ])
        .then(() => {
          console.log('');
          console.log('========== 完成！ ==========');
          console.log('所有字段已检查/添加完成');
          console.log('');
          console.log('下一步: 运行 npx prisma generate');
          db.close((err) => {
            if (err) {
              console.error('关闭数据库时出错:', err.message);
              reject(err);
            } else {
              resolve();
            }
          });
        })
        .catch((err) => {
          console.error('添加字段时出错:', err.message);
          db.close();
          reject(err);
        });
    });
  });
}

// 运行修复
fixDatabase()
  .then(() => {
    console.log('数据库修复成功！');
    process.exit(0);
  })
  .catch((err) => {
    console.error('数据库修复失败:', err.message);
    console.error('');
    console.error('如果 sqlite3 模块未安装，请运行:');
    console.error('  npm install sqlite3');
    console.error('');
    console.error('或者使用 Prisma 方式修复:');
    console.error('  npx prisma db push --accept-data-loss');
    process.exit(1);
  });
