import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, Modal, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from '../styles/commonStyles';

const RECORD_KEY_PREFIX = 'quiz_record_';

const QuizScreen = ({
  questions,
  bankName,
  bankId,
  isFavoriteMode,
  isWrongMode = false,
  collectedIndices,
  onToggleCollect,
  onRemoveWrong,
  onAddWrong,          // 答错时回调，用于加入错题本
  onBack,
  mode = 'order',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  const [allRecords, setAllRecords] = useState({});
  const [autoJumpTimer, setAutoJumpTimer] = useState(null);

  const currentQ = questions[currentIndex];
  const recordKey = `${RECORD_KEY_PREFIX}${bankId}_${mode}`;
  const isMulti = currentQ?.type === '多选题' || false;
  const originalIndex = currentQ?.originalIndex ?? currentIndex;
  const isCollected = collectedIndices.includes(originalIndex);

  // 加载做题记录
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

  // 重置进度（仅错题本或收藏模式）
  const resetProgress = async () => {
    const label = isWrongMode ? '错题本' : '收藏';
    Alert.alert(
      `🔄 重置${label}进度`,
      `确定要清除${label}模式下所有题目的做题记录吗？此操作不可撤销。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定重置',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(recordKey);
              setAllRecords({});
              setSelectedIndices([]);
              setShowResult(false);
              setIsCorrect(false);
              setCurrentIndex(0);
              Alert.alert('✅ 已重置', `${label}模式下的所有题目进度已清空。`);
            } catch (error) {
              console.error('重置失败:', error);
              Alert.alert('❌ 错误', '重置失败，请重试');
            }
          }
        }
      ]
    );
  };

  // 单选/判断题
  const handleSinglePress = (index) => {
    if (showResult) return;
    const correct = currentQ.correct.includes(index);
    setSelectedIndices([index]);
    setShowResult(true);
    setIsCorrect(correct);
    saveRecord([index], correct);

    // 答错时加入错题本
    if (!correct && onAddWrong) {
      onAddWrong(originalIndex);
    }

    if (correct) {
      if (autoJumpTimer) clearTimeout(autoJumpTimer);
      const timer = setTimeout(() => {
        if (currentIndex < questions.length - 1) {
          goToQuestion(currentIndex + 1);
        } else {
          Alert.alert('🎉 恭喜', '你已完成这个题库！');
        }
      }, 500);
      setAutoJumpTimer(timer);
    }
  };

  // 多选题切换
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

  // 提交多选题
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

    // 答错时加入错题本
    if (!isCorrectResult && onAddWrong) {
      onAddWrong(originalIndex);
    }
  };

  // 切换题目
  const goToQuestion = (newIndex) => {
    if (newIndex < 0 || newIndex >= questions.length) return;
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

  // 切换收藏
  const handleToggleCollect = async () => {
    const newCollected = await onToggleCollect(originalIndex);
    if (isFavoriteMode && !newCollected.includes(originalIndex)) {
      if (currentIndex < questions.length - 1) {
        goToQuestion(currentIndex + 1);
      } else if (currentIndex > 0) {
        goToQuestion(currentIndex - 1);
      } else {
        Alert.alert('提示', '已取消收藏，当前列表为空');
        onBack();
      }
    }
  };

  // 移出错题本
  const handleRemoveWrong = () => {
    Alert.alert(
      '📕 移出错题本',
      '确定要将此题移出错题本吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '移除',
          style: 'destructive',
          onPress: async () => {
            await onRemoveWrong(originalIndex);
            if (currentIndex < questions.length - 1) {
              goToQuestion(currentIndex + 1);
            } else if (currentIndex > 0) {
              goToQuestion(currentIndex - 1);
            } else {
              Alert.alert('提示', '错题本已空，即将返回');
              onBack();
            }
          }
        }
      ]
    );
  };

  // ----- 选项样式 -----
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
      if (isCorrect) {
        if (isSelected) {
          return { backgroundColor: '#4CAF50' };
        }
        return {};
      } else {
        if (isSelected) {
          return { backgroundColor: '#f44336' };
        }
        return {};
      }
    } else {
      if (isInCorrect) {
        return { backgroundColor: '#4CAF50' };
      }
      if (isSelected && !isInCorrect) {
        return { backgroundColor: '#f44336' };
      }
      return {};
    }
  };

  // 目录渲染
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

  if (!currentQ) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>没有题目可显示</Text>
        <TouchableOpacity onPress={onBack} style={[styles.optionButton, { marginTop: 20 }]}>
          <Text style={styles.optionText}>返回</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const correctLetters = currentQ.correct.map(i => String.fromCharCode(65 + i)).join('');

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <TouchableOpacity onPress={onBack}>
          <Text style={{ fontSize: 18, color: '#2196F3' }}>‹ 返回</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {(isFavoriteMode || isWrongMode) && (
            <TouchableOpacity onPress={resetProgress} style={{ marginRight: 12 }}>
              <Text style={{ fontSize: 20, color: '#f44336' }}>🔄</Text>
            </TouchableOpacity>
          )}
          {!isWrongMode && (
            <TouchableOpacity onPress={handleToggleCollect} style={{ marginRight: 15 }}>
              <Text style={{ fontSize: 24, color: isCollected ? '#FFD700' : '#ccc' }}>
                {isCollected ? '⭐' : '☆'}
              </Text>
            </TouchableOpacity>
          )}
          {isWrongMode && (
            <TouchableOpacity onPress={handleRemoveWrong} style={{ marginRight: 15 }}>
              <Text style={{ fontSize: 20, color: '#f44336' }}>📕</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => setShowCatalog(true)}>
            <Text style={{ fontSize: 18, color: '#2196F3', fontWeight: 'bold' }}>📋 目录</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.title}>{bankName} - {currentIndex + 1}/{questions.length}</Text>
      <Text style={styles.title}>{currentQ.type}：{currentQ.title}</Text>

      {currentQ.options.map((option, idx) => {
        const optionStyle = getOptionStyle(idx);
        let textColor = '#000';
        if (showResult) {
          if (isMulti) {
            if (selectedIndices.includes(idx)) {
              textColor = '#fff';
            }
          } else {
            if (selectedIndices.includes(idx)) {
              textColor = '#fff';
            }
          }
        }
        return (
          <TouchableOpacity
            key={idx}
            style={[styles.optionButton, optionStyle]}
            onPress={() => {
              if (isMulti) {
                handleMultiPress(idx);
              } else {
                handleSinglePress(idx);
              }
            }}
            disabled={showResult}
          >
            <Text style={[styles.optionText, { color: textColor }]}>
              {String.fromCharCode(65 + idx)}. {option}
            </Text>
          </TouchableOpacity>
        );
      })}

      {isMulti && !showResult && (
        <TouchableOpacity
          style={[styles.optionButton, { marginTop: 10, backgroundColor: '#2196F3' }]}
          onPress={handleSubmitMulti}
        >
          <Text style={[styles.optionText, { color: '#fff', textAlign: 'center' }]}>确认答案</Text>
        </TouchableOpacity>
      )}

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