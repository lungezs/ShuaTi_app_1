import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, Modal, TextInput, Alert } from 'react-native';
import { useQuestionBank } from './hooks/useQuestionBank';
import QuizScreen from './screens/QuizScreen';
import QuizModeScreen from './screens/QuizModeScreen';
import ExamSetupScreen from './screens/ExamSetupScreen';
import ExamScreen from './screens/ExamScreen';
import { styles } from './styles/commonStyles';

export default function App() {
  const {
    banks,
    importNewBank,
    confirmImport,
    modalVisible,
    setModalVisible,
    inputName,
    setInputName,
    deleteBank,
    getCollected,
    toggleCollected,
  } = useQuestionBank();

  const [currentBank, setCurrentBank] = useState(null);
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [isFavoriteMode, setIsFavoriteMode] = useState(false);
  const [collectedIndices, setCollectedIndices] = useState([]);
  const [displayQuestions, setDisplayQuestions] = useState([]);

  // 考试相关状态
  const [showExamSetup, setShowExamSetup] = useState(false);
  const [isExamMode, setIsExamMode] = useState(false);
  const [examQuestions, setExamQuestions] = useState([]);
  const [examBankName, setExamBankName] = useState('');

  // 加载收藏
  useEffect(() => {
    const loadCollected = async () => {
      if (currentBank) {
        const indices = await getCollected(currentBank.id);
        setCollectedIndices(indices);
      }
    };
    loadCollected();
  }, [currentBank]);

  // 构建显示题目
  useEffect(() => {
    if (!currentBank) {
      setDisplayQuestions([]);
      return;
    }

    if (isFavoriteMode) {
      const filtered = currentBank.questions
        .map((q, idx) => ({ ...q, originalIndex: idx }))
        .filter((_, idx) => collectedIndices.includes(idx));
      setDisplayQuestions(filtered);
    } else {
      const all = currentBank.questions.map((q, idx) => ({ ...q, originalIndex: idx }));
      setDisplayQuestions(all);
    }
  }, [currentBank, isFavoriteMode, collectedIndices]);

  const handleToggleCollect = async (originalIndex) => {
    const newCollected = await toggleCollected(currentBank.id, originalIndex);
    setCollectedIndices(newCollected);
    return newCollected;
  };

  // 模式启动函数
  const startOrder = () => {
    setIsFavoriteMode(false);
    setIsQuizMode(true);
  };

  const startFavorite = () => {
    if (collectedIndices.length === 0) {
      Alert.alert('提示', '还没有收藏任何题目，请先在顺序练习中收藏题目。');
      return;
    }
    setIsFavoriteMode(true);
    setIsQuizMode(true);
  };

  const startExam = () => {
    setShowExamSetup(true);
  };

  const backToMode = () => {
    setIsQuizMode(false);
    setIsFavoriteMode(false);
    setShowExamSetup(false);
    setIsExamMode(false);
    setExamQuestions([]);
  };

  // 考试开始：根据 plan 抽取题目，保留原始索引
  const handleExamStart = (plan) => {
    const allQuestions = currentBank.questions;
    const selected = [];
    Object.keys(plan).forEach(type => {
      const count = plan[type];
      // 保留原始索引
      const pool = allQuestions.map((q, idx) => ({ ...q, originalIndex: idx })).filter(q => (q.type || '单选题') === type);
      const shuffled = pool.sort(() => Math.random() - 0.5);
      const picked = shuffled.slice(0, count);
      selected.push(...picked);
    });
    // 打乱整体顺序
    const finalQuestions = selected.sort(() => Math.random() - 0.5);
    setExamQuestions(finalQuestions);
    setExamBankName(currentBank.name);
    setShowExamSetup(false);
    setIsExamMode(true);
  };

  // 退出考试
  const exitExam = () => {
    setIsExamMode(false);
    setExamQuestions([]);
    backToMode(); // 返回模式选择
  };

  // ----- 页面路由 -----
  // 考试界面
  if (currentBank && isExamMode && examQuestions.length > 0) {
    return (
      <ExamScreen
        questions={examQuestions}
        bankName={examBankName}
        onBack={exitExam}
        collectedIndices={collectedIndices}
        onToggleCollect={handleToggleCollect}
      />
    );
  }

  // 考试设置界面
  if (currentBank && showExamSetup) {
    return (
      <ExamSetupScreen
        bank={currentBank}
        onBack={() => {
          setShowExamSetup(false);
          // 返回模式选择（currentBank 保留）
        }}
        onStart={handleExamStart}
      />
    );
  }

  // 刷题界面（顺序/收藏）
  if (currentBank && isQuizMode) {
    return (
      <QuizScreen
        questions={displayQuestions}
        bankName={currentBank.name}
        bankId={currentBank.id}
        isFavoriteMode={isFavoriteMode}
        collectedIndices={collectedIndices}
        onToggleCollect={handleToggleCollect}
        onBack={backToMode}
        mode={isFavoriteMode ? 'favorite' : 'order'}
      />
    );
  }

  // 模式选择界面
  if (currentBank) {
    return (
      <QuizModeScreen
        bank={currentBank}
        onBack={() => {
          setCurrentBank(null);
          setIsQuizMode(false);
          setIsFavoriteMode(false);
          setShowExamSetup(false);
          setIsExamMode(false);
        }}
        onStartOrder={startOrder}
        onStartFavorite={startFavorite}
        onStartExam={startExam}
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
                  setIsFavoriteMode(false);
                  setShowExamSetup(false);
                  setIsExamMode(false);
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