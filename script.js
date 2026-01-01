// Daily Record Manager - Professional Implementation

class DailyRecordManager {
    constructor() {
        this.records = this.loadRecords();
        this.editingId = null;
        this.autoBackupEnabled = this.loadAutoBackupSetting();
        this.storagePreference = this.loadStoragePreference();
        this.backupFrequency = this.loadBackupFrequency();
        this.fileHandle = null; // For File System Access API
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
        const filterCategory = document.getElementById('filterCategory').value;
        const filterStatus = document.getElementById('filterStatus').value;
        
        let filteredRecords = this.records;
        
        if (filterCategory) {
            filteredRecords = filteredRecords.filter(r => r.category === filterCategory);
        }
        
        if (filterStatus) {
            filteredRecords = filteredRecords.filter(r => r.status === filterStatus);
        }
        
        if (filteredRecords.length === 0) {
            recordsList.innerHTML = '<p class="empty-message">No records found. Add your first record above!</p>';
            return;
        }
        
        recordsList.innerHTML = filteredRecords.map(record => this.createRecordCard(record)).join('');
        
        // Add event listeners to action buttons
        filteredRecords.forEach(record => {
            document.getElementById(`edit-${record.id}`).addEventListener('click', () => this.editRecord(record.id));
            document.getElementById(`delete-${record.id}`).addEventListener('click', () => this.deleteRecord(record.id));
        });
    }

    createRecordCard(record) {
        const date = new Date(record.date).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
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
        
        return `
            <div class="record-card ${record.status}">
                <div class="record-header">
                    <div>
                        <div class="record-title">${this.escapeHtml(record.title)}</div>
                        <div class="record-meta">
                            <span>📅 ${date}</span>
                            <span class="category-badge">${categoryLabels[record.category] || record.category}</span>
                            <span class="status-badge status-${record.status.replace('-', '-')}">${record.status.replace('-', ' ')}</span>
                        </div>
                    </div>
                </div>
                <div class="record-description">${this.escapeHtml(record.description)}</div>
                <div class="record-actions">
                    <button class="btn btn-success btn-small" id="edit-${record.id}">Edit</button>
                    <button class="btn btn-danger btn-small" id="delete-${record.id}">Delete</button>
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

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new DailyRecordManager();
});

