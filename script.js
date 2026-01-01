// Daily Record Manager - Professional Implementation

import { supabase } from './supabaseClient.js';

export default class DailyRecordManager {
    constructor() {
        this.records = this.loadRecords();
        this.editingId = null;
        this.autoBackupEnabled = this.loadAutoBackupSetting();
        this.storagePreference = this.loadStoragePreference();
        this.backupFrequency = this.loadBackupFrequency();
        this.fileHandle = null; // For File System Access API
        this.user = null;
        this.init();
    }

    init() {
        // Set today's date as default
        document.getElementById('date').valueAsDate = new Date();
        
        // Event listeners
        document.getElementById('recordForm').addEventListener('submit', (e) => this.handleSubmit(e));
        document.getElementById('editForm').addEventListener('submit', (e) => this.handleEditSubmit(e));
        document.getElementById('resetBtn').addEventListener('click', () => this.resetForm());
        document.getElementById('filterCategory').addEventListener('change', () => this.filterRecords());
        document.getElementById('filterStatus').addEventListener('change', () => this.filterRecords());
        document.getElementById('clearAllBtn').addEventListener('click', () => this.clearAllRecords());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportData());
        document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importFile').click());
        document.getElementById('importFile').addEventListener('change', (e) => this.importData(e));
        document.getElementById('storageSettingsBtn').addEventListener('click', () => this.openStorageSettings());
        document.getElementById('saveToPCBtn').addEventListener('click', () => this.saveToPC());
        document.getElementById('autoBackupToggle').addEventListener('change', (e) => this.toggleAutoBackup(e));
        document.getElementById('autoBackupToggle').checked = this.autoBackupEnabled;
        document.getElementById('cancelEditBtn').addEventListener('click', () => this.closeModal());
        document.getElementById('saveSettingsBtn').addEventListener('click', () => this.saveStorageSettings());
        document.getElementById('cancelSettingsBtn').addEventListener('click', () => this.closeStorageSettings());
        document.getElementById('chooseFolderBtn').addEventListener('click', () => this.chooseSaveFolder());
        document.getElementById('saveToPCNowBtn').addEventListener('click', () => this.saveToPC());
        document.querySelector('.close').addEventListener('click', () => this.closeModal());
        document.querySelector('.close-storage').addEventListener('click', () => this.closeStorageSettings());
        // Auth controls
        const openAuthBtn = document.getElementById('openAuthBtn');
        if (openAuthBtn) openAuthBtn.addEventListener('click', () => this.openAuthModal());
        const signOutBtn = document.getElementById('signOutBtn');
        if (signOutBtn) signOutBtn.addEventListener('click', () => this.signOut());
        
        // Update storage status
        this.updateStorageStatus();
        
        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            const editModal = document.getElementById('editModal');
            const storageModal = document.getElementById('storageModal');
            if (e.target === editModal) {
                this.closeModal();
            }
            if (e.target === storageModal) {
                this.closeStorageSettings();
            }
        });

        this.renderRecords();

        // Initialize Supabase auth
        this.initAuth();
    }

    async initAuth() {
        try {
            const { data } = await supabase.auth.getSession();
            this.user = data.session?.user ?? null;
            supabase.auth.onAuthStateChange((event, session) => {
                this.user = session?.user ?? null;
                this.updateAuthUI();
                if (this.user) {
                    // Pull user's records from Supabase and offer to merge/replace
                    this.syncFromSupabase();
                }
            });
            this.updateAuthUI();
        } catch (err) {
            console.error('Auth init error', err);
        }
    }

    updateAuthUI() {
        const signOutBtn = document.getElementById('signOutBtn');
        const userEmail = document.getElementById('userEmail');
        const openAuthBtn = document.getElementById('openAuthBtn');
        if (this.user) {
            if (signOutBtn) signOutBtn.style.display = 'inline-block';
            if (openAuthBtn) openAuthBtn.style.display = 'none';
            if (userEmail) userEmail.textContent = this.user.email;
        } else {
            if (signOutBtn) signOutBtn.style.display = 'none';
            if (openAuthBtn) openAuthBtn.style.display = 'inline-block';
            if (userEmail) userEmail.textContent = '';
        }
    }

    openAuthModal() {
        // Build a simple modal if not present
        if (!document.getElementById('authModal')) {
            const modal = document.createElement('div');
            modal.id = 'authModal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close-auth">&times;</span>
                    <h2>Account</h2>
                    <form id="authForm">
                        <div class="form-group">
                            <label for="authEmail">Email:</label>
                            <input id="authEmail" type="email" required />
                        </div>
                        <div class="form-group">
                            <label for="authPassword">Password:</label>
                            <input id="authPassword" type="password" required />
                        </div>
                        <div class="form-group">
                            <label for="authMode">Mode:</label>
                            <select id="authMode">
                                <option value="login">Login</option>
                                <option value="signup">Sign up</option>
                            </select>
                        </div>
                        <div class="form-actions">
                            <button class="btn btn-primary" type="submit">Continue</button>
                        </div>
                    </form>
                </div>`;
            document.body.appendChild(modal);
            document.querySelector('#authModal .close-auth').addEventListener('click', () => modal.remove());
            document.getElementById('authForm').addEventListener('submit', (e) => this.handleAuthForm(e));
        }
        document.getElementById('authModal').style.display = 'block';
    }

    async handleAuthForm(e) {
        e.preventDefault();
        const email = document.getElementById('authEmail').value;
        const password = document.getElementById('authPassword').value;
        const mode = document.getElementById('authMode').value;
        try {
            if (mode === 'signup') {
                const { data, error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                this.showNotification('Sign-up email sent (check inbox).', 'success');
            } else {
                const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                this.showNotification('Signed in successfully!', 'success');
            }
            document.getElementById('authModal').style.display = 'none';
        } catch (err) {
            console.error(err);
            this.showNotification(err.message || 'Auth error', 'error');
        }
    }

    async signOut() {
        try {
            await supabase.auth.signOut();
            this.user = null;
            this.updateAuthUI();
            this.showNotification('Signed out.', 'success');
        } catch (err) {
            console.error('Sign out error', err);
        }
    }

    handleSubmit(e) {
        e.preventDefault();
        
        const record = {
            id: Date.now().toString(),
            date: document.getElementById('date').value,
            title: document.getElementById('title').value,
            category: document.getElementById('category').value,
            description: document.getElementById('description').value,
            status: document.getElementById('status').value,
            createdAt: new Date().toISOString()
        };

        this.records.unshift(record); // Add to beginning
        this.saveRecords();
        this.renderRecords();
        this.resetForm();
        
        // Show success feedback
        this.showNotification('Record added successfully!', 'success');
    }

    handleEditSubmit(e) {
        e.preventDefault();
        
        const id = document.getElementById('editId').value;
        const recordIndex = this.records.findIndex(r => r.id === id);
        
        if (recordIndex !== -1) {
            this.records[recordIndex] = {
                ...this.records[recordIndex],
                date: document.getElementById('editDate').value,
                title: document.getElementById('editTitle').value,
                category: document.getElementById('editCategory').value,
                description: document.getElementById('editDescription').value,
                status: document.getElementById('editStatus').value,
                updatedAt: new Date().toISOString()
            };
            
            this.saveRecords();
            this.renderRecords();
            this.closeModal();
            this.showNotification('Record updated successfully!', 'success');
        }
    }

    deleteRecord(id) {
        if (confirm('Are you sure you want to delete this record?')) {
            this.records = this.records.filter(r => r.id !== id);
            this.saveRecords();
            this.renderRecords();
            this.showNotification('Record deleted successfully!', 'success');
        }
    }

    editRecord(id) {
        const record = this.records.find(r => r.id === id);
        if (record) {
            document.getElementById('editId').value = record.id;
            document.getElementById('editDate').value = record.date;
            document.getElementById('editTitle').value = record.title;
            document.getElementById('editCategory').value = record.category;
            document.getElementById('editDescription').value = record.description;
            document.getElementById('editStatus').value = record.status;
            
            document.getElementById('editModal').style.display = 'block';
        }
    }

    closeModal() {
        document.getElementById('editModal').style.display = 'none';
        document.getElementById('editForm').reset();
    }

    resetForm() {
        document.getElementById('recordForm').reset();
        document.getElementById('date').valueAsDate = new Date();
    }

    filterRecords() {
        this.renderRecords();
    }

    clearAllRecords() {
        if (confirm('Are you sure you want to delete ALL records? This action cannot be undone.')) {
            this.records = [];
            this.saveRecords();
            this.renderRecords();
            this.showNotification('All records cleared!', 'success');
        }
    }

    renderRecords() {
        const recordsList = document.getElementById('recordsList');
        const recordsCountEl = document.getElementById('recordsCount');
        const filterCategory = document.getElementById('filterCategory').value;
        const filterStatus = document.getElementById('filterStatus').value;
        
        let filteredRecords = this.records;
        
        if (filterCategory) {
            filteredRecords = filteredRecords.filter(r => r.category === filterCategory);
        }
        
        if (filterStatus) {
            filteredRecords = filteredRecords.filter(r => r.status === filterStatus);
        }
        
        // Update records count
        if (recordsCountEl) {
            const count = filteredRecords.length;
            recordsCountEl.textContent = `${count} record${count !== 1 ? 's' : ''}`;
        }
        
        if (filteredRecords.length === 0) {
            recordsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📝</div>
                    <h3>No records found</h3>
                    <p>${this.records.length === 0 ? 'Start by adding your first record above!' : 'Try adjusting your filters to see more records.'}</p>
                </div>
            `;
            return;
        }
        
        recordsList.innerHTML = filteredRecords.map(record => this.createRecordCard(record)).join('');
        
        // Add event listeners to action buttons
        filteredRecords.forEach(record => {
            const editBtn = document.getElementById(`edit-${record.id}`);
            const deleteBtn = document.getElementById(`delete-${record.id}`);
            if (editBtn) editBtn.addEventListener('click', () => this.editRecord(record.id));
            if (deleteBtn) deleteBtn.addEventListener('click', () => this.deleteRecord(record.id));
        });
    }

    createRecordCard(record) {
        const date = new Date(record.date).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
        
        const categoryLabels = {
            work: '💼 Work',
            personal: '👤 Personal',
            health: '🏥 Health',
            learning: '📚 Learning',
            project: '🚀 Project',
            other: '📋 Other'
        };

        const statusIcons = {
            'pending': '⏳',
            'in-progress': '🔄',
            'completed': '✅'
        };

        const statusLabels = {
            'pending': 'Pending',
            'in-progress': 'In Progress',
            'completed': 'Completed'
        };
        
        return `
            <div class="record-card ${record.status.replace(' ', '-')}" data-category="${record.category}">
                <div class="record-header">
                    <div class="record-main-info">
                        <div class="record-title">${this.escapeHtml(record.title)}</div>
                        <div class="record-meta">
                            <span class="record-date">📅 ${date}</span>
                            <span class="category-badge">${categoryLabels[record.category] || record.category}</span>
                            <span class="status-badge status-${record.status.replace('-', '-')}">
                                ${statusIcons[record.status] || ''} ${statusLabels[record.status] || record.status}
                            </span>
                        </div>
                    </div>
                </div>
                <div class="record-description">${this.escapeHtml(record.description)}</div>
                <div class="record-actions">
                    <button class="btn btn-success btn-small" id="edit-${record.id}">
                        <span>✏️</span>
                        <span>Edit</span>
                    </button>
                    <button class="btn btn-danger btn-small" id="delete-${record.id}">
                        <span>🗑️</span>
                        <span>Delete</span>
                    </button>
                </div>
            </div>
        `;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    saveRecords() {
        // Save based on storage preference
        if (this.storagePreference === 'browser' || this.storagePreference === 'both') {
            localStorage.setItem('dailyRecords', JSON.stringify(this.records));
        }
        
        // Save to PC if preference is PC or both
        if ((this.storagePreference === 'pc' || this.storagePreference === 'both') && this.records.length > 0) {
            if (this.storagePreference === 'pc') {
                // Save directly to PC
                this.saveToPCFile();
            } else if (this.autoBackupEnabled) {
                // Auto backup if enabled
                this.autoBackupToPC();
            }
        }
        
        this.updateStorageStatus();

        // If user is signed in, sync to Supabase
        if (this.user) {
            this.saveToSupabase();
        }
    }

    async saveToSupabase() {
        if (!this.user) return;
        try {
            // prepare rows ensuring user_id present
            const rows = this.records.map(r => ({ ...r, user_id: this.user.id }));
            const { error } = await supabase.from('records').upsert(rows, { onConflict: 'id' });
            if (error) console.error('Supabase upsert error', error);
        } catch (err) {
            console.error('Error saving to Supabase', err);
        }
    }

    async syncFromSupabase() {
        if (!this.user) return;
        try {
            const { data, error } = await supabase.from('records').select('*').eq('user_id', this.user.id);
            if (error) {
                console.error('Supabase fetch error', error);
                return;
            }
            if (!data || data.length === 0) return;
            const action = confirm(`Found ${data.length} records in your account. Click OK to MERGE, Cancel to REPLACE local records.`);
            if (action) {
                const existingIds = new Set(this.records.map(r => r.id));
                const newRows = data.filter(d => !existingIds.has(d.id)).map(d => ({ id: d.id, date: d.date, title: d.title, category: d.category, description: d.description, status: d.status, createdAt: d.createdAt }));
                this.records = [...this.records, ...newRows];
                this.saveRecords();
                this.renderRecords();
                this.showNotification(`Merged ${newRows.length} records from cloud.`, 'success');
            } else {
                // Replace local
                this.records = data.map(d => ({ id: d.id, date: d.date, title: d.title, category: d.category, description: d.description, status: d.status, createdAt: d.createdAt }));
                this.saveRecords();
                this.renderRecords();
                this.showNotification(`Replaced local records with ${data.length} records from cloud.`, 'success');
            }
        } catch (err) {
            console.error('Sync error', err);
        }
    }
    
    autoBackupToPC() {
        try {
            // Check backup frequency
            const lastBackup = localStorage.getItem('lastAutoBackup');
            const now = Date.now();
            let shouldBackup = true;
            
            if (lastBackup) {
                const timeSinceLastBackup = now - parseInt(lastBackup);
                const frequencies = {
                    immediate: 0,
                    hourly: 60 * 60 * 1000,
                    daily: 24 * 60 * 60 * 1000,
                    weekly: 7 * 24 * 60 * 60 * 1000
                };
                
                if (timeSinceLastBackup < frequencies[this.backupFrequency]) {
                    shouldBackup = false;
                }
            }
            
            if (!shouldBackup) return;
            
            // Use File System Access API if available and folder chosen
            if (this.fileHandle) {
                this.saveToPCFile();
                return;
            }
            
            // Fallback to download (CSV)
            const dataStr = this.buildCsvContent(this.records);
            const dataBlob = new Blob([dataStr], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(dataBlob);

            const link = document.createElement('a');
            link.href = url;
            const dateStr = new Date().toISOString().split('T')[0];
            const timeStr = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
            link.download = `daily-records-backup-${dateStr}-${timeStr}.csv`;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            // Save backup timestamp
            localStorage.setItem('lastAutoBackup', now.toString());
        } catch (error) {
            console.error('Auto backup failed:', error);
        }
    }
    
    async chooseSaveFolder() {
        try {
            if ('showDirectoryPicker' in window) {
                this.fileHandle = await window.showDirectoryPicker();
                const folderName = this.fileHandle.name;
                document.getElementById('folderPath').textContent = `Selected: ${folderName}`;
                localStorage.setItem('saveFolderHandle', JSON.stringify({ name: folderName }));
                this.showNotification('Folder selected successfully!', 'success');
            } else {
                this.showNotification('File System Access API not supported. Using Downloads folder.', 'success');
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error choosing folder:', error);
                this.showNotification('Could not select folder. Using Downloads folder.', 'error');
            }
        }
    }

    buildCsvContent(records, exportField = 'exportedAt') {
        const headers = [];
        records.forEach(r => Object.keys(r).forEach(k => { if (!headers.includes(k)) headers.push(k); }));
        if (!headers.includes(exportField)) headers.push(exportField);

        const escapeCsv = (val) => {
            if (val === null || val === undefined) return '';
            const s = String(val);
            return '"' + s.replace(/"/g, '""') + '"';
        };

        const nowIso = new Date().toISOString();
        const rows = [];
        rows.push(headers.map(h => escapeCsv(h)).join(','));
        records.forEach(r => {
            const row = headers.map(h => h === exportField ? escapeCsv(nowIso) : escapeCsv(r[h] ?? '')).join(',');
            rows.push(row);
        });
        return rows.join('\r\n');
    }
    
    async saveToPCFile() {
        try {
            const dataStr = this.buildCsvContent(this.records);
            
            // Try to use File System Access API if folder is chosen
            if (this.fileHandle) {
                const dateStr = new Date().toISOString().split('T')[0];
                const fileName = `daily-records-${dateStr}.csv`;

                try {
                    const fileHandle = await this.fileHandle.getFileHandle(fileName, { create: true });
                    const writable = await fileHandle.createWritable();
                    await writable.write(dataStr);
                    await writable.close();
                    this.showNotification('Data saved to PC folder successfully (CSV)!', 'success');
                    return;
                } catch (error) {
                    console.error('Error saving to folder:', error);
                    // Fall through to download method
                }
            }

            // Fallback to download (CSV)
            const dataBlob = new Blob([dataStr], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(dataBlob);

            const link = document.createElement('a');
            link.href = url;
            const dateStr = new Date().toISOString().split('T')[0];
            link.download = `daily-records-${dateStr}.csv`;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            this.showNotification('Data saved to PC (Downloads folder)! (CSV)', 'success');
        } catch (error) {
            console.error('Error saving to PC:', error);
            this.showNotification('Error saving to PC!', 'error');
        }
    }
    
    saveToPC() {
        this.saveToPCFile();
    }
    
    openStorageSettings() {
        const modal = document.getElementById('storageModal');
        modal.style.display = 'block';
        
        // Set current settings
        document.getElementById(`storage${this.storagePreference.charAt(0).toUpperCase() + this.storagePreference.slice(1)}`).checked = true;
        document.getElementById('autoBackupToggle').checked = this.autoBackupEnabled;
        document.getElementById('backupFrequency').value = this.backupFrequency;
        
        // Update stats
        this.updateStorageStats();
        
        // Load saved folder info
        const savedFolder = localStorage.getItem('saveFolderHandle');
        if (savedFolder) {
            try {
                const folderInfo = JSON.parse(savedFolder);
                document.getElementById('folderPath').textContent = `Selected: ${folderInfo.name}`;
            } catch (e) {}
        }
    }
    
    closeStorageSettings() {
        document.getElementById('storageModal').style.display = 'none';
    }
    
    saveStorageSettings() {
        const preference = document.querySelector('input[name="storagePreference"]:checked').value;
        const autoBackup = document.getElementById('autoBackupToggle').checked;
        const frequency = document.getElementById('backupFrequency').value;
        
        this.storagePreference = preference;
        this.autoBackupEnabled = autoBackup;
        this.backupFrequency = frequency;
        
        localStorage.setItem('storagePreference', preference);
        localStorage.setItem('autoBackupEnabled', autoBackup.toString());
        localStorage.setItem('backupFrequency', frequency);
        
        this.updateStorageStatus();
        this.closeStorageSettings();
        this.showNotification('Storage settings saved!', 'success');
    }
    
    loadStoragePreference() {
        return localStorage.getItem('storagePreference') || 'both';
    }
    
    loadBackupFrequency() {
        return localStorage.getItem('backupFrequency') || 'hourly';
    }
    
    updateStorageStats() {
        document.getElementById('statsRecords').textContent = this.records.length;
        document.getElementById('statsBrowser').textContent = 
            (this.storagePreference === 'browser' || this.storagePreference === 'both') ? '✅ Active' : '❌ Disabled';
        document.getElementById('statsPC').textContent = 
            (this.storagePreference === 'pc' || this.storagePreference === 'both') ? '✅ Active' : '❌ Disabled';
        
        const storageSize = new Blob([JSON.stringify(this.records)]).size;
        const sizeKB = (storageSize / 1024).toFixed(2);
        document.getElementById('statsSize').textContent = `${sizeKB} KB`;
    }
    
    toggleAutoBackup(event) {
        this.autoBackupEnabled = event.target.checked;
        localStorage.setItem('autoBackupEnabled', this.autoBackupEnabled.toString());
        this.updateStorageStatus();
        
        if (this.autoBackupEnabled) {
            this.showNotification('Auto backup enabled! Data will be saved to PC automatically.', 'success');
            // Do immediate backup
            if (this.records.length > 0) {
                this.autoBackupToPC();
            }
        } else {
            this.showNotification('Auto backup disabled.', 'success');
        }
    }
    
    loadAutoBackupSetting() {
        const setting = localStorage.getItem('autoBackupEnabled');
        return setting === null ? true : setting === 'true';
    }
    
    updateStorageStatus() {
        const statusEl = document.getElementById('storageStatus');
        const recordCount = this.records.length;
        const storageSize = new Blob([JSON.stringify(this.records)]).size;
        const sizeKB = (storageSize / 1024).toFixed(2);
        
        const storageMode = {
            browser: 'Browser Only',
            pc: 'PC Only',
            both: 'Browser + PC'
        };
        
        statusEl.innerHTML = `
            💾 ${storageMode[this.storagePreference]} | 
            ${recordCount} records (${sizeKB} KB) | 
            Auto Backup: ${this.autoBackupEnabled ? '✅' : '❌'}
        `;
    }

    loadRecords() {
        const stored = localStorage.getItem('dailyRecords');
        return stored ? JSON.parse(stored) : [];
    }

    exportData() {
        if (this.records.length === 0) {
            this.showNotification('No records to export!', 'error');
            return;
        }

        // Build CSV with all record fields + exportedAt column
        const headers = [];
        this.records.forEach(r => {
            Object.keys(r).forEach(k => { if (!headers.includes(k)) headers.push(k); });
        });

        const exportField = 'exportedAt';
        if (!headers.includes(exportField)) headers.push(exportField);

        const escapeCsv = (val) => {
            if (val === null || val === undefined) return '';
            const s = String(val);
            return '"' + s.replace(/"/g, '""') + '"';
        };

        const nowIso = new Date().toISOString();
        const rows = [];
        // header row
        rows.push(headers.map(h => escapeCsv(h)).join(','));

        // data rows
        this.records.forEach(r => {
            const row = headers.map(h => {
                if (h === exportField) return escapeCsv(nowIso);
                return escapeCsv(r[h] ?? '');
            }).join(',');
            rows.push(row);
        });

        const csvContent = rows.join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        const dateStr = new Date().toISOString().split('T')[0];
        link.download = `daily-records-${dateStr}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        this.showNotification(`Exported ${this.records.length} records to CSV successfully!`, 'success');
    }

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                // Handle different data formats
                let recordsToImport = [];
                if (Array.isArray(importedData)) {
                    // If it's just an array of records
                    recordsToImport = importedData;
                } else if (importedData.records && Array.isArray(importedData.records)) {
                    // If it's the exported format with metadata
                    recordsToImport = importedData.records;
                } else {
                    throw new Error('Invalid file format');
                }

                if (recordsToImport.length === 0) {
                    this.showNotification('No records found in file!', 'error');
                    return;
                }

                // Ask user if they want to merge or replace
                const action = confirm(
                    `Found ${recordsToImport.length} records.\n\n` +
                    `Click OK to MERGE with existing records\n` +
                    `Click Cancel to REPLACE all existing records`
                );

                if (action) {
                    // Merge: Add imported records, avoiding duplicates
                    const existingIds = new Set(this.records.map(r => r.id));
                    const newRecords = recordsToImport.filter(r => !existingIds.has(r.id));
                    this.records = [...this.records, ...newRecords];
                    this.showNotification(
                        `Merged ${newRecords.length} new records. ${recordsToImport.length - newRecords.length} duplicates skipped.`,
                        'success'
                    );
                } else {
                    // Replace: Clear existing and use imported
                    this.records = recordsToImport;
                    this.showNotification(`Imported ${recordsToImport.length} records (replaced existing)!`, 'success');
                }

                this.saveRecords();
                this.renderRecords();
                
                // Reset file input
                event.target.value = '';
            } catch (error) {
                this.showNotification('Error importing file: ' + error.message, 'error');
                console.error('Import error:', error);
            }
        };

        reader.onerror = () => {
            this.showNotification('Error reading file!', 'error');
        };

        reader.readAsText(file);
    }

    showNotification(message, type = 'success') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#50c878' : '#e74c3c'};
            color: white;
            padding: 15px 25px;
            border-radius: 6px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideIn 0.3s;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Note: this module exports `DailyRecordManager` so the dashboard page
// can instantiate it when appropriate (see `dashboard.js`).

