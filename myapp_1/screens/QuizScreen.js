import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from '../styles/commonStyles';

// 存储记录的前缀，用于区分不同题库
const RECORD_KEY_PREFIX = 'quiz_record_';

const QuizScreen = ({ bank, onBack }) => {
  const { questions, name, id } = bank;
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentQ = questions[currentIndex];
  const recordKey = RECORD_KEY_PREFIX + id; // 例如 "quiz_record_1234567890"

  // ---------- 加载本地记录 ----------
  useEffect(() => {
    const loadRecords = async () => {
      try {
        const stored = await AsyncStorage.getItem(recordKey);
        if (stored !== null) {
          const records = JSON.parse(stored);
          // 恢复当前题目的状态（如果有记录）
          const record = records[currentIndex];
          if (record) {
            setSelectedIndex(record.selectedIndex);
            setShowResult(true);
            setIsCorrect(record.correct);
          }
        }
      } catch (error) {
        console.error('加载做题记录失败:', error);
      }
    };
    loadRecords();
  }, [currentIndex, recordKey]);

  // ---------- 保存当前题目记录 ----------
  const saveRecord = async (index, correct) => {
    try {
      const stored = await AsyncStorage.getItem(recordKey);
      const records = stored ? JSON.parse(stored) : {};
      records[currentIndex] = {
        selectedIndex: index,
        correct: correct,
      };
      await AsyncStorage.setItem(recordKey, JSON.stringify(records));
    } catch (error) {
      console.error('保存做题记录失败:', error);
    }
  };

  // ---------- 点击选项 ----------
  const handlePress = (index) => {
    if (showResult) return;
    const correct = index === currentQ.correct;
    setSelectedIndex(index);
    setShowResult(true);
    setIsCorrect(correct);
    // 保存记录
    saveRecord(index, correct);
  };

  // ---------- 切换题目时重置当前题目的状态（但保留已保存记录） ----------
  const goToQuestion = (newIndex) => {
    if (newIndex < 0 || newIndex >= questions.length) return;
    setCurrentIndex(newIndex);
    // 重置当前题目的显示状态，等待 useEffect 加载记录
    setSelectedIndex(null);
    setShowResult(false);
    setIsCorrect(false);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      goToQuestion(currentIndex + 1);
    } else {
      Alert.alert('🎉 恭喜', '你已完成这个题库！');
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      goToQuestion(currentIndex - 1);
    }
  };

  // ---------- 获取选项样式 ----------
  const getOptionStyle = (index) => {
    if (!showResult) {
      return selectedIndex === index ? { backgroundColor: '#d3d3d3' } : {};
    }
    if (index === currentQ.correct) {
      return { backgroundColor: '#4CAF50' };
    }
    if (index === selectedIndex && !isCorrect) {
      return { backgroundColor: '#f44336' };
    }
    return {};
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={{ alignSelf: 'flex-start', marginBottom: 10 }}>
        <Text style={{ fontSize: 18, color: '#2196F3' }}>‹ 返回模式选择</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{name} - {currentIndex + 1}/{questions.length}</Text>
      <Text style={styles.title}>{currentQ.title}</Text>

      {currentQ.options.map((option, idx) => (
        <TouchableOpacity
          key={idx}
          style={[
            styles.optionButton,
            getOptionStyle(idx),
            showResult && idx !== currentQ.correct && idx !== selectedIndex && { opacity: 0.6 },
          ]}
          onPress={() => handlePress(idx)}
          disabled={showResult}
        >
          <Text style={styles.optionText}>{option}</Text>
        </TouchableOpacity>
      ))}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
        <TouchableOpacity
          style={[styles.optionButton, { flex: 1, marginRight: 8, backgroundColor: currentIndex > 0 ? '#2196F3' : '#ccc' }]}
          onPress={handlePrev}
          disabled={currentIndex === 0}
        >
          <Text style={[styles.optionText, { color: '#fff', textAlign: 'center' }]}>‹ 上一题</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionButton, { flex: 1, marginLeft: 8, backgroundColor: '#4CAF50' }]}
          onPress={handleNext}
        >
          <Text style={[styles.optionText, { color: '#fff', textAlign: 'center' }]}>
            {currentIndex < questions.length - 1 ? '下一题 ➜' : '完成'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default QuizScreen;