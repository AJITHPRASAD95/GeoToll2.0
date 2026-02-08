// API Base URL
const API_URL = '/api';


// Global variables
let currentUserId = null;
let allUsers = [];
let allVehicles = [];
let allGeofences = [];
let allTransactions = [];

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    loadDashboardStats();
});

// Navigation
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const pageName = item.getAttribute('data-page');
            switchPage(pageName);
        });
    });
}

function switchPage(pageName) {
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-page="${pageName}"]`).classList.add('active');

    // Update pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageName).classList.add('active');

    // Load page data
    loadPageData(pageName);
}

function loadPageData(pageName) {
    switch(pageName) {
        case 'dashboard':
            loadDashboardStats();
            break;
        case 'users':
            loadUsers();
            break;
        case 'vehicles':
            loadVehicles();
            break;
        case 'geofences':
            loadGeofences();
            break;
        case 'transactions':
            loadTransactions();
            break;
    }
}

// Dashboard Functions
async function loadDashboardStats() {
    try {
        // Load counts
        const [usersRes, vehiclesRes, geofencesRes, statsRes] = await Promise.all([
            fetch(`${API_URL}/users`),
            fetch(`${API_URL}/vehicles`),
            fetch(`${API_URL}/geofences`),
            fetch(`${API_URL}/transactions/stats`)
        ]);

        const users = await usersRes.json();
        const vehicles = await vehiclesRes.json();
        const geofences = await geofencesRes.json();
        const stats = await statsRes.json();

        document.getElementById('totalUsers').textContent = users.data.length;
        document.getElementById('totalVehicles').textContent = vehicles.data.length;
        document.getElementById('totalGeofences').textContent = geofences.data.length;
        document.getElementById('totalRevenue').textContent = `₹${stats.data.totalRevenue.toFixed(2)}`;

        // Load recent transactions
        const transRes = await fetch(`${API_URL}/transactions`);
        const transactions = await transRes.json();
        displayRecentTransactions(transactions.data.slice(0, 10));

    } catch (error) {
        console.error('Error loading dashboard:', error);
        showNotification('Error loading dashboard data', 'error');
    }
}

function displayRecentTransactions(transactions) {
    const container = document.getElementById('recentTransactions');
    
    if (transactions.length === 0) {
        container.innerHTML = '<p class="loading">No transactions yet</p>';
        return;
    }

    container.innerHTML = transactions.map(t => `
        <div class="transaction-item">
            <div class="transaction-details">
                <h4>${t.vehicleID?.registrationNo || 'N/A'} - ${t.zoneID?.name || 'N/A'}</h4>
                <p>${formatDate(t.timestamp)}</p>
            </div>
            <div>
                <span class="status-badge status-${t.status}">${t.status}</span>
                <div class="transaction-amount">₹${t.amount.toFixed(2)}</div>
            </div>
        </div>
    `).join('');
}

// Users Functions
async function loadUsers() {
    try {
        const response = await fetch(`${API_URL}/users`);
        const data = await response.json();
        allUsers = data.data;
        displayUsers(allUsers);
    } catch (error) {
        console.error('Error loading users:', error);
        showNotification('Error loading users', 'error');
    }
}

function displayUsers(users) {
    const tbody = document.getElementById('usersTableBody');
    
    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading">No users found</td></tr>';
        return;
    }

    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.mobile}</td>
            <td>₹${user.walletBalance.toFixed(2)}</td>
            <td>${user.vehicles.length}</td>
            <td class="action-buttons">
                <button onclick="rechargeWallet('${user._id}', ${user.walletBalance})" class="btn btn-success btn-sm">Recharge</button>
                <button onclick="editUser('${user._id}')" class="btn btn-primary btn-sm">Edit</button>
                <button onclick="deleteUser('${user._id}')" class="btn btn-danger btn-sm">Delete</button>
            </td>
        </tr>
    `).join('');
}

function searchUsers() {
    const searchTerm = document.getElementById('userSearch').value.toLowerCase();
    const filtered = allUsers.filter(user => 
        user.name.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm) ||
        user.mobile.includes(searchTerm)
    );
    displayUsers(filtered);
}

function openUserModal() {
    document.getElementById('userModalTitle').textContent = 'Add User';
    document.getElementById('userForm').reset();
    currentUserId = null;
    document.getElementById('userModal').style.display = 'block';
}

function closeUserModal() {
    document.getElementById('userModal').style.display = 'none';
}

async function saveUser(event) {
    event.preventDefault();
    
    const userData = {
        name: document.getElementById('userName').value,
        email: document.getElementById('userEmail').value,
        mobile: document.getElementById('userMobile').value,
        walletBalance: parseFloat(document.getElementById('userWallet').value)
    };

    try {
        const url = currentUserId ? `${API_URL}/users/${currentUserId}` : `${API_URL}/users`;
        const method = currentUserId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (data.success) {
            showNotification(`User ${currentUserId ? 'updated' : 'added'} successfully`, 'success');
            closeUserModal();
            loadUsers();
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        console.error('Error saving user:', error);
        showNotification('Error saving user', 'error');
    }
}

async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
        const response = await fetch(`${API_URL}/users/${userId}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            showNotification('User deleted successfully', 'success');
            loadUsers();
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        showNotification('Error deleting user', 'error');
    }
}

// Wallet Recharge
function rechargeWallet(userId, currentBalance) {
    currentUserId = userId;
    document.getElementById('currentBalance').value = `₹${currentBalance.toFixed(2)}`;
    document.getElementById('rechargeAmount').value = '';
    document.getElementById('rechargeModal').style.display = 'block';
}

function closeRechargeModal() {
    document.getElementById('rechargeModal').style.display = 'none';
}

async function processRecharge(event) {
    event.preventDefault();
    
    const amount = parseFloat(document.getElementById('rechargeAmount').value);

    try {
        const response = await fetch(`${API_URL}/users/${currentUserId}/recharge`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount })
        });

        const data = await response.json();

        if (data.success) {
            showNotification(data.message, 'success');
            closeRechargeModal();
            loadUsers();
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        console.error('Error recharging wallet:', error);
        showNotification('Error recharging wallet', 'error');
    }
}

// Vehicles Functions
async function loadVehicles() {
    try {
        const response = await fetch(`${API_URL}/vehicles`);
        const data = await response.json();
        allVehicles = data.data;
        displayVehicles(allVehicles);

        // Load users for dropdown
        const usersResponse = await fetch(`${API_URL}/users`);
        const usersData = await usersResponse.json();
        populateUserDropdown(usersData.data);
    } catch (error) {
        console.error('Error loading vehicles:', error);
        showNotification('Error loading vehicles', 'error');
    }
}

function displayVehicles(vehicles) {
    const tbody = document.getElementById('vehiclesTableBody');
    
    if (vehicles.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading">No vehicles found</td></tr>';
        return;
    }

    tbody.innerHTML = vehicles.map(vehicle => `
        <tr>
            <td><strong>${vehicle.registrationNo}</strong></td>
            <td>${vehicle.userID?.name || 'N/A'}</td>
            <td>${vehicle.vehicleType}</td>
            <td>${vehicle.deviceID}</td>
            <td><span class="status-badge status-${vehicle.isActive ? 'active' : 'inactive'}">${vehicle.isActive ? 'Active' : 'Inactive'}</span></td>
            <td class="action-buttons">
                <button onclick="deleteVehicle('${vehicle._id}')" class="btn btn-danger btn-sm">Delete</button>
            </td>
        </tr>
    `).join('');
}

function searchVehicles() {
    const searchTerm = document.getElementById('vehicleSearch').value.toLowerCase();
    const filtered = allVehicles.filter(vehicle => 
        vehicle.registrationNo.toLowerCase().includes(searchTerm) ||
        vehicle.deviceID.toLowerCase().includes(searchTerm) ||
        vehicle.userID?.name.toLowerCase().includes(searchTerm)
    );
    displayVehicles(filtered);
}

function populateUserDropdown(users) {
    const select = document.getElementById('vehicleOwner');
    select.innerHTML = '<option value="">Select User</option>' + 
        users.map(user => `<option value="${user._id}">${user.name} (${user.email})</option>`).join('');
}

function openVehicleModal() {
    document.getElementById('vehicleModalTitle').textContent = 'Add Vehicle';
    document.getElementById('vehicleForm').reset();
    document.getElementById('vehicleModal').style.display = 'block';
}

function closeVehicleModal() {
    document.getElementById('vehicleModal').style.display = 'none';
}

async function saveVehicle(event) {
    event.preventDefault();
    
    const vehicleData = {
        userID: document.getElementById('vehicleOwner').value,
        registrationNo: document.getElementById('vehicleRegNo').value.toUpperCase(),
        deviceID: document.getElementById('vehicleDeviceID').value,
        vehicleType: document.getElementById('vehicleType').value,
        manufacturer: document.getElementById('vehicleManufacturer').value,
        model: document.getElementById('vehicleModel').value,
        color: document.getElementById('vehicleColor').value
    };

    try {
        const response = await fetch(`${API_URL}/vehicles`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(vehicleData)
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Vehicle added successfully', 'success');
            closeVehicleModal();
            loadVehicles();
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        console.error('Error saving vehicle:', error);
        showNotification('Error saving vehicle', 'error');
    }
}

async function deleteVehicle(vehicleId) {
    if (!confirm('Are you sure you want to delete this vehicle?')) return;

    try {
        const response = await fetch(`${API_URL}/vehicles/${vehicleId}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Vehicle deleted successfully', 'success');
            loadVehicles();
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        console.error('Error deleting vehicle:', error);
        showNotification('Error deleting vehicle', 'error');
    }
}

// Geofences Functions
async function loadGeofences() {
    try {
        const response = await fetch(`${API_URL}/geofences`);
        const data = await response.json();
        allGeofences = data.data;
        displayGeofences(allGeofences);
    } catch (error) {
        console.error('Error loading geo-fences:', error);
        showNotification('Error loading geo-fences', 'error');
    }
}

function displayGeofences(geofences) {
    const tbody = document.getElementById('geofencesTableBody');
    
    if (geofences.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading">No geo-fences found</td></tr>';
        return;
    }

    tbody.innerHTML = geofences.map(gf => `
        <tr>
            <td><strong>${gf.name}</strong></td>
            <td><span class="status-badge ${gf.type === 'toll' ? 'status-success' : 'status-failed'}">${gf.type}</span></td>
            <td>${gf.coordinates.length} points</td>
            <td>${gf.type === 'toll' ? `₹${gf.tollAmount}` : gf.alertMessage || 'N/A'}</td>
            <td><span class="status-badge status-${gf.isActive ? 'active' : 'inactive'}">${gf.isActive ? 'Active' : 'Inactive'}</span></td>
            <td class="action-buttons">
                <button onclick="toggleGeofenceStatus('${gf._id}')" class="btn btn-warning btn-sm">Toggle</button>
                <button onclick="deleteGeofence('${gf._id}')" class="btn btn-danger btn-sm">Delete</button>
            </td>
        </tr>
    `).join('');
}

function filterGeofences() {
    const type = document.getElementById('geofenceTypeFilter').value;
    const filtered = type ? allGeofences.filter(gf => gf.type === type) : allGeofences;
    displayGeofences(filtered);
}

function openGeofenceModal() {
    document.getElementById('geofenceModalTitle').textContent = 'Add Geo-fence';
    document.getElementById('geofenceForm').reset();
    document.getElementById('geofenceModal').style.display = 'block';
}

function closeGeofenceModal() {
    document.getElementById('geofenceModal').style.display = 'none';
}

function toggleGeofenceFields() {
    const type = document.getElementById('geofenceType').value;
    const tollGroup = document.getElementById('tollAmountGroup');
    const severityGroup = document.getElementById('severityGroup');
    const alertGroup = document.getElementById('alertMessageGroup');

    if (type === 'toll') {
        tollGroup.style.display = 'block';
        severityGroup.style.display = 'none';
        alertGroup.style.display = 'none';
    } else if (type === 'danger') {
        tollGroup.style.display = 'none';
        severityGroup.style.display = 'block';
        alertGroup.style.display = 'block';
    } else {
        tollGroup.style.display = 'none';
        severityGroup.style.display = 'none';
        alertGroup.style.display = 'none';
    }
}

async function saveGeofence(event) {
    event.preventDefault();
    
    const coordinatesText = document.getElementById('geofenceCoordinates').value;
    const coordinates = coordinatesText.trim().split('\n').map(line => {
        const [lon, lat] = line.trim().split(',').map(Number);
        return [lon, lat];
    });

    const type = document.getElementById('geofenceType').value;
    
    const geofenceData = {
        name: document.getElementById('geofenceName').value,
        type: type,
        description: document.getElementById('geofenceDescription').value,
        coordinates: coordinates,
        speedLimit: parseInt(document.getElementById('geofenceSpeedLimit').value) || null
    };

    if (type === 'toll') {
        geofenceData.tollAmount = parseFloat(document.getElementById('geofenceTollAmount').value);
    } else {
        geofenceData.severity = document.getElementById('geofenceSeverity').value;
        geofenceData.alertMessage = document.getElementById('geofenceAlertMessage').value;
    }

    try {
        const response = await fetch(`${API_URL}/geofences`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(geofenceData)
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Geo-fence added successfully', 'success');
            closeGeofenceModal();
            loadGeofences();
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        console.error('Error saving geo-fence:', error);
        showNotification('Error saving geo-fence', 'error');
    }
}

async function toggleGeofenceStatus(geofenceId) {
    try {
        const response = await fetch(`${API_URL}/geofences/${geofenceId}/toggle`, {
            method: 'PATCH'
        });

        const data = await response.json();

        if (data.success) {
            showNotification(data.message, 'success');
            loadGeofences();
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        console.error('Error toggling geo-fence:', error);
        showNotification('Error toggling geo-fence status', 'error');
    }
}

async function deleteGeofence(geofenceId) {
    if (!confirm('Are you sure you want to delete this geo-fence?')) return;

    try {
        const response = await fetch(`${API_URL}/geofences/${geofenceId}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Geo-fence deleted successfully', 'success');
            loadGeofences();
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        console.error('Error deleting geo-fence:', error);
        showNotification('Error deleting geo-fence', 'error');
    }
}

// Transactions Functions
async function loadTransactions() {
    try {
        const response = await fetch(`${API_URL}/transactions`);
        const data = await response.json();
        allTransactions = data.data;
        displayTransactions(allTransactions);
    } catch (error) {
        console.error('Error loading transactions:', error);
        showNotification('Error loading transactions', 'error');
    }
}

function displayTransactions(transactions) {
    const tbody = document.getElementById('transactionsTableBody');
    
    if (transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading">No transactions found</td></tr>';
        return;
    }

    tbody.innerHTML = transactions.map(t => `
        <tr>
            <td>${formatDate(t.timestamp)}</td>
            <td>${t.vehicleID?.registrationNo || 'N/A'}</td>
            <td>${t.zoneID?.name || 'N/A'}</td>
            <td>₹${t.amount.toFixed(2)}</td>
            <td><span class="status-badge status-${t.status}">${t.status}</span></td>
            <td>${t.remarks || '-'}</td>
        </tr>
    `).join('');
}

function filterTransactions() {
    const status = document.getElementById('transactionStatusFilter').value;
    const filtered = status ? allTransactions.filter(t => t.status === status) : allTransactions;
    displayTransactions(filtered);
}

// Utility Functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showNotification(message, type = 'info') {
    alert(message); // Simple alert for now
    // You can implement a better notification system here
}

// Close modals when clicking outside
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}
