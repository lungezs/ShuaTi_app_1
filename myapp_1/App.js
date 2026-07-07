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
    setSelected(index);//赋值当前[选项索引]
    if (index === question.correct) {//判断是否正确
      Alert.alert('✅ 回答正确！！', '太棒了，继续加油！');
    } else {
      Alert.alert('❌ 再想想', '正确答案是：' + question.options[question.correct]);
    }
  };

  return (//UI布局
    <View style={styles.container}>{/* 背景 */}
      <Text style={styles.title}>{question.title}</Text>{/* 题目 */}
      {/* 选项 */}
      {question.options.map((option, index) => (//遍历选项数组，生成选项按钮 */}
        <TouchableOpacity
          key={index}//唯一标识=当前选项号
          style={[
            styles.optionButton,//选项按钮样式
            selected === index && { backgroundColor: '#d3d3d3' },//如果当前选项被选中，则改变颜色
          ]}
          onPress={() => handlePress(index)}//点击选项时调用handlePress函数
        >
          <Text style={styles.optionText}>{option}</Text>{/* 显示选项文本*/}
        </TouchableOpacity>
      ))}
      <TouchableOpacity
        style={[styles.optionButton,{ marginTop: 20, backgroundColor: '#4CAF50' }]}//提交按钮样式
        onPress={() => {}}
      >
        <Text style={[styles.optionText, { color: '#fff' }]}>下一题</Text>{/* 提交按钮文本 */}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({//样式表
  container: {//背景样式
    flex: 1,//占满整个屏幕
    backgroundColor: '#f5f5f5',//背景颜色
    justifyContent: 'center',//垂直居中
    padding: 20,//内边距
  },
  title: {//题目样式
    fontSize: 22,//字体大小
    fontWeight: 'bold',//字体加粗
    marginBottom: 30,//下边距
    textAlign: 'center',//文本居中
  },
  optionButton: {//选项按钮样式
    backgroundColor: '#fff',//背景颜色
    padding: 15,//内边距
    marginVertical: 8,//上下边距
    borderRadius: 8,//圆角
    borderWidth: 1,//边框宽度
    borderColor: '#ddd',//边框颜色
  },
  optionText: {//选项文本样式
    fontSize: 18,//字体大小
  },
});