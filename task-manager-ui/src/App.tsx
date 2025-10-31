import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

// TypeScript interfaces
interface Task {
  id: number;
  description: string;
  isCompleted: boolean;
  createdAt: string;
}

const API_BASE_URL = 'http://localhost:5100/api';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskDescription, setNewTaskDescription] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Fetch all tasks on component mount
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get<Task[]>(`${API_BASE_URL}/tasks`);
      setTasks(response.data);
    } catch (err) {
      setError('Failed to fetch tasks. Please ensure the backend is running.');
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTaskDescription.trim()) {
      setError('Task description cannot be empty');
      return;
    }

    try {
      setError('');
      const response = await axios.post<Task>(`${API_BASE_URL}/tasks`, {
        description: newTaskDescription
      });
      setTasks([...tasks, response.data]);
      setNewTaskDescription('');
    } catch (err) {
      setError('Failed to add task');
      console.error('Error adding task:', err);
    }
  };

  const toggleTaskCompletion = async (id: number, currentStatus: boolean) => {
    try {
      setError('');
      const response = await axios.put<Task>(`${API_BASE_URL}/tasks/${id}`, {
        isCompleted: !currentStatus
      });
      setTasks(tasks.map(task => 
        task.id === id ? response.data : task
      ));
    } catch (err) {
      setError('Failed to update task');
      console.error('Error updating task:', err);
    }
  };

  const deleteTask = async (id: number) => {
    try {
      setError('');
      await axios.delete(`${API_BASE_URL}/tasks/${id}`);
      setTasks(tasks.filter(task => task.id !== id));
    } catch (err) {
      setError('Failed to delete task');
      console.error('Error deleting task:', err);
    }
  };

  return (
    <div className="app">
      <div className="container">
        <h1>Task Manager</h1>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={addTask} className="add-task-form">
          <input
            type="text"
            placeholder="Enter a new task..."
            value={newTaskDescription}
            onChange={(e) => setNewTaskDescription(e.target.value)}
            className="task-input"
          />
          <button type="submit" className="add-button">
            Add Task
          </button>
        </form>

        {loading ? (
          <div className="loading">Loading tasks...</div>
        ) : (
          <div className="task-list">
            {tasks.length === 0 ? (
              <p className="no-tasks">No tasks yet. Add one to get started!</p>
            ) : (
              tasks.map((task) => (
                <div key={task.id} className={`task-item ${task.isCompleted ? 'completed' : ''}`}>
                  <div className="task-content">
                    <input
                      type="checkbox"
                      checked={task.isCompleted}
                      onChange={() => toggleTaskCompletion(task.id, task.isCompleted)}
                      className="task-checkbox"
                    />
                    <span className="task-description">{task.description}</span>
                  </div>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="delete-button"
                    aria-label="Delete task"
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        <div className="task-summary">
          Total: {tasks.length} | Completed: {tasks.filter(t => t.isCompleted).length}
        </div>
      </div>
    </div>
  );
};

export default App;