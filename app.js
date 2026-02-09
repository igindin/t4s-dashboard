// Schedule will be loaded from schedule.json
let scheduleData = [];

// Timezone offsets from UTC
const timezones = {
    'Yerevan': 4,
    'CET': 1,
    'PST': -8
};

let currentTZ = 'Yerevan';

// Convert UTC time to selected timezone
function convertTime(utcTime, tz) {
    const [hours, minutes] = utcTime.split(':').map(Number);
    const offset = timezones[tz];
    let newHours = hours + offset;
    
    if (newHours < 0) newHours += 24;
    if (newHours >= 24) newHours -= 24;
    
    return `${String(newHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

// Check if session is happening now
function isCurrentSession(session) {
    const now = new Date();
    const sessionDate = new Date(session.date + 'T' + session.time + ':00Z');
    const sessionEnd = new Date(session.date + 'T' + session.endTime + ':00Z');
    return now >= sessionDate && now < sessionEnd;
}

// Render schedule
function renderSchedule() {
    const container = document.getElementById('schedule-container');
    const now = new Date();
    
    // Filter and sort: show today and next 2 days, sort by datetime
    const relevantSessions = scheduleData
        .map(session => ({
            ...session,
            datetime: new Date(session.date + 'T' + session.time + ':00Z')
        }))
        .filter(session => {
            const daysDiff = Math.floor((session.datetime - now) / (1000 * 60 * 60 * 24));
            return daysDiff >= -1 && daysDiff <= 2; // Include today even if time passed
        })
        .sort((a, b) => a.datetime - b.datetime);
    
    if (relevantSessions.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary)">Нет предстоящих сессий</p>';
        return;
    }
    
    container.innerHTML = relevantSessions.map(session => {
        const localTime = convertTime(session.time, currentTZ);
        const localEndTime = convertTime(session.endTime, currentTZ);
        const isCurrent = isCurrentSession(session);
        const currentClass = isCurrent ? ' style="border: 2px solid var(--accent); background: #f0fff0;"' : '';
        const currentBadge = isCurrent ? '<span style="background: var(--accent); color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">СЕЙЧАС</span>' : '';
        
        return `
            <div class="schedule-item"${currentClass}>
                <div class="schedule-header">
                    <span class="schedule-time">${localTime} - ${localEndTime} ${currentTZ}</span>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        ${currentBadge}
                        <span style="font-size: 12px; color: var(--text-secondary)">${session.day}</span>
                    </div>
                </div>
                <div class="schedule-title">${session.title}</div>
                <div class="schedule-facilitator">with ${session.facilitator}</div>
                ${session.zoom ? `<a href="${session.zoom}" target="_blank" class="schedule-link">→ Zoom</a>` : ''}
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

// Load schedule and initialize
fetch('schedule.json')
    .then(r => r.json())
    .then(data => {
        scheduleData = data;
        renderSchedule();
        updateStats();
    })
    .catch(err => {
        console.error('Failed to load schedule:', err);
        document.getElementById('schedule-container').innerHTML = 
            '<p style="color: var(--text-secondary)">Ошибка загрузки расписания</p>';
    });
