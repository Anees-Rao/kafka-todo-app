const express = require('express');
const { publishEvent, connect } = require('./producer');

const app = express();
app.use(express.json());

let tasks = [];

// Connect to Kafka when the app starts
connect().catch(console.error);

// Get all tasks
app.get('/tasks', (req, res) => {
  res.json(tasks);
});

// Get a specific task
app.get('/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const task = tasks.find(t => t.id === id);
  
  if (!task) return res.status(404).json({ message: 'Task not found' });
  res.json(task);
});

app.post('/tasks', async (req, res) => {
  const task = { 
    id: tasks.length + 1, 
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  tasks.push(task);
  
  await publishEvent('task_created', task);
  res.status(201).json(task);
});

app.put('/tasks/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const taskIndex = tasks.findIndex(t => t.id === id);
  if (taskIndex === -1) return res.status(404).json({ message: 'Task not found' });

  const updatedTask = { 
    ...tasks[taskIndex], 
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  
  tasks[taskIndex] = updatedTask;
  await publishEvent('task_updated', updatedTask);
  res.json(updatedTask);
});

app.delete('/tasks/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const taskIndex = tasks.findIndex(t => t.id === id);
  if (taskIndex === -1) return res.status(404).json({ message: 'Task not found' });

  const deletedTask = tasks.splice(taskIndex, 1)[0];
  await publishEvent('task_deleted', deletedTask);
  res.json(deletedTask);
});

const PORT = 3000;
app.listen(PORT, () => console.log(`TodoList Service running on port ${PORT}`)); 