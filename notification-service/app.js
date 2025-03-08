const express = require('express');
const { startConsumer, stopConsumer } = require('./consumer');
const { initDb, getNotifications, markAsRead, markAllAsRead, closeDb } = require('./db');

const app = express();
app.use(express.json());

// Initialize database and start Kafka consumer
const init = async () => {
  try {
    await initDb();
    await startConsumer();
  } catch (error) {
    console.error('Initialization error:', error);
    process.exit(1);
  }
};

init();

// API routes
app.get('/notifications', async (req, res) => {
  try {
    const userId = parseInt(req.query.userId) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    
    const notifications = await getNotifications(userId, limit, offset);
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

app.put('/notifications/:id/read', async (req, res) => {
  try {
    const notificationId = req.params.id;
    const result = await markAsRead(notificationId);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

app.put('/notifications/read-all', async (req, res) => {
  try {
    const userId = parseInt(req.query.userId) || 1;
    const result = await markAllAsRead(userId);
    
    res.json({ 
      success: true, 
      message: `Marked ${result.changes} notifications as read` 
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// Graceful shutdown
const shutdown = async () => {
  try {
    await stopConsumer();
    await closeDb();
    console.log('Application shutdown complete');
  } catch (error) {
    console.error('Error during shutdown:', error);
  }
};

process.on('SIGINT', async () => {
  await shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await shutdown();
  process.exit(0);
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Notification Service running on port ${PORT}`)); 