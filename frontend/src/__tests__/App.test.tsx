import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { completeTask, createTask, fetchTasks, uncompleteTask } from '../services/api';
import { Task } from '../types';

jest.mock('../services/api');

const mockFetchTasks = fetchTasks as jest.MockedFunction<typeof fetchTasks>;
const mockCreateTask = createTask as jest.MockedFunction<typeof createTask>;
const mockCompleteTask = completeTask as jest.MockedFunction<typeof completeTask>;
const mockUncompleteTask = uncompleteTask as jest.MockedFunction<typeof uncompleteTask>;

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: 1,
  title: 'Buy groceries',
  description: '',
  status: 'todo',
  priority: 'medium',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

beforeEach(() => {
  // Don't set a default for fetchTasks - let each test control it
  mockCreateTask.mockResolvedValue(makeTask());
  mockCompleteTask.mockResolvedValue(makeTask({ status: 'done' }));
  mockUncompleteTask.mockResolvedValue(makeTask({ status: 'todo' }));
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('TT-001: Add Task', () => {
  describe('Page renders correctly', () => {
    it('renders the task input and add button', async () => {
      mockFetchTasks.mockResolvedValue([]);
      render(<App />);
      expect(screen.getByPlaceholderText(/add a new task/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
    });

    it('shows an empty state message when no tasks exist', async () => {
      mockFetchTasks.mockResolvedValue([]);
      render(<App />);
      expect(await screen.findByText(/no tasks yet/i)).toBeInTheDocument();
    });

    it('displays tasks that already exist on mount', async () => {
      mockFetchTasks.mockResolvedValue([makeTask({ title: 'Existing task' })]);
      render(<App />);
      expect(await screen.findByText('Existing task')).toBeInTheDocument();
    });
  });

  describe('AC1: Valid text + submit → task added to list', () => {
    it('adds the new task to the list after submission', async () => {
      const user = userEvent.setup();
      mockCreateTask.mockResolvedValue(makeTask({ title: 'Buy groceries' }));
      render(<App />);
      await user.type(screen.getByPlaceholderText(/add a new task/i), 'Buy groceries');
      await user.click(screen.getByRole('button', { name: /add/i }));
      expect(await screen.findByText('Buy groceries')).toBeInTheDocument();
    });

    it('clears the input after a task is successfully added', async () => {
      const user = userEvent.setup();
      render(<App />);
      const input = screen.getByPlaceholderText(/add a new task/i);
      await user.type(input, 'Buy groceries');
      await user.click(screen.getByRole('button', { name: /add/i }));
      await waitFor(() => expect(input).toHaveValue(''));
    });

    it('calls createTask with trimmed input text', async () => {
      const user = userEvent.setup();
      render(<App />);
      await user.type(screen.getByPlaceholderText(/add a new task/i), '  Buy groceries  ');
      await user.click(screen.getByRole('button', { name: /add/i }));
      expect(mockCreateTask).toHaveBeenCalledWith('Buy groceries');
    });
  });

  describe('AC2: New task defaults to Active status', () => {
    it('displays the Active badge on a newly added task', async () => {
      const user = userEvent.setup();
      mockFetchTasks.mockClear();
      mockFetchTasks.mockResolvedValue([]);
      mockCreateTask.mockResolvedValue(makeTask({ title: 'Buy groceries', status: 'todo' }));
      render(<App />);
      await user.type(screen.getByPlaceholderText(/add a new task/i), 'Buy groceries');
      await user.click(screen.getByRole('button', { name: /add/i }));
      // Look for the Active badge specifically
      const activeBadge = await screen.findByText('Active', { selector: '.bg-blue-100' });
      expect(activeBadge).toBeInTheDocument();
    });

    it('does not display Completed status on a newly added task', async () => {
      const user = userEvent.setup();
      mockFetchTasks.mockClear();
      mockFetchTasks.mockResolvedValue([]);
      mockCreateTask.mockResolvedValue(makeTask({ title: 'Buy groceries', status: 'todo' }));
      render(<App />);
      await user.type(screen.getByPlaceholderText(/add a new task/i), 'Buy groceries');
      await user.click(screen.getByRole('button', { name: /add/i }));
      // Wait for the task to appear first
      await screen.findByText('Buy groceries');
      // Check there's no Completed badge
      expect(
        screen.queryByText('Completed', { selector: '.bg-green-100' })
      ).not.toBeInTheDocument();
    });
  });

  describe('AC3: Empty or whitespace input → no task created', () => {
    it('does not call createTask when input is empty', async () => {
      const user = userEvent.setup();
      render(<App />);
      await user.click(screen.getByRole('button', { name: /add/i }));
      expect(mockCreateTask).not.toHaveBeenCalled();
    });

    it('does not call createTask when input is only whitespace', async () => {
      const user = userEvent.setup();
      render(<App />);
      await user.type(screen.getByPlaceholderText(/add a new task/i), '   ');
      await user.click(screen.getByRole('button', { name: /add/i }));
      expect(mockCreateTask).not.toHaveBeenCalled();
    });
  });
});

describe('TT-002: Mark Task Complete', () => {
  describe('AC1: Marking a task complete updates its status to Completed', () => {
    it('calls completeTask with the correct task id', async () => {
      const user = userEvent.setup();
      mockFetchTasks.mockResolvedValue([makeTask({ id: 42, title: 'Fix bug' })]);
      mockCompleteTask.mockResolvedValue(makeTask({ id: 42, title: 'Fix bug', status: 'done' }));
      render(<App />);
      await screen.findByText('Fix bug');
      await user.click(screen.getByRole('button', { name: /mark as complete/i }));
      expect(mockCompleteTask).toHaveBeenCalledWith(42);
    });

    it('updates the task status badge from Active to Completed', async () => {
      const user = userEvent.setup();
      mockFetchTasks.mockClear();
      mockFetchTasks.mockResolvedValue([makeTask({ title: 'Fix bug' })]);
      mockCompleteTask.mockResolvedValue(makeTask({ title: 'Fix bug', status: 'done' }));
      render(<App />);
      // Verify initial state - should have Active badge
      const activeBadge = await screen.findByText('Active', { selector: '.bg-blue-100' });
      expect(activeBadge).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /mark as complete/i }));

      // Verify final state - should have Completed badge and no Active badge
      const completedBadge = await screen.findByText('Completed', { selector: '.bg-green-100' });
      expect(completedBadge).toBeInTheDocument();
      expect(screen.queryByText('Active', { selector: '.bg-blue-100' })).not.toBeInTheDocument();
    });
  });

  describe('AC2: Completed state is clearly shown in the UI', () => {
    it('shows the Completed badge after a task is marked done', async () => {
      const user = userEvent.setup();
      mockFetchTasks.mockClear();
      mockFetchTasks.mockResolvedValue([makeTask({ title: 'Fix bug' })]);
      mockCompleteTask.mockResolvedValue(makeTask({ title: 'Fix bug', status: 'done' }));
      render(<App />);
      await screen.findByText('Fix bug');
      await user.click(screen.getByRole('button', { name: /mark as complete/i }));
      // Look for the Completed badge specifically
      const completedBadge = await screen.findByText('Completed', { selector: '.bg-green-100' });
      expect(completedBadge).toBeInTheDocument();
    });

    it('renders tasks already loaded as Completed with the Completed badge', async () => {
      mockFetchTasks.mockClear();
      mockFetchTasks.mockResolvedValue([makeTask({ title: 'Already done', status: 'done' })]);
      render(<App />);
      expect(await screen.findByText('Completed')).toBeInTheDocument();
      // Check that there's no Active badge on the task (not counting filter buttons)
      expect(screen.queryByText('Active', { selector: '.bg-blue-100' })).not.toBeInTheDocument();
    });

    it('applies strikethrough styling to a completed task title', async () => {
      const user = userEvent.setup();
      mockFetchTasks.mockResolvedValue([makeTask({ title: 'Fix bug' })]);
      mockCompleteTask.mockResolvedValue(makeTask({ title: 'Fix bug', status: 'done' }));
      render(<App />);
      await screen.findByText('Fix bug');
      await user.click(screen.getByRole('button', { name: /mark as complete/i }));
      const title = await screen.findByText('Fix bug');
      expect(title).toHaveClass('line-through');
    });
  });

  describe('AC3: A completed task remains completed without further action', () => {
    it('keeps the Completed badge when no action is taken', async () => {
      mockFetchTasks.mockResolvedValue([makeTask({ title: 'Already done', status: 'done' })]);
      render(<App />);
      expect(await screen.findByText('Completed')).toBeInTheDocument();
    });

    it('shows Mark as incomplete button for a completed task', async () => {
      mockFetchTasks.mockResolvedValue([makeTask({ title: 'Already done', status: 'done' })]);
      render(<App />);
      expect(
        await screen.findByRole('button', { name: /mark as incomplete/i })
      ).toBeInTheDocument();
    });

    it('calls uncompleteTask and restores Active status when toggled back', async () => {
      const user = userEvent.setup();

      // Clear any existing mock and set up the completed task
      mockFetchTasks.mockClear();
      const completedTask = makeTask({ title: 'Fix bug', status: 'done' });
      mockFetchTasks.mockResolvedValue([completedTask]);
      mockUncompleteTask.mockResolvedValue(makeTask({ title: 'Fix bug', status: 'todo' }));

      render(<App />);

      // Wait for the task to appear first
      expect(await screen.findByText('Fix bug')).toBeInTheDocument();

      // Check if it shows as completed - look for the completed task badge
      const completedBadge = screen.getByText('Completed', { selector: '.bg-green-100' });
      expect(completedBadge).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /mark as incomplete/i })).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /mark as incomplete/i }));
      expect(mockUncompleteTask).toHaveBeenCalledWith(1);

      // Look for the Active badge specifically after uncompleting
      const activeBadge = await screen.findByText('Active', { selector: '.bg-blue-100' });
      expect(activeBadge).toBeInTheDocument();
      expect(
        screen.queryByText('Completed', { selector: '.bg-green-100' })
      ).not.toBeInTheDocument();
    });
  });
});

describe('TT-003: Filter Tasks by Status', () => {
  describe('Filter UI Components', () => {
    it('renders filter buttons for All, Active, and Completed', async () => {
      render(<App />);
      expect(await screen.findByRole('button', { name: /all/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /active/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /completed/i })).toBeInTheDocument();
    });

    it('shows Filter by status label', async () => {
      render(<App />);
      expect(await screen.findByText(/filter by status/i)).toBeInTheDocument();
    });

    it('highlights the active filter button', async () => {
      render(<App />);
      const allButton = await screen.findByRole('button', { name: /all/i });
      expect(allButton).toHaveClass('bg-indigo-600', 'text-white');
    });
  });

  describe('AC1: All filter shows all tasks', () => {
    it('displays both active and completed tasks when All filter is selected', async () => {
      mockFetchTasks.mockResolvedValue([
        makeTask({ id: 1, title: 'Active task', status: 'todo' }),
        makeTask({ id: 2, title: 'Completed task', status: 'done' }),
      ]);
      render(<App />);

      expect(await screen.findByText('Active task')).toBeInTheDocument();
      expect(screen.getByText('Completed task')).toBeInTheDocument();
    });

    it('shows correct task count for All filter', async () => {
      mockFetchTasks.mockResolvedValue([
        makeTask({ id: 1, title: 'Task 1', status: 'todo' }),
        makeTask({ id: 2, title: 'Task 2', status: 'done' }),
      ]);
      render(<App />);

      expect(await screen.findByText(/2 tasks/i)).toBeInTheDocument();
    });
  });

  describe('AC2: Active filter shows only active tasks', () => {
    it('displays only active tasks when Active filter is selected', async () => {
      const user = userEvent.setup();
      mockFetchTasks.mockResolvedValue([
        makeTask({ id: 1, title: 'Active task 1', status: 'todo' }),
        makeTask({ id: 2, title: 'Active task 2', status: 'in-progress' }),
        makeTask({ id: 3, title: 'Completed task', status: 'done' }),
      ]);
      render(<App />);

      await user.click(screen.getByRole('button', { name: /active/i }));

      expect(await screen.findByText('Active task 1')).toBeInTheDocument();
      expect(screen.getByText('Active task 2')).toBeInTheDocument();
      expect(screen.queryByText('Completed task')).not.toBeInTheDocument();
    });

    it('shows correct task count for Active filter', async () => {
      const user = userEvent.setup();
      mockFetchTasks.mockResolvedValue([
        makeTask({ id: 1, title: 'Active task', status: 'todo' }),
        makeTask({ id: 2, title: 'Completed task', status: 'done' }),
      ]);
      render(<App />);

      await user.click(screen.getByRole('button', { name: /active/i }));

      expect(await screen.findByText(/1 task.*\(active\)/i)).toBeInTheDocument();
    });

    it('highlights Active filter button when selected', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.click(screen.getByRole('button', { name: /active/i }));

      const activeButton = screen.getByRole('button', { name: /active/i });
      expect(activeButton).toHaveClass('bg-indigo-600', 'text-white');
    });
  });

  describe('AC3: Completed filter shows only completed tasks', () => {
    it('displays only completed tasks when Completed filter is selected', async () => {
      const user = userEvent.setup();
      mockFetchTasks.mockResolvedValue([
        makeTask({ id: 1, title: 'Active task', status: 'todo' }),
        makeTask({ id: 2, title: 'Completed task 1', status: 'done' }),
        makeTask({ id: 3, title: 'Completed task 2', status: 'done' }),
      ]);
      render(<App />);

      await user.click(screen.getByRole('button', { name: /completed/i }));

      expect(await screen.findByText('Completed task 1')).toBeInTheDocument();
      expect(screen.getByText('Completed task 2')).toBeInTheDocument();
      expect(screen.queryByText('Active task')).not.toBeInTheDocument();
    });

    it('shows correct task count for Completed filter', async () => {
      const user = userEvent.setup();
      mockFetchTasks.mockResolvedValue([
        makeTask({ id: 1, title: 'Active task', status: 'todo' }),
        makeTask({ id: 2, title: 'Completed task', status: 'done' }),
      ]);
      render(<App />);

      await user.click(screen.getByRole('button', { name: /completed/i }));

      expect(await screen.findByText(/1 task.*\(completed\)/i)).toBeInTheDocument();
    });

    it('highlights Completed filter button when selected', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.click(screen.getByRole('button', { name: /completed/i }));

      const completedButton = screen.getByRole('button', { name: /completed/i });
      expect(completedButton).toHaveClass('bg-indigo-600', 'text-white');
    });
  });

  describe('AC4: Empty state messages for filtered results', () => {
    it('shows appropriate empty state when no active tasks exist', async () => {
      const user = userEvent.setup();
      mockFetchTasks.mockResolvedValue([
        makeTask({ id: 1, title: 'Completed task', status: 'done' }),
      ]);
      render(<App />);

      await user.click(screen.getByRole('button', { name: /active/i }));

      expect(await screen.findByText(/no active tasks/i)).toBeInTheDocument();
    });

    it('shows appropriate empty state when no completed tasks exist', async () => {
      const user = userEvent.setup();
      mockFetchTasks.mockResolvedValue([makeTask({ id: 1, title: 'Active task', status: 'todo' })]);
      render(<App />);

      await user.click(screen.getByRole('button', { name: /completed/i }));

      expect(await screen.findByText(/no completed tasks yet/i)).toBeInTheDocument();
    });

    it('shows general empty state when no tasks exist at all', async () => {
      mockFetchTasks.mockResolvedValue([]);
      render(<App />);

      expect(await screen.findByText(/no tasks yet/i)).toBeInTheDocument();
    });
  });

  describe('Filter interaction behavior', () => {
    it('maintains filter selection when new tasks are added', async () => {
      const user = userEvent.setup();
      mockFetchTasks.mockResolvedValue([makeTask({ title: 'Existing task', status: 'todo' })]);
      mockCreateTask.mockResolvedValue(makeTask({ id: 2, title: 'New task', status: 'todo' }));
      render(<App />);

      await user.click(screen.getByRole('button', { name: /active/i }));
      await user.type(screen.getByPlaceholderText(/add a new task/i), 'New task');
      await user.click(screen.getByRole('button', { name: /add/i }));

      expect(await screen.findByText('Existing task')).toBeInTheDocument();
      expect(screen.getByText('New task')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /active/i })).toHaveClass('bg-indigo-600');
    });

    it('updates filtered view when task status changes', async () => {
      const user = userEvent.setup();
      mockFetchTasks.mockResolvedValue([makeTask({ title: 'Task to complete', status: 'todo' })]);
      mockCompleteTask.mockResolvedValue(makeTask({ title: 'Task to complete', status: 'done' }));
      render(<App />);

      await user.click(screen.getByRole('button', { name: /active/i }));
      expect(await screen.findByText('Task to complete')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /mark as complete/i }));

      expect(screen.queryByText('Task to complete')).not.toBeInTheDocument();
      expect(await screen.findByText(/no active tasks/i)).toBeInTheDocument();
    });

    it('switches between filters correctly', async () => {
      const user = userEvent.setup();
      mockFetchTasks.mockResolvedValue([
        makeTask({ id: 1, title: 'Active task', status: 'todo' }),
        makeTask({ id: 2, title: 'Completed task', status: 'done' }),
      ]);
      render(<App />);

      expect(await screen.findByText('Active task')).toBeInTheDocument();
      expect(screen.getByText('Completed task')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /active/i }));
      expect(screen.getByText('Active task')).toBeInTheDocument();
      expect(screen.queryByText('Completed task')).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /completed/i }));
      expect(screen.queryByText('Active task')).not.toBeInTheDocument();
      expect(screen.getByText('Completed task')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /all/i }));
      expect(screen.getByText('Active task')).toBeInTheDocument();
      expect(screen.getByText('Completed task')).toBeInTheDocument();
    });
  });
});
