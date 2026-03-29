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
