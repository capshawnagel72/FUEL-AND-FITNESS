const app = {
    currentUser: null,
    currentWeek: 1,
    currentDay: 1,
    currentMealWeek: 1,
    currentMealDay: 1,
    masterPassword: 'master123',

    init() {
        this.loadData();
        this.checkAutoLogin();
    },

    loadData() {
        const saved = localStorage.getItem('workoutAppData');
        if (saved) {
            this.data = JSON.parse(saved);
        } else {
            this.data = { users: {} };
        }
    },

    saveData() {
        localStorage.setItem('workoutAppData', JSON.stringify(this.data));
    },

    checkAutoLogin() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser && this.data.users[savedUser]) {
            this.currentUser = savedUser;
            this.showMainScreen();
        }
    },

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
    },

    showLogin() {
        this.showScreen('loginScreen');
    },

    showCreateAccount() {
        this.showScreen('createAccountScreen');
    },

    login() {
        const username = document.getElementById('usernameInput').value.trim();
        const password = document.getElementById('passwordInput').value;

        if (!username || !password) {
            alert('Please enter username and password');
            return;
        }

        if (this.data.users[username] && this.data.users[username].password === password) {
            this.currentUser = username;
            localStorage.setItem('currentUser', username);
            this.showMainScreen();
        } else {
            alert('Invalid username or password');
        }
    },

    createAccount() {
        const username = document.getElementById('newUsername').value.trim();
        const password = document.getElementById('newPassword').value;
        const confirm = document.getElementById('confirmPassword').value;

        if (!username || !password) {
            alert('Please enter username and password');
            return;
        }

        if (password !== confirm) {
            alert('Passwords do not match');
            return;
        }

        if (this.data.users[username]) {
            alert('Username already exists');
            return;
        }

        this.data.users[username] = {
            password: password,
            workoutPlan: this.getDefaultWorkoutPlan(),
            mealPlan: this.getDefaultMealPlan(),
            workoutData: {},
            mealData: {},
            carbSchedule: [1, 0, 1, 0, 1, 0, 0] // 1 = moderate, 0 = low
        };

        this.saveData();
        alert('Account created successfully!');
        this.showLogin();
    },

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.showLogin();
    },

    showMainScreen() {
        document.getElementById('currentUser').textContent = this.currentUser;
        this.showScreen('mainScreen');
        
        // Show master section if master password
        if (this.data.users[this.currentUser].password === this.masterPassword) {
            document.getElementById('masterSection').style.display = 'block';
        }

        // Load reminder settings
        const userData = this.data.users[this.currentUser];
        if (userData.remindersEnabled) {
            document.getElementById('enableReminders').checked = true;
            document.getElementById('reminderTimes').style.display = 'block';
            if (userData.reminderTimes) {
                Object.keys(userData.reminderTimes).forEach(meal => {
                    document.getElementById(meal + 'Time').value = userData.reminderTimes[meal];
                });
            }
        }

        this.renderWorkout();
        this.renderMeals();
        this.renderProgress();
    },

    switchTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        event.target.classList.add('active');
        document.getElementById(tabName + 'Tab').classList.add('active');

        if (tabName === 'workout') this.renderWorkout();
        if (tabName === 'meals') this.renderMeals();
        if (tabName === 'progress') this.renderProgress();
    },

    changeWeek(delta) {
        this.currentWeek += delta;
        if (this.currentWeek < 1) this.currentWeek = 1;
        document.getElementById('currentWeek').textContent = `Week ${this.currentWeek}`;
        this.renderWorkout();
    },

    selectDay(day) {
        this.currentDay = day;
        document.querySelectorAll('#workoutTab .day-btn').forEach((btn, idx) => {
            btn.classList.toggle('active', idx === day - 1);
        });
        this.renderWorkout();
    },

    changeMealWeek(delta) {
        this.currentMealWeek += delta;
        if (this.currentMealWeek < 1) this.currentMealWeek = 1;
        document.getElementById('currentMealWeek').textContent = `Week ${this.currentMealWeek}`;
        this.renderMeals();
    },

    selectMealDay(day) {
        this.currentMealDay = day;
        document.querySelectorAll('#mealsTab .day-btn').forEach((btn, idx) => {
            btn.classList.toggle('active', idx === day - 1);
        });
        this.renderMeals();
    },

    renderWorkout() {
        const userData = this.data.users[this.currentUser];
        const dayPlan = userData.workoutPlan[this.currentDay - 1];
        const weekKey = `w${this.currentWeek}_d${this.currentDay}`;
        const prevWeekKey = `w${this.currentWeek - 1}_d${this.currentDay}`;
        
        if (!userData.workoutData[weekKey]) {
            userData.workoutData[weekKey] = { exercises: [], completed: false };
        }

        const workoutData = userData.workoutData[weekKey];
        const prevWeekData = userData.workoutData[prevWeekKey];

        let html = `<div class="workout-day">`;
        html += `<h2>${dayPlan.name}</h2>`;

        if (dayPlan.exercises && dayPlan.exercises.length > 0) {
            dayPlan.exercises.forEach((exercise, idx) => {
                const exerciseData = workoutData.exercises[idx] || {};
                const prevExerciseData = prevWeekData?.exercises[idx] || {};
                const unit = exerciseData.unit || 'lbs';

                html += `<div class="exercise">`;
                html += `<h3>${exercise.name}</h3>`;
                html += `<p class="sets-reps">${exercise.sets}</p>`;
                
                // Unit selector
                html += `<div class="unit-selector">
                    <label>Unit:</label>
                    <select onchange="app.updateExerciseUnit(${idx}, this.value)">
                        <option value="lbs" ${unit === 'lbs' ? 'selected' : ''}>lbs</option>
                        <option value="kg" ${unit === 'kg' ? 'selected' : ''}>kg</option>
                        <option value="seconds" ${unit === 'seconds' ? 'selected' : ''}>seconds</option>
                    </select>
                </div>`;

                // Last week's data display
                if (prevExerciseData.weight || prevExerciseData.reps) {
                    const prevUnit = prevExerciseData.unit || 'lbs';
                    html += `<div class="last-week-data">
                        <strong>Last Week:</strong> 
                        ${prevExerciseData.weight || '-'} ${prevUnit} × ${prevExerciseData.reps || '-'} reps
                        ${prevExerciseData.notes ? `<br><em>Notes: ${prevExerciseData.notes}</em>` : ''}
                    </div>`;
                }

                html += `<div class="exercise-inputs">`;
                html += `<input type="text" 
                    placeholder="${unit === 'seconds' ? 'Duration' : 'Weight'}" 
                    value="${exerciseData.weight || ''}" 
                    oninput="app.updateExercise(${idx}, 'weight', this.value)">`;
                html += `<input type="text" 
                    placeholder="Reps" 
                    value="${exerciseData.reps || ''}" 
                    oninput="app.updateExercise(${idx}, 'reps', this.value)">`;
                html += `</div>`;
                
                // Notes textarea
                html += `<div class="exercise-notes">
                    <textarea 
                        placeholder="Notes (optional)" 
                        oninput="app.updateExercise(${idx}, 'notes', this.value)"
                        rows="2">${exerciseData.notes || ''}</textarea>
                </div>`;
                
                html += `</div>`;
            });

            html += `<div class="workout-complete">`;
            html += `<label>
                <input type="checkbox" 
                    ${workoutData.completed ? 'checked' : ''} 
                    onchange="app.toggleWorkoutComplete(this.checked)">
                Mark workout complete
            </label>`;
            html += `</div>`;
        } else {
            html += `<p class="cardio-note">Cardio day - Track your cardio session</p>`;
            html += `<textarea 
                placeholder="Cardio notes (type, duration, intensity, etc.)" 
                oninput="app.updateCardioNotes(this.value)"
                rows="4">${workoutData.cardioNotes || ''}</textarea>`;
            html += `<div class="workout-complete">`;
            html += `<label>
                <input type="checkbox" 
                    ${workoutData.completed ? 'checked' : ''} 
                    onchange="app.toggleWorkoutComplete(this.checked)">
                Mark cardio complete
            </label>`;
            html += `</div>`;
        }

        html += `</div>`;
        document.getElementById('workoutContent').innerHTML = html;
    },

    updateExerciseUnit(exerciseIdx, unit) {
        const userData = this.data.users[this.currentUser];
        const weekKey = `w${this.currentWeek}_d${this.currentDay}`;
        
        if (!userData.workoutData[weekKey].exercises[exerciseIdx]) {
            userData.workoutData[weekKey].exercises[exerciseIdx] = {};
        }
        
        userData.workoutData[weekKey].exercises[exerciseIdx].unit = unit;
        this.saveData();
        this.renderWorkout();
    },

    updateExercise(exerciseIdx, field, value) {
        const userData = this.data.users[this.currentUser];
        const weekKey = `w${this.currentWeek}_d${this.currentDay}`;
        
        if (!userData.workoutData[weekKey].exercises[exerciseIdx]) {
            userData.workoutData[weekKey].exercises[exerciseIdx] = {};
        }
        
        userData.workoutData[weekKey].exercises[exerciseIdx][field] = value;
        this.saveData();
    },

    updateCardioNotes(value) {
        const userData = this.data.users[this.currentUser];
        const weekKey = `w${this.currentWeek}_d${this.currentDay}`;
        userData.workoutData[weekKey].cardioNotes = value;
        this.saveData();
    },

    toggleWorkoutComplete(checked) {
        const userData = this.data.users[this.currentUser];
        const weekKey = `w${this.currentWeek}_d${this.currentDay}`;
        userData.workoutData[weekKey].completed = checked;
        this.saveData();
    },

    renderMeals() {
        const userData = this.data.users[this.currentUser];
        const carbType = userData.carbSchedule[this.currentMealDay - 1];
        const mealPlan = carbType === 1 ? userData.mealPlan.moderate : userData.mealPlan.low;
        const weekKey = `w${this.currentMealWeek}_d${this.currentMealDay}`;
        
        if (!userData.mealData[weekKey]) {
            userData.mealData[weekKey] = { meals: [{}, {}, {}, {}, {}] };
        }

        const mealData = userData.mealData[weekKey];

        let html = `<div class="meal-day">`;
        html += `<h2>${carbType === 1 ? 'Moderate' : 'Low'} Carb Day</h2>`;

        mealPlan.forEach((meal, idx) => {
            const eaten = mealData.meals[idx]?.eaten || false;
            html += `<div class="meal ${eaten ? 'eaten' : ''}">`;
            html += `<h3>Meal ${idx + 1}</h3>`;
            html += `<p>${meal}</p>`;
            html += `<label>
                <input type="checkbox" 
                    ${eaten ? 'checked' : ''} 
                    onchange="app.toggleMealEaten(${idx}, this.checked)">
                Eaten
            </label>`;
            html += `</div>`;
        });

        html += `</div>`;
        document.getElementById('mealContent').innerHTML = html;

        // Update day type labels
        for (let i = 1; i <= 7; i++) {
            const type = userData.carbSchedule[i - 1] === 1 ? 'Moderate' : 'Low';
            const elem = document.getElementById(`day${i}Type`);
            if (elem) elem.textContent = type;
        }
    },

    toggleMealEaten(mealIdx, checked) {
        const userData = this.data.users[this.currentUser];
        const weekKey = `w${this.currentMealWeek}_d${this.currentMealDay}`;
        userData.mealData[weekKey].meals[mealIdx] = { eaten: checked };
        this.saveData();
        this.renderMeals();
    },

    renderProgress() {
        const userData = this.data.users[this.currentUser];
        let html = '';

        const weeks = {};
        Object.keys(userData.workoutData).forEach(key => {
            const week = key.split('_')[0];
            if (!weeks[week]) weeks[week] = [];
            weeks[week].push(key);
        });

        Object.keys(weeks).sort().reverse().forEach(week => {
            const weekNum = week.replace('w', '');
            html += `<div class="week-summary">`;
            html += `<h3>Week ${weekNum}</h3>`;
            
            for (let day = 1; day <= 7; day++) {
                const key = `w${weekNum}_d${day}`;
                const dayData = userData.workoutData[key];
                if (dayData) {
                    const dayName = userData.workoutPlan[day - 1].name;
                    html += `<div class="day-summary ${dayData.completed ? 'completed' : ''}">`;
                    html += `<strong>Day ${day} - ${dayName}</strong>`;
                    html += `<span>${dayData.completed ? '✓ Complete' : '○ Incomplete'}</span>`;
                    html += `</div>`;
                }
            }
            
            html += `</div>`;
        });

        if (html === '') {
            html = '<p>No workout data yet. Start tracking your workouts!</p>';
        }

        document.getElementById('progressContent').innerHTML = html;
    },

    toggleReminders() {
        const enabled = document.getElementById('enableReminders').checked;
        document.getElementById('reminderTimes').style.display = enabled ? 'block' : 'none';
        
        const userData = this.data.users[this.currentUser];
        userData.remindersEnabled = enabled;
        this.saveData();

        if (enabled) {
            this.requestNotificationPermission();
        }
    },

    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    this.saveReminderTimes();
                }
            });
        }
    },

    saveReminderTimes() {
        const userData = this.data.users[this.currentUser];
        userData.reminderTimes = {
            meal1: document.getElementById('meal1Time').value,
            meal2: document.getElementById('meal2Time').value,
            meal3: document.getElementById('meal3Time').value,
            meal4: document.getElementById('meal4Time').value,
            meal5: document.getElementById('meal5Time').value
        };
        this.saveData();
    },

    changePassword() {
        const current = document.getElementById('currentPassword').value;
        const newPass = document.getElementById('newPasswordProfile').value;
        const confirm = document.getElementById('confirmPasswordProfile').value;

        const userData = this.data.users[this.currentUser];

        if (userData.password !== current) {
            alert('Current password is incorrect');
            return;
        }

        if (newPass !== confirm) {
            alert('New passwords do not match');
            return;
        }

        if (!newPass) {
            alert('Please enter a new password');
            return;
        }

        userData.password = newPass;
        this.saveData();
        alert('Password updated successfully!');
        
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPasswordProfile').value = '';
        document.getElementById('confirmPasswordProfile').value = '';
    },

    editWorkoutPlan() {
        const userData = this.data.users[this.currentUser];
        const json = JSON.stringify(userData.workoutPlan, null, 2);
        const newPlan = prompt('Edit your workout plan (JSON format):', json);
        
        if (newPlan) {
            try {
                userData.workoutPlan = JSON.parse(newPlan);
                this.saveData();
                alert('Workout plan updated!');
                this.renderWorkout();
            } catch (e) {
                alert('Invalid JSON format');
            }
        }
    },

    editMealPlan() {
        const userData = this.data.users[this.currentUser];
        const json = JSON.stringify(userData.mealPlan, null, 2);
        const newPlan = prompt('Edit your meal plan (JSON format):', json);
        
        if (newPlan) {
            try {
                userData.mealPlan = JSON.parse(newPlan);
                this.saveData();
                alert('Meal plan updated!');
                this.renderMeals();
            } catch (e) {
                alert('Invalid JSON format');
            }
        }
    },

    viewAllUsers() {
        if (this.data.users[this.currentUser].password !== this.masterPassword) {
            alert('Access denied');
            return;
        }

        let info = 'All Users:\n\n';
        Object.keys(this.data.users).forEach(username => {
            info += `${username}\n`;
        });
        alert(info);
    },

    exportProgress() {
        const userData = this.data.users[this.currentUser];
        const data = {
            username: this.currentUser,
            workoutData: userData.workoutData,
            mealData: userData.mealData
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.currentUser}_progress.json`;
        a.click();
    },

    exportAllData() {
        if (this.data.users[this.currentUser].password !== this.masterPassword) {
            alert('Access denied');
            return;
        }

        const blob = new Blob([JSON.stringify(this.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'all_users_data.json';
        a.click();
    },

    deleteAccount() {
        if (!confirm('Are you sure you want to delete your account? This cannot be undone.')) {
            return;
        }

        const password = prompt('Enter your password to confirm:');
        if (this.data.users[this.currentUser].password !== password) {
            alert('Incorrect password');
            return;
        }

        delete this.data.users[this.currentUser];
        this.saveData();
        this.logout();
    },

    getDefaultWorkoutPlan() {
        return [
            {
                name: "Push Day",
                exercises: [
                    { name: "Barbell Bench Press", sets: "3 sets x 8-10 reps" },
                    { name: "Incline Dumbbell Press", sets: "3 sets x 10-12 reps" },
                    { name: "Dumbbell Flyes", sets: "3 sets x 12-15 reps" },
                    { name: "Overhead Press", sets: "3 sets x 8-10 reps" },
                    { name: "Lateral Raises", sets: "3 sets x 12-15 reps" },
                    { name: "Tricep Dips", sets: "3 sets x 10-12 reps" },
                    { name: "Tricep Pushdowns", sets: "3 sets x 12-15 reps" }
                ]
            },
            {
                name: "Pull Day",
                exercises: [
                    { name: "Deadlifts", sets: "3 sets x 6-8 reps" },
                    { name: "Pull-ups", sets: "3 sets x 8-10 reps" },
                    { name: "Barbell Rows", sets: "3 sets x 8-10 reps" },
                    { name: "Lat Pulldowns", sets: "3 sets x 10-12 reps" },
                    { name: "Face Pulls", sets: "3 sets x 15-20 reps" },
                    { name: "Barbell Curls", sets: "3 sets x 10-12 reps" },
                    { name: "Hammer Curls", sets: "3 sets x 12-15 reps" }
                ]
            },
            {
                name: "Leg Day",
                exercises: [
                    { name: "Squats", sets: "4 sets x 8-10 reps" },
                    { name: "Romanian Deadlifts", sets: "3 sets x 10-12 reps" },
                    { name: "Leg Press", sets: "3 sets x 12-15 reps" },
                    { name: "Walking Lunges", sets: "3 sets x 12 reps per leg" },
                    { name: "Leg Curls", sets: "3 sets x 12-15 reps" },
                    { name: "Calf Raises", sets: "4 sets x 15-20 reps" }
                ]
            },
            {
                name: "Shoulders & Arms",
                exercises: [
                    { name: "Overhead Press", sets: "4 sets x 8-10 reps" },
                    { name: "Arnold Press", sets: "3 sets x 10-12 reps" },
                    { name: "Lateral Raises", sets: "3 sets x 12-15 reps" },
                    { name: "Rear Delt Flyes", sets: "3 sets x 12-15 reps" },
                    { name: "Barbell Curls", sets: "3 sets x 10-12 reps" },
                    { name: "Tricep Rope Pushdowns", sets: "3 sets x 12-15 reps" },
                    { name: "Concentration Curls", sets: "3 sets x 12-15 reps" }
                ]
            },
            {
                name: "Posterior Chain",
                exercises: [
                    { name: "Deadlifts", sets: "4 sets x 6-8 reps" },
                    { name: "Good Mornings", sets: "3 sets x 10-12 reps" },
                    { name: "Hamstring Curls", sets: "3 sets x 12-15 reps" },
                    { name: "Back Extensions", sets: "3 sets x 15-20 reps" },
                    { name: "Cable Pull-throughs", sets: "3 sets x 12-15 reps" },
                    { name: "Glute Bridges", sets: "3 sets x 15-20 reps" }
                ]
            },
            {
                name: "Cardio",
                exercises: []
            },
            {
                name: "Cardio",
                exercises: []
            }
        ];
    },

    getDefaultMealPlan() {
        return {
            moderate: [
                "4 whole eggs + 1 cup oatmeal with berries",
                "6 oz chicken breast + 1 cup white rice + mixed vegetables",
                "Protein shake (40g protein) + 1 banana + 2 tbsp peanut butter",
                "6 oz salmon + 8 oz sweet potato + asparagus",
                "6 oz lean ground beef + 1 cup pasta + marinara sauce"
            ],
            low: [
                "4 whole eggs + 2 cups spinach + avocado",
                "6 oz chicken breast + large mixed green salad + olive oil",
                "Protein shake (40g protein) + handful of almonds",
                "8 oz steak + broccoli + cauliflower",
                "6 oz white fish + zucchini noodles + pesto"
            ]
        };
    }
};

// Initialize app when page loads
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
