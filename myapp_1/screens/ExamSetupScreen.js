import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert } from 'react-native';
import { styles } from '../styles/commonStyles';

const ExamSetupScreen = ({ bank, onBack, onStart }) => {
  const { questions, name } = bank;

  // 统计各题型总数
  const typeCounts = {};
  questions.forEach(q => {
    const t = q.type || '单选题';
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });

  // 初始化每个题型的选择数量（默认取全部）
  const initialSelections = {};
  Object.keys(typeCounts).forEach(t => {
    initialSelections[t] = typeCounts[t];
  });

  const [selections, setSelections] = useState(initialSelections);

  // 修改某个题型的数量
  const updateCount = (type, value) => {
    const num = parseInt(value, 10) || 0;
    const max = typeCounts[type];
    const clamped = Math.min(Math.max(num, 0), max);
    setSelections(prev => ({ ...prev, [type]: clamped }));
  };

  // 检查是否至少选择了一道题
  const totalSelected = Object.values(selections).reduce((sum, v) => sum + v, 0);

  const handleStart = () => {
    if (totalSelected === 0) {
      Alert.alert('提示', '请至少选择一道题目');
      return;
    }
    // 构建抽题计划：{ type: count }
    const plan = {};
    Object.keys(selections).forEach(type => {
      if (selections[type] > 0) {
        plan[type] = selections[type];
      }
    });
    onStart(plan);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={{ alignSelf: 'flex-start', marginBottom: 10 }}>
        <Text style={{ fontSize: 18, color: '#2196F3' }}>‹ 返回</Text>
      </TouchableOpacity>

      <Text style={styles.title}>📝 模拟考试设置</Text>
      <Text style={{ textAlign: 'center', color: '#666', marginBottom: 20 }}>
        题库：{name}（共 {questions.length} 题）
      </Text>

      {Object.keys(typeCounts).map(type => (
        <View key={type} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 8 }}>
          <Text style={{ fontSize: 18 }}>{type}（共 {typeCounts[type]} 题）</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => updateCount(type, selections[type] - 1)}
              style={{ padding: 8, backgroundColor: '#ddd', borderRadius: 4, marginRight: 8 }}
            >
              <Text style={{ fontSize: 18 }}>−</Text>
            </TouchableOpacity>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 4, padding: 4, width: 50, textAlign: 'center' }}
              keyboardType="numeric"
              value={String(selections[type])}
              onChangeText={(text) => updateCount(type, text)}
            />
            <TouchableOpacity
              onPress={() => updateCount(type, selections[type] + 1)}
              style={{ padding: 8, backgroundColor: '#ddd', borderRadius: 4, marginLeft: 8 }}
            >
              <Text style={{ fontSize: 18 }}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <Text style={{ marginTop: 20, textAlign: 'center', fontSize: 16, color: '#333' }}>
        共选择 <Text style={{ fontWeight: 'bold', color: '#2196F3' }}>{totalSelected}</Text> 道题
      </Text>

      <TouchableOpacity
        style={[styles.optionButton, { backgroundColor: '#4CAF50', marginTop: 20 }]}
        onPress={handleStart}
      >
        <Text style={[styles.optionText, { color: '#fff', textAlign: 'center' }]}>🚀 开始考试</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ExamSetupScreen;