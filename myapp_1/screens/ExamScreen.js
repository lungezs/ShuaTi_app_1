// screens/ExamScreen.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Modal, FlatList } from 'react-native';
import { styles } from '../styles/commonStyles';

const ExamScreen = ({
  questions,
  bankName,
  onBack,
  collectedIndices,
  onToggleCollect,
  onExamSubmit, // 提交后回调，传递结果数组
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState(Array(questions.length).fill(null));
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState([]);
  const [showCatalog, setShowCatalog] = useState(false);
  const [answeredStatus, setAnsweredStatus] = useState(Array(questions.length).fill(false));

  const currentQ = questions[currentIndex];
  const isMulti = currentQ?.type === '多选题';
  const originalIndex = currentQ?.originalIndex ?? currentIndex;
  const isCollected = collectedIndices.includes(originalIndex);

  // 选择答案
  const handleSelect = (optionIndex) => {
    if (submitted) return;
    const newAnswers = [...answers];
    if (isMulti) {
      const current = newAnswers[currentIndex] || [];
      if (current.includes(optionIndex)) {
        newAnswers[currentIndex] = current.filter(i => i !== optionIndex);
      } else {
        newAnswers[currentIndex] = [...current, optionIndex];
      }
    } else {
      newAnswers[currentIndex] = optionIndex;
    }
    setAnswers(newAnswers);
    const newStatus = [...answeredStatus];
    newStatus[currentIndex] = (newAnswers[currentIndex] !== null &&
      !(Array.isArray(newAnswers[currentIndex]) && newAnswers[currentIndex].length === 0));
    setAnsweredStatus(newStatus);
  };

  // 判断选项是否被选中
  const isSelected = (optionIndex) => {
    const ans = answers[currentIndex];
    if (ans === null) return false;
    if (Array.isArray(ans)) {
      return ans.includes(optionIndex);
    }
    return ans === optionIndex;
  };

  // 切换收藏
  const handleToggleCollect = async () => {
    await onToggleCollect(originalIndex);
  };

  // 提交试卷
  const handleSubmit = () => {
    let hasUnanswered = false;
    for (let i = 0; i < questions.length; i++) {
      const ans = answers[i];
      if (ans === null || (Array.isArray(ans) && ans.length === 0)) {
        hasUnanswered = true;
        break;
      }
    }
    if (hasUnanswered) {
      Alert.alert('提示', '还有题目未作答，请检查后提交');
      return;
    }

    const resultArray = questions.map((q, idx) => {
      let userAns = answers[idx];
      if (userAns === null || userAns === undefined) {
        return false;
      }
      const userSorted = Array.isArray(userAns) ? [...userAns].sort() : [userAns];
      const correct = q.correct;
      const correctSorted = Array.isArray(correct) ? [...correct].sort() : [correct];
      return JSON.stringify(userSorted) === JSON.stringify(correctSorted);
    });

    setResults(resultArray);
    setSubmitted(true);

    // 调用父组件回调，传递结果数组
    if (onExamSubmit) {
      onExamSubmit(resultArray);
    }
  };

  const handleRetry = () => {
    onBack();
  };

  const goToQuestion = (index) => {
    if (index < 0 || index >= questions.length) return;
    setCurrentIndex(index);
    setShowCatalog(false);
  };

  // 渲染目录项
  const renderCatalogItem = ({ item }) => {
    const idx = item - 1;
    let bgColor = '#fff';
    let textColor = '#333';
    const isAnswered = answeredStatus[idx];
    const isCorrect = results[idx];

    if (submitted) {
      if (isCorrect === true) {
        bgColor = '#4CAF50';
        textColor = '#fff';
      } else if (isCorrect === false) {
        bgColor = '#f44336';
        textColor = '#fff';
      }
    } else {
      if (isAnswered) {
        bgColor = '#d3d3d3';
        textColor = '#333';
      }
    }

    return (
      <TouchableOpacity
        style={{
          width: '18%',
          aspectRatio: 1,
          margin: '1%',
          backgroundColor: bgColor,
          borderRadius: 8,
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: '#ddd',
        }}
        onPress={() => goToQuestion(idx)}
      >
        <Text style={{ color: textColor, fontWeight: 'bold', fontSize: 16 }}>{item}</Text>
      </TouchableOpacity>
    );
  };

  // 渲染选项
  const renderOptions = () => {
    return currentQ.options.map((opt, idx) => {
      let optionStyle = {};
      let textColor = '#000';

      if (submitted) {
        const isCorrect = results[currentIndex];
        const isUserSelected = isSelected(idx);

        if (isMulti) {
          if (isCorrect) {
            // 整题正确：选中的选项显示绿色
            if (isUserSelected) {
              optionStyle = { backgroundColor: '#4CAF50' };
              textColor = '#fff';
            }
          } else {
            // 整题错误：所有选中的选项显示红色
            if (isUserSelected) {
              optionStyle = { backgroundColor: '#f44336' };
              textColor = '#fff';
            }
            // 未选中的选项保持白色，不显示正确答案
          }
        } else {
          // 单选/判断题
          const isInCorrect = currentQ.correct.includes(idx);
          if (isCorrect) {
            if (isInCorrect) {
              optionStyle = { backgroundColor: '#4CAF50' };
              textColor = '#fff';
            }
          } else {
            if (isInCorrect) {
              optionStyle = { backgroundColor: '#4CAF50' };
              textColor = '#fff';
            }
            if (isUserSelected && !isInCorrect) {
              optionStyle = { backgroundColor: '#f44336' };
              textColor = '#fff';
            }
          }
        }
      } else {
        if (isSelected(idx)) {
          optionStyle = { backgroundColor: '#d3d3d3' };
        }
      }

      return (
        <TouchableOpacity
          key={idx}
          style={[styles.optionButton, optionStyle]}
          onPress={() => handleSelect(idx)}
          disabled={submitted}
        >
          <Text style={[styles.optionText, { color: textColor }]}>
            {String.fromCharCode(65 + idx)}. {opt}
          </Text>
        </TouchableOpacity>
      );
    });
  };

  const correctLetters = currentQ.correct.map(i => String.fromCharCode(65 + i)).join('');

  // 结果显示
  const renderResultSummary = () => {
    const correctCount = results.filter(r => r).length;
    const total = questions.length;
    return (
      <View style={{ marginTop: 20, padding: 12, backgroundColor: '#e8f5e9', borderRadius: 8 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center' }}>
          得分：{correctCount} / {total}
        </Text>
        <Text style={{ textAlign: 'center', marginTop: 8 }}>
          正确率：{((correctCount / total) * 100).toFixed(1)}%
        </Text>
        <TouchableOpacity
          style={[styles.optionButton, { backgroundColor: '#2196F3', marginTop: 16 }]}
          onPress={handleRetry}
        >
          <Text style={[styles.optionText, { color: '#fff', textAlign: 'center' }]}>返回设置</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (!currentQ) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>没有题目</Text>
        <TouchableOpacity onPress={onBack} style={[styles.optionButton, { marginTop: 20 }]}>
          <Text style={styles.optionText}>返回</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <TouchableOpacity onPress={onBack} disabled={submitted}>
          <Text style={{ fontSize: 18, color: submitted ? '#ccc' : '#2196F3' }}>‹ 退出</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={handleToggleCollect} style={{ marginRight: 15 }}>
            <Text style={{ fontSize: 24, color: isCollected ? '#FFD700' : '#ccc' }}>
              {isCollected ? '⭐' : '☆'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowCatalog(true)} style={{ marginRight: 12 }}>
            <Text style={{ fontSize: 18, color: '#2196F3', fontWeight: 'bold' }}>📋 目录</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 16, color: '#333' }}>
            {currentIndex + 1} / {questions.length}
          </Text>
        </View>
      </View>

      <Text style={styles.title}>{bankName} - 模拟考试</Text>
      <Text style={styles.title}>{currentQ.type}：{currentQ.title}</Text>

      {renderOptions()}

      {submitted && (
        <View style={{
          marginTop: 15,
          padding: 12,
          backgroundColor: '#fff3e0',
          borderRadius: 8,
          borderWidth: 1,
          borderColor: '#ffb74d'
        }}>
          <Text style={{ fontWeight: 'bold', color: '#e65100' }}>正确答案：{correctLetters}</Text>
          {currentQ.parse && currentQ.parse.trim() !== '' && (
            <Text style={{ fontSize: 16, color: '#333', marginTop: 4 }}>解析：{currentQ.parse}</Text>
          )}
        </View>
      )}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
        <TouchableOpacity
          style={[styles.optionButton, { flex: 1, marginRight: 8, backgroundColor: currentIndex > 0 ? '#2196F3' : '#ccc' }]}
          onPress={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
        >
          <Text style={[styles.optionText, { color: '#fff', textAlign: 'center' }]}>上一题</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionButton, { flex: 1, marginLeft: 8, backgroundColor: currentIndex < questions.length - 1 ? '#2196F3' : '#ccc' }]}
          onPress={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
          disabled={currentIndex === questions.length - 1}
        >
          <Text style={[styles.optionText, { color: '#fff', textAlign: 'center' }]}>下一题</Text>
        </TouchableOpacity>
      </View>

      {!submitted && (
        <TouchableOpacity
          style={[styles.optionButton, { backgroundColor: '#FF9800', marginTop: 20 }]}
          onPress={handleSubmit}
        >
          <Text style={[styles.optionText, { color: '#fff', textAlign: 'center' }]}>📤 提交试卷</Text>
        </TouchableOpacity>
      )}

      {submitted && renderResultSummary()}

      <Modal
        visible={showCatalog}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCatalog(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: '70%', width: '90%' }]}>
            <Text style={styles.modalTitle}>📖 题目列表</Text>
            <Text style={{ textAlign: 'center', marginBottom: 10, color: '#666' }}>
              {submitted ? '🟢 正确  🔴 错误' : '⬜ 未答  🟨 已答'}
            </Text>
            <FlatList
              data={Array.from({ length: questions.length }, (_, i) => i + 1)}
              keyExtractor={(item) => item.toString()}
              numColumns={5}
              renderItem={renderCatalogItem}
              contentContainerStyle={{ paddingVertical: 10 }}
            />
            <TouchableOpacity
              onPress={() => setShowCatalog(false)}
              style={{ marginTop: 10, padding: 12, backgroundColor: '#2196F3', borderRadius: 8 }}
            >
              <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>关闭</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ExamScreen;