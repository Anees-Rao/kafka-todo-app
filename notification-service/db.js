const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Create a new database or open existing one
const dbPath = path.resolve(__dirname, 'notifications.db');
const db = new sqlite3.Database(dbPath);

// Initialize the database
const initDb = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS notifications (
          id TEXT PRIMARY KEY,
          userId INTEGER NOT NULL,
          message TEXT NOT NULL,
          taskId INTEGER NOT NULL,
          eventType TEXT NOT NULL,
          createdAt TEXT NOT NULL,
          isRead INTEGER DEFAULT 0
        )
      `, (err) => {
        if (err) {
          console.error('Error creating notifications table:', err);
          reject(err);
        } else {
          console.log('Notifications database initialized');
          resolve();
        }
      });
    });
  });
};

// Save a new notification
const saveNotification = (notification) => {
  return new Promise((resolve, reject) => {
    const id = uuidv4();
    const { userId, message, taskId, eventType, createdAt } = notification;
    
    db.run(
      `INSERT INTO notifications (id, userId, message, taskId, eventType, createdAt, isRead) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, message, taskId, eventType, createdAt, 0],
      function(err) {
        if (err) {
          console.error('Error saving notification:', err);
          reject(err);
        } else {
          resolve({ id, ...notification, isRead: 0 });
        }
      }
    );
  });
};

// Get notifications for a user
const getNotifications = (userId, limit = 20, offset = 0) => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT * FROM notifications 
       WHERE userId = ? 
       ORDER BY createdAt DESC 
       LIMIT ? OFFSET ?`,
      [userId, limit, offset],
      (err, rows) => {
        if (err) {
          console.error('Error fetching notifications:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      }
    );
  });
};

// Mark notification as read
const markAsRead = (notificationId) => {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE notifications SET isRead = 1 WHERE id = ?`,
      [notificationId],
      function(err) {
        if (err) {
          console.error('Error marking notification as read:', err);
          reject(err);
        } else {
          resolve({ success: true, changes: this.changes });
        }
      }
    );
  });
};

// Mark all notifications as read for a user
const markAllAsRead = (userId) => {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE notifications SET isRead = 1 WHERE userId = ?`,
      [userId],
      function(err) {
        if (err) {
          console.error('Error marking all notifications as read:', err);
          reject(err);
        } else {
          resolve({ success: true, changes: this.changes });
        }
      }
    );
  });
};

// Close database connection
const closeDb = () => {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
        reject(err);
      } else {
        console.log('Database connection closed');
        resolve();
      }
    });
  });
};

module.exports = {
  initDb,
  saveNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  closeDb
}; 