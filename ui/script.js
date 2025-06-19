document.addEventListener('DOMContentLoaded', function() {
    const auditForm = document.getElementById('auditForm');
    const uploadSection = document.getElementById('uploadSection');
    const loadingSection = document.getElementById('loadingSection');
    const resultsSection = document.getElementById('resultsSection');
    const resultsContent = document.getElementById('resultsContent');
    const fileInput = document.getElementById('fileInput');
    const fileLabel = document.querySelector('.file-input-label');

    // File input handling
    fileInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            const fileName = e.target.files[0].name;
            fileLabel.innerHTML = `<i class="fas fa-file-archive"></i> ${fileName}`;
            fileLabel.style.background = '#667eea';
            fileLabel.style.color = 'white';
            fileLabel.style.borderColor = '#667eea';
        }
    });

    // Form submission
    auditForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!fileInput.files.length) {
            alert('Please select a ZIP file to upload.');
            return;
        }

        // Show loading state
        uploadSection.classList.add('hidden');
        loadingSection.classList.remove('hidden');
        resultsSection.classList.add('hidden');

        // Submit form data
        const formData = new FormData(auditForm);
        
        fetch('/audit', {
            method: 'POST',
            body: formData
        })
        .then(response => response.text())
        .then(data => {
            // Hide loading, show results
            loadingSection.classList.add('hidden');
            resultsSection.classList.remove('hidden');
            
            // Parse and display results
            displayResults(data);
        })
        .catch(error => {
            console.error('Error:', error);
            loadingSection.classList.add('hidden');
            uploadSection.classList.remove('hidden');
            alert('An error occurred during the audit. Please try again.');
        });
    });
});

function displayResults(rawData) {
    const resultsContent = document.getElementById('resultsContent');
    
    // Clean up the raw data (remove HTML tags if present)
    let cleanData = rawData.replace(/<\/?pre>/g, '').trim();
    
    // Check if it's an error message
    if (cleanData.includes('Error:')) {
        resultsContent.innerHTML = `
            <div class="result-category">
                <div class="category-header security">
                    <i class="fas fa-exclamation-triangle"></i>
                    Error During Analysis
                </div>
                <div class="category-content">
                    <div class="result-item">
                        <div class="code-block">${escapeHtml(cleanData)}</div>
                    </div>
                </div>
            </div>
        `;
        return;
    }

    // Parse the AI results
    const categories = parseAuditResults(cleanData);
    
    let html = '';
    
    if (categories.security.length > 0) {
        html += createCategorySection('security', 'Security Issues', 'fas fa-shield-alt', categories.security);
    }
    
    if (categories.architecture.length > 0) {
        html += createCategorySection('architecture', 'Architecture Issues', 'fas fa-sitemap', categories.architecture);
    }
    
    if (categories.bestPractices.length > 0) {
        html += createCategorySection('best-practices', 'Best Practice Violations', 'fas fa-check-circle', categories.bestPractices);
    }
    
    if (categories.improvements.length > 0) {
        html += createCategorySection('improvements', 'Improvement Suggestions', 'fas fa-lightbulb', categories.improvements);
    }
    
    if (categories.general.length > 0) {
        html += createCategorySection('improvements', 'General Analysis', 'fas fa-search', categories.general);
    }

    if (html === '') {
        html = `
            <div class="result-category">
                <div class="category-header best-practices">
                    <i class="fas fa-check-circle"></i>
                    Analysis Complete
                </div>
                <div class="category-content">
                    <div class="result-item">
                        <strong>Great job!</strong> No major issues were found in your code. Here's the full analysis:
                        <div class="code-block">${escapeHtml(cleanData)}</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    resultsContent.innerHTML = html;
}

function parseAuditResults(data) {
    const categories = {
        security: [],
        architecture: [],
        bestPractices: [],
        improvements: [],
        general: []
    };
    
    // Split by bullet points or lines
    const lines = data.split(/[\n\r]+/).filter(line => line.trim());
    
    let currentCategory = 'general';
    
    for (let line of lines) {
        line = line.trim();
        if (!line || line.startsWith('✅') || line.startsWith('🧠') || line.startsWith('🧪')) continue;
        
        // Detect category headers
        if (line.toLowerCase().includes('security') || line.toLowerCase().includes('vulnerability')) {
            currentCategory = 'security';
            continue;
        } else if (line.toLowerCase().includes('architecture')) {
            currentCategory = 'architecture';
            continue;
        } else if (line.toLowerCase().includes('best practice') || line.toLowerCase().includes('practices')) {
            currentCategory = 'bestPractices';
            continue;
        } else if (line.toLowerCase().includes('improvement') || line.toLowerCase().includes('suggestion')) {
            currentCategory = 'improvements';
            continue;
        }
        
        // Clean up bullet points
        line = line.replace(/^[-•*]\s*/, '').trim();
        
        if (line) {
            categories[currentCategory].push(line);
        }
    }
    
    return categories;
}

function createCategorySection(categoryClass, title, icon, items) {
    let itemsHtml = items.map(item => `
        <div class="result-item">
            ${formatResultItem(item)}
        </div>
    `).join('');
    
    return `
        <div class="result-category">
            <div class="category-header ${categoryClass}">
                <i class="${icon}"></i>
                ${title}
            </div>
            <div class="category-content">
                ${itemsHtml}
            </div>
        </div>
    `;
}

function formatResultItem(item) {
    // Check if the item contains code snippets (usually in backticks or indented)
    if (item.includes('`') || item.match(/^\s{2,}/m)) {
        const parts = item.split(/(`[^`]+`)/);
        return parts.map(part => {
            if (part.startsWith('`') && part.endsWith('`')) {
                return `<code class="inline-code">${escapeHtml(part.slice(1, -1))}</code>`;
            }
            return escapeHtml(part);
        }).join('');
    }
    
    return escapeHtml(item);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function resetAudit() {
    const uploadSection = document.getElementById('uploadSection');
    const loadingSection = document.getElementById('loadingSection');
    const resultsSection = document.getElementById('resultsSection');
    const fileInput = document.getElementById('fileInput');
    const fileLabel = document.querySelector('.file-input-label');
    
    // Reset form
    document.getElementById('auditForm').reset();
    fileLabel.innerHTML = '<i class="fas fa-folder-open"></i> Choose ZIP File';
    fileLabel.style.background = '#f8f9fa';
    fileLabel.style.color = '#667eea';
    fileLabel.style.borderColor = '#667eea';
    
    // Show upload section, hide others
    uploadSection.classList.remove('hidden');
    loadingSection.classList.add('hidden');
    resultsSection.classList.add('hidden');
}