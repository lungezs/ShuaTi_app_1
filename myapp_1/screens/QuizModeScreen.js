import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { styles } from '../styles/commonStyles';

const QuizModeScreen = ({ bank, onBack, onStartOrder, onStartFavorite, onStartExam }) => {
  const { name, questions } = bank;

  const modes = [
    { id: 'order', label: '📝 顺序练习', color: '#4CAF50', action: onStartOrder },
    { id: 'favorite', label: '⭐ 收藏', color: '#FF9800', action: onStartFavorite },
    { id: 'wrong', label: '❌ 错题本', color: '#f44336' },
    { id: 'exam', label: '📊 模拟考试', color: '#9C27B0', action: onStartExam },
  ];

  const handleModePress = (mode) => {
    if (mode.action) {
      mode.action();
    } else {
      Alert.alert('⏳ 开发中', '这个功能还在开发中，敬请期待！');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={{ alignSelf: 'flex-start', marginBottom: 10 }}>
        <Text style={{ fontSize: 18, color: '#2196F3' }}>‹ 返回题库列表</Text>
      </TouchableOpacity>

      <Text style={[styles.title, { marginBottom: 5 }]}>{name}</Text>
      <Text style={{ textAlign: 'center', color: '#666', marginBottom: 30 }}>
        共 {questions.length} 道题
      </Text>

      {modes.map((mode) => (
        <TouchableOpacity
          key={mode.id}
          style={[styles.modeButton, { backgroundColor: mode.color }]}
          onPress={() => handleModePress(mode)}
        >
          <Text style={styles.modeButtonText}>{mode.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default QuizModeScreen;