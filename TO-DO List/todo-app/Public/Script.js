class TodoApp {
    constructor() {
        this.taskInput = document.getElementById('taskInput');
        this.addBtn = document.getElementById('addBtn');
        this.taskList = document.getElementById('taskList');
        this.emptyState = document.getElementById('emptyState');
        this.pendingCount = document.getElementById('pendingCount');
        this.completedCount = document.getElementById('completedCount');

        this.init();
    }

    async init() {
        this.addBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        await this.loadTasks();
        this.updateStats();
    }

    async loadTasks() {
        try {
            const response = await fetch('/api/tasks');
            const tasks = await response.json();
            this.renderTasks(tasks);
        } catch (error) {
            console.error('Error loading tasks:', error);
        }
    }

    async addTask() {
        const title = this.taskInput.value.trim();
        if (!title) return;

        try {
            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title })
            });

            if (response.ok) {
                const newTask = await response.json();
                this.renderTask(newTask);
                this.taskInput.value = '';
                this.emptyState.style.display = 'none';
                this.updateStats();
            }
        } catch (error) {
            console.error('Error adding task:', error);
        }
    }

    renderTasks(tasks) {
        this.taskList.innerHTML = '';
        if (tasks.length === 0) {
            this.emptyState.style.display = 'block';
            return;
        }
        this.emptyState.style.display = 'none';

        tasks.forEach(task => this.renderTask(task));
    }

    renderTask(task) {
        const li = document.createElement('li');
        li.className = 'task-item';
        li.dataset.id = task._id;

        li.innerHTML = `
      <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
      <span class="task-text ${task.completed ? 'completed' : ''}">${this.escapeHtml(task.title)}</span>
      <button class="task-delete">🗑️</button>
    `;

        // Event listeners
        li.querySelector('.task-checkbox').addEventListener('change', (e) => this.toggleTask(task._id, e.target.checked));
        li.querySelector('.task-delete').addEventListener('click', () => this.deleteTask(task._id));

        this.taskList.insertBefore(li, this.taskList.firstChild);
    }

    async toggleTask(id, completed) {
        try {
            await fetch(`/api/tasks/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completed })
            });

            // Update UI immediately
            const taskItem = document.querySelector(`[data-id="${id}"]`);
            const taskText = taskItem.querySelector('.task-text');
            const checkbox = taskItem.querySelector('.task-checkbox');

            taskText.classList.toggle('completed', completed);
            this.updateStats();
        } catch (error) {
            console.error('Error updating task:', error);
        }
    }

    async deleteTask(id) {
        if (!confirm('Are you sure you want to delete this task?')) return;

        try {
            await fetch(`/api/tasks/${id}`, { method: 'DELETE' });

            // Remove from UI
            const taskItem = document.querySelector(`[data-id="${id}"]`);
            taskItem.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => {
                taskItem.remove();
                this.updateStats();
                if (this.taskList.children.length === 0) {
                    this.emptyState.style.display = 'block';
                }
            }, 300);
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    }

    updateStats() {
        const tasks = Array.from(this.taskList.children);
        const pending = tasks.filter(item => !item.querySelector('.task-checkbox').checked).length;
        const completed = tasks.length - pending;

        this.pendingCount.textContent = pending;
        this.completedCount.textContent = completed;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
});