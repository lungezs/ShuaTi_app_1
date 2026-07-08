import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';  // 👈 加上 /legacy
import * as XLSX from 'xlsx';

export const parseExcelToQuestions = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
      ],
    });

    if (result.canceled) {
      return null;
    }

    const fileUri = result.assets[0].uri;

    // ✅ 修复点：直接写 'base64' 字符串
    const fileContent = await FileSystem.readAsStringAsync(fileUri, {
      encoding: 'base64',
    });

    const workbook = XLSX.read(fileContent, { type: 'base64' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    const formattedQuestions = jsonData.map((row) => ({
      title: row['题目'],
      options: [
        row['选项A'],
        row['选项B'],
        row['选项C'],
        row['选项D'],
      ],
      correct: parseInt(row['正确答案索引'], 10),
    }));

    return formattedQuestions;
  } catch (error) {
    console.error('解析 Excel 失败：', error);
    return null;
  }
};