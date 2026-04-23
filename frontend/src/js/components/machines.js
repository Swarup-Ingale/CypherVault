// frontend/src/js/components/machines.js
import { ApiClient } from '../api/client.js';

export const MachineRoster = {
    init: () => {
        const refreshBtn = document.getElementById('refresh-roster');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', MachineRoster.scanNetwork);
        }
        // Auto-scan on load
        MachineRoster.scanNetwork();
    },

    scanNetwork: async () => {
        const grid = document.getElementById('machine-grid');
        grid.innerHTML = '<div style="color: var(--accent-green); font-family: var(--font-mono);">Scanning...</div>';

        // In a full production build, this would hit: await ApiClient.request('/secure/machines/all', 'GET');
        // For the UI demonstration of the 1:1 visual match, we render structured data:
        const mockData = [
            { id: '1', name: 'Lame', os: 'Linux', difficulty: 'Easy', points: 20 },
            { id: '2', name: 'Optimum', os: 'Windows', difficulty: 'Easy', points: 20 },
            { id: '3', name: 'Brainfuck', os: 'Linux', difficulty: 'Hard', points: 40 },
            { id: '4', name: 'Forest', os: 'Windows', difficulty: 'Medium', points: 30 }
        ];

        setTimeout(() => {
            grid.innerHTML = '';
            mockData.forEach(machine => {
                grid.appendChild(MachineRoster.createCard(machine));
            });
        }, 800); // Simulate network latency
    },

    createCard: (machine) => {
        const card = document.createElement('div');
        card.className = 'glass-panel machine-card';
        
        let diffClass = 'diff-medium';
        if (machine.difficulty === 'Easy') diffClass = 'diff-easy';
        if (machine.difficulty === 'Hard') diffClass = 'diff-hard';

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <h3 style="color: var(--accent-green); font-family: var(--font-mono); font-size: 1.2rem;">${machine.name}</h3>
                <span class="difficulty-badge ${diffClass}">${machine.difficulty}</span>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px;">
                <div>
                    <div class="data-label">OS</div>
                    <div style="color: var(--text-primary);">${machine.os}</div>
                </div>
                <div>
                    <div class="data-label">Points</div>
                    <div style="color: var(--text-primary);">${machine.points}</div>
                </div>
            </div>
            <div style="margin-top: 15px; border-top: 1px solid var(--border-subtle); padding-top: 15px;">
                <button class="btn-cyber" style="width: 100%; font-size: 0.8rem;" onclick="window.location.href='../dashboard/dashboard.html?id=${machine.id}'">Initialize Target</button>
            </div>
        `;
        return card;
    }
};

document.addEventListener('DOMContentLoaded', MachineRoster.init);