import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
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
    const fileContent = await FileSystem.readAsStringAsync(fileUri, {
      encoding: 'base64',
    });

    const workbook = XLSX.read(fileContent, { type: 'base64' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    console.log('📄 解析前 2 行原始数据：', jsonData.slice(0, 2));

    const formattedQuestions = jsonData.map((row, index) => {
      // ----- 安全读取字段（强制转字符串） -----
      const getStr = (key) => String(row[key] || '').trim();

      const type = getStr('题型') || '单选题';
      const title = getStr('题目内容');
      const answerRaw = getStr('答案');
      const parse = getStr('解析');

      let options = [];
      let correctIndices = [];

      // ----- 解析选项 -----
      if (type === '判断题') {
        options = ['正确', '错误'];
      } else {
        // 从 A、B、C、D 列提取，过滤空值
        const rawOptions = ['A', 'B', 'C', 'D']
          .map(col => getStr(col))
          .filter(opt => opt !== '');

        // 如果选项不足两个，补默认值
        while (rawOptions.length < 2) rawOptions.push('选项');
        options = rawOptions;
      }

      // ----- 解析答案 -----
      if (type === '判断题') {
        if (answerRaw === 'T' || answerRaw === '正确') {
          correctIndices = [0];
        } else if (answerRaw === 'F' || answerRaw === '错误') {
          correctIndices = [1];
        } else {
          console.warn(`⚠️ 第 ${index+1} 行判断题答案异常，默认“正确”`, answerRaw);
          correctIndices = [0];
        }
      } else if (type === '多选题') {
        // 去除标点，提取字母
        const clean = answerRaw.replace(/[、，,，\s]/g, '');
        if (clean) {
          for (const ch of clean) {
            const idx = ['A', 'B', 'C', 'D'].indexOf(ch.toUpperCase());
            if (idx !== -1) correctIndices.push(idx);
          }
        }
        correctIndices = [...new Set(correctIndices)].sort();
        if (correctIndices.length === 0) {
          console.warn(`⚠️ 第 ${index+1} 行多选题答案异常，默认“A”`, answerRaw);
          correctIndices = [0];
        }
      } else {
        // 单选题：提取第一个大写字母
        const match = answerRaw.match(/[A-D]/i);
        if (match) {
          const idx = ['A', 'B', 'C', 'D'].indexOf(match[0].toUpperCase());
          if (idx !== -1) correctIndices = [idx];
        }
        if (correctIndices.length === 0) {
          console.warn(`⚠️ 第 ${index+1} 行单选题答案异常，默认“A”`, answerRaw);
          correctIndices = [0];
        }
      }

      // ----- 校验：如果某行数据完全为空，跳过 -----
      if (!title && options.every(opt => opt === '选项')) {
        console.warn(`⚠️ 第 ${index+1} 行数据无效，已跳过`);
        return null;
      }

      return {
        title: title,
        type: type,
        options: options,
        correct: correctIndices,
        parse: parse,
      };
    });

    // 过滤掉 null
    const valid = formattedQuestions.filter(q => q !== null);

    if (valid.length === 0) {
      Alert.alert('解析失败', '没有读取到任何有效题目，请检查 Excel 格式是否正确。');
      return null;
    }

    console.log(`✅ 成功解析 ${valid.length} 道题`);
    return valid;

  } catch (error) {
    console.error('解析 Excel 失败：', error);
    Alert.alert('解析失败', error.message || '请检查文件是否损坏或格式不正确。');
    return null;
  }
};