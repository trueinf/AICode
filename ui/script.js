document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('audit-form');
    const fileInput = document.getElementById('project-file');
    const fileInfo = document.getElementById('file-info');
    const fileName = document.getElementById('file-name');
    const fileSize = document.getElementById('file-size');
    const submitBtn = document.getElementById('submit-btn');
    const newAuditBtn = document.getElementById('new-audit-btn');
    
    const uploadSection = document.getElementById('upload-section');
    const loadingSection = document.getElementById('loading-section');
    const resultsSection = document.getElementById('results-section');
    const resultsContent = document.getElementById('results-content');

    // File input change handler
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            fileName.textContent = file.name;
            fileSize.textContent = formatFileSize(file.size);
            fileInfo.style.display = 'flex';
            submitBtn.disabled = false;
        } else {
            fileInfo.style.display = 'none';
            submitBtn.disabled = true;
        }
    });

    // Form submission handler
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!fileInput.files[0]) {
            alert('Please select a file first.');
            return;
        }

        // Show loading state
        uploadSection.style.display = 'none';
        loadingSection.style.display = 'block';
        resultsSection.style.display = 'none';

        // Create FormData and submit
        const formData = new FormData();
        formData.append('project', fileInput.files[0]);

        fetch('/audit', {
            method: 'POST',
            body: formData
        })
        .then(response => response.text())
        .then(data => {
            // Hide loading, show results
            loadingSection.style.display = 'none';
            resultsSection.style.display = 'block';
            
            // Parse and display results
            displayResults(data);
        })
        .catch(error => {
            console.error('Error:', error);
            loadingSection.style.display = 'none';
            uploadSection.style.display = 'block';
            alert('An error occurred during analysis. Please try again.');
        });
    });

    // New audit button handler
    newAuditBtn.addEventListener('click', function() {
        // Reset form
        form.reset();
        fileInfo.style.display = 'none';
        submitBtn.disabled = true;
        
        // Show upload section
        resultsSection.style.display = 'none';
        uploadSection.style.display = 'block';
    });

    // Format file size helper
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Display results function
    function displayResults(rawData) {
        // Clean the data (remove HTML tags if present)
        const cleanData = rawData.replace(/<\/?pre>/g, '').trim();
        
        // Parse the AI response
        const categories = parseAIResponse(cleanData);
        
        // Clear previous results
        resultsContent.innerHTML = '';
        
        // Create result categories
        categories.forEach(category => {
            if (category.items.length > 0) {
                const categoryElement = createCategoryElement(category);
                resultsContent.appendChild(categoryElement);
            }
        });

        // If no issues found
        if (categories.every(cat => cat.items.length === 0)) {
            resultsContent.innerHTML = `
                <div class="result-category">
                    <div class="no-issues">
                        <i class="fas fa-check-circle"></i>
                        <h3>Great Job!</h3>
                        <p>No significant issues found in your code. Your project follows good practices!</p>
                    </div>
                </div>
            `;
        }
    }

    // Parse AI response into categories
    function parseAIResponse(data) {
        const categories = [
            { 
                type: 'security', 
                title: 'Security Issues', 
                icon: 'fas fa-shield-alt', 
                items: [],
                keywords: ['security', 'vulnerability', 'exploit', 'injection', 'xss', 'csrf', 'authentication', 'authorization', 'password', 'token', 'encryption']
            },
            { 
                type: 'architecture', 
                title: 'Architecture Issues', 
                icon: 'fas fa-sitemap', 
                items: [],
                keywords: ['architecture', 'structure', 'design', 'pattern', 'coupling', 'cohesion', 'separation', 'modularity', 'dependency']
            },
            { 
                type: 'best-practices', 
                title: 'Best Practice Violations', 
                icon: 'fas fa-exclamation-triangle', 
                items: [],
                keywords: ['best practice', 'convention', 'standard', 'naming', 'formatting', 'style', 'lint', 'code quality', 'maintainability']
            },
            { 
                type: 'improvements', 
                title: 'Improvement Suggestions', 
                icon: 'fas fa-lightbulb', 
                items: [],
                keywords: ['improvement', 'suggestion', 'optimize', 'performance', 'refactor', 'enhance', 'upgrade', 'recommendation']
            }
        ];

        // Split the response into lines and process each
        const lines = data.split('\n').filter(line => line.trim());
        
        lines.forEach(line => {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('-') || trimmedLine.startsWith('•') || trimmedLine.startsWith('*')) {
                const content = trimmedLine.substring(1).trim();
                if (content) {
                    // Categorize based on keywords
                    let categorized = false;
                    const lowerContent = content.toLowerCase();
                    
                    for (const category of categories) {
                        if (category.keywords.some(keyword => lowerContent.includes(keyword))) {
                            category.items.push(content);
                            categorized = true;
                            break;
                        }
                    }
                    
                    // If not categorized, add to improvements as default
                    if (!categorized) {
                        categories[3].items.push(content);
                    }
                }
            }
        });

        return categories;
    }

    // Create category element
    function createCategoryElement(category) {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = `result-category ${category.type}`;
        
        categoryDiv.innerHTML = `
            <div class="category-header">
                <div class="category-icon">
                    <i class="${category.icon}"></i>
                </div>
                <h3 class="category-title">${category.title}</h3>
                <span class="category-count">${category.items.length}</span>
            </div>
            <ul class="result-items">
                ${category.items.map(item => `
                    <li class="result-item">
                        <div class="result-item-icon"></div>
                        <div class="result-item-text">${formatResultText(item)}</div>
                    </li>
                `).join('')}
            </ul>
        `;
        
        return categoryDiv;
    }

    // Format result text (handle code snippets, etc.)
    function formatResultText(text) {
        // Handle code snippets (text between backticks)
        text = text.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
        
        // Handle file paths
        text = text.replace(/([a-zA-Z0-9_-]+\.[a-zA-Z]{2,4})/g, '<strong>$1</strong>');
        
        // Handle function names (text followed by parentheses)
        text = text.replace(/(\w+)\(\)/g, '<strong>$1()</strong>');
        
        return text;
    }
});