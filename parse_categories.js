const fs = require('fs');

const L1_NAMES = [
  "家居生活", "日用百货", "数码家电", "服饰鞋包", "美妆个护", 
  "食品生鲜", "酒水饮料", "运动户外", "母婴用品", "图书文创", 
  "农资园艺", "宠物用品", "汽车用品", "医药健康"
];

const rawText = fs.readFileSync('categories.txt', 'utf8');
const lines = rawText.split('\n').map(l => l.trim()).filter(l => l);

const categories = [];
let currentL1 = null;
let currentL2 = null;

let i = 0;
// Skip until first L1
while (i < lines.length && !L1_NAMES.includes(lines[i])) {
  i++;
}

// Helper to identify description line
const isDescription = (line) => {
  if (!line) return false;
  // Description usually long or has punctuation
  if (line.length > 8) return true;
  if (line.includes('，') || line.includes('。')) return true;
  // Check if it looks like keywords (contains '、') but we treat that as desc if it appears after name?
  // Actually keywords also contain '、'.
  // But Desc usually comes before Keywords.
  // Desc: "满足..."
  // Keywords: "A、B、C"
  return false;
};

while (i < lines.length) {
  const line = lines[i];
  
  if (line === "表格使用说明") {
    break;
  }
  
  if (L1_NAMES.includes(line)) {
    // Special handling: if we are already inside an L1 with the same name, 
    // treat this occurrence as a subcategory (L2) instead of a new L1.
    // This fixes the issue where "宠物用品" appears as both L1 and L2.
    if (currentL1 && currentL1.name === line) {
      // Fall through to L2 logic below
    } else {
      currentL1 = {
        id: `cat_${categories.length + 1}`,
        name: line,
        children: []
      };
      categories.push(currentL1);
      currentL2 = null;
      i++;
      continue;
    }
  }
  
  // Look ahead to determine if this is L2 or L3
  // If next line is Description, then this is L3
  // If next line is NOT Description (and not L1), then this is L2
  
  if (i + 1 >= lines.length) {
    i++;
    continue;
  }
  
  const nextLine = lines[i+1];
  
  if (L1_NAMES.includes(nextLine)) {
    // Should not happen if logic is correct, but safe fallback
    i++;
    continue;
  }
  
  if (isDescription(nextLine)) {
    // Current line is L3
    // Ensure we have an L2
    if (!currentL2) {
       currentL2 = { 
         id: `${currentL1.id}_sub_default`, 
         name: '通用分类', 
         children: [] 
       };
       currentL1.children.push(currentL2);
    }
    
    const l3 = {
      id: `${currentL2.id}_${currentL2.children.length + 1}`,
      name: line,
      description: nextLine,
      keywords: lines[i+2] || ""
    };
    currentL2.children.push(l3);
    i += 3; // Skip Name, Desc, Keywords
  } else {
    // Current line is L2
    currentL2 = {
      id: `${currentL1.id}_sub_${currentL1.children.length + 1}`,
      name: line,
      children: []
    };
    currentL1.children.push(currentL2);
    i++;
  }
}

fs.writeFileSync('parsed_categories.json', JSON.stringify(categories, null, 2));
console.log('Parsed ' + categories.length + ' L1 categories.');
