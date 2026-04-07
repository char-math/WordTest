const fs = require('fs');
const path = require('path');

// 读取JSON文件
function readJsonFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
    } catch (error) {
        console.error('读取JSON文件时出错:', error);
        return [];
    }
}

// 生成嵌入JSON数据的JavaScript代码
function generateEmbedCode() {
    const primaryWords = readJsonFile(path.join(__dirname, 'data', '京师小学考纲.json'));
    const middleWords = readJsonFile(path.join(__dirname, 'data', '京师初中考纲（不含小学）.json'));
    const highWords = readJsonFile(path.join(__dirname, 'data', '京师高中考纲（不含初中）.json'));

    const embedCode = `// 嵌入的词库数据
const embeddedWordData = {
    primary: ${JSON.stringify(primaryWords)},
    middle: ${JSON.stringify(middleWords)},
    high: ${JSON.stringify(highWords)}
};
`;

    fs.writeFileSync(path.join(__dirname, 'embedded_word_data.js'), embedCode);
    console.log('嵌入的词库数据已生成');
}

// 生成嵌入代码
generateEmbedCode();