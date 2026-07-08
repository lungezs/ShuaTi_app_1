import { useState } from 'react';
import { Alert } from 'react-native';
import { parseExcelToQuestions } from '../utils/excelHelper';

export const useQuestionBank = () => {
  // 所有状态都搬到这里来了
  const [questions, setQuestions] = useState([]);        // 题库（默认空数组）
  const [selected, setSelected] = useState(null);        // 选中项
  const [currentIndex, setCurrentIndex] = useState(0);   // 当前第几题

  // 导入题库（从 Excel 加载）
  const importQuestions = async () => {
    const data = await parseExcelToQuestions();
    if (data && data.length > 0) {
      setQuestions(data);
      setCurrentIndex(0);
      setSelected(null);
      Alert.alert('✅ 成功', `导入了 ${data.length} 道题目！`);
    } else if (data && data.length === 0) {
      Alert.alert('⚠️ 提示', 'Excel 文件里没有有效数据。');
    } else {
      // data === null 表示用户取消了选择或解析失败
      // 什么都不做，或者静静返回
    }
  };

  // 点击选项
  const handlePress = (index) => {
    // 如果没有题目，直接返回
    if (questions.length === 0) return;

    setSelected(index);
    const currentQ = questions[currentIndex];
    if (index === currentQ.correct) {
      Alert.alert('✅ 回答正确！！', '太棒了，继续加油！');
    } else {
      Alert.alert('❌ 再想想', '正确答案是：' + currentQ.options[currentQ.correct]);
    }
  };

  // 下一题
  const handleNext = () => {
    if (questions.length === 0) return;

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelected(null);
    } else {
      Alert.alert('🎉 恭喜', '你已经做完了所有题目！');
    }
  };

  // 把外部需要用到的东西全部暴露出去
  return {
    questions,
    selected,
    currentIndex,
    importQuestions,
    handlePress,
    handleNext,
  };
};