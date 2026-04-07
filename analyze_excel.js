const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// 读取Excel文件
function analyzeExcel(filePath) {
    console.log(`分析文件: ${filePath}`);
    
    try {
        const workbook = XLSX.readFile(filePath);
        
        // 遍历所有工作表
        workbook.SheetNames.forEach(sheetName => {
            console.log(`\n工作表：${sheetName}`);
            
            const worksheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            console.log(`行数：${json.length}`);
            if (json.length > 0) {
                console.log(`列数：${json[0].length}`);
                console.log('前5行数据：');
                
                // 打印表头
                let headerRow = '| ';
                for (let i = 0; i < json[0].length; i++) {
                    headerRow += `列 ${i+1} | `;
                }
                console.log(headerRow);
                
                // 打印分隔线
                let separator = '| ';
                for (let i = 0; i < json[0].length; i++) {
                    separator += '----- | ';
                }
                console.log(separator);
                
                // 打印数据行
                const rowsToShow = Math.min(5, json.length);
                for (let i = 0; i < rowsToShow; i++) {
                    let dataRow = '| ';
                    for (let j = 0; j < json[i].length; j++) {
                        dataRow += `${json[i][j] || ''} | `;
                    }
                    console.log(dataRow);
                }
            }
        });
    } catch (error) {
        console.error('分析文件时出错:', error);
    }
}

// 分析所有Excel文件
const dataDir = path.join(__dirname, 'data');
const files = fs.readdirSync(dataDir);

files.forEach(file => {
    if (file.endsWith('.xlsx')) {
        const filePath = path.join(dataDir, file);
        analyzeExcel(filePath);
        console.log('\n' + '='.repeat(80) + '\n');
    }
});