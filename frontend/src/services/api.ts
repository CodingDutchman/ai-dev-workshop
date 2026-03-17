import { Task } from '../types';

const API_BASE_URL = 'http://localhost:3001/api';

export const fetchHello = async (): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/hello`);
  if (!response.ok) {
    throw new Error('Failed to fetch from API');
  }
  const data = await response.json();
  return data.message;
};

export const fetchTasks = async (): Promise<Task[]> => {
  const response = await fetch(`${API_BASE_URL}/tasks`);
  if (!response.ok) {
    throw new Error('Failed to fetch tasks');
  }
  return response.json();
};

export const createTask = async (title: string): Promise<Task> => {
  const response = await fetch(`${API_BASE_URL}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to create task');
  }
  return response.json();
};

export const completeTask = async (id: number): Promise<Task> => {
  const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'done' }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to complete task');
  }
  return response.json();
};

export const uncompleteTask = async (id: number): Promise<Task> => {
  const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'todo' }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to uncomplete task');
  }
  return response.json();
};
