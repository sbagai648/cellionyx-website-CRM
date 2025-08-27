// Edit functions for the sales portal
// These functions are added to the portal object

portal.toggleEditMode = function() {
    const viewMode = document.getElementById('infoViewMode');
    const editMode = document.getElementById('infoEditMode');
    const editBtn = document.getElementById('editInfoBtn');
    
    if (editMode && editMode.style.display === 'none') {
        // Enter edit mode
        viewMode.style.display = 'none';
        editMode.style.display = 'grid';
        if (editBtn) editBtn.style.display = 'none';
    } else if (editMode) {
        // Exit edit mode
        viewMode.style.display = 'grid';
        editMode.style.display = 'none';
        if (editBtn) editBtn.style.display = 'block';
    }
};

portal.cancelEdit = function() {
    // Reset fields to original values
    if (this.currentProspect) {
        const fields = {
            'editFirstName': this.currentProspect.first_name || '',
            'editLastName': this.currentProspect.last_name || '',
            'editEmail': this.currentProspect.email || '',
            'editPhone': this.currentProspect.phone || '',
            'editOrganization': this.currentProspect.organization || '',
            'editFunction': this.currentProspect.function_label || this.currentProspect.function_role || '',
            'editDiscipline': this.currentProspect.discipline_label || this.currentProspect.discipline || '',
            'editNotes': this.currentProspect.notes || ''
        };
        
        for (const [id, value] of Object.entries(fields)) {
            const elem = document.getElementById(id);
            if (elem) elem.value = value;
        }
    }
    
    // Exit edit mode
    this.toggleEditMode();
};

portal.saveProspectInfo = async function() {
    // Get updated values
    const updatedData = {
        first_name: document.getElementById('editFirstName')?.value?.trim() || '',
        last_name: document.getElementById('editLastName')?.value?.trim() || '',
        email: document.getElementById('editEmail')?.value?.trim() || '',
        phone: document.getElementById('editPhone')?.value?.trim() || '',
        organization: document.getElementById('editOrganization')?.value?.trim() || '',
        function_label: document.getElementById('editFunction')?.value?.trim() || '',
        discipline_label: document.getElementById('editDiscipline')?.value?.trim() || '',
        notes: document.getElementById('editNotes')?.value?.trim() || ''
    };
    
    // Update local data
    Object.assign(this.currentProspect, updatedData);
    
    // Update display
    const updates = {
        'prospectName': `${updatedData.first_name} ${updatedData.last_name}`,
        'detailEmail': updatedData.email,
        'detailPhone': updatedData.phone || 'No phone',
        'detailOrganization': updatedData.organization || 'No organization',
        'detailFunction': updatedData.function_label || 'Not specified',
        'detailDiscipline': updatedData.discipline_label || 'Not specified',
        'detailNotes': updatedData.notes || 'No notes'
    };
    
    for (const [id, text] of Object.entries(updates)) {
        const elem = document.getElementById(id);
        if (elem) elem.textContent = text;
    }
    
    // Add activity log entry
    const logDiv = document.getElementById('activityLog');
    if (logDiv) {
        const activityHtml = `
            <div class="activity-item">
                <div class="activity-date">${new Date().toLocaleString()}</div>
                <div class="activity-text">Contact information updated</div>
            </div>
        `;
        logDiv.insertAdjacentHTML('afterbegin', activityHtml);
    }
    
    // Exit edit mode
    this.toggleEditMode();
    
    // Update the table row
    if (this.loadProspects) {
        this.loadProspects();
    }
    
    // TODO: Save to backend
    console.log('Saving prospect info:', this.currentProspect?.prospect_id, updatedData);
};
