import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet } from 'react-native';
import { MqttConnection } from './src/mqttClient';

export default function App() {
  const [name, setName] = useState(''); 
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<string[]>([]);
  const [topic, setTopic] = useState('chat/room1');

  useEffect(() => {
    MqttConnection.connectAndInitialize().then(() => {
      MqttConnection.subscribe(topic, (msg: { payloadString: any; }) => {
        // Assuming the message format is "name: message"
        const messageContent = msg.payloadString;
        // Split the message into name and the actual message
        const separatorIndex = messageContent.indexOf(':');
        if (separatorIndex !== -1) {
          const senderName = messageContent.substring(0, separatorIndex).trim();
          const messageText = messageContent.substring(separatorIndex + 1).trim();
          const formattedMessage = `${senderName}: ${messageText}`;
          setMessages((prevMessages) => [...prevMessages, formattedMessage]);
        } else {  
          setMessages((prevMessages) => [...prevMessages, messageContent]);
        }
      });
    });
  }, [topic]);

  const handleSend = () => {
    if (message.trim()) {
      const fullMessage = `${name}: ${message}`;
      MqttConnection.publish(topic, fullMessage);
      setMessage('');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>MQTT Chat</Text>
      <TextInput 
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Enter your name"
      />
      <TextInput 
        style={styles.input}
        value={topic}
        onChangeText={setTopic}
        placeholder="Enter the topic you want to join"
      />
      <FlatList
  data={messages}
  renderItem={({ item }) => {
    // Check if the message is from the current user
    const isFromUser = item.startsWith(`${name}:`);
    const displayMessage = isFromUser ? item.substring(name.length + 1).trim() : item;
    return (
      <View style={isFromUser ? styles.userMessageContainer : styles.otherMessageContainer}>
        <Text style={styles.message}>{displayMessage}</Text>
      </View>
    );
  }}
  keyExtractor={(item, index) => index.toString()}
/>
      <TextInput
        style={styles.input}
        value={message}
        onChangeText={setMessage}
        placeholder="Enter message"
      />
      <Button 
        title="Send" 
        onPress={handleSend}
        disabled = {name === '' && message === ''}
        />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 20,  
  },
  message: {
    fontSize: 18,
    marginVertical: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
    marginVertical: 5,
    backgroundColor: '#DCF8C6', 
    borderRadius: 20,
    padding: 10,
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
    marginVertical: 5,
    backgroundColor: '#ECECEC', 
    borderRadius: 20,
    padding: 10,
  },
});