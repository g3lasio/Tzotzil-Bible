document.addEventListener('DOMContentLoaded', function() {
    initializeSettings();
    setupEventListeners();
    setupBackupAndSync();
});

async function updateSettings(type, settings) {
    try {
        const response = await fetch('/settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: type,
                ...settings
            })
        });
        
        const data = await response.json();
        if (data.status === 'success') {
            window.createToast(data.message, 'success');
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error(`Error updating ${type} settings:`, error);
        window.createToast(`Error updating ${type} settings`, 'danger');
        throw error;
    }
}

function initializeSettings() {
    // Theme mode
    const currentTheme = localStorage.getItem('themeMode') || 'dark';
    document.documentElement.setAttribute('data-bs-theme', currentTheme);
    document.querySelector(`input[name="themeMode"][value="${currentTheme}"]`).checked = true;
    
    // Font size
    const fontSize = localStorage.getItem('fontSize') || '16';
    document.documentElement.style.fontSize = fontSize + 'px';
    if (document.getElementById('fontSizeRange')) {
        document.getElementById('fontSizeRange').value = fontSize;
        if (document.getElementById('fontSizeValue')) {
            document.getElementById('fontSizeValue').textContent = fontSize + 'px';
        }
    }
    
    // Reading preferences
    if (document.getElementById('verseNumbers')) {
        document.getElementById('verseNumbers').checked = localStorage.getItem('verseNumbers') !== 'false';
    }
    if (document.getElementById('parallelView')) {
        document.getElementById('parallelView').checked = localStorage.getItem('parallelView') === 'true';
    }
    if (document.getElementById('primaryLanguage')) {
        document.getElementById('primaryLanguage').value = localStorage.getItem('primaryLanguage') || 'tzotzil';
    }
    
    // Language preferences
    if (document.getElementById('languageSelect')) {
        document.getElementById('languageSelect').value = localStorage.getItem('language') || 'es';
    }
    if (document.getElementById('bilingualMode')) {
        document.getElementById('bilingualMode').checked = localStorage.getItem('bilingualMode') === 'true';
    }
}

function setupEventListeners() {
    // Profile form
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            try {
                const response = await fetch('/settings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        type: 'profile',
                        first_name: document.getElementById('profileName').value,
                        phone: document.getElementById('profilePhone').value
                    })
                });
                
                const data = await response.json();
                window.createToast(data.message, data.status === 'success' ? 'success' : 'danger');
            } catch (error) {
                console.error('Error updating profile:', error);
                window.createToast('Error updating profile', 'danger');
            }
        });
    }

    // Theme mode toggles
    const themeToggles = document.querySelectorAll('input[name="themeMode"]');
    themeToggles.forEach(toggle => {
        toggle.addEventListener('change', async function() {
            if (this.checked) {
                const theme = this.value;
                try {
                    document.documentElement.setAttribute('data-bs-theme', theme);
                    localStorage.setItem('themeMode', theme);
                    await updateSettings('appearance', { theme_mode: theme });
                } catch (error) {
                    console.error('Error updating theme:', error);
                }
            }
        });
    });

    // Font size control
    const fontSizeRange = document.getElementById('fontSizeRange');
    if (fontSizeRange) {
        fontSizeRange.addEventListener('input', function() {
            const size = this.value;
            document.getElementById('fontSizeValue').textContent = size + 'px';
        });

        fontSizeRange.addEventListener('change', async function() {
            try {
                const size = this.value;
                document.documentElement.style.fontSize = size + 'px';
                localStorage.setItem('fontSize', size);
                await updateSettings('appearance', { font_size: size });
            } catch (error) {
                console.error('Error updating font size:', error);
            }
        });
    }

    // Reading preferences
    setupReadingPreferences();
    
    // Language preferences
    setupLanguagePreferences();
}

function setupReadingPreferences() {
    const verseNumbers = document.getElementById('verseNumbers');
    const parallelView = document.getElementById('parallelView');
    const primaryLanguage = document.getElementById('primaryLanguage');
    
    if (verseNumbers) {
        verseNumbers.addEventListener('change', async function() {
            try {
                localStorage.setItem('verseNumbers', this.checked);
                await updateSettings('reading', { verse_numbers: this.checked });
            } catch (error) {
                console.error('Error updating verse numbers setting:', error);
                window.createToast('Error updating reading preferences', 'danger');
            }
        });
    }
    
    if (parallelView) {
        parallelView.addEventListener('change', async function() {
            try {
                localStorage.setItem('parallelView', this.checked);
                await updateSettings('reading', { parallel_view: this.checked });
            } catch (error) {
                console.error('Error updating parallel view:', error);
                window.createToast('Error updating reading preferences', 'danger');
            }
        });
    }
    
    if (primaryLanguage) {
        primaryLanguage.addEventListener('change', async function() {
            try {
                localStorage.setItem('primaryLanguage', this.value);
                await updateSettings('reading', { primary_language: this.value });
            } catch (error) {
                console.error('Error updating primary language:', error);
                window.createToast('Error updating reading preferences', 'danger');
            }
        });
    }
}

function setupLanguagePreferences() {
    const languageSelect = document.getElementById('languageSelect');
    const bilingualMode = document.getElementById('bilingualMode');
    
    if (languageSelect) {
        languageSelect.addEventListener('change', async function() {
            try {
                const language = this.value;
                localStorage.setItem('language', language);
                await updateSettings('language', { 
                    language: language,
                    bilingual_mode: bilingualMode.checked 
                });
            } catch (error) {
                console.error('Error updating language:', error);
                window.createToast('Error updating language preferences', 'danger');
            }
        });
    }
    
    if (bilingualMode) {
        bilingualMode.addEventListener('change', async function() {
            try {
                localStorage.setItem('bilingualMode', this.checked);
                await updateSettings('language', { bilingual_mode: this.checked });
            } catch (error) {
                console.error('Error updating bilingual mode:', error);
                window.createToast('Error updating language preferences', 'danger');
            }
        });
    }
}

function setupBackupAndSync() {
    const backupBtn = document.querySelector('[data-action="backup"]');
    const restoreBtn = document.querySelector('[data-action="restore"]');
    
    if (backupBtn) {
        backupBtn.addEventListener('click', function() {
            const settings = {
                themeMode: localStorage.getItem('themeMode'),
                fontSize: localStorage.getItem('fontSize'),
                verseNumbers: localStorage.getItem('verseNumbers'),
                parallelView: localStorage.getItem('parallelView'),
                primaryLanguage: localStorage.getItem('primaryLanguage'),
                language: localStorage.getItem('language'),
                bilingualMode: localStorage.getItem('bilingualMode')
            };
            
            const blob = new Blob([JSON.stringify(settings)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'bible_settings_backup.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.createToast('Settings backed up successfully', 'success');
        });
    }
    
    if (restoreBtn) {
        restoreBtn.addEventListener('click', function() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            
            input.onchange = function(e) {
                const file = e.target.files[0];
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    try {
                        const settings = JSON.parse(e.target.result);
                        Object.entries(settings).forEach(([key, value]) => {
                            localStorage.setItem(key, value);
                        });
                        initializeSettings();
                        window.createToast('Settings restored successfully', 'success');
                    } catch (error) {
                        console.error('Error restoring settings:', error);
                        window.createToast('Error restoring settings', 'danger');
                    }
                };
                
                reader.readAsText(file);
            };
            
            input.click();
        });
    }
}