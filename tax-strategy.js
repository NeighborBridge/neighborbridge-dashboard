// Tax Strategy & Optimization Dashboard JavaScript

// Data structure
let taxData = {
  transactions: [],
  categories: [
    { id: 'travel', name: 'Travel', color: '#3b82f6', deductible: 100 },
    { id: 'homeoffice', name: 'Home Office', color: '#8b5cf6', deductible: 100 },
    { id: 'communication', name: 'Communication', color: '#06b6d4', deductible: 50 },
    { id: 'software', name: 'Software / Tools', color: '#10b981', deductible: 100 },
    { id: 'professional', name: 'Professional', color: '#f59e0b', deductible: 100 },
    { id: 'startup', name: 'Startup Costs', color: '#ef4444', deductible: 100 }
  ],
  receipts: [],
  weekly_status: {
    current_week: 13,
    completed_items: 0,
    total_items: 5
  },
  alerts: [],
  audit_score: 85,
  last_updated: new Date().toISOString()
};

// Initialize dashboard
function initDashboard() {
  updateLastUpdated();
  loadFromLocalStorage();
  updateWeeklyProgress();
  updateCategoryTotals();
  generateAlerts();
  updateSuccessMetrics();
  
  // Set up drag and drop for receipts
  setupDragAndDrop();
  
  // Set next session slot
  setNextSessionSlot();
}

// Update last updated timestamp
function updateLastUpdated() {
  const now = new Date();
  const options = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  const formatted = now.toLocaleString('en-US', options);
  document.getElementById('last-updated').textContent = `Last updated: ${formatted}`;
  taxData.last_updated = now.toISOString();
}

// Load data from localStorage
function loadFromLocalStorage() {
  const savedData = localStorage.getItem('tax_strategy_data');
  if (savedData) {
    try {
      taxData = JSON.parse(savedData);
      updateUIFromData();
      showNotification('Data loaded from local storage', 'success');
    } catch (e) {
      console.error('Failed to load data:', e);
      showNotification('Failed to load saved data', 'error');
    }
  }
}

// Save data to localStorage
function saveToLocalStorage() {
  try {
    localStorage.setItem('tax_strategy_data', JSON.stringify(taxData));
  } catch (e) {
    console.error('Failed to save data:', e);
    showNotification('Failed to save data', 'error');
  }
}

// Update UI from loaded data
function updateUIFromData() {
  // Update weekly checklist
  const items = ['weekly-item-1', 'weekly-item-2', 'weekly-item-3', 'weekly-item-4', 'weekly-item-5'];
  items.forEach((id, index) => {
    const checkbox = document.getElementById(id);
    if (checkbox) {
      checkbox.checked = index < taxData.weekly_status.completed_items;
    }
  });
  
  updateWeeklyProgress();
  updateCategoryTotals();
  updateTransactionCounts();
  generateAlerts();
  updateSuccessMetrics();
  updateJSONDisplay();
}

// Refresh dashboard
function refreshDashboard() {
  // Show loading state
  const refreshBtn = document.querySelector('button[onclick="refreshDashboard()"]');
  const originalText = refreshBtn.innerHTML;
  refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Refreshing...';
  refreshBtn.disabled = true;
  
  // Simulate API call
  setTimeout(() => {
    updateLastUpdated();
    generateAlerts();
    updateSuccessMetrics();
    
    // Restore button
    refreshBtn.innerHTML = originalText;
    refreshBtn.disabled = false;
    
    showNotification('Dashboard refreshed successfully', 'success');
  }, 1000);
}

// Update weekly progress
function updateWeeklyProgress() {
  const items = ['weekly-item-1', 'weekly-item-2', 'weekly-item-3', 'weekly-item-4', 'weekly-item-5'];
  const completed = items.filter(id => document.getElementById(id)?.checked).length;
  const total = items.length;
  const percentage = Math.round((completed / total) * 100);
  
  taxData.weekly_status.completed_items = completed;
  
  document.getElementById('weekly-completion').textContent = `${percentage}%`;
  document.getElementById('weekly-progress-bar').style.width = `${percentage}%`;
  
  // Update progress bar color
  const progressBar = document.getElementById('weekly-progress-bar');
  if (percentage < 33) {
    progressBar.className = 'bg-red-500 h-2 rounded-full';
  } else if (percentage < 66) {
    progressBar.className = 'bg-yellow-500 h-2 rounded-full';
  } else {
    progressBar.className = 'bg-green-500 h-2 rounded-full';
  }
  
  // Enable/disable complete week button
  const completeBtn = document.getElementById('complete-week-btn');
  completeBtn.disabled = percentage < 100;
  
  saveToLocalStorage();
  updateSuccessMetrics();
}

// Complete weekly checklist
function completeWeeklyChecklist() {
  showNotification('Weekly checklist completed! Data saved.', 'success');
  
  // Log session
  addSessionLog('Completed weekly tax checklist');
  
  // Reset for next week (in a real app, this would archive and create new week)
  setTimeout(() => {
    const items = ['weekly-item-1', 'weekly-item-2', 'weekly-item-3', 'weekly-item-4', 'weekly-item-5'];
    items.forEach(id => {
      const checkbox = document.getElementById(id);
      if (checkbox) checkbox.checked = false;
    });
    updateWeeklyProgress();
    showNotification('Checklist reset for next week', 'info');
  }, 2000);
}

// Add transaction
function addTransaction() {
  const desc = document.getElementById('transaction-desc').value.trim();
  const amount = parseFloat(document.getElementById('transaction-amount').value);
  
  if (!desc || isNaN(amount) || amount <= 0) {
    showNotification('Please enter valid description and amount', 'error');
    return;
  }
  
  const transaction = {
    id: Date.now(),
    description: desc,
    amount: amount,
    date: new Date().toISOString().split('T')[0],
    category: null,
    classification: 'needs_review',
    deductible: true
  };
  
  // Auto-suggest category based on description
  const suggestion = suggestCategory(desc, amount);
  transaction.category = suggestion.category;
  transaction.classification = suggestion.classification;
  
  taxData.transactions.push(transaction);
  
  // Clear inputs
  document.getElementById('transaction-desc').value = '';
  document.getElementById('transaction-amount').value = '';
  
  // Update UI
  updateTransactionCounts();
  updateCategoryTotals();
  generateAlerts();
  updateSuccessMetrics();
  saveToLocalStorage();
  
  showNotification(`Transaction added: ${desc} - $${amount}`, 'success');
  
  // Add deduction suggestion if applicable
  if (suggestion.deductionOpportunity) {
    addDeductionSuggestion(desc, amount, suggestion.category);
  }
}

// Suggest category based on description
function suggestCategory(description, amount) {
  const desc = description.toLowerCase();
  let category = null;
  let classification = 'needs_review';
  let deductionOpportunity = false;
  
  // Travel-related
  if (desc.includes('uber') || desc.includes('lyft') || desc.includes('taxi') || 
      desc.includes('gas') || desc.includes('fuel') || desc.includes('parking') ||
      desc.includes('flight') || desc.includes('hotel') || desc.includes('airbnb')) {
    category = 'travel';
    classification = 'business';
    deductionOpportunity = true;
  }
  // Software/Tools
  else if (desc.includes('zoom') || desc.includes('aws') || desc.includes('github') ||
           desc.includes('slack') || desc.includes('notion') || desc.includes('adobe') ||
           desc.includes('subscription') || desc.includes('software') || desc.includes('app')) {
    category = 'software';
    classification = 'business';
    deductionOpportunity = true;
  }
  // Communication
  else if (desc.includes('phone') || desc.includes('internet') || desc.includes('wifi') ||
           desc.includes('verizon') || desc.includes('att') || desc.includes('comcast')) {
    category = 'communication';
    classification = 'business';
    deductionOpportunity = amount > 50; // Only flag if significant amount
  }
  // Professional
  else if (desc.includes('cme') || desc.includes('conference') || desc.includes('license') ||
           desc.includes('certification') || desc.includes('course') || desc.includes('training')) {
    category = 'professional';
    classification = 'business';
    deductionOpportunity = true;
  }
  // Home Office
  else if (desc.includes('office') || desc.includes('desk') || desc.includes('chair') ||
           desc.includes('printer') || desc.includes('supplies') || desc.includes('ink')) {
    category = 'homeoffice';
    classification = 'business';
    deductionOpportunity = true;
  }
  // Amazon (needs review)
  else if (desc.includes('amazon')) {
    category = null;
    classification = 'needs_review';
    deductionOpportunity = true;
  }
  // Personal (likely)
  else if (desc.includes('groceries') || desc.includes('restaurant') || desc.includes('food') ||
           desc.includes('netflix') || desc.includes('spotify') || desc.includes('entertainment')) {
    category = null;
    classification = 'personal';
    deductionOpportunity = false;
  }
  
  return { category, classification, deductionOpportunity };
}

// Add deduction suggestion
function addDeductionSuggestion(description, amount, category) {
  const suggestionsContainer = document.getElementById('deduction-suggestions');
  
  // Remove placeholder if present
  const placeholder = suggestionsContainer.querySelector('.text-gray-500');
  if (placeholder) placeholder.remove();
  
  const suggestionDiv = document.createElement('div');
  suggestionDiv.className = 'deduction-suggestion p-3 bg-blue-50 rounded-lg';
  suggestionDiv.style.borderLeftColor = '#3b82f6';
  
  suggestionDiv.innerHTML = `
    <div class="flex justify-between items-start">
      <div>
        <div class="font-medium text-gray-800">${description}</div>
        <div class="text-sm text-gray-600">$${amount.toFixed(2)} • Suggested: ${category || 'Review needed'}</div>
      </div>
      <button class="text-blue-600 hover:text-blue-800" onclick="this.parentElement.parentElement.remove()">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="mt-2 text-xs text-blue-700">
      <i class="fas fa-lightbulb mr-1"></i>
      Potential tax deduction opportunity
    </div>
  `;
  
  suggestionsContainer.appendChild(suggestionDiv);
}

// Scan for deductions
function scanForDeductions() {
  // In a real implementation, this would analyze all transactions
  showNotification('Scanning for deduction opportunities...', 'info');
  
  setTimeout(() => {
    // Simulate finding opportunities
    const opportunities = [
      { desc: 'Uber rides to client meetings', amount: 125.50, category: 'travel' },
      { desc: 'AWS hosting charges', amount: 89.99, category: 'software' },
      { desc: 'Professional conference registration', amount: 450.00, category: 'professional' }
    ];
    
    opportunities.forEach(opp => {
      addDeductionSuggestion(opp.desc, opp.amount, opp.category);
    });
    
    showNotification(`Found ${opportunities.length} deduction opportunities`, 'success');
  }, 1500);
}

// Update transaction counts
function updateTransactionCounts() {
  const business = taxData.transactions.filter(t => t.classification === 'business').length;
  const review = taxData.transactions.filter(t => t.classification === 'needs_review').length;
  const personal = taxData.transactions.filter(t => t.classification === 'personal').length;
  
  document.getElementById('business-count').textContent = business;
  document.getElementById('review-count').textContent = review;
  document.getElementById('personal-count').textContent = personal;
}

// Update category totals
function updateCategoryTotals() {
  let ytdTotal = 0;
  let monthlyTotal = 0;
  const currentMonth = new Date().getMonth() + 1;
  
  // Reset all totals
  taxData.categories.forEach(cat => {
    cat.total = 0;
    cat.monthly = 0;
  });
  
  // Calculate totals
  taxData.transactions.forEach(transaction => {
    const amount = transaction.amount;
    const transactionMonth = new Date(transaction.date).getMonth() + 1;
    
    ytdTotal += amount;
    if (transactionMonth === currentMonth) {
      monthlyTotal += amount;
    }
    
    if (transaction.category) {
      const category = taxData.categories.find(c => c.id === transaction.category);
      if (category) {
        category.total += amount;
        if (transactionMonth === currentMonth) {
          category.monthly += amount;
        }
      }
    }
  });
  
  // Update UI
  document.getElementById('ytd-total').textContent = `$${ytdTotal.toFixed(0)}`;
  document.getElementById('ytd-total-display').textContent = `$${ytdTotal.toFixed(2)}`;
  document.getElementById('monthly-total').textContent = `$${monthlyTotal.toFixed(2)}`;
  
  // Update each category
  taxData.categories.forEach(cat => {
    const totalElement = document.getElementById(`${cat.id}-total`);
    const deductibleElement = document.getElementById(`${cat.id}-deductible`);
    
    if (totalElement) {
      totalElement.textContent = `$${cat.total.toFixed(0)}`;
    }
    
    if (deductibleElement) {
      deductibleElement.textContent = `${cat.deductible}%`;
    }
  });
  
  // Calculate deductible percentage
  const deductibleTotal = taxData.transactions
    .filter(t => t.deductible && t.classification === 'business')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const deductiblePercentage = ytdTotal > 0 ? Math.round((deductibleTotal / ytdTotal) * 100) : 0;
  document.getElementById('deductible-percentage').textContent = `${deductiblePercentage}%`;
  
  saveToLocalStorage();
}

// Generate alerts
function generateAlerts() {
  taxData.alerts = [];
  
  // Calculate uncategorized expenses
  const uncategorized = taxData.transactions.filter(t => !t.category && t.classification !== 'personal');
  const uncategorizedTotal = uncategorized.reduce((sum, t) => sum + t.amount, 0);
  
  // Alert 1: Uncategorized expenses
  if (uncategorizedTotal > 500) {
    taxData.alerts.push({
      id: 1,
      title: `High uncategorized expenses: $${uncategorizedTotal.toFixed(2)}`,
      description: 'Review and categorize these transactions for potential deductions',
      priority: 'high',
      type: 'uncategorized'
    });
  } else if (uncategorizedTotal > 100) {
    taxData.alerts.push({
      id: 2,
      title: `Medium uncategorized expenses: $${uncategorizedTotal.toFixed(2)}`,
      description: 'Consider categorizing these transactions',
      priority: 'medium',
      type: 'uncategorized'
    });
  }
  
  // Alert 2: Home office not updated
  const currentMonth = new Date().getMonth() + 1;
  const homeOfficeThisMonth = taxData.transactions.filter(t => 
    t.category === 'homeoffice' && 
    new Date(t.date).getMonth() + 1 === currentMonth
  ).length;
  
  if (homeOfficeThisMonth === 0) {
    taxData.alerts.push({
      id: 3,
      title: 'Home office not updated this month',
      description: 'Consider adding home office expenses for March',
      priority: 'medium',
      type: 'homeoffice'
    });
  }
  
  // Alert 3: No travel logs
  const travelThisMonth = taxData.transactions.filter(t => 
    t.category === 'travel' && 
    new Date(t.date).getMonth() + 1 === currentMonth
  ).length;
  
  if (travelThisMonth === 0) {
    taxData.alerts.push({
      id: 4,
      title: 'No travel logs detected this month',
      description: 'Add travel expenses if you had business travel',
      priority: 'low',
      type: 'travel'
    });
  }
  
  // Alert 4: High personal spend
  const personalTotal = taxData.transactions
    .filter(t => t.classification === 'personal')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const businessTotal = taxData.transactions
    .filter(t => t.classification === 'business')
    .reduce((sum, t) => sum + t.amount, 0);
  
  if (personalTotal > businessTotal * 2) {
    taxData.alerts.push({
      id: 5,
      title: 'High personal spend relative to business',
      description: 'Review for potential business allocation opportunities',
      priority: 'medium',
      type: 'allocation'
    });
  }
  
  // Update UI
  updateAlertsUI();
}

// Update alerts UI
function updateAlertsUI() {
  const container = document.getElementById('alerts-container');
  const countElement = document.getElementById('alert-count');
  
  // Clear container
  container.innerHTML = '';
  
  if (taxData.alerts.length === 0) {
    container.innerHTML = `
      <div class="text-sm text-gray-500 text-center py-4">
        No alerts at the moment. Add transactions to see opportunities.
      </div>
    `;
  } else {
    countElement.textContent = `${taxData.alerts.length} alert${taxData.alerts.length !== 1 ? 's' : ''}`;
    
    // Add each alert
    taxData.alerts.forEach(alert => {
      const alertDiv = document.createElement('div');
      alertDiv.className = `p-4 rounded-lg border-l-4 ${
        alert.priority === 'high' ? 'bg-red-50 border-red-500' :
        alert.priority === 'medium' ? 'bg-yellow-50 border-yellow-500' :
        'bg-blue-50 border-blue-500'
      }`;
      
      alertDiv.innerHTML = `
        <div class="flex justify-between items-start">
          <div>
            <div class="font-medium text-gray-800">${alert.title}</div>
            <div class="text-sm text-gray-600 mt-1">${alert.description}</div>
          </div>
          <span class="text-xs font-medium px-2 py-1 rounded ${
            alert.priority === 'high' ? 'bg-red-100 text-red-800' :
            alert.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-blue-100 text-blue-800'
          }">
            ${alert.priority}
          </span>
        </div>
      `;
      
      container.appendChild(alertDiv);
    });
  }
}

// Update success metrics
function updateSuccessMetrics() {
  // Weekly completion
  const items = ['weekly-item-1', 'weekly-item-2', 'weekly-item-3', 'weekly-item-4', 'weekly-item-5'];
  const completed = items.filter(id => document.getElementById(id)?.checked).length;
  const weeklyPercentage = Math.round((completed / items.length) * 100);
  document.getElementById('weekly-completion-metric').textContent = `${weeklyPercentage}%`;
  
  // Uncategorized expenses
  const uncategorized = taxData.transactions.filter(t => !t.category && t.classification !== 'personal');
  const uncategorizedTotal = uncategorized.reduce((sum, t) => sum + t.amount, 0);
  const totalSpend = taxData.transactions.reduce((sum, t) => sum + t.amount, 0);
  const uncategorizedPercentage = totalSpend > 0 ? Math.round((uncategorizedTotal / totalSpend) * 100) : 0;
  document.getElementById('uncategorized-metric').textContent = `${uncategorizedPercentage}%`;
  
  // Deductions captured
  const businessTransactions = taxData.transactions.filter(t => t.classification === 'business');
  const majorCategories = ['travel', 'homeoffice', 'software', 'professional'];
  const deductionsCaptured = majorCategories.filter(cat => 
    businessTransactions.some(t => t.category === cat)
  ).length;
  document.getElementById('deductions-captured').textContent = deductionsCaptured;
  
  // Audit metric
  document.getElementById('audit-metric').textContent = `${taxData.audit_score}%`;
  document.getElementById('audit-score').textContent = `${taxData.audit_score}%`;
}

// Setup drag and drop for receipts
function setupDragAndDrop() {
  const uploadArea = document.getElementById('receipt-upload-area');
  
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
  });
  
  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
  });
  
  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    handleReceiptUpload(files);
  });
}

// Handle receipt upload (simulated for MVP)
function handleReceiptUpload(files) {
  if (!files || files.length === 0) return;
  
  // In MVP, we just track file names
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    // Check file type
    if (!file.type.match('image.*') && !file.type.match('application/pdf')) {
      showNotification(`Skipped ${file.name}: Only images and PDFs supported`, 'warning');
      continue;
    }
    
    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      showNotification(`Skipped ${file.name}: File too large (max 10MB)`, 'warning');
      continue;
    }
    
    // Add to receipts list
    taxData.receipts.push({
      id: Date.now() + i,
      name: file.name,
      size: file.size,
      type: file.type,
      uploaded: new Date().toISOString(),
      category: null,
      tagged: false
    });
    
    showNotification(`Added receipt: ${file.name}`, 'success');
  }
  
  // Update audit score based on receipts
  updateAuditScore();
  saveToLocalStorage();
}

// Tag receipt
function tagReceipt() {
  const category = document.getElementById('receipt-category').value;
  const date = document.getElementById('receipt-date').value;
  const purpose = document.getElementById('receipt-purpose').value.trim();
  
  if (!purpose) {
    showNotification('Business purpose is required for IRS documentation', 'error');
    return;
  }
  
  // Find untagged receipt
  const untaggedReceipt = taxData.receipts.find(r => !r.tagged);
  
  if (untaggedReceipt) {
    untaggedReceipt.category = category;
    untaggedReceipt.date = date;
    untaggedReceipt.purpose = purpose;
    untaggedReceipt.tagged = true;
    
    showNotification(`Receipt tagged: ${untaggedReceipt.name} → ${category}`, 'success');
    
    // Clear form
    document.getElementById('receipt-purpose').value = '';
    
    // Update audit score
    updateAuditScore();
    saveToLocalStorage();
  } else {
    showNotification('No untagged receipts available', 'info');
  }
}

// Update audit score
function updateAuditScore() {
  let score = 85; // Base score
  
  // Bonus for tagged receipts
  const taggedReceipts = taxData.receipts.filter(r => r.tagged).length;
  score += Math.min(taggedReceipts * 2, 10); // Max +10 for receipts
  
  // Bonus for categorized transactions
  const categorizedTransactions = taxData.transactions.filter(t => t.category).length;
  const totalTransactions = taxData.transactions.length;
  
  if (totalTransactions > 0) {
    const categorizationRate = categorizedTransactions / totalTransactions;
    score += Math.round(categorizationRate * 10); // Max +10 for categorization
  }
  
  // Cap at 100
  taxData.audit_score = Math.min(score, 100);
  
  // Update UI
  document.getElementById('audit-score').textContent = `${taxData.audit_score}%`;
  document.getElementById('audit-metric').textContent = `${taxData.audit_score}%`;
}

// Set next session slot
function setNextSessionSlot() {
  const now = new Date();
  const nextSlot = new Date(now);
  
  // Set to next even hour (2 PM, 4 PM, etc.)
  nextSlot.setHours(14, 0, 0, 0);
  if (nextSlot < now) {
    nextSlot.setDate(nextSlot.getDate() + 1);
  }
  
  const options = { 
    weekday: 'short', 
    hour: 'numeric',
    minute: '2-digit'
  };
  const formatted = nextSlot.toLocaleString('en-US', options);
  document.getElementById('next-slot').textContent = formatted;
}

// Start optimization session
function startOptimizationSession() {
  const sessionBtn = document.querySelector('button[onclick="startOptimizationSession()"]');
  const originalText = sessionBtn.innerHTML;
  
  // Start timer
  let timeLeft = 30 * 60; // 30 minutes in seconds
  sessionBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Session in progress...';
  sessionBtn.disabled = true;
  
  // Update timer display
  const timerDisplay = document.querySelector('.text-4xl.font-bold.text-gray-800');
  const updateTimer = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    if (timeLeft > 0) {
      timeLeft--;
      setTimeout(updateTimer, 1000);
    } else {
      // Session complete
      sessionBtn.innerHTML = originalText;
      sessionBtn.disabled = false;
      timerDisplay.textContent = '30:00';
      
      // Log session
      addSessionLog('Completed 30-min tax optimization session');
      showNotification('Tax optimization session completed!', 'success');
    }
  };
  
  updateTimer();
  addSessionLog('Started 30-min tax optimization session');
}

// Add session log
function addSessionLog(message) {
  const logContainer = document.getElementById('session-log');
  
  // Remove placeholder if present
  const placeholder = logContainer.querySelector('.text-gray-500');
  if (placeholder) placeholder.remove();
  
  const now = new Date();
  const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  
  const logEntry = document.createElement('div');
  logEntry.className = 'text-sm text-gray-700 bg-gray-50 p-2 rounded';
  logEntry.innerHTML = `
    <div class="flex justify-between">
      <span>${message}</span>
      <span class="text-gray-500 text-xs">${timeString}</span>
    </div>
  `;
  
  // Add to top
  logContainer.insertBefore(logEntry, logContainer.firstChild);
  
  // Limit to 5 entries
  const entries = logContainer.querySelectorAll('div.text-sm');
  if (entries.length > 5) {
    entries[entries.length - 1].remove();
  }
}

// Export all data
function exportAllData() {
  const dataStr = JSON.stringify(taxData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  // Create download link
  const downloadLink = document.createElement('a');
  downloadLink.href = URL.createObjectURL(dataBlob);
  downloadLink.download = `tax-strategy-data-${new Date().toISOString().split('T')[0]}.json`;
  
  // Trigger download
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  
  showNotification('Data exported successfully', 'success');
}

// Toggle data view
function toggleDataView() {
  const dataView = document.getElementById('data-structure-view');
  const toggleBtn = document.querySelector('button[onclick="toggleDataView()"]');
  
  if (dataView.classList.contains('hidden')) {
    dataView.classList.remove('hidden');
    toggleBtn.innerHTML = '<i class="fas fa-eye-slash mr-1"></i> Hide';
    updateJSONDisplay();
  } else {
    dataView.classList.add('hidden');
    toggleBtn.innerHTML = '<i class="fas fa-eye mr-1"></i> View';
  }
}

// Update JSON display
function updateJSONDisplay() {
  const jsonElement = document.getElementById('json-data');
  if (jsonElement) {
    jsonElement.textContent = JSON.stringify(taxData, null, 2);
  }
}

// Show notification
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg max-w-sm ${
    type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
    type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
    type === 'warning' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
    'bg-blue-100 text-blue-800 border border-blue-200'
  }`;
  
  notification.innerHTML = `
    <div class="flex items-center">
      <i class="fas ${
        type === 'success' ? 'fa-check-circle' :
        type === 'error' ? 'fa-exclamation-circle' :
        type === 'warning' ? 'fa-exclamation-triangle' :
        'fa-info-circle'
      } mr-2"></i>
      <span>${message}</span>
    </div>
  `;
  
  // Add to body
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.5s';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 500);
  }, 3000);
}

// Initialize on load
window.addEventListener('DOMContentLoaded', initDashboard);

// ============================================
// TAX REDUCTION EXECUTION ENGINE FUNCTIONS
// ============================================

// Initialize tax reduction engine
function initTaxReductionEngine() {
  loadTaxReductionData();
  renderWeeklyActions();
  renderExpenseCategories();
  renderExpenseTable();
  renderTaxAlerts();
  updateWeeklyCompletion();
}

// Load tax reduction data from localStorage
function loadTaxReductionData() {
  const saved = localStorage.getItem('taxReductionData');
  if (saved) {
    try {
      taxData.taxReduction = JSON.parse(saved);
    } catch (e) {
      console.error('Error loading tax reduction data:', e);
      initializeTaxReductionData();
    }
  } else {
    initializeTaxReductionData();
  }
}

// Initialize tax reduction data structure
function initializeTaxReductionData() {
  taxData.taxReduction = {
    weeklyActions: [
      { id: 1, text: "Log all business-related expenses from last 7 days", completed: false, timestamp: null },
      { id: 2, text: "Tag personal vs business transactions", completed: false, timestamp: null },
      { id: 3, text: "Identify any deductible travel or networking activity", completed: false, timestamp: null },
      { id: 4, text: "Review subscriptions that qualify as business expense", completed: false, timestamp: null },
      { id: 5, text: "Estimate current YTD business expenses", completed: false, timestamp: null }
    ],
    expenses: [
      { id: 1, category: 'travel', description: 'Business trip to conference', amount: 450, date: '2026-03-25', deductible: true },
      { id: 2, category: 'software', description: 'Project management tool subscription', amount: 29, date: '2026-03-20', deductible: true },
      { id: 3, category: 'communication', description: 'Business phone line', amount: 45, date: '2026-03-15', deductible: true },
      { id: 4, category: 'professional', description: 'Online course for business skills', amount: 199, date: '2026-03-10', deductible: true },
      { id: 5, category: 'education', description: 'Industry certification', amount: 350, date: '2026-03-05', deductible: true }
    ],
    expenseCategories: [
      { id: 'travel', name: 'Travel', color: '#3b82f6', total: 450, target: 2000 },
      { id: 'phone', name: 'Phone/Internet', color: '#06b6d4', total: 45, target: 1200 },
      { id: 'software', name: 'Software/Subscriptions', color: '#10b981', total: 29, target: 1000 },
      { id: 'education', name: 'Education', color: '#8b5cf6', total: 350, target: 1500 },
      { id: 'professional', name: 'Professional services', color: '#f59e0b', total: 199, target: 2000 }
    ],
    lastUpdated: new Date().toISOString()
  };
  
  saveTaxReductionData();
}

// Save tax reduction data to localStorage
function saveTaxReductionData() {
  localStorage.setItem('taxReductionData', JSON.stringify(taxData.taxReduction));
}

// Render weekly actions
function renderWeeklyActions() {
  const container = document.getElementById('weekly-actions-list');
  if (!container) return;
  
  container.innerHTML = '';
  
  taxData.taxReduction.weeklyActions.forEach(action => {
    const actionElement = document.createElement('div');
    actionElement.className = 'flex items-center justify-between p-3 bg-gray-50 rounded-lg';
    actionElement.innerHTML = `
      <div class="flex items-center">
        <input type="checkbox" id="action-${action.id}" ${action.completed ? 'checked' : ''} 
               onchange="toggleWeeklyAction(${action.id})" 
               class="h-4 w-4 text-blue-600 rounded focus:ring-blue-500">
        <label for="action-${action.id}" class="ml-3 text-sm ${action.completed ? 'text-gray-500 line-through' : 'text-gray-700'}">
          ${action.text}
        </label>
      </div>
      ${action.completed ? `
        <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
          <i class="fas fa-check mr-1"></i>${action.timestamp ? new Date(action.timestamp).toLocaleDateString() : 'Done'}
        </span>
      ` : `
        <span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Pending</span>
      `}
    `;
    container.appendChild(actionElement);
  });
}

// Toggle weekly action completion
function toggleWeeklyAction(actionId) {
  const action = taxData.taxReduction.weeklyActions.find(a => a.id === actionId);
  if (action) {
    action.completed = !action.completed;
    action.timestamp = action.completed ? new Date().toISOString() : null;
    saveTaxReductionData();
    renderWeeklyActions();
    updateWeeklyCompletion();
    renderTaxAlerts();
  }
}

// Update weekly completion progress
function updateWeeklyCompletion() {
  const completed = taxData.taxReduction.weeklyActions.filter(a => a.completed).length;
  const total = taxData.taxReduction.weeklyActions.length;
  const percentage = Math.round((completed / total) * 100);
  
  const completionElement = document.getElementById('weekly-completion');
  const progressBar = document.getElementById('weekly-progress-bar');
  
  if (completionElement) {
    completionElement.textContent = `${completed}/${total}`;
  }
  
  if (progressBar) {
    progressBar.style.width = `${percentage}%`;
    progressBar.className = `h-2 rounded-full ${percentage === 100 ? 'bg-green-500' : percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`;
  }
}

// Calculate ROI
function calculateROI() {
  const input = document.getElementById('deduction-input');
  if (!input) return;
  
  const deduction = parseFloat(input.value) || 1000;
  const taxSaved = deduction * 0.30; // 30% bracket
  
  const resultElement = document.getElementById('roi-result');
  if (resultElement) {
    resultElement.innerHTML = `
      <div class="flex items-center">
        <i class="fas fa-chart-line text-green-600 text-xl mr-3"></i>
        <div>
          <p class="font-bold text-gray-800 text-lg">You save ~$${taxSaved.toFixed(0)} for every $${deduction.toFixed(0)} of deductions</p>
          <p class="text-sm text-gray-600 mt-1">Formula: deduction × 0.30 (30% bracket)</p>
          <p class="text-xs text-gray-500 mt-2">Estimated annual savings: $${(taxSaved * 12).toFixed(0)}</p>
        </div>
      </div>
    `;
  }
}

// Render expense categories
function renderExpenseCategories() {
  const container = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-5.gap-4.mb-4');
  if (!container) return;
  
  container.innerHTML = '';
  
  taxData.taxReduction.expenseCategories.forEach(category => {
    const percentage = Math.min(Math.round((category.total / category.target) * 100), 100);
    const isLowUtilization = percentage < 30;
    
    const categoryElement = document.createElement('div');
    categoryElement.className = `p-4 rounded-lg border ${isLowUtilization ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'}`;
    categoryElement.innerHTML = `
      <div class="flex justify-between items-center mb-2">
        <span class="font-medium text-gray-800">${category.name}</span>
        <span class="text-xs px-2 py-1 rounded-full" style="background-color: ${category.color}20; color: ${category.color}">
          ${percentage}%
        </span>
      </div>
      <div class="text-2xl font-bold text-gray-800">$${category.total}</div>
      <div class="text-sm text-gray-500 mt-1">Target: $${category.target}</div>
      <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
        <div class="h-2 rounded-full" style="width: ${percentage}%; background-color: ${category.color}"></div>
      </div>
      ${isLowUtilization ? `
        <div class="mt-2 text-xs text-red-600">
          <i class="fas fa-exclamation-triangle mr-1"></i>Low utilization
        </div>
      ` : ''}
    `;
    container.appendChild(categoryElement);
  });
}

// Render expense table
function renderExpenseTable() {
  const container = document.getElementById('expense-table');
  if (!container) return;
  
  if (taxData.taxReduction.expenses.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-gray-500">
        <i class="fas fa-receipt text-3xl mb-3"></i>
        <p>No expenses logged yet</p>
        <p class="text-sm mt-2">Click "Add Expense" to get started</p>
      </div>
    `;
    return;
  }
  
  let html = `
    <table class="min-w-full divide-y divide-gray-200">
      <thead>
        <tr>
          <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
          <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
          <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
          <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
          <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-200">
  `;
  
  taxData.taxReduction.expenses.forEach(expense => {
    const category = taxData.taxReduction.expenseCategories.find(c => c.id === expense.category);
    html += `
      <tr class="hover:bg-gray-50">
        <td class="px-4 py-3 text-sm text-gray-700">${expense.date}</td>
        <td class="px-4 py-3 text-sm text-gray-800">${expense.description}</td>
        <td class="px-4 py-3 text-sm">
          <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium" 
                style="background-color: ${category?.color || '#6b7280'}20; color: ${category?.color || '#6b7280'}">
            ${category?.name || expense.category}
          </span>
        </td>
        <td class="px-4 py-3 text-sm font-medium text-gray-900">$${expense.amount}</td>
        <td class="px-4 py-3 text-sm">
          <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <i class="fas fa-check mr-1"></i>Deductible
          </span>
        </td>
      </tr>
    `;
  });
  
  html += `
      </tbody>
    </table>
  `;
  
  container.innerHTML = html;
}

// Add new expense
function addExpense() {
  // For MVP, add a sample expense
  const newExpense = {
    id: taxData.taxReduction.expenses.length + 1,
    category: 'professional',
    description: 'Business consultation fee',
    amount: 150,
    date: new Date().toISOString().split('T')[0],
    deductible: true
  };
  
  taxData.taxReduction.expenses.unshift(newExpense);
  
  // Update category total
  const category = taxData.taxReduction.expenseCategories.find(c => c.id === newExpense.category);
  if (category) {
    category.total += newExpense.amount;
  }
  
  saveTaxReductionData();
  renderExpenseCategories();
  renderExpenseTable();
  renderTaxAlerts();
  
  showNotification('Expense added successfully!', 'success');
}

// Render tax alerts
function renderTaxAlerts() {
  const container = document.getElementById('tax-alerts');
  if (!container) return;
  
  const alerts = [];
  
  // Check for no expenses this week
  const today = new Date();
  const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recentExpenses = taxData.taxReduction.expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate >= oneWeekAgo;
  });
  
  if (recentExpenses.length === 0) {
    alerts.push({
      type: 'warning',
      icon: 'fa-exclamation-triangle',
      text: 'No expenses logged this week',
      details: 'Log at least 3 business expenses to maintain tax leverage'
    });
  }
  
  // Check for low business activity
  const totalExpenses = taxData.taxReduction.expenses.reduce((sum, exp) => sum + exp.amount, 0);
  if (totalExpenses < 1000) {
    alerts.push({
      type: 'warning',
      icon: 'fa-chart-line',
      text: 'Business activity too low to generate tax leverage',
      details: 'Consider increasing deductible activities'
    });
  }
  
  // Check for incomplete weekly actions
  const completedActions = taxData.taxReduction.weeklyActions.filter(a => a.completed).length;
  if (completedActions < 2) {
    alerts.push({
      type: 'info',
      icon: 'fa-tasks',
      text: 'Weekly tax actions incomplete',
      details: `${completedActions}/5 actions completed this week`
    });
  }
  
  // Check for low utilization categories
  const lowUtilizationCategories = taxData.taxReduction.expenseCategories.filter(c => {
    const percentage = Math.round((c.total / c.target) * 100);
    return percentage < 30;
  });
  
  if (lowUtilizationCategories.length > 0) {
    alerts.push({
      type: 'info',
      icon: 'fa-chart-pie',
      text: `${lowUtilizationCategories.length} categories underutilized`,
      details: 'Consider increasing expenses in these categories'
    });
  }
  
  // If no alerts, show positive message
  if (alerts.length === 0) {
    alerts.push({
      type: 'success',
      icon: 'fa-check-circle',
      text: 'Tax strategy on track',
      details: 'All systems operational'
    });
  }
  
  container.innerHTML = '';
  alerts.forEach(alert => {
    const alertElement = document.createElement('div');
    alertElement.className = `flex items-start p-3 rounded-lg ${
      alert.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
      alert.type === 'info' ? 'bg-blue-50 border border-blue-200' :
      'bg-green-50 border border-green-200'
    }`;
    alertElement.innerHTML = `
      <i class="fas ${alert.icon} mt-1 mr-3 ${
        alert.type === 'warning' ? 'text-yellow-600' :
        alert.type === 'info' ? 'text-blue-600' :
        'text-green-600'
      }"></i>
      <div>
        <p class="font-medium text-gray-800">${alert.text}</p>
        <p class="text-sm text-gray-600 mt-1">${alert.details}</p>
      </div>
    `;
    container.appendChild(alertElement);
  });
}

// Initialize tax reduction engine on dashboard load
document.addEventListener('DOMContentLoaded', function() {
  // Initialize main dashboard
  initDashboard();
  
  // Initialize tax reduction engine
  initTaxReductionEngine();
  
  // Set week number
  const weekNumberElement = document.getElementById('week-number');
  if (weekNumberElement) {
    const today = new Date();
    const start = new Date(today.getFullYear(), 0, 1);
    const days = Math.floor((today - start) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + 1) / 7);
    weekNumberElement.textContent = `Week ${weekNumber}`;
  }
  
  // Initialize ROI calculator
  calculateROI();
});
