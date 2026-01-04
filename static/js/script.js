/**
 * AdPlatform Dashboard Controller
 * Simple JS to handle API interactions for the fallback UI
 */

const API_BASE = '/api';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // If we're on the dashboard, load data
    if (document.getElementById('campaignList')) {
        loadStats();
        loadCampaigns();
    }
});

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('errorMessage');

    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (data.success) {
            window.location.href = '/';
        } else {
            errorEl.textContent = data.message || 'LOGIN_FAILED';
            errorEl.classList.remove('hidden');
        }
    } catch (err) {
        console.error(err);
    }
}

async function handleLogout() {
    await fetch(`${API_BASE}/logout`, { method: 'POST' });
    window.location.href = '/login';
}

async function loadStats() {
    try {
        const res = await fetch(`${API_BASE}/stats`);
        const stats = await res.json();
        document.getElementById('totalSpend').textContent = `$${stats.totalSpend.toLocaleString()}`;
        document.getElementById('totalImpressions').textContent = stats.impressions.toLocaleString();
        document.getElementById('avgCtr').textContent = `${stats.ctr}%`;
        document.getElementById('budgetRem').textContent = `$${stats.budgetRemaining.toLocaleString()}`;
    } catch (err) {
        console.log("Stats fetch failed");
    }
}

async function loadCampaigns() {
    const list = document.getElementById('campaignList');
    try {
        const res = await fetch(`${API_BASE}/campaigns`);
        const campaigns = await res.json();

        list.innerHTML = campaigns.map(c => `
            <tr>
                <td>${c.name}</td>
                <td>$${c.budget.toLocaleString()}</td>
                <td><span class="status-${c.status}">${c.status.toUpperCase()}</span></td>
                <td>${c.start_date}</td>
                <td>
                    <button onclick="deleteCampaign(${c.id})" class="btn-sm btn-danger">DELETE</button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        list.innerHTML = '<tr><td colspan="5">FAILED_TO_LOAD_CAMPAIGNS</td></tr>';
    }
}

async function deleteCampaign(id) {
    if (confirm('CONFIRM_DELETION?')) {
        await fetch(`${API_BASE}/campaigns/${id}`, { method: 'DELETE' });
        loadCampaigns();
        loadStats();
    }
}
