// Schedule data (from schedule.md)
const scheduleData = [
    { day: 'Пн, 9 фев', time: '10:00', title: 'Focus with Ilya', facilitator: 'Ilya', zoom: 'https://us06web.zoom.us/j/8505264478' },
    { day: 'Пн, 9 фев', time: '14:00', title: 'Focus with Ilya', facilitator: 'Ilya', zoom: 'https://us06web.zoom.us/j/8505264478' },
    { day: 'Пн, 9 фев', time: '16:30', title: 'Meditation with Michael', facilitator: 'Michael', zoom: 'https://us06web.zoom.us/j/83655452854' },
    { day: 'Вт, 10 фев', time: '10:00', title: 'Focus with Ilya', facilitator: 'Ilya', zoom: 'https://us06web.zoom.us/j/8505264478' },
    { day: 'Вт, 10 фев', time: '12:00', title: 'Focus with Vlad', facilitator: 'Vlad', zoom: 'https://us06web.zoom.us/j/82714804246' },
    { day: 'Вт, 10 фев', time: '16:30', title: 'Shipping Studio', facilitator: 'Max', zoom: 'https://us06web.zoom.us/j/8505264478' },
    { day: 'Ср, 11 фев', time: '10:00', title: 'Focus with Max', facilitator: 'Max', zoom: 'https://us06web.zoom.us/j/8505264478' },
    { day: 'Ср, 11 фев', time: '12:00', title: 'Focus with Vlad', facilitator: 'Vlad', zoom: 'https://us06web.zoom.us/j/82714804246' },
    { day: 'Ср, 11 фев', time: '12:00', title: 'Music Focus', facilitator: 'Michael', zoom: 'https://us06web.zoom.us/j/86580160735' },
    { day: 'Ср, 11 фев', time: '16:30', title: 'Breathwork with Olya', facilitator: 'Olya', zoom: 'https://us06web.zoom.us/j/8505264478' },
];

// Timezone offsets from UTC
const timezones = {
    'CET': 1,
    'PST': -8,
    'Yerevan': 4
};

let currentTZ = 'CET';

// Convert UTC time to selected timezone
function convertTime(utcTime, tz) {
    const [hours, minutes] = utcTime.split(':').map(Number);
    const offset = timezones[tz];
    let newHours = hours + offset;
    
    if (newHours < 0) newHours += 24;
    if (newHours >= 24) newHours -= 24;
    
    return `${String(newHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

// Render schedule
function renderSchedule() {
    const container = document.getElementById('schedule-container');
    const today = new Date().getDate();
    
    // Filter to show only today and tomorrow
    const relevantSessions = scheduleData.filter(session => {
        const dayNum = parseInt(session.day.match(/\d+/)[0]);
        return dayNum === today || dayNum === today + 1;
    });
    
    if (relevantSessions.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary)">Нет сессий сегодня</p>';
        return;
    }
    
    container.innerHTML = relevantSessions.map(session => {
        const localTime = convertTime(session.time, currentTZ);
        return `
            <div class="schedule-item">
                <div class="schedule-header">
                    <span class="schedule-time">${localTime} ${currentTZ}</span>
                    <span style="font-size: 12px; color: var(--text-secondary)">${session.day}</span>
                </div>
                <div class="schedule-title">${session.title}</div>
                <div class="schedule-facilitator">with ${session.facilitator}</div>
                <a href="${session.zoom}" target="_blank" class="schedule-link">→ Zoom</a>
            </div>
        `;
    }).join('');
}

// Timezone selector
document.querySelectorAll('.tz-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tz-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTZ = btn.dataset.tz;
        renderSchedule();
    });
});

// Check-in functionality
const checkinBtn = document.getElementById('checkin-btn');
const checkinStatus = document.getElementById('checkin-status');

checkinBtn.addEventListener('click', () => {
    const now = new Date();
    const timestamp = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    
    // Save to localStorage
    const checkins = JSON.parse(localStorage.getItem('t4s-checkins') || '[]');
    checkins.push({
        date: now.toISOString().split('T')[0],
        time: timestamp
    });
    localStorage.setItem('t4s-checkins', JSON.stringify(checkins));
    
    checkinStatus.textContent = `✓ Зарегистрирован в ${timestamp}`;
    checkinBtn.style.background = '#999';
    checkinBtn.disabled = true;
    
    setTimeout(() => {
        checkinBtn.style.background = 'var(--accent)';
        checkinBtn.disabled = false;
        checkinStatus.textContent = '';
    }, 3000);
    
    updateStats();
});

// Update stats
function updateStats() {
    const checkins = JSON.parse(localStorage.getItem('t4s-checkins') || '[]');
    const today = new Date().toISOString().split('T')[0];
    
    // Calculate streak
    let streak = 0;
    const dates = [...new Set(checkins.map(c => c.date))].sort().reverse();
    for (let i = 0; i < dates.length; i++) {
        const checkDate = new Date(dates[i]);
        const expectedDate = new Date();
        expectedDate.setDate(expectedDate.getDate() - i);
        
        if (checkDate.toISOString().split('T')[0] === expectedDate.toISOString().split('T')[0]) {
            streak++;
        } else {
            break;
        }
    }
    
    document.getElementById('sessions-week').textContent = scheduleData.length;
    document.getElementById('participants-today').textContent = Math.floor(Math.random() * 8) + 3; // Mock
    document.getElementById('your-streak').textContent = streak;
    document.getElementById('new-members').textContent = Math.floor(Math.random() * 5) + 2; // Mock
}

// Initialize
renderSchedule();
updateStats();
