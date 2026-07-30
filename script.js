// API Configuration
const API_URL = 'http://localhost:3000/api/scrape';

// Form submission handler
document.getElementById('scrapeForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    if (!username) {
        showError('Por favor ingresa un username');
        return;
    }

    await scrapeStories(username);
});

// Main scrape function
async function scrapeStories(username) {
    // Hide previous results/errors
    document.getElementById('resultsCard').style.display = 'none';
    document.getElementById('errorCard').style.display = 'none';

    // Show loading state
    showLoading(true);
    updateLoadingText('Iniciando navegador...');

    try {
        updateLoadingText(`Navegando a @${username}...`);

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.error || 'Error al hacer scraping');
        }

        updateLoadingText('Extracción completada!');
        setTimeout(() => {
            showLoading(false);
            displayResults(result.data);
        }, 500);

    } catch (error) {
        console.error('Scraping error:', error);
        showLoading(false);
        showError(error.message || 'Error al conectar con el servidor. Asegúrate de que el servidor esté corriendo.');
    }
}

// Display results
function displayResults(data) {
    document.getElementById('totalCount').textContent = data.total;
    document.getElementById('imageCount').textContent = data.images;
    document.getElementById('videoCount').textContent = data.videos;

    const container = document.getElementById('imageUrlsContainer');

    if (data.imageUrls.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <p>No se encontraron imágenes en las historias</p>
            </div>
        `;
    } else {
        container.innerHTML = `
            <h3 class="urls-title">🖼️ URLs de Imágenes</h3>
            <div class="urls-list">
                ${data.imageUrls.map((url, index) => `
                    <div class="url-item">
                        <span class="url-label">Imagen ${index + 1}:</span>
                        <div class="url-input-wrapper">
                            <input 
                                type="text" 
                                value="${url}" 
                                readonly 
                                class="url-input"
                                onclick="this.select()"
                            >
                            <button class="copy-url-btn" onclick="copyUrl('${url}', this)">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    document.getElementById('resultsCard').style.display = 'block';
    document.getElementById('resultsCard').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Copy URL to clipboard
function copyUrl(url, button) {
    navigator.clipboard.writeText(url).then(() => {
        const originalHTML = button.innerHTML;
        button.innerHTML = '✓';
        button.style.background = '#4CAF50';

        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.style.background = '';
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
        showNotification('Error al copiar URL');
    });
}

// Show/hide loading state
function showLoading(show) {
    const loadingState = document.getElementById('loadingState');
    const scrapeBtn = document.getElementById('scrapeBtn');

    if (show) {
        loadingState.style.display = 'block';
        scrapeBtn.disabled = true;
        scrapeBtn.style.opacity = '0.6';
    } else {
        loadingState.style.display = 'none';
        scrapeBtn.disabled = false;
        scrapeBtn.style.opacity = '1';
    }
}

// Update loading text
function updateLoadingText(text) {
    document.getElementById('loadingText').textContent = text;
}

// Show error
function showError(message) {
    document.getElementById('errorMessage').textContent = message;
    document.getElementById('errorCard').style.display = 'block';
    document.getElementById('errorCard').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
        color: white;
        padding: 15px 25px;
        border-radius: 12px;
        font-weight: 600;
        font-size: 14px;
        box-shadow: 0 8px 24px rgba(76, 175, 80, 0.4);
        z-index: 10000;
        animation: slideInRight 0.4s ease-out, fadeOut 0.4s ease-out 2.6s;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes fadeOut {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
