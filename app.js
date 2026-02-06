// Goal Tracker Application
class GoalTracker {
    constructor() {
        this.goal = null;
        this.isEditing = false;
        this.DAYS_PER_WEEK = 7;
        this.DAYS_PER_MONTH = 30;
        this.init();
    }

    init() {
        // Load goal from localStorage
        this.loadGoal();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Display appropriate section
        this.updateDisplay();
    }

    setupEventListeners() {
        // Goal creation form
        document.getElementById('goalForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createGoal();
        });

        // Update form
        document.getElementById('updateForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateCurrentValue();
        });

        // Delete button
        document.getElementById('deleteGoalBtn').addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this goal?')) {
                this.deleteGoal();
            }
        });

        // Edit button
        document.getElementById('editGoalBtn').addEventListener('click', () => {
            this.startEditing();
        });

        // Cancel edit button
        document.getElementById('cancelEditBtn').addEventListener('click', () => {
            this.cancelEditing();
        });

        // Set minimum date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('targetDate').setAttribute('min', today);
        document.getElementById('startDate').value = today;
    }

    createGoal() {
        const name = document.getElementById('goalName').value;
        const targetValue = parseFloat(document.getElementById('targetValue').value);
        const currentValue = parseFloat(document.getElementById('currentValue').value);
        const startDate = document.getElementById('startDate').value;
        const targetDate = document.getElementById('targetDate').value;

        if (new Date(startDate) > new Date(targetDate)) {
            alert(`Start date (${startDate}) must be on or before target date (${targetDate}).`);
            return;
        }

        if (this.isEditing && this.goal) {
            this.goal = {
                ...this.goal,
                name,
                targetValue,
                currentValue,
                startDate,
                targetDate
            };
        } else {
            this.goal = {
                name,
                targetValue,
                currentValue,
                startDate,
                targetDate,
                createdAt: new Date().toISOString()
            };
        }

        this.isEditing = false;
        this.saveGoal();
        this.updateDisplay();
        this.resetForm();
    }

    updateCurrentValue() {
        const newValue = parseFloat(document.getElementById('newCurrentValue').value);
        
        if (newValue >= 0 && this.goal) {
            this.goal.currentValue = newValue;
            this.saveGoal();
            this.updateDisplay();
            document.getElementById('newCurrentValue').value = '';
        }
    }

    deleteGoal() {
        this.goal = null;
        this.isEditing = false;
        localStorage.removeItem('goalTrackerData');
        this.updateDisplay();
        
        // Reset form
        this.resetForm();
    }

    saveGoal() {
        localStorage.setItem('goalTrackerData', JSON.stringify(this.goal));
    }

    loadGoal() {
        const savedGoal = localStorage.getItem('goalTrackerData');
        if (savedGoal) {
            this.goal = JSON.parse(savedGoal);
        }
    }

    updateDisplay() {
        const createSection = document.getElementById('createGoalSection');
        const displaySection = document.getElementById('goalDisplaySection');

        if (this.goal && !this.isEditing) {
            createSection.classList.add('hidden');
            displaySection.classList.remove('hidden');
            this.displayGoalProgress();
        } else {
            createSection.classList.remove('hidden');
            displaySection.classList.add('hidden');
            if (!this.isEditing) {
                this.setFormMode('create');
            }
        }
    }

    displayGoalProgress() {
        // Update goal name
        document.getElementById('displayGoalName').textContent = this.goal.name;

        // Calculate progress
        const progress = this.calculateProgress();
        
        // Update progress circle
        this.updateProgressCircle(progress.percentage);
        
        // Update current progress
        document.getElementById('currentProgress').textContent = 
            `${this.formatNumber(this.goal.currentValue)} / ${this.formatNumber(this.goal.targetValue)}`;
        
        // Update remaining
        document.getElementById('remaining').textContent = 
            this.formatNumber(progress.remaining);
        
        // Update days left
        document.getElementById('daysLeft').textContent = progress.daysLeft;
        
        // Update status
        this.updateStatus(progress);
        
        // Update targets
        this.updateTargets(progress);
        
        // Set current value in update form
        document.getElementById('newCurrentValue').value = this.goal.currentValue;
    }

    calculateProgress() {
        const currentValue = this.goal.currentValue;
        const targetValue = this.goal.targetValue;
        const remaining = Math.max(0, targetValue - currentValue);
        const percentage = Math.min(100, (currentValue / targetValue) * 100);

        // Calculate time metrics
        const now = new Date();
        const startDateValue = this.goal.startDate || this.goal.createdAt;
        const createdAt = new Date(startDateValue);
        const targetDate = new Date(this.goal.targetDate);
        
        // Time elapsed in days
        const timeElapsed = Math.max(0, Math.floor((now - createdAt) / (1000 * 60 * 60 * 24)));
        
        // Days left until target
        const daysLeft = Math.max(0, Math.floor((targetDate - now) / (1000 * 60 * 60 * 24)));
        
        // Total days for the goal
        const totalDays = Math.max(1, Math.floor((targetDate - createdAt) / (1000 * 60 * 60 * 24)));

        // Calculate required contribution rates
        const dailyRequired = daysLeft > 0 ? remaining / daysLeft : 0;
        const weeklyRequired = daysLeft > 0 ? (remaining * this.DAYS_PER_WEEK) / daysLeft : 0;
        const monthlyRequired = daysLeft > 0 ? (remaining * this.DAYS_PER_MONTH) / daysLeft : 0;

        // Calculate expected progress
        const expectedProgress = timeElapsed > 0 ? (timeElapsed / totalDays) * targetValue : 0;
        
        // Determine if on track
        let status = 'on-track';
        if (percentage >= 100) {
            status = 'completed';
        } else if (currentValue < expectedProgress && daysLeft > 0) {
            status = 'behind';
        } else if (currentValue > expectedProgress && daysLeft > 0) {
            status = 'ahead';
        }

        return {
            percentage: percentage.toFixed(1),
            remaining,
            daysLeft,
            timeElapsed,
            totalDays,
            dailyRequired,
            weeklyRequired,
            monthlyRequired,
            expectedProgress,
            status
        };
    }

    startEditing() {
        if (!this.goal) {
            return;
        }

        this.isEditing = true;
        this.setFormMode('edit');
        this.populateForm();
        this.updateDisplay();
    }

    cancelEditing() {
        this.isEditing = false;
        this.updateDisplay();
        this.resetForm();
    }

    populateForm() {
        document.getElementById('goalName').value = this.goal.name;
        document.getElementById('targetValue').value = this.goal.targetValue;
        document.getElementById('currentValue').value = this.goal.currentValue;
        document.getElementById('startDate').value = this.formatDateInput(this.goal.startDate || this.goal.createdAt);
        document.getElementById('targetDate').value = this.goal.targetDate;
    }

    resetForm() {
        document.getElementById('goalForm').reset();
        document.getElementById('startDate').value = new Date().toISOString().split('T')[0];
        this.setFormMode('create');
    }

    setFormMode(mode) {
        const title = document.getElementById('goalFormTitle');
        const submitButton = document.getElementById('goalFormSubmit');
        const cancelButton = document.getElementById('cancelEditBtn');

        if (mode === 'edit') {
            title.textContent = 'Edit Goal';
            submitButton.textContent = 'Save Changes';
            cancelButton.classList.remove('hidden');
        } else {
            title.textContent = 'Create Your Goal';
            submitButton.textContent = 'Create Goal';
            cancelButton.classList.add('hidden');
        }
    }

    formatDateInput(value) {
        const date = new Date(value);
        if (isNaN(date)) {
            return '';
        }
        return date.toISOString().split('T')[0];
    }

    updateProgressCircle(percentage) {
        const circle = document.getElementById('progressRing');
        const radius = circle.r.baseVal.value;
        const circumference = radius * 2 * Math.PI;
        const offset = circumference - (percentage / 100) * circumference;

        circle.style.strokeDasharray = `${circumference} ${circumference}`;
        circle.style.strokeDashoffset = offset;

        document.getElementById('progressPercentage').textContent = `${percentage}%`;
    }

    updateStatus(progress) {
        const statusElement = document.getElementById('trackStatus');
        let statusText = '';
        
        switch (progress.status) {
            case 'completed':
                statusText = '🎉 Completed!';
                break;
            case 'ahead':
                statusText = '✅ Ahead of Schedule';
                break;
            case 'behind':
                statusText = '⚠️ Behind Schedule';
                break;
            default:
                statusText = '✓ On Track';
        }

        statusElement.textContent = statusText;
        statusElement.className = `value badge ${progress.status}`;
    }

    updateTargets(progress) {
        document.getElementById('dailyTarget').textContent = 
            this.formatNumber(progress.dailyRequired);
        document.getElementById('weeklyTarget').textContent = 
            this.formatNumber(progress.weeklyRequired);
        document.getElementById('monthlyTarget').textContent = 
            this.formatNumber(progress.monthlyRequired);
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(2) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(2) + 'K';
        } else if (Number.isInteger(num)) {
            return num.toString();
        } else {
            return num.toFixed(2);
        }
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new GoalTracker();
});
