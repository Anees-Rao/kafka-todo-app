# Kafka TodoList Application

This project demonstrates a microservices architecture using Kafka for event-driven communication between a TodoList service and a Notification service.

This application consists of two microservices:

1. `TodoList Service`: Manages tasks (create, read, update, delete) and publishes events to Kafka when tasks are modified.
2. `Notification Service`: Consumes task events from Kafka, generates notifications, and provides APIs to retrieve and manage these notifications.
3. `docker-compose.yml`: The Docker Compose file for the application for zookeeper and kafka

## Project Structure

/kafka-todo-app
│── /todolist-service # Service for managing todo tasks
│ ├── producer.js # Kafka producer setup
│ ├── app.js # Main application logic
│ └── package.json # Dependencies
│── /notification-service # Service for handling notifications
│ ├── consumer.js # Kafka consumer setup
│ ├── db.js # Database operations
│ ├── app.js # Notification API
│ └── package.json # Dependencies
│── docker-compose.yml # Kafka and Zookeeper setup
│── README.md # Project documentation


## Technologies Used

`Backend`: Node.js (Express.js)
`Kafka`: Apache Kafka
`Database`: SQLite
`Containerization`: Docker & Docker Compose
-
## Setup Instructions

### 1. Start Kafka and Zookeeper

```bash
docker-compose up -d
```

This will start Kafka and Zookeeper in Docker containers. You can verify they're running with:

```bash
docker ps
```

### 2. Run the TodoList Service

```bash
cd todolist-service
npm install
npm start
```

The TodoList service will run on http://localhost:3000.

### 3. Install dependencies and start Notification Service

```bash
cd notification-service
npm install
npm start
```

## API Endpoints

### TodoList Service (http://localhost:3000)

- `GET /tasks` - Get all tasks
- `GET /tasks/:id` - Get a specific task
- `POST /tasks` - Create a new task
  - Body: `{ "title": "Task title", "description": "Task description", "userId": 1 }`
- `PUT /tasks/:id` - Update a task
  - Body: `{ "title": "Updated title", "description": "Updated description" }`
- `DELETE /tasks/:id` - Delete a task

### Notification Service (http://localhost:3001)

- `GET /notifications?userId=1&limit=20&offset=0` - Get notifications for a user
- `PUT /notifications/:id/read` - Mark a notification as read
- `PUT /notifications/read-all?userId=1` - Mark all notifications as read for a user

## How It Works

### Event Flow

1. User creates/updates/deletes a task via TodoList API
2. TodoList service publishes an event to Kafka
3. Notification service consumes the event
4. Notification service creates a notification record
5. Users can view their notifications via the Notification API

### Kafka Integration

#### Producer (TodoList Service)
- Connects to Kafka on service startup
- Publishes events with structured data including event type, task details, and timestamp
- Handles connection management and graceful shutdown
- Provides error handling for failed event publishing

#### Consumer (Notification Service)
- Subscribes to the 'task-events' topic
- Processes incoming messages and extracts event data
- Generates human-readable notification messages based on event type
- Stores notifications in a SQLite database
- Handles connection management and graceful shutdown

### Database Schema

The Notification service uses SQLite with the following schema:

```sql
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  userId INTEGER NOT NULL,
  message TEXT NOT NULL,
  taskId INTEGER NOT NULL,
  eventType TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  isRead INTEGER DEFAULT 0
)
```

## Testing the Application

### 1. Create a Task

```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Learn Kafka", "description": "Integrate Kafka with TodoList app", "userId": 1}'
```

Expected response:
```json
{
  "id": 1,
  "title": "Learn Kafka",
  "description": "Integrate Kafka with TodoList app",
  "userId": 1,
  "createdAt": "2023-05-15T10:30:00.000Z",
  "updatedAt": "2023-05-15T10:30:00.000Z"
}
```

In the TodoList service terminal, you should see:
```
Event published: task_created for task ID: 1
```

In the Notification service terminal, you should see:
```
Received task_created event for task ID: 1
Notification saved: New task created: "Learn Kafka"
```

### 2. Update a Task

```bash
curl -X PUT http://localhost:3000/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"title": "Master Kafka", "description": "Successfully integrate Kafka with TodoList app"}'
```

Expected response:
```json
{
  "id": 1,
  "title": "Master Kafka",
  "description": "Successfully integrate Kafka with TodoList app",
  "userId": 1,
  "createdAt": "2023-05-15T10:30:00.000Z",
  "updatedAt": "2023-05-15T10:35:00.000Z"
}
```

### 3. Delete a Task

```bash
curl -X DELETE http://localhost:3000/tasks/1
```

Expected response:
```json
{
  "id": 1,
  "title": "Master Kafka",
  "description": "Successfully integrate Kafka with TodoList app",
  "userId": 1,
  "createdAt": "2023-05-15T10:30:00.000Z",
  "updatedAt": "2023-05-15T10:35:00.000Z"
}
```

### 4. View Notifications

```bash
curl http://localhost:3001/notifications?userId=1
```

Expected response:
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": 1,
    "message": "Task deleted: \"Master Kafka\"",
    "taskId": 1,
    "eventType": "task_deleted",
    "createdAt": "2023-05-15T10:40:00.000Z",
    "isRead": 0
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "userId": 1,
    "message": "Task updated: \"Master Kafka\"",
    "taskId": 1,
    "eventType": "task_updated",
    "createdAt": "2023-05-15T10:35:00.000Z",
    "isRead": 0
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "userId": 1,
    "message": "New task created: \"Learn Kafka\"",
    "taskId": 1,
    "eventType": "task_created",
    "createdAt": "2023-05-15T10:30:00.000Z",
    "isRead": 0
  }
]
```

### 5. Mark a Notification as Read

```bash
curl -X PUT http://localhost:3001/notifications/550e8400-e29b-41d4-a716-446655440000/read
```

Expected response:
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

### 6. Mark All Notifications as Read

```bash
curl -X PUT http://localhost:3001/notifications/read-all?userId=1
```

Expected response:
```json
{
  "success": true,
  "message": "Marked 3 notifications as read"
}
```
`Postman Collection` - https://documenter.getpostman.com/view/25896075/2sAYdoEnUU

## Error Handling

Both services implement error handling for:
- Kafka connection issues
- Message processing failures
- Database operation errors
- API request errors

The error handling includes:
- Logging errors to the console
- Returning appropriate HTTP status codes for API errors
- Graceful shutdown of connections on process termination

## Scalability Considerations

This implementation can be scaled by:
- Adding more consumer instances for the Notification service
- Increasing Kafka partitions for the 'task-events' topic
- Implementing a more robust database solution for production use
- Using a load balancer for distributing API requests

## Security Considerations

For a production environment, consider:
- Adding authentication to both services
- Implementing SSL/TLS for Kafka connections
- Adding rate limiting to the APIs
- Implementing proper user authorization for notifications
- Securing the database with proper access controls

## Troubleshooting

### Common Issues

1. **Kafka Connection Errors**
   - Ensure Kafka and Zookeeper containers are running: `docker ps`
   - Check Kafka logs: `docker logs kafka-todo-app_kafka_1`
   - Verify network connectivity between services and Kafka

2. **Database Errors**
   - Check if the SQLite database file exists in the notification-service directory
   - Ensure proper permissions for the database file
   - Verify SQLite is installed correctly

3. **API Errors**
   - Verify both services are running on their expected ports
   - Check the console logs for error messages
   - Ensure JSON payloads are properly formatted

### Debugging Tips

1. **Kafka Issues**
   - Use Kafka tools to inspect topics: `docker exec -it kafka-todo-app_kafka_1 kafka-topics --list --bootstrap-server localhost:9092`
   - Check consumer groups: `docker exec -it kafka-todo-app_kafka_1 kafka-consumer-groups --list --bootstrap-server localhost:9092`

2. **Notification Service**
   - Inspect the SQLite database directly:
     ```bash
     cd notification-service
     sqlite3 notifications.db
     .tables
     SELECT * FROM notifications;
     .exit
     ```

3. **TodoList Service**
   - Check in-memory task storage by calling `GET /tasks`

## Future Enhancements

Potential improvements include:
- Real-time notification delivery using WebSockets
- Email or push notification integration
- More sophisticated notification types and templates
- User preference settings for notifications
- Notification analytics and metrics
- Persistent storage for tasks
- User authentication and authorization
- Admin dashboard for monitoring

## Architecture Diagram

```
┌─────────────────┐                  ┌─────────────────┐
│                 │                  │                 │
│  TodoList API   │                  │ Notification API│
│  (Port 3000)    │                  │  (Port 3001)    │
│                 │                  │                 │
└────────┬────────┘                  └────────┬────────┘
         │                                    │
         │                                    │
         ▼                                    ▼
┌─────────────────┐                  ┌─────────────────┐
│                 │     publish      │                 │
│ Kafka Producer  ├─────events─────► │ Kafka Consumer  │
│                 │                  │                 │
└─────────────────┘                  └────────┬────────┘
                                              │
                                              │
                                              ▼
                                     ┌─────────────────┐
                                     │                 │
                                     │ SQLite Database │
                                     │                 │
                                     └─────────────────┘
```

## Contributors

- Anees Ur Rehman - Initial work

## Acknowledgments

- Kafka documentation
- Express.js community
- SQLite documentation

