import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, Modal, TextInput, Alert } from 'react-native';
import { useQuestionBank } from './hooks/useQuestionBank';

// ---------- 刷题界面组件 ----------
const QuizScreen = ({ bank, onBack }) => {
  const { questions, name } = bank;
  const [selected, setSelected] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePress = (index) => {
    setSelected(index);
    const q = questions[currentIndex];
    if (index === q.correct) {
      Alert.alert('✅ 正确！', '太棒了！');
    } else {
      Alert.alert('❌ 再想想', '正确答案是：' + q.options[q.correct]);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelected(null);
    } else {
      Alert.alert('🎉 恭喜', '你已完成这个题库！');
    }
  };

  const currentQ = questions[currentIndex];

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={{ alignSelf: 'flex-start', marginBottom: 10 }}>
        <Text style={{ fontSize: 18, color: '#2196F3' }}>‹ 返回题库列表</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{name} - {currentIndex + 1}/{questions.length}</Text>
      <Text style={styles.title}>{currentQ.title}</Text>

      {currentQ.options.map((option, idx) => (
        <TouchableOpacity
          key={idx}
          style={[
            styles.optionButton,
            selected === idx && { backgroundColor: '#d3d3d3' },
          ]}
          onPress={() => handlePress(idx)}
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
};

// ---------- 主 App ----------
export default function App() {
  // 解构出 deleteBank
  const { banks, importNewBank, confirmImport, modalVisible, setModalVisible, inputName, setInputName, deleteBank } = useQuestionBank();
  const [currentBank, setCurrentBank] = useState(null);

  if (currentBank) {
    return <QuizScreen bank={currentBank} onBack={() => setCurrentBank(null)} />;
  }

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
                onPress={() => setCurrentBank(item)}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.listItemText}>📖 {item.name}（{item.questions.length} 题）</Text>
                  <Text style={{ color: '#999', fontSize: 20 }}>›</Text>
                </View>
              </TouchableOpacity>

              {/* 删除按钮 */}
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

      {/* Modal 输入框（不变） */}
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

// ---------- 样式表（新增了两个样式） ----------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
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
  // 新增：列表项容器（横向排列）
  listItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  // 原有列表项（占据大部分宽度）
  listItem: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 8,
  },
  listItemText: {
    fontSize: 18,
    fontWeight: '500',
  },
  // 新增：删除按钮
  deleteButton: {
    backgroundColor: '#ff6b6b',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    width: 50,
    height: 50,
  },
  deleteButtonText: {
    fontSize: 22,
    color: '#fff',
  },
  // Modal 样式（不变）
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 6,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});