const { Kafka } = require('kafkajs');
const { saveNotification } = require('./db');

const kafka = new Kafka({ clientId: 'notification-service', brokers: ['localhost:9092'] });
const consumer = kafka.consumer({ groupId: 'notification-group' });

const generateNotificationMessage = (eventType, task) => {
  switch (eventType) {
    case 'task_created':
      return `New task created: "${task.title}"`;
    case 'task_updated':
      return `Task updated: "${task.title}"`;
    case 'task_deleted':
      return `Task deleted: "${task.title}"`;
    default:
      return `Task event occurred: ${eventType}`;
  }
};

const startConsumer = async () => {
  try {
    await consumer.connect();
    console.log('Consumer connected to Kafka');
    
    await consumer.subscribe({ topic: 'task-events', fromBeginning: true });
    
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const eventType = message.key.toString();
          const eventData = JSON.parse(message.value.toString());
          const task = eventData.task;
          
          console.log(`Received ${eventType} event for task ID: ${task.id}`);
          
          const notificationMessage = generateNotificationMessage(eventType, task);
          
          // Save notification to database
          await saveNotification({
            userId: task.userId || 1, // Default to user 1 if not specified
            message: notificationMessage,
            taskId: task.id,
            eventType,
            createdAt: new Date().toISOString()
          });
          
          console.log(`Notification saved: ${notificationMessage}`);
        } catch (error) {
          console.error('Error processing message:', error);
        }
      },
    });
  } catch (error) {
    console.error('Error starting consumer:', error);
  }
};

const stopConsumer = async () => {
  try {
    await consumer.disconnect();
    console.log('Consumer disconnected from Kafka');
  } catch (error) {
    console.error('Error disconnecting consumer:', error);
  }
};

// Handle process termination
process.on('SIGINT', async () => {
  await stopConsumer();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await stopConsumer();
  process.exit(0);
});

module.exports = { startConsumer, stopConsumer }; 