const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// 转换Excel文件为JSON
function convertExcelToJson(filePath, outputPath) {
    console.log(`转换文件: ${filePath}`);
    
    try {
        const workbook = XLSX.readFile(filePath);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // 跳过表头，处理数据
        const words = [];
        for (let i = 1; i < json.length; i++) {
            if (json[i] && json[i].length >= 2) {
                words.push({
                    word: json[i][0],
                    meaning: json[i][1],
                    phonetic: json[i][2] || ''
                });
            }
        }
        
        // 写入JSON文件
        fs.writeFileSync(outputPath, JSON.stringify(words, null, 2));
        console.log(`转换完成，输出到: ${outputPath}`);
        
        return words;
    } catch (error) {
        console.error('转换文件时出错:', error);
        return [];
    }
}

// 转换所有Excel文件
const dataDir = path.join(__dirname, 'data');
const outputDir = path.join(__dirname, 'data');

const files = fs.readdirSync(dataDir);
files.forEach(file => {
    if (file.endsWith('.xlsx')) {
        const filePath = path.join(dataDir, file);
        const outputPath = path.join(outputDir, file.replace('.xlsx', '.json'));
        convertExcelToJson(filePath, outputPath);
        console.log('\n' + '='.repeat(80) + '\n');
    }
});