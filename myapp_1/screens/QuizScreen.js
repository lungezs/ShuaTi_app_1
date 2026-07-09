import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, Modal, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from '../styles/commonStyles';

const RECORD_KEY_PREFIX = 'quiz_record_';

const QuizScreen = ({ bank, onBack }) => {
  const { questions, name, id } = bank;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [showCatalog, setShowCatalog] = useState(false);
  const [allRecords, setAllRecords] = useState({});
  const [autoJumpTimer, setAutoJumpTimer] = useState(null); // 用于存储定时器

  const currentQ = questions[currentIndex];
  const recordKey = RECORD_KEY_PREFIX + id;
  const isMulti = currentQ.type === '多选题';

  // 加载记录
  useEffect(() => {
    const loadRecords = async () => {
      try {
        const stored = await AsyncStorage.getItem(recordKey);
        if (stored !== null) {
          const records = JSON.parse(stored);
          setAllRecords(records);
          const record = records[currentIndex];
          if (record) {
            setSelectedIndices(record.selectedIndices || []);
            setShowResult(true);
            setIsCorrect(record.correct);
          } else {
            setSelectedIndices([]);
            setShowResult(false);
            setIsCorrect(false);
          }
        } else {
          setAllRecords({});
          setSelectedIndices([]);
          setShowResult(false);
          setIsCorrect(false);
        }
      } catch (error) {
        console.error('加载做题记录失败:', error);
      }
    };
    loadRecords();

    // 清理定时器（组件卸载或切换题目时）
    return () => {
      if (autoJumpTimer) clearTimeout(autoJumpTimer);
    };
  }, [currentIndex, recordKey]);

  // 保存记录
  const saveRecord = async (selected, correct) => {
    try {
      const stored = await AsyncStorage.getItem(recordKey);
      const records = stored ? JSON.parse(stored) : {};
      records[currentIndex] = {
        selectedIndices: selected,
        correct: correct,
      };
      await AsyncStorage.setItem(recordKey, JSON.stringify(records));
      setAllRecords(records);
    } catch (error) {
      console.error('保存做题记录失败:', error);
    }
  };

  // ---------- 单选/判断题点击 ----------
  const handleSinglePress = (index) => {
    if (showResult) return;
    const correct = currentQ.correct.includes(index);
    setSelectedIndices([index]);
    setShowResult(true);
    setIsCorrect(correct);
    saveRecord([index], correct);

    // 如果答对了，自动跳转下一题（延迟500ms让用户看到绿色反馈）
    if (correct) {
      // 清除之前的定时器（避免重复）
      if (autoJumpTimer) clearTimeout(autoJumpTimer);
      const timer = setTimeout(() => {
        // 检查是否还有下一题
        if (currentIndex < questions.length - 1) {
          goToQuestion(currentIndex + 1);
        } else {
          Alert.alert('🎉 恭喜', '你已完成这个题库！');
        }
      }, 500);
      setAutoJumpTimer(timer);
    }
  };

  // ---------- 多选题点击切换 ----------
  const handleMultiPress = (index) => {
    if (showResult) return;
    setSelectedIndices(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  // ---------- 提交多选题 ----------
  const handleSubmitMulti = () => {
    if (showResult) return;
    if (selectedIndices.length === 0) {
      Alert.alert('提示', '请至少选择一个选项');
      return;
    }
    const sorted = [...selectedIndices].sort();
    const correctSorted = [...currentQ.correct].sort();
    const isCorrectResult = sorted.length === correctSorted.length && sorted.every((v, i) => v === correctSorted[i]);
    setShowResult(true);
    setIsCorrect(isCorrectResult);
    saveRecord(sorted, isCorrectResult);
    // 多选无论对错都不自动跳转，用户需要手动点击“下一题”
  };

  // ---------- 切换题目（通用） ----------
  const goToQuestion = (newIndex) => {
    if (newIndex < 0 || newIndex >= questions.length) return;
    // 清除定时器，防止在跳转过程中触发
    if (autoJumpTimer) {
      clearTimeout(autoJumpTimer);
      setAutoJumpTimer(null);
    }
    setCurrentIndex(newIndex);
    setSelectedIndices([]);
    setShowResult(false);
    setIsCorrect(false);
    setShowCatalog(false);
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
      if (selectedIndices.includes(index)) {
        return { backgroundColor: '#d3d3d3' };
      }
      return {};
    }
    const isInCorrect = currentQ.correct.includes(index);
    const isSelected = selectedIndices.includes(index);

    if (isMulti) {
      if (isSelected && isInCorrect) {
        return { backgroundColor: '#4CAF50' };
      }
      if (isSelected && !isInCorrect) {
        return { backgroundColor: '#f44336' };
      }
      return {};
    } else {
      // 单选/判断
      if (isInCorrect) {
        return { backgroundColor: '#4CAF50' };
      }
      if (isSelected && !isInCorrect) {
        return { backgroundColor: '#f44336' };
      }
      return {};
    }
  };

  // 渲染目录项
  const renderCatalogItem = ({ item }) => {
    const idx = item - 1;
    const record = allRecords[idx];
    let bgColor = '#fff';
    let textColor = '#333';
    if (record) {
      if (record.correct) {
        bgColor = '#4CAF50';
        textColor = '#fff';
      } else {
        bgColor = '#f44336';
        textColor = '#fff';
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

  // 正确答案字母串
  const correctLetters = currentQ.correct.map(i => String.fromCharCode(65 + i)).join('');

  // ---------- 主界面 ----------
  return (
    <View style={styles.container}>
      {/* 顶部导航 */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <TouchableOpacity onPress={onBack}>
          <Text style={{ fontSize: 18, color: '#2196F3' }}>‹ 返回</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowCatalog(true)}>
          <Text style={{ fontSize: 18, color: '#2196F3', fontWeight: 'bold' }}>📋 目录</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>{name} - {currentIndex + 1}/{questions.length}</Text>
      <Text style={styles.title}>
        {currentQ.type}：{currentQ.title}
      </Text>

      {currentQ.options.map((option, idx) => (
        <TouchableOpacity
          key={idx}
          style={[styles.optionButton, getOptionStyle(idx)]}
          onPress={() => {
            if (isMulti) {
              handleMultiPress(idx);
            } else {
              handleSinglePress(idx);
            }
          }}
          disabled={showResult}
        >
          <Text style={styles.optionText}>
            {String.fromCharCode(65 + idx)}. {option}
          </Text>
        </TouchableOpacity>
      ))}

      {/* 多选题提交按钮 */}
      {isMulti && !showResult && (
        <TouchableOpacity
          style={[styles.optionButton, { marginTop: 10, backgroundColor: '#2196F3' }]}
          onPress={handleSubmitMulti}
        >
          <Text style={[styles.optionText, { color: '#fff', textAlign: 'center' }]}>确认答案</Text>
        </TouchableOpacity>
      )}

      {/* 上一题/下一题 */}
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

      {/* 解析 + 正确答案 */}
      {showResult && (
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

      {/* 目录弹窗 */}
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
              🟢 正确 &nbsp;|&nbsp; 🔴 错误 &nbsp;|&nbsp; ⬜ 未做
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

export default QuizScreen;