import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useQuestionBank } from './hooks/useQuestionBank'; // 引入刚才写的管理员

export default function App() {
  // 从管理员那里拿数据和函数
  const { questions, selected, currentIndex, importQuestions, handlePress, handleNext } = useQuestionBank();

  // ---------- 如果没有题库，显示导入界面 ----------
  if (questions.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>📂 请导入 Excel 题库</Text>
        <TouchableOpacity style={[styles.optionButton, { backgroundColor: '#2196F3' }]} onPress={importQuestions}>
          <Text style={[styles.optionText, { color: '#fff', textAlign: 'center' }]}>选择 Excel 文件</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ---------- 有题库，正常显示 ----------
  const currentQ = questions[currentIndex];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{currentIndex + 1}. {currentQ.title}</Text>

      {currentQ.options.map((option, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.optionButton,
            selected === index && { backgroundColor: '#d3d3d3' },
          ]}
          onPress={() => handlePress(index)}
        >
          <Text style={styles.optionText}>{option}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={[styles.optionButton, { marginTop: 20, backgroundColor: '#4CAF50' }]}
        onPress={handleNext}
      >
        <Text style={[styles.optionText, { color: '#fff', textAlign: 'center' }]}>下一题 ➜</Text>
      </TouchableOpacity>
    </View>
  );
}

// ---------- 样式表完全保持不变 ----------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  optionButton: {
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  optionText: {
    fontSize: 18,
  },
});