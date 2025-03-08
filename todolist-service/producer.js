const { Kafka } = require('kafkajs');

const kafka = new Kafka({ clientId: 'todolist', brokers: ['localhost:9092'] });
const producer = kafka.producer();

// Connect once at startup
let connected = false;
const connect = async () => {
  if (!connected) {
    await producer.connect();
    connected = true;
    console.log('Producer connected to Kafka');
  }
};

// Graceful shutdown
const disconnect = async () => {
  if (connected) {
    await producer.disconnect();
    connected = false;
    console.log('Producer disconnected from Kafka');
  }
};

const publishEvent = async (eventType, task) => {
  try {
    if (!connected) await connect();
    
    await producer.send({
      topic: 'task-events',
      messages: [{ 
        key: eventType, 
        value: JSON.stringify({
          eventType,
          task,
          timestamp: new Date().toISOString()
        }) 
      }],
    });
    
    console.log(`Event published: ${eventType} for task ID: ${task.id}`);
    return true;
  } catch (error) {
    console.error('Error publishing event:', error);
    return false;
  }
};

// Handle process termination
process.on('SIGINT', async () => {
  await disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnect();
  process.exit(0);
});

module.exports = { publishEvent, connect, disconnect }; 