import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';

export default function App() {
  const question = {
    title: 'React Native 是用什么语言开发的？',
    options: ['Java', 'Kotlin', 'JavaScript', 'Swift'],
    correct: 2,
  };

  const [selected, setSelected] = useState(null);

  const handlePress = (index) => {
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