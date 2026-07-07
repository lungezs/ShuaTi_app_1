import React, { useState } from 'react';//导入React库，并单独导入useState hook
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';//导入组件

export default function App() {//题目数据
  const question = {
    title: 'React Native 是用什么语言开发的？',
    options: ['Java', 'Kotlin', 'JavaScript', 'Swift'],
    correct: 2,
  };

  const [selected, setSelected] = useState(null);//定义[选项索引]，初始值为null

  const handlePress = (index) => {//点击选项函数
    setSelected(index);
    if (index === question.correct) {
      Alert.alert('✅ 回答正确！！', '太棒了，继续加油！');
    } else {
      Alert.alert('❌ 再想想', '正确答案是：' + question.options[question.correct]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{question.title}</Text>
      {question.options.map((option, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.optionButton,
            selected === index && { backgroundColor: '#d3d3d3' },
          ]}
          onPress={() => handlePress(index)}
        >
          <Text style={styles.optionText}>{option}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 30,
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
});