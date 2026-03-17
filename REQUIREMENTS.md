# Simple Task Tracker Requirements

## Product Overview
The Simple Task Tracker enables users to create tasks, mark tasks as complete, and filter tasks by status so they can manage day-to-day work clearly.

## Scope
### In Scope
- Add a new task
- Mark an existing task as complete
- Filter tasks by status (`All`, `Active`, `Completed`)

### Out of Scope
- User authentication
- Task editing and deletion
- Due dates, priorities, tags, or reminders
- Multi-user collaboration

## User Stories

### Story 1: Add Task
**Story ID:** TT-001  
**Title:** Create a new task  
**Priority:** High  
**Size:** M

**User Story**  
As a task tracker user, I want to add a new task, so that I can keep track of work I need to do.

**Acceptance Criteria (Given/When/Then)**
1. **Given** I am on the task tracker page, **when** I enter valid task text and submit, **then** a new task is added to the task list.
2. **Given** I add a new task, **when** it appears in the list, **then** its default status is `Active` (not completed).
3. **Given** the add-task input is empty or only whitespace, **when** I try to submit, **then** the system does not create a task.

---

### Story 2: Mark Task Complete
**Story ID:** TT-002  
**Title:** Complete an active task  
**Priority:** High  
**Size:** S

**User Story**  
As a task tracker user, I want to mark a task as complete, so that I can see what I have finished.

**Acceptance Criteria (Given/When/Then)**
1. **Given** I have at least one `Active` task, **when** I mark a task as complete, **then** that task status updates to `Completed`.
2. **Given** I mark a task as complete, **when** the task list refreshes in the UI, **then** the completed state is clearly shown.
3. **Given** a task is marked as `Completed`, **when** I take no further action, **then** the task remains completed.

---

### Story 3: Filter Tasks by Status
**Story ID:** TT-003  
**Title:** View tasks by status  
**Priority:** High  
**Size:** M

**User Story**  
As a task tracker user, I want to filter tasks by status, so that I can focus on active work or review completed work.

**Acceptance Criteria (Given/When/Then)**
1. **Given** tasks exist with mixed statuses, **when** I select the `All` filter, **then** all tasks are displayed.
2. **Given** tasks exist with mixed statuses, **when** I select the `Active` filter, **then** only tasks with `Active` status are displayed.
3. **Given** tasks exist with mixed statuses, **when** I select the `Completed` filter, **then** only tasks with `Completed` status are displayed.
4. **Given** a selected filter has no matching tasks, **when** the list renders, **then** the system displays an empty-state message.

## Definition of Done
- All three user stories are implemented and pass acceptance criteria.
- Core task flows (add, complete, filter) are testable in the UI.
- Product owner review confirms requirements are met.
