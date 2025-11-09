let isSearching = false;

async function searchChef() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const errorContainer = document.getElementById('errorContainer');
    const resultsContainer = document.getElementById('resultsContainer');
    const searchQuery = searchInput.value.trim();

    if (!searchQuery) {
        errorContainer.innerHTML = '<div class="error-message">❌ Veuillez entrer le nom d\'un chef</div>';
        return;
    }

    if (isSearching) return;
    isSearching = true;

    errorContainer.innerHTML = '';
    resultsContainer.innerHTML = `
        <div class="loading">
            <div style="font-size: 1.5em; margin-bottom: 20px;">🔍 Recherche en cours...</div>
            <div class="spinner"></div>
            <div style="margin-top: 20px; font-size: 1.1em;">L'IA recherche "${searchQuery}" sur le web...</div>
        </div>
    `;

    searchBtn.disabled = true;
    searchBtn.textContent = '⏳ Recherche...';

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 4000,
                tools: [{
                    type: "web_search_20250305",
                    name: "web_search"
                }],
                messages: [{
                    role: 'user',
                    content: `Recherche des informations détaillées sur le chef étoilé "${searchQuery}". 

IMPORTANT: Tu dois répondre UNIQUEMENT avec un objet JSON valide, sans aucun texte avant ou après, sans balises markdown, sans backticks.

Format JSON requis:
{
  "name": "Nom complet du chef",
  "age": 50,
  "stars": 3,
  "totalStars": 5,
  "restaurant": "Nom du restaurant principal, Ville",
  "country": "Pays",
  "specialty": "Type de cuisine",
  "signatureDishes": ["Plat 1", "Plat 2", "Plat 3", "Plat 4"],
  "achievements": "Principales distinctions et réalisations"
}

Informations à rechercher:
- Nom complet et âge exact
- Nombre d'étoiles Michelin actuelles et total dans sa carrière
- Nom du restaurant principal et ville
- Pays d'origine
- Spécialité culinaire
- 4-6 plats signature
- Principales distinctions

Réponds maintenant avec SEULEMENT le JSON, rien d'autre:`
                }]
            })
        });

        const data = await response.json();

        // Extraire le texte de la réponse
        let fullText = '';
        for (const block of data.content) {
            if (block.type === 'text') {
                fullText += block.text;
            }
        }

        console.log('Réponse brute:', fullText);

        // Nettoyer et parser le JSON de manière plus robuste
        let cleanText = fullText.trim();
        
        // Supprimer les balises markdown
        cleanText = cleanText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
        
        // Trouver le premier { et le dernier }
        const firstBrace = cleanText.indexOf('{');
        const lastBrace = cleanText.lastIndexOf('}');
        
        if (firstBrace !== -1 && lastBrace !== -1) {
            cleanText = cleanText.substring(firstBrace, lastBrace + 1);
        }

        console.log('JSON nettoyé:', cleanText);

        const chefData = JSON.parse(cleanText);

        // Générer une image aléatoire de chef
        const imageId = Math.floor(Math.random() * 10) + 1;
        chefData.image = `https://images.unsplash.com/photo-${1577219491135 + imageId * 1000}-ce391730fb2c?w=800&h=500&fit=crop`;

        displayChefResult(chefData);

    } catch (err) {
        console.error('Erreur complète:', err);
        
        let errorMsg = 'Erreur lors de la recherche. ';
        if (err.message.includes('JSON')) {
            errorMsg += 'Problème de format de données. Veuillez réessayer.';
        } else if (err.message.includes('fetch')) {
            errorMsg += 'Problème de connexion. Vérifiez votre connexion internet.';
        } else {
            errorMsg += 'Le chef n\'existe peut-être pas ou essayez un autre nom.';
        }
        
        errorContainer.innerHTML = `
            <div class="error-message">
                ❌ ${errorMsg}
                <br><small>Détails: ${err.message}</small>
            </div>
        `;
        resultsContainer.innerHTML = '';
    } finally {
        isSearching = false;
        searchBtn.disabled = false;
        searchBtn.textContent = '🔍 Rechercher';
    }
}

function displayChefResult(chef) {
    const resultsContainer = document.getElementById('resultsContainer');
    const starsHtml = '⭐'.repeat(Math.min(chef.stars, 3));

    resultsContainer.innerHTML = `
        <div class="chef-card">
            <div class="chef-image-container">
                <img src="${chef.image}" alt="${chef.name}" class="chef-image" 
                     onerror="this.src='https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=800&h=500&fit=crop'">
                <div class="image-overlay"></div>
                <div class="chef-header-info">
                    <div class="chef-name">${chef.name}</div>
                    <div class="chef-country">
                        📍 ${chef.country}
                    </div>
                </div>
                <div class="stars-badge">
                    ${starsHtml}
                </div>
            </div>

            <div class="chef-content">
                <div class="info-grid">
                    <div class="info-card purple">
                        <div class="info-label">👤 Âge</div>
                        <div class="info-value">${chef.age} ans</div>
                    </div>

                    <div class="info-card yellow">
                        <div class="info-label">⭐ Étoiles Michelin</div>
                        <div class="info-value">
                            ${chef.stars} étoile${chef.stars > 1 ? 's' : ''}
                            ${chef.totalStars && chef.totalStars !== chef.stars ? `<br><small>(${chef.totalStars} total carrière)</small>` : ''}
                        </div>
                    </div>

                    <div class="info-card blue">
                        <div class="info-label">🏢 Restaurant</div>
                        <div class="info-value">${chef.restaurant}</div>
                    </div>

                    <div class="info-card green">
                        <div class="info-label">🍳 Spécialité</div>
                        <div class="info-value">${chef.specialty}</div>
                    </div>
                </div>

                <div class="signature-section">
                    <div class="section-title">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/>
                            <line x1="6" y1="17" x2="18" y2="17"/>
                        </svg>
                        Plats Signature
                    </div>
                    <div class="dishes-container">
                        ${chef.signatureDishes.map(dish => `<span class="dish-tag">${dish}</span>`).join('')}
                    </div>
                </div>

                <div class="achievements-section">
                    <div class="section-title">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="8" r="6"/>
                            <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
                        </svg>
                        Distinctions & Réalisations
                    </div>
                    <div class="achievements-text">${chef.achievements}</div>
                </div>
            </div>
        </div>
    `;
}

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('searchInput').focus();
});