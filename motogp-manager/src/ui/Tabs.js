// Tabs.js - Handles navigation tab switching & pane visibility

export class TabsManager {
    static init() {
        const navButtons = document.querySelectorAll('.nav-btn');
        const panes = document.querySelectorAll('.tab-pane');

        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.getAttribute('data-tab');

                // Toggle button active classes
                navButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Toggle pane active classes
                panes.forEach(pane => {
                    if (pane.id === `pane-${targetTab}`) {
                        pane.classList.add('active');
                    } else {
                        pane.classList.remove('active');
                    }
                });
            });
        });
    }
}
