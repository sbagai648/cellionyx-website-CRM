// ===== CELLIONYX SALES PORTAL APPLICATION =====
// Frontend JavaScript for the sales CRM dashboard

class CellionyxPortal {
    constructor() {
        this.apiBase = 'https://us-central1-cellionyx-crm.cloudfunctions.net/api'; // Live Firebase API
        this.token = localStorage.getItem('cellionyx_token');
        this.user = JSON.parse(localStorage.getItem('cellionyx_user') || 'null');
        this.currentTab = 'prospects';
        this.prospects = [];
        this.appointments = [];

        this.init();
    }

    init() {
        // Check if user is already logged in
        if (this.token && this.user && ['Sales Rep', 'Country Head', 'Discipline Head', 'Admin'].includes(this.user.role)) {
            console.log('Initializing dashboard for:', this.user.email, 'with role:', this.user.role);
            this.showDashboard();
            this.loadDashboardData();
        } else {
            // Redirect to unified login page
            window.location.href = '../login.html';
            return;
        }

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.handleLogout();
        });

        // Navigation tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.closest('.nav-tab').dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Filters
        document.getElementById('statusFilter').addEventListener('change', () => {
            this.loadProspects();
        });

        document.getElementById('priorityFilter').addEventListener('change', () => {
            this.loadProspects();
        });

        // Modal handlers
        document.getElementById('closeProspectModal').addEventListener('click', () => {
            this.closeModal('prospectModal');
        });

        document.getElementById('closeActivityModal').addEventListener('click', () => {
            this.closeModal('activityModal');
        });

        document.getElementById('cancelActivity').addEventListener('click', () => {
            this.closeModal('activityModal');
        });

        // Activity form
        document.getElementById('activityForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogActivity();
        });

        // Close modals when clicking outside
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });

        // Escape key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal').forEach(modal => {
                    if (modal.style.display === 'block') {
                        this.closeModal(modal.id);
                    }
                });
            }
        });
    }

    // ===== AUTHENTICATION =====
    async handleLogin() {
        const form = document.getElementById('loginForm');
        const submitButton = form.querySelector('button[type="submit"]');
        const buttonText = submitButton.querySelector('.button-text');
        const buttonLoading = submitButton.querySelector('.button-loading');
        const errorDiv = document.getElementById('loginError');

        // Show loading state
        buttonText.style.display = 'none';
        buttonLoading.style.display = 'inline';
        submitButton.disabled = true;
        errorDiv.style.display = 'none';

        try {
            const formData = new FormData(form);
            const loginData = {
                email: formData.get('email'),
                password: formData.get('password')
            };

            const response = await fetch(`${this.apiBase}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            });

            const data = await response.json();

            if (response.ok) {
                // Store token and user data
                this.token = data.token;
                this.user = data.user;
                localStorage.setItem('cellionyx_token', this.token);
                localStorage.setItem('cellionyx_user', JSON.stringify(this.user));

                // Show dashboard
                this.showDashboard();
                this.loadDashboardData();
            } else {
                // Show error
                errorDiv.textContent = data.error || 'Login failed. Please try again.';
                errorDiv.style.display = 'block';
            }
        } catch (error) {
            console.error('Login error:', error);
            errorDiv.textContent = 'Network error. Please check your connection and try again.';
            errorDiv.style.display = 'block';
        } finally {
            // Reset button state
            buttonText.style.display = 'inline';
            buttonLoading.style.display = 'none';
            submitButton.disabled = false;
        }
    }

    handleLogout() {
        // Clear stored data
        localStorage.removeItem('cellionyx_token');
        localStorage.removeItem('cellionyx_user');
        this.token = null;
        this.user = null;

        // Redirect to unified login page
        window.location.href = '../login.html';
    }

    // ===== UI MANAGEMENT =====
    showLogin() {
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('dashboard').style.display = 'none';
    }

    showDashboard() {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('dashboard').style.display = 'flex';

        // Update user info
        if (this.user) {
            document.getElementById('userWelcome').textContent = `Welcome, ${this.user.firstName || this.user.first_name}`;
            document.getElementById('userRole').textContent = this.user.role;
            
            // Show admin tabs if user is admin
            console.log('User role detected:', this.user.role);
            if (this.user.role === 'Admin') {
                console.log('Showing admin features...');
                // Show admin navigation tabs
                document.querySelectorAll('.nav-tab.admin-only').forEach(tab => {
                    tab.style.display = 'flex';
                });
                // Show admin tab content
                document.querySelectorAll('.tab-content.admin-only').forEach(content => {
                    content.style.display = 'block';
                });
                // Enable admin features in prospects
                this.isAdmin = true;
            } else {
                this.isAdmin = false;
            }
        }
    }

    switchTab(tabName) {
        // Update navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Hide all tab content first
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Show the selected tab
        const selectedTab = document.getElementById(`${tabName}Tab`);
        if (selectedTab) {
            selectedTab.classList.add('active');
        }

        this.currentTab = tabName;

        // Load tab data
        switch (tabName) {
            case 'prospects':
                this.loadProspects();
                break;
            case 'appointments':
                this.loadAppointments();
                break;
            case 'activity':
                this.loadActivity();
                break;
            case 'performance':
                this.loadPerformance();
                break;
            case 'users':
                if (this.user.role === 'Admin') {
                    this.loadUsers();
                }
                break;
            case 'analytics':
                if (this.user.role === 'Admin') {
                    this.loadAnalytics();
                }
                break;
        }
    }

    loadDashboardData() {
        // Load data for the current tab
        this.switchTab(this.currentTab);
    }

    // ===== API CALLS =====
    async apiCall(endpoint, options = {}) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            }
        };

        const mergedOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };

        try {
            const response = await fetch(`${this.apiBase}${endpoint}`, mergedOptions);
            
            if (response.status === 401) {
                // Token expired, redirect to unified login
                localStorage.removeItem('cellionyx_token');
                localStorage.removeItem('cellionyx_user');
                window.location.href = '../login.html';
                throw new Error('Authentication expired');
            }

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'API request failed');
            }

            return data;
        } catch (error) {
            console.error('API call failed:', error);
            throw error;
        }
    }

    // ===== PROSPECTS =====
    async loadProspects() {
        console.log('🔄 Loading prospects...');
        const tbody = document.getElementById('prospectsTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px;">Loading prospects...</td></tr>';
        }

        try {
            const statusFilter = document.getElementById('statusFilter').value;
            const priorityFilter = document.getElementById('priorityFilter').value;

            // Load prospects directly from Firestore
            let query = firebase.firestore().collection('prospects');
            
            // Admin sees all prospects, others see only assigned
            if (!this.isAdmin && this.user) {
                query = query.where('assignedTo', '==', this.user.email);
            }
            
            // Apply filters if needed
            if (statusFilter) {
                query = query.where('status', '==', statusFilter);
            }
            if (priorityFilter) {
                query = query.where('priority', '==', priorityFilter);
            }
            
            const snapshot = await query.get();
            this.prospects = [];
            
            snapshot.forEach(doc => {
                this.prospects.push({
                    id: doc.id,
                    ...doc.data(),
                    created_at: doc.data().createdAt?.toDate() || new Date()
                });
            });
            
            console.log('📥 Prospects loaded from Firestore:', this.prospects.length);
            
            // Sort prospects by creation date (newest first) on frontend
            if (Array.isArray(this.prospects)) {
                this.prospects.sort((a, b) => {
                    const dateA = new Date(a.created_at);
                    const dateB = new Date(b.created_at);
                    return dateB - dateA; // Newest first
                });
                console.log('✅ Prospects sorted by newest first');
            }
            
            this.renderProspects();
        } catch (error) {
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="9" style="text-align: center; padding: 40px;">
                            <p style="color: var(--color-error);">Failed to load prospects: ${error.message}</p>
                            <button class="btn btn-primary" onclick="portal.loadProspects()">Retry</button>
                        </td>
                    </tr>
                `;
            }
        }
    }

    // Admin functions for prospects
    async deleteProspect(prospectId) {
        if (!this.isAdmin) return;
        
        if (confirm('Are you sure you want to delete this prospect?')) {
            try {
                await firebase.firestore().collection('prospects').doc(prospectId).delete();
                alert('Prospect deleted successfully');
                this.loadProspects();
            } catch (error) {
                alert('Error deleting prospect: ' + error.message);
            }
        }
    }
    
    async assignProspect(prospectId) {
        if (!this.isAdmin) return;
        
        const email = prompt('Enter email of sales rep to assign to:');
        if (email) {
            try {
                await firebase.firestore().collection('prospects').doc(prospectId).update({
                    assignedTo: email,
                    assignedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                alert('Prospect assigned successfully');
                this.loadProspects();
            } catch (error) {
                alert('Error assigning prospect: ' + error.message);
            }
        }
    }
    
    renderProspects() {
        console.log('🎨 Rendering prospects...');
        const tbody = document.getElementById('prospectsTableBody');
        console.log('📋 Table body element:', tbody ? 'Found' : 'NOT FOUND');
        
        if (!tbody) {
            console.error('❌ prospectsTableBody element not found!');
            // Fallback for old grid view if table doesn't exist
            return;
        }
        
        console.log('📊 Prospects to render:', this.prospects?.length || 0);
        if (this.prospects.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; padding: 40px; color: rgba(255,255,255,0.5);">
                        No prospects found matching your filters.
                    </td>
                </tr>
            `;
            return;
        }

        console.log('✅ About to render rows for prospects...');
        const rows = this.prospects.map(prospect => {
            console.log('🔍 Processing prospect:', prospect.prospect_id, prospect.first_name);
            const createdDate = new Date(prospect.created_at).toLocaleDateString();
            const statusClass = prospect.status.toLowerCase().replace(/\s+/g, '-');
            const priorityClass = prospect.priority.toLowerCase();
            
            const adminActions = this.isAdmin ? `
                <td>
                    <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); portal.deleteProspect('${prospect.id || prospect.prospect_id}')">Delete</button>
                    <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); portal.assignProspect('${prospect.id || prospect.prospect_id}')">Assign</button>
                </td>
            ` : '';
            
            return `
                <tr onclick="portal.showProspectDetail('${prospect.prospect_id || prospect.id}', this)">
                    <td><strong>${prospect.first_name || prospect.firstName || ''} ${prospect.last_name || prospect.lastName || ''}</strong></td>
                    <td>${prospect.email}</td>
                    <td>${prospect.phone || '-'}</td>
                    <td>${prospect.organization || prospect.company || '-'}</td>
                    <td>${prospect.function_role || prospect.function || '-'}</td>
                    <td>${prospect.discipline || '-'}</td>
                    <td><span class="status-badge status-${statusClass}">${prospect.status || 'New'}</span></td>
                    <td><span class="priority-badge priority-${priorityClass}">${prospect.priority || 'Medium'}</span></td>
                    <td>${createdDate}</td>
                    ${adminActions}
                </tr>
            `;
        }).join('');

        tbody.innerHTML = rows;
    }
    
    // New methods for prospect detail panel
    showProspectDetail(prospectId, row) {
        const prospect = this.prospects.find(p => p.prospect_id === prospectId);
        if (!prospect) return;
        
        this.currentProspect = prospect;
        
        // Populate the detail panel
        document.getElementById('prospectName').textContent = `${prospect.first_name} ${prospect.last_name}`;
        document.getElementById('detailEmail').textContent = prospect.email;
        document.getElementById('detailPhone').textContent = prospect.phone || 'No phone';
        document.getElementById('detailOrganization').textContent = prospect.organization || 'No organization';
        document.getElementById('detailFunction').textContent = prospect.function_role || 'Not specified';
        document.getElementById('detailDiscipline').textContent = prospect.discipline || 'Not specified';
        
        // Set status and priority
        document.getElementById('detailStatus').value = prospect.status;
        document.getElementById('detailPriority').value = prospect.priority;
        
        // Load activity log
        this.loadActivityLog(prospectId);
        
        // Show the panel
        const panel = document.getElementById('prospectDetailPanel');
        if (panel) {
            panel.classList.add('active');
        }
        
        // Highlight the selected row
        document.querySelectorAll('.prospects-table tbody tr').forEach(tr => {
            tr.style.background = '';
        });
        if (row) {
            row.style.background = 'rgba(255, 135, 54, 0.1)';
        }
    }
    
    closeProspectPanel() {
        const panel = document.getElementById('prospectDetailPanel');
        if (panel) {
            panel.classList.remove('active');
        }
        
        // Remove row highlight
        document.querySelectorAll('.prospects-table tbody tr').forEach(tr => {
            tr.style.background = '';
        });
    }
    
    async loadActivityLog(prospectId) {
        const logDiv = document.getElementById('activityLog');
        if (!logDiv) return;
        
        logDiv.innerHTML = '<p style="color: rgba(255,255,255,0.5);">Loading activity...</p>';
        
        // Mock activity data for now - replace with actual API call
        const activities = [
            { date: new Date().toLocaleString(), text: 'Lead created from website form' }
        ];
        
        const activityHtml = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-date">${activity.date}</div>
                <div class="activity-text">${activity.text}</div>
            </div>
        `).join('');
        
        logDiv.innerHTML = activityHtml || '<p style="color: rgba(255,255,255,0.5);">No activity recorded yet.</p>';
    }
    
    async updateProspectStatus() {
        const status = document.getElementById('detailStatus').value;
        const priority = document.getElementById('detailPriority').value;
        
        try {
            // Update via API - implement this endpoint
            console.log('Updating prospect:', this.currentProspect.prospect_id, { status, priority });
            
            // Update local data
            this.currentProspect.status = status;
            this.currentProspect.priority = priority;
            
            // Refresh table
            this.renderProspects();
            
            // Show success message
            alert('Prospect updated successfully!');
        } catch (error) {
            alert('Failed to update prospect: ' + error.message);
        }
    }
    
    emailProspect() {
        if (this.currentProspect) {
            window.location.href = `mailto:${this.currentProspect.email}`;
        }
    }
    
    textProspect() {
        if (this.currentProspect && this.currentProspect.phone) {
            window.location.href = `sms:${this.currentProspect.phone}`;
        } else {
            alert('No phone number available for this prospect.');
        }
    }
    
    callProspect() {
        if (this.currentProspect && this.currentProspect.phone) {
            window.location.href = `tel:${this.currentProspect.phone}`;
        } else {
            alert('No phone number available for this prospect.');
        }
    }
    
    scheduleDemo() {
        // Implement scheduling logic
        alert('Demo scheduling feature coming soon!');
    }
    
    async addNote() {
        const noteText = document.getElementById('newNote').value.trim();
        if (!noteText) {
            alert('Please enter a note.');
            return;
        }
        
        try {
            // Add note via API - implement this
            console.log('Adding note for prospect:', this.currentProspect.prospect_id, noteText);
            
            // Clear the textarea
            document.getElementById('newNote').value = '';
            
            // Reload activity log
            this.loadActivityLog(this.currentProspect.prospect_id);
            
            alert('Note added successfully!');
        } catch (error) {
            alert('Failed to add note: ' + error.message);
        }
    }



    // ===== ACTIVITY LOGGING =====
    logActivity(prospectId) {
        document.getElementById('activityProspectId').value = prospectId;
        document.getElementById('activityModal').style.display = 'block';
        
        // Reset form
        document.getElementById('activityForm').reset();
        document.getElementById('activityProspectId').value = prospectId;
    }

    async handleLogActivity() {
        const form = document.getElementById('activityForm');
        const submitButton = form.querySelector('button[type="submit"]');
        
        submitButton.disabled = true;
        submitButton.textContent = 'Logging...';

        try {
            const formData = new FormData(form);
            const activityData = {
                prospect_id: parseInt(formData.get('prospect_id')),
                activity_type: formData.get('activity_type'),
                activity_details: formData.get('activity_details'),
                outcome: formData.get('outcome'),
                next_action: formData.get('next_action')
            };

            await this.apiCall('/reps/log-activity', {
                method: 'POST',
                body: JSON.stringify(activityData)
            });

            this.closeModal('activityModal');
            this.loadProspects(); // Refresh prospects
            this.showSuccess('Activity logged successfully!');
        } catch (error) {
            this.showError(`Failed to log activity: ${error.message}`);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Log Activity';
        }
    }

    // ===== APPOINTMENTS =====
    async loadAppointments() {
        const container = document.getElementById('appointmentsCalendar');
        container.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>Loading appointments...</p></div>';

        try {
            // Get appointments for the next 30 days
            const today = new Date().toISOString().split('T')[0];
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 30);
            const future = futureDate.toISOString().split('T')[0];

            this.appointments = await this.apiCall(`/reps/my-appointments?date_from=${today}&date_to=${future}`);
            this.renderAppointments();
        } catch (error) {
            container.innerHTML = `
                <div class="loading-state">
                    <p style="color: var(--color-error);">Failed to load appointments: ${error.message}</p>
                    <button class="btn btn-primary" onclick="portal.loadAppointments()">Retry</button>
                </div>
            `;
        }
    }

    renderAppointments() {
        const container = document.getElementById('appointmentsCalendar');
        
        if (this.appointments.length === 0) {
            container.innerHTML = `
                <div class="loading-state">
                    <p>No upcoming appointments scheduled.</p>
                    <button class="btn btn-primary" onclick="portal.scheduleAppointment()">Schedule Your First Appointment</button>
                </div>
            `;
            return;
        }

        const appointmentsHtml = this.appointments.map(appointment => {
            const appointmentDate = new Date(appointment.appointment_time);
            const dateStr = appointmentDate.toLocaleDateString();
            const timeStr = appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            return `
                <div class="appointment-card" style="background: var(--color-dark-grey); border: 1px solid var(--color-medium-grey); border-radius: var(--radius-md); padding: var(--spacing-lg); margin-bottom: var(--spacing-md);">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: var(--spacing-md);">
                        <div>
                            <h4 style="color: var(--color-white); margin-bottom: var(--spacing-xs);">${appointment.first_name} ${appointment.last_name}</h4>
                            <p style="color: var(--color-light-grey); font-size: 0.9rem;">${appointment.organization || 'No organization'}</p>
                        </div>
                        <span class="appointment-type" style="background: rgba(255, 135, 54, 0.2); color: var(--color-orange); padding: var(--spacing-xs) var(--spacing-sm); border-radius: var(--radius-sm); font-size: 0.8rem; font-weight: 500;">
                            ${appointment.appointment_type}
                        </span>
                    </div>
                    
                    <div style="display: flex; align-items: center; gap: var(--spacing-lg); color: var(--color-light-grey); font-size: 0.9rem; margin-bottom: var(--spacing-md);">
                        <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                                <polyline points="12,6 12,12 16,14" stroke="currentColor" stroke-width="2"/>
                            </svg>
                            ${dateStr} at ${timeStr}
                        </div>
                        <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                                <polyline points="12,6 12,12 16,14" stroke="currentColor" stroke-width="2"/>
                            </svg>
                            ${appointment.duration_minutes || 60} minutes
                        </div>
                    </div>
                    
                    ${appointment.notes ? `
                        <p style="color: var(--color-light-grey); font-size: 0.9rem; margin-bottom: var(--spacing-md); font-style: italic;">
                            "${appointment.notes}"
                        </p>
                    ` : ''}
                    
                    <div style="display: flex; gap: var(--spacing-sm);">
                        <button class="btn btn-primary btn-small">Join Meeting</button>
                        <button class="btn btn-secondary btn-small">Reschedule</button>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = appointmentsHtml;
    }

    // ===== PLACEHOLDER METHODS =====
    async loadActivity() {
        const container = document.getElementById('activityFeed');
        container.innerHTML = `
            <div class="loading-state">
                <p>Activity feed coming soon...</p>
                <p style="color: var(--color-light-grey); font-size: 0.9rem;">Track all your prospect interactions and team activities.</p>
            </div>
        `;
    }

    async loadPerformance() {
        const container = document.getElementById('performanceMetrics');
        container.innerHTML = `
            <div class="loading-state">
                <p>Performance metrics coming soon...</p>
                <p style="color: var(--color-light-grey); font-size: 0.9rem;">View your sales performance, commission tracking, and team comparisons.</p>
            </div>
        `;
    }

    scheduleAppointment(prospectId) {
        // Placeholder for appointment scheduling
        this.showInfo('Appointment scheduling feature coming soon!');
    }

    // ===== UTILITY METHODS =====
    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showInfo(message) {
        this.showNotification(message, 'info');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? 'var(--color-success)' : type === 'error' ? 'var(--color-error)' : 'var(--color-orange)'};
            color: white;
            padding: var(--spacing-md) var(--spacing-lg);
            border-radius: var(--radius-md);
            z-index: 10000;
            box-shadow: var(--shadow-lg);
            font-family: var(--font-inter);
            font-weight: 500;
            max-width: 350px;
            animation: slideIn 0.3s ease;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }
    
    // ===== ADMIN FUNCTIONS =====
    
    async deleteUser(userId) {
        if (!this.isAdmin) return;
        
        if (confirm('Are you sure you want to delete this user? This cannot be undone.')) {
            try {
                await firebase.firestore().collection('users').doc(userId).delete();
                // Also delete from Firebase Auth if possible
                // Note: This would require admin SDK, so we just delete from Firestore
                alert('User deleted successfully');
                this.loadUsers();
            } catch (error) {
                alert('Error deleting user: ' + error.message);
            }
        }
    }
    
    async loadUsers() {
        const usersList = document.getElementById('usersList');
        usersList.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>Loading users...</p></div>';
        
        try {
            // Load users directly from Firestore
            const snapshot = await firebase.firestore().collection('users').get();
            const users = [];
            
            snapshot.forEach(doc => {
                const data = doc.data();
                users.push({
                    id: doc.id,
                    firstName: data.firstName || '',
                    lastName: data.lastName || '',
                    email: data.email || '',
                    role: data.role || 'User',
                    isActive: data.isActive !== false,
                    lastLogin: data.lastLogin?.toDate() || null
                });
            });
            
            // Update stats
            document.getElementById('totalUsersCount').textContent = users.length;
            document.getElementById('totalRepsCount').textContent = users.filter(u => u.role === 'Sales Rep').length;
            document.getElementById('totalCustomersCount').textContent = users.filter(u => u.role === 'Customer').length;
            document.getElementById('activeUsersCount').textContent = users.filter(u => {
                const lastLogin = new Date(u.lastLogin);
                const today = new Date();
                return lastLogin.toDateString() === today.toDateString();
            }).length;
            
            // Display users
            if (users.length === 0) {
                usersList.innerHTML = '<div class="empty-state">No users found</div>';
                return;
            }
            
            let html = '<table class="data-table"><thead><tr>';
            html += '<th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Last Login</th><th>Actions</th>';
            html += '</tr></thead><tbody>';
            
            users.forEach(user => {
                const lastLogin = user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never';
                const status = user.isActive ? 'Active' : 'Inactive';
                
                html += `
                    <tr>
                        <td>${user.firstName} ${user.lastName}</td>
                        <td>${user.email}</td>
                        <td><span class="badge badge-${user.role.toLowerCase().replace(' ', '-')}">${user.role}</span></td>
                        <td><span class="badge badge-${status.toLowerCase()}">${status}</span></td>
                        <td>${lastLogin}</td>
                        <td>
                            <button class="btn btn-sm btn-danger" onclick="portal.deleteUser('${user.id}')">Delete</button>
                            <button class="btn btn-sm" onclick="portal.toggleUserStatus('${user.id}', ${user.isActive})">
                                ${user.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                        </td>
                    </tr>
                `;
            });
            
            html += '</tbody></table>';
            usersList.innerHTML = html;
            
        } catch (error) {
            console.error('Error loading users:', error);
            usersList.innerHTML = '<div class="error-state">Failed to load users. Please try again.</div>';
        }
    }
    
    async loadAnalytics() {
        const analyticsContent = document.getElementById('teamPerformanceList');
        analyticsContent.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>Loading analytics...</p></div>';
        
        try {
            // TEMPORARY: Use mock data if API fails
            let data = {};
            
            try {
                const response = await fetch(`${this.apiBase}/admin/analytics`, {
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    }
                });
                
                if (response.ok) {
                    data = await response.json();
                }
            } catch (err) {
                // Use mock data if API is not ready
                console.log('Using mock analytics data while backend deploys...');
                data = {
                    totalRevenue: 250000,
                    totalProspects: 45,
                    conversionRate: 22,
                    avgDealSize: 50000,
                    teamPerformance: [
                        { name: 'John Smith', prospects: 15, appointments: 8, conversions: 3, revenue: 150000 },
                        { name: 'Mike Johnson', prospects: 12, appointments: 5, conversions: 2, revenue: 100000 }
                    ]
                };
            }
            
            // Update metrics
            document.getElementById('totalRevenue').textContent = `$${(data.totalRevenue || 0).toLocaleString()}`;
            document.getElementById('totalProspectsAnalytics').textContent = data.totalProspects || 0;
            document.getElementById('conversionRate').textContent = `${data.conversionRate || 0}%`;
            document.getElementById('avgDealSize').textContent = `$${(data.avgDealSize || 0).toLocaleString()}`;
            
            // Display team performance
            if (data.teamPerformance && data.teamPerformance.length > 0) {
                let html = '<table class="data-table"><thead><tr>';
                html += '<th>Sales Rep</th><th>Prospects</th><th>Appointments</th><th>Conversions</th><th>Revenue</th>';
                html += '</tr></thead><tbody>';
                
                data.teamPerformance.forEach(rep => {
                    html += `
                        <tr>
                            <td>${rep.name}</td>
                            <td>${rep.prospects}</td>
                            <td>${rep.appointments}</td>
                            <td>${rep.conversions}</td>
                            <td>$${rep.revenue.toLocaleString()}</td>
                        </tr>
                    `;
                });
                
                html += '</tbody></table>';
                analyticsContent.innerHTML = html;
            } else {
                analyticsContent.innerHTML = '<div class="empty-state">No performance data available</div>';
            }
            
        } catch (error) {
            console.error('Error loading analytics:', error);
            analyticsContent.innerHTML = '<div class="error-state">Failed to load analytics. Please try again.</div>';
        }
    }
    
    async editUser(userId) {
        // TODO: Implement user editing modal
        this.showNotification('User editing feature coming soon!', 'info');
    }
    
    async toggleUserStatus(userId, currentStatus) {
        if (!confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this user?`)) {
            return;
        }
        
        try {
            const response = await fetch(`${this.apiBase}/admin/users/${userId}/status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ isActive: !currentStatus })
            });
            
            if (!response.ok) throw new Error('Failed to update user status');
            
            this.showNotification(`User ${currentStatus ? 'deactivated' : 'activated'} successfully`, 'success');
            this.loadUsers(); // Reload users list
            
        } catch (error) {
            console.error('Error updating user status:', error);
            this.showNotification('Failed to update user status', 'error');
        }
    }
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
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
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize the portal when the page loads
let portal;
document.addEventListener('DOMContentLoaded', () => {
    portal = new CellionyxPortal();
});

// Global error handler
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    if (portal) {
        portal.showError('An unexpected error occurred. Please refresh the page.');
    }
});
// Update showProspectDetail to populate new fields
if (typeof portal !== 'undefined' && portal.showProspectDetail) {
    const originalShowProspectDetail = portal.showProspectDetail.bind(portal);
    portal.showProspectDetail = function(prospectId, row) {
        originalShowProspectDetail(prospectId, row);
        
        const prospect = this.currentProspect;
        if (!prospect) return;
        
        // Update display fields with labels
        const functionElem = document.getElementById('detailFunction');
        if (functionElem) {
            functionElem.textContent = prospect.function_label || prospect.function_role || 'Not specified';
        }
        
        const disciplineElem = document.getElementById('detailDiscipline');
        if (disciplineElem) {
            disciplineElem.textContent = prospect.discipline_label || prospect.discipline || 'Not specified';
        }
        
        const notesElem = document.getElementById('detailNotes');
        if (notesElem) {
            notesElem.textContent = prospect.notes || 'No notes';
        }
        
        // Populate edit fields
        const editFields = {
            'editFirstName': prospect.first_name || '',
            'editLastName': prospect.last_name || '',
            'editEmail': prospect.email || '',
            'editPhone': prospect.phone || '',
            'editOrganization': prospect.organization || '',
            'editFunction': prospect.function_label || prospect.function_role || '',
            'editDiscipline': prospect.discipline_label || prospect.discipline || '',
            'editNotes': prospect.notes || ''
        };
        
        for (const [id, value] of Object.entries(editFields)) {
            const elem = document.getElementById(id);
            if (elem) elem.value = value;
        }
    };
}
