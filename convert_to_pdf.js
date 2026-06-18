const { mdToPdf } = require('md-to-pdf');

const pdfPath = '项目理解文档.pdf';
const mdPath = '项目理解文档.md';

(async () => {
  try {
    const result = await mdToPdf(
      { path: mdPath },
      {
        dest: pdfPath,
        pdf_options: {
          format: 'A4',
          margin: {
            top: '20mm',
            bottom: '20mm',
            left: '20mm',
            right: '20mm'
          }
        }
      }
    );
    if (result) {
      console.log('PDF文档已生成: ' + pdfPath);
    }
  } catch (error) {
    console.error('生成PDF失败:', error);
  }
})();
