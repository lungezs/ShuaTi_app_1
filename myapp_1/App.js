import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Modal, TextInput, Alert } from 'react-native';
import { useQuestionBank } from './hooks/useQuestionBank';
import QuizScreen from './screens/QuizScreen';
import { styles } from './styles/commonStyles';

// ---------- 模式选择界面 ----------
const QuizModeScreen = ({ bank, onBack, onStartQuiz }) => {
  const { name, questions } = bank;

  const modes = [
    { id: 'order', label: '📝 顺序练习', color: '#4CAF50' },
    { id: 'favorite', label: '⭐ 收藏', color: '#FF9800' },
    { id: 'wrong', label: '❌ 错题本', color: '#f44336' },
    { id: 'exam', label: '📊 模拟考试', color: '#9C27B0' },
  ];

  const handleModePress = (modeId) => {
    if (modeId === 'order') {
      onStartQuiz();
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
          onPress={() => handleModePress(mode.id)}
        >
          <Text style={styles.modeButtonText}>{mode.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// ---------- 主 App ----------
export default function App() {
  const { banks, importNewBank, confirmImport, modalVisible, setModalVisible, inputName, setInputName, deleteBank } = useQuestionBank();
  
  const [currentBank, setCurrentBank] = useState(null);
  const [isQuizMode, setIsQuizMode] = useState(false);

  // 刷题界面
  if (currentBank && isQuizMode) {
    return <QuizScreen bank={currentBank} onBack={() => setIsQuizMode(false)} />;
  }

  // 模式选择界面
  if (currentBank) {
    return (
      <QuizModeScreen
        bank={currentBank}
        onBack={() => {
          setCurrentBank(null);
          setIsQuizMode(false);
        }}
        onStartQuiz={() => setIsQuizMode(true)}
      />
    );
  }

  // 首页
  return (
    <View style={styles.container}>
      <Text style={styles.title}>📚 我的全部题库</Text>

      <TouchableOpacity
        style={[styles.optionButton, { backgroundColor: '#2196F3', marginBottom: 15 }]}
        onPress={importNewBank}
      >
        <Text style={[styles.optionText, { color: '#fff', textAlign: 'center' }]}>➕ 导入新题库</Text>
      </TouchableOpacity>

      {banks.length === 0 ? (
        <Text style={{ textAlign: 'center', color: '#999', marginTop: 30 }}>
          还没有题库，点击上方按钮导入吧！
        </Text>
      ) : (
        <FlatList
          data={banks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.listItemContainer}>
              <TouchableOpacity
                style={styles.listItem}
                onPress={() => {
                  setCurrentBank(item);
                  setIsQuizMode(false);
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.listItemText}>📖 {item.name}（{item.questions.length} 题）</Text>
                  <Text style={{ color: '#999', fontSize: 20 }}>›</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteBank(item.id)}
              >
                <Text style={styles.deleteButtonText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* Modal 输入弹窗 */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>📚 新题库名称</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="请输入题库名称"
              placeholderTextColor="#999"
              value={inputName}
              onChangeText={setInputName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={[styles.modalButton, { backgroundColor: '#ccc' }]}>
                <Text style={styles.modalButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmImport} style={[styles.modalButton, { backgroundColor: '#2196F3' }]}>
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>确定</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}