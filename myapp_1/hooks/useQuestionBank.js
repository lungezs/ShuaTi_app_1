import { useState, useEffect } from 'react';
import { Alert, Modal, TextInput, View, Text, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseExcelToQuestions } from '../utils/excelHelper';

const STORAGE_KEY = 'all_question_banks';
const WRONG_PREFIX = 'wrong_';

export const useQuestionBank = () => {
  const [banks, setBanks] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [inputName, setInputName] = useState('');

  useEffect(() => {
    const loadBanks = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored !== null) setBanks(JSON.parse(stored));
      } catch (error) {
        console.error('加载题库列表失败:', error);
      }
    };
    loadBanks();
  }, []);

  const importNewBank = () => {
    setInputName('');
    setModalVisible(true);
  };

  const confirmImport = async () => {
    setModalVisible(false);
    const name = inputName.trim();
    if (!name) {
      Alert.alert('⚠️ 提示', '名称不能为空');
      return;
    }

    const data = await parseExcelToQuestions();
    if (!data || data.length === 0) {
      Alert.alert('⚠️ 提示', 'Excel 数据无效或为空');
      return;
    }

    const newBank = {
      id: Date.now().toString(),
      name: name,
      questions: data,
    };

    try {
      const currentBanks = await AsyncStorage.getItem(STORAGE_KEY);
      const banksArray = currentBanks ? JSON.parse(currentBanks) : [];
      const updatedBanks = [...banksArray, newBank];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedBanks));
      setBanks(updatedBanks);
      Alert.alert('✅ 成功', `已导入“${name}” (${data.length} 道题)`);
    } catch (error) {
      console.error('保存失败:', error);
      Alert.alert('❌ 错误', '保存失败，请重试');
    }
  };

  const deleteBank = async (id) => {
    Alert.alert(
      '🗑️ 删除题库',
      '确定要删除这个题库吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              const updated = banks.filter(b => b.id !== id);
              await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
              setBanks(updated);
            } catch (error) {
              console.error('删除失败:', error);
            }
          }
        }
      ]
    );
  };

  // ---------- 收藏 ----------
  const getCollected = async (bankId) => {
    try {
      const stored = await AsyncStorage.getItem(`collected_${bankId}`);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('获取收藏失败:', error);
      return [];
    }
  };

  const toggleCollected = async (bankId, questionIndex) => {
    try {
      const stored = await AsyncStorage.getItem(`collected_${bankId}`);
      let collected = stored ? JSON.parse(stored) : [];
      if (collected.includes(questionIndex)) {
        collected = collected.filter(i => i !== questionIndex);
      } else {
        collected.push(questionIndex);
        collected.sort((a, b) => a - b);
      }
      await AsyncStorage.setItem(`collected_${bankId}`, JSON.stringify(collected));
      return collected;
    } catch (error) {
      console.error('切换收藏失败:', error);
      return [];
    }
  };

  // ---------- 错题本 ----------
  const getWrongQuestions = async (bankId) => {
    try {
      const stored = await AsyncStorage.getItem(WRONG_PREFIX + bankId);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('获取错题本失败:', error);
      return [];
    }
  };

  // 批量添加错题（传入原始索引数组）
  const addWrongQuestions = async (bankId, indices) => {
    if (!indices || indices.length === 0) return;
    try {
      const stored = await AsyncStorage.getItem(WRONG_PREFIX + bankId);
      let wrong = stored ? JSON.parse(stored) : [];
      const set = new Set(wrong);
      indices.forEach(idx => set.add(idx));
      const updated = Array.from(set).sort((a, b) => a - b);
      await AsyncStorage.setItem(WRONG_PREFIX + bankId, JSON.stringify(updated));
    } catch (error) {
      console.error('添加错题失败:', error);
    }
  };

  // 移除单个错题
  const removeWrongQuestion = async (bankId, questionIndex) => {
    try {
      const stored = await AsyncStorage.getItem(WRONG_PREFIX + bankId);
      if (!stored) return;
      let wrong = JSON.parse(stored);
      const updated = wrong.filter(i => i !== questionIndex);
      await AsyncStorage.setItem(WRONG_PREFIX + bankId, JSON.stringify(updated));
    } catch (error) {
      console.error('移除错题失败:', error);
    }
  };

  // 清空错题本（删除整个键）
  const clearWrongQuestions = async (bankId) => {
    try {
      await AsyncStorage.removeItem(WRONG_PREFIX + bankId);
    } catch (error) {
      console.error('清空错题本失败:', error);
    }
  };

  return {
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
    getWrongQuestions,
    addWrongQuestions,
    removeWrongQuestion,
    clearWrongQuestions,
  };
};