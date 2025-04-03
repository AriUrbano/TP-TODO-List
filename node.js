// Clase para representar una tarea
class Task {
    constructor(text, completed = false, createdAt = new Date(), completedAt = null) {
        this.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
        this.text = text;
        this.completed = completed;
        this.createdAt = createdAt;
        this.completedAt = completedAt;
    }
    
    getCompletionTime() {
        if (!this.completed || !this.completedAt) return null;
        return this.completedAt - this.createdAt;
    }
}

// Clase principal de la aplicación
class TaskManager {
    constructor() {
        this.tasks = [];
        this.currentFilter = 'all';
        
        // Elementos del DOM
        this.taskInput = document.querySelector('.task-input');
        this.addBtn = document.querySelector('.add-btn');
        this.taskList = document.querySelector('.task-list');
        this.filterBtns = document.querySelectorAll('.filter-btn');
        this.clearCompletedBtn = document.querySelector('.clear-completed');
        this.fastestTaskInfo = document.querySelector('#fastest-task');
        
        // Event listeners
        this.addBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });
        
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', () => this.filterTasks(btn.dataset.filter));
        });
        
        this.clearCompletedBtn.addEventListener('click', () => this.clearCompletedTasks());
        
        // Cargar tareas al iniciar
        this.loadTasks();
        this.renderTasks();
        this.updateFastestTaskInfo();
    }
    
    // Añadir una nueva tarea
    addTask() {
        const text = this.taskInput.value.trim();
        if (text === '') return;
        
        const newTask = new Task(text);
        this.tasks.push(newTask);
        
        this.taskInput.value = '';
        this.saveTasks();
        this.renderTasks();
    }
    
    // Marcar tarea como completada/pendiente
    toggleTaskCompletion(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;
        
        task.completed = !task.completed;
        task.completedAt = task.completed ? new Date() : null;
        
        this.saveTasks();
        this.renderTasks();
        this.updateFastestTaskInfo();
    }
    
    // Eliminar una tarea
    deleteTask(taskId) {
        this.tasks = this.tasks.filter(task => task.id !== taskId);
        this.saveTasks();
        this.renderTasks();
        this.updateFastestTaskInfo();
    }
    
    // Eliminar todas las tareas completadas
    clearCompletedTasks() {
        this.tasks = this.tasks.filter(task => !task.completed);
        this.saveTasks();
        this.renderTasks();
    }
    
    // Filtrar tareas
    filterTasks(filter) {
        this.currentFilter = filter;
        this.renderTasks();
        
        // Actualizar botones activos
        this.filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
    }
    
    // Renderizar la lista de tareas
    renderTasks() {
        this.taskList.innerHTML = '';
        
        let tasksToShow = [];
        
        switch (this.currentFilter) {
            case 'completed':
                tasksToShow = this.tasks.filter(task => task.completed);
                break;
            case 'pending':
                tasksToShow = this.tasks.filter(task => !task.completed);
                break;
            default:
                tasksToShow = [...this.tasks];
        }
        
        // Ordenar por fecha de creación (más recientes primero)
        tasksToShow.sort((a, b) => b.createdAt - a.createdAt);
        
        tasksToShow.forEach(task => {
            const taskItem = document.createElement('li');
            taskItem.className = 'task-item';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'task-checkbox';
            checkbox.checked = task.completed;
            checkbox.addEventListener('change', () => this.toggleTaskCompletion(task.id));
            
            const taskText = document.createElement('span');
            taskText.className = `task-text ${task.completed ? 'completed' : ''}`;
            taskText.textContent = task.text;
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = 'Eliminar';
            deleteBtn.addEventListener('click', () => this.deleteTask(task.id));
            
            const timeInfo = document.createElement('small');
            timeInfo.textContent = this.formatTimeInfo(task);
            timeInfo.style.marginLeft = '10px';
            timeInfo.style.color = '#666';
            
            taskItem.appendChild(checkbox);
            taskItem.appendChild(taskText);
            taskItem.appendChild(timeInfo);
            taskItem.appendChild(deleteBtn);
            
            this.taskList.appendChild(taskItem);
        });
    }
    
    // Formatear la información de tiempo
    formatTimeInfo(task) {
        const created = new Date(task.createdAt).toLocaleString();
        
        if (task.completed && task.completedAt) {
            const completed = new Date(task.completedAt).toLocaleString();
            const duration = this.formatDuration(task.getCompletionTime());
            return `Creada: ${created} - Completada: ${completed} (${duration})`;
        }
        
        return `Creada: ${created}`;
    }
    
    // Formatear duración en ms a formato legible
    formatDuration(ms) {
        if (!ms) return '';
        
        const seconds = Math.floor(ms / 1000) % 60;
        const minutes = Math.floor(ms / (1000 * 60)) % 60;
        const hours = Math.floor(ms / (1000 * 60 * 60)) % 24;
        const days = Math.floor(ms / (1000 * 60 * 60 * 24));
        
        const parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        if (seconds > 0) parts.push(`${seconds}s`);
        
        return parts.join(' ');
    }
    
    // Actualizar información de la tarea más rápida
    updateFastestTaskInfo() {
        const completedTasks = this.tasks.filter(task => task.completed && task.getCompletionTime() !== null);
        
        if (completedTasks.length === 0) {
            this.fastestTaskInfo.textContent = 'No hay tareas completadas aún.';
            return;
        }
        
        const fastestTask = completedTasks.reduce((prev, current) => {
            return (prev.getCompletionTime() < current.getCompletionTime()) ? prev : current;
        });
        
        const duration = this.formatDuration(fastestTask.getCompletionTime());
        this.fastestTaskInfo.textContent = `Tarea más rápida completada: "${fastestTask.text}" en ${duration}`;
    }
    
    // Guardar tareas en localStorage
    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }
    
    // Cargar tareas desde localStorage
    loadTasks() {
        const savedTasks = localStorage.getItem('tasks');
        if (savedTasks) {
            const parsedTasks = JSON.parse(savedTasks);
            this.tasks = parsedTasks.map(task => {
                return new Task(
                    task.text,
                    task.completed,
                    new Date(task.createdAt),
                    task.completedAt ? new Date(task.completedAt) : null
                );
            });
        }
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new TaskManager();
}); 