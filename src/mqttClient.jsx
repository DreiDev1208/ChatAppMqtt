import initialize from "../lib"
import {URL, PORT, userName, password} from '../src/key';

// Initialize necessary libraries or configurations
initialize();

class MqttConnection {
  constructor() {
    this.client = null;
  }

  initializeClient() {
    const clientId = `ExpoClient-${Math.floor(Math.random() * 1000000)}`;
    this.client = new Paho.MQTT.Client(URL, PORT, clientId);
    this.client.onConnectionLost = this.onConnectionLost;
    this.client.onMessageArrived = this.onMessageArrived;
  }

  onConnect = () => {
    return new Promise((resolve, reject) => {
      if (!this.client) {
        this.initializeClient();
      }

      // Check if already connected or in the process of reconnecting
      if (this.client.isConnected() || this.isReconnecting) {
        console.log('Already connected or reconnecting to MQTT broker.');
        resolve();
        return;
      }

      const connectOptions = {
        timeout: 10000,
        onSuccess: () => {
          console.log('MQTT Connection Successful');
          this.isReconnecting = false; // Reset reconnection flag on success
          resolve();
        },
        useSSL: true,
        onFailure: (errorCode, errorMessage) => {
          console.error('MQTT Connection Failure:', errorCode, errorMessage);
          this.isReconnecting = false; // Reset reconnection flag on failure
          reject(new Error('MQTT Connection Failed'));
        },
        reconnect: true,
        keepAliveInterval: 60,
        cleanSession: true,
        userName: userName,
        password: password,
      };

      this.client.connect(connectOptions);
    });
  };

  onConnectionLost = (responseObject) => {
    if (responseObject.errorCode !== 0) {
      console.error('MQTT Connection Lost:', responseObject.errorMessage);
      // Check if not already connected or in the process of reconnecting
      if (!this.client.isConnected() && !this.isReconnecting) {
        this.isReconnecting = true; // Set reconnection flag
        this.initializeClient();
        this.onConnect()
          .then(() => {
            console.log('Reconnected to MQTT');
          })
          .catch((error) => {
            console.error('Reconnection failed:', error);
            this.isReconnecting = false; // Reset reconnection flag on failure
          });
      }
    }
  };

  subscribe = (topic, onMessage) => {
    if (this.client && this.client.isConnected()) {
      this.client.subscribe(topic, {
        onSuccess: () => console.log(`Subscribed to ${topic}`),
        onFailure: (e) => console.error(`Subscription failed: ${e}`),
      });
      this.client.onMessageArrived = onMessage;
    }
  };
  
  publish = (topic, message) => {
    if (this.client && this.client.isConnected()) {
      let mqttMessage = new Paho.MQTT.Message(message);
      mqttMessage.destinationName = topic;
      this.client.send(mqttMessage);
    }
  };

  onMessageArrived = (message) => {
    console.log(`Message received on topic ${message.destinationName}: ${message.payloadString}`);
  };

  connectAndInitialize = () => {
    return this.onConnect();
  };
}

const connection = new MqttConnection();
export { connection as MqttConnection };