import { useState, useEffect } from 'react';
import { Alert, Modal, TextInput, View, Text, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseExcelToQuestions } from '../utils/excelHelper';

const STORAGE_KEY = 'all_question_banks';

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

  // ✅ 删除题库函数（确认已定义）
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

  // ✅ 返回对象中一定要包含 deleteBank
  return {
    banks,
    importNewBank,
    confirmImport,
    modalVisible,
    setModalVisible,
    inputName,
    setInputName,
    deleteBank,   // 👈 必须要有这一行
  };
};