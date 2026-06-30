/**
 * POKÉDEX - Classe Principal
 * Gerencia API, estado e renderização
 */

class Pokedex {
    constructor() {
        this.apiBase = 'https://pokeapi.co/api/v2';
        this.pokemonList = [];
        this.filteredList = [];
        this.favorites = [];
        this.currentPage = 1;
        this.limit = 20;
        this.totalCount = 0;
        this.isLoading = false;
        this.currentPokemon = null;

        // DOM Elements
        this.grid = document.getElementById('pokemonGrid');
        this.loading = document.getElementById('loading');
        this.loadMoreBtn = document.getElementById('loadMoreBtn');
        this.searchInput = document.getElementById('searchInput');
        this.searchBtn = document.getElementById('searchBtn');
        this.typeFilter = document.getElementById('typeFilter');
        this.sortFilter = document.getElementById('sortFilter');
        this.modal = document.getElementById('pokemonModal');
        this.modalBody = document.getElementById('modalBody');
        this.favoritesModal = document.getElementById('favoritesModal');
        this.favoritesGrid = document.getElementById('favoritesGrid');
        this.favoritesCount = document.getElementById('favoritesCount');
        this.favoritesToggle = document.getElementById('favoritesToggle');
        this.favoritesClose = document.getElementById('favoritesClose');

        this.init();
    }

    async init() {
        this.loadFavorites();
        this.updateFavoritesCount();
        await this.loadPokemon();
        this.setupEventListeners();
        console.log('🔄 Pokédex inicializada!');
    }

    // ============================================
    // API REQUESTS
    // ============================================
    async fetchPokemonList(offset = 0, limit = 20) {
        try {
            const response = await fetch(
                `${this.apiBase}/pokemon?offset=${offset}&limit=${limit}`
            );
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Erro ao buscar lista:', error);
            return null;
        }
    }

    async fetchPokemonDetails(url) {
        try {
            const response = await fetch(url);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Erro ao buscar detalhes:', error);
            return null;
        }
    }

    async fetchPokemonByName(name) {
        try {
            const response = await fetch(`${this.apiBase}/pokemon/${name.toLowerCase()}`);
            if (!response.ok) throw new Error('Pokémon não encontrado');
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Erro ao buscar Pokémon:', error);
            return null;
        }
    }

    async fetchEvolutionChain(url) {
        try {
            const response = await fetch(url);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Erro ao buscar evolução:', error);
            return null;
        }
    }

    async fetchSpecies(url) {
        try {
            const response = await fetch(url);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Erro ao buscar espécie:', error);
            return null;
        }
    }

    // ============================================
    // LOAD POKEMON
    // ============================================
    async loadPokemon(loadMore = false) {
        if (this.isLoading) return;
        this.isLoading = true;
        this.loading.classList.add('active');

        try {
            const offset = loadMore ? this.pokemonList.length : 0;
            const data = await this.fetchPokemonList(offset, this.limit);
            
            if (!data) {
                this.showToast('Erro ao carregar Pokémon');
                return;
            }

            this.totalCount = data.count;

            // Carregar detalhes
            const promises = data.results.map(pokemon => 
                this.fetchPokemonDetails(pokemon.url)
            );
            const details = await Promise.all(promises);

            const newPokemon = details
                .filter(p => p !== null)
                .map(p => this.formatPokemonData(p));

            if (loadMore) {
                this.pokemonList = [...this.pokemonList, ...newPokemon];
            } else {
                this.pokemonList = newPokemon;
            }

            this.filteredList = [...this.pokemonList];
            this.renderPokemon();

            // Atualizar botão
            if (this.pokemonList.length >= this.totalCount) {
                this.loadMoreBtn.disabled = true;
                this.loadMoreBtn.innerHTML = '<i class="fas fa-check"></i> Todos carregados';
            } else {
                this.loadMoreBtn.disabled = false;
                this.loadMoreBtn.innerHTML = '<i class="fas fa-plus"></i> Carregar Mais';
            }

        } catch (error) {
            console.error('Erro ao carregar Pokémon:', error);
            this.showToast('Erro ao carregar Pokémon');
        } finally {
            this.isLoading = false;
            this.loading.classList.remove('active');
        }
    }

    formatPokemonData(data) {
        return {
            id: data.id,
            name: data.name,
            types: data.types.map(t => t.type.name),
            sprite: data.sprites.other['official-artwork'].front_default || 
                   data.sprites.front_default,
            height: data.height / 10,
            weight: data.weight / 10,
            stats: data.stats.map(s => ({
                name: s.stat.name,
                value: s.base_stat
            })),
            abilities: data.abilities.map(a => a.ability.name),
            speciesUrl: data.species.url,
            isFavorite: this.isFavorite(data.id)
        };
    }

    // ============================================
    // RENDER
    // ============================================
    renderPokemon(pokemonList = null) {
        const list = pokemonList || this.filteredList;
        
        if (list.length === 0) {
            this.grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-muted);">
                    <i class="fas fa-search" style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;"></i>
                    <h3 style="margin-bottom: 8px; color: var(--text-secondary);">Nenhum Pokémon encontrado</h3>
                    <p>Tente ajustar sua busca ou filtros</p>
                </div>
            `;
            return;
        }

        this.grid.innerHTML = list.map(pokemon => `
            <div class="pokemon-card" data-id="${pokemon.id}" onclick="pokedex.openDetail(${pokemon.id})">
                <span class="card-number">#${String(pokemon.id).padStart(3, '0')}</span>
                <button class="card-favorite ${pokemon.isFavorite ? 'active' : ''}" 
                        onclick="event.stopPropagation(); pokedex.toggleFavorite(${pokemon.id})">
                    <i class="fas fa-star"></i>
                </button>
                <div class="card-image">
                    <img src="${pokemon.sprite}" alt="${pokemon.name}" loading="lazy">
                </div>
                <div class="card-name">${this.capitalize(pokemon.name)}</div>
                <div class="card-types">
                    ${pokemon.types.map(type => `
                        <span class="type-badge type-${type}">${type}</span>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    // ============================================
    // DETAIL MODAL
    // ============================================
    async openDetail(id) {
        const pokemon = this.pokemonList.find(p => p.id === id);
        if (!pokemon) {
            this.showToast('Pokémon não encontrado');
            return;
        }

        this.currentPokemon = pokemon;
        this.modalBody.innerHTML = '<div class="loading active"><div class="pokeball-loader"></div><p>Carregando...</p></div>';
        this.modal.classList.add('active');

        // Buscar dados adicionais
        const species = await this.fetchSpecies(pokemon.speciesUrl);
        let evolutionChain = null;
        
        if (species && species.evolution_chain) {
            evolutionChain = await this.fetchEvolutionChain(species.evolution_chain.url);
        }

        this.renderDetail(pokemon, evolutionChain);
    }

    renderDetail(pokemon, evolutionChain) {
        const maxStat = 255;
        
        this.modalBody.innerHTML = `
            <div class="pokemon-detail">
                <div class="detail-header">
                    <span class="detail-number">#${String(pokemon.id).padStart(3, '0')}</span>
                    <button class="detail-favorite-btn ${pokemon.isFavorite ? 'active' : ''}" 
                            onclick="pokedex.toggleFavorite(${pokemon.id}); pokedex.renderDetail(pokedex.currentPokemon, null)">
                        <i class="fas fa-star"></i>
                    </button>
                </div>
                <div class="detail-image">
                    <img src="${pokemon.sprite}" alt="${pokemon.name}">
                </div>
                <h2 class="detail-name">${this.capitalize(pokemon.name)}</h2>
                <div class="detail-types">
                    ${pokemon.types.map(type => `
                        <span class="type-badge type-${type}">${type}</span>
                    `).join('')}
                </div>
                <div class="detail-stats">
                    ${pokemon.stats.map(stat => `
                        <div class="detail-stat">
                            <div class="stat-label">${this.getStatName(stat.name)}</div>
                            <div class="stat-value">${stat.value}</div>
                            <div class="stat-bar">
                                <div class="stat-bar-fill" style="width: ${(stat.value / maxStat) * 100}%; background: ${this.getStatColor(stat.value, maxStat)};"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="detail-abilities">
                    <h4>Habilidades</h4>
                    <div class="abilities-list">
                        ${pokemon.abilities.map(ability => `
                            <span class="ability-tag">${this.capitalize(ability.replace('-', ' '))}</span>
                        `).join('')}
                    </div>
                </div>
                ${this.renderEvolutionChain(evolutionChain)}
            </div>
        `;
    }

    renderEvolutionChain(chain) {
        if (!chain || !chain.chain) return '';

        const evolutions = this.getEvolutionChain(chain.chain);
        if (evolutions.length <= 1) return '';

        return `
            <div class="detail-evolutions">
                <h4>Evoluções</h4>
                <div class="evolutions-chain">
                    ${evolutions.map((evo, index) => `
                        ${index > 0 ? '<span class="evolution-arrow">→</span>' : ''}
                        <div class="evolution-item" onclick="pokedex.searchPokemon('${evo.name}')">
                            <img src="${evo.sprite || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/0.png'}" alt="${evo.name}" loading="lazy">
                            <span>${this.capitalize(evo.name)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    getEvolutionChain(chain, evolutions = []) {
        const name = chain.species.name;
        const sprite = this.pokemonList.find(p => p.name === name)?.sprite || 
                      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${this.getPokemonId(name)}.png`;
        
        evolutions.push({ name, sprite });

        if (chain.evolves_to.length > 0) {
            this.getEvolutionChain(chain.evolves_to[0], evolutions);
        }

        return evolutions;
    }

    getPokemonId(name) {
        const pokemon = this.pokemonList.find(p => p.name === name);
        return pokemon ? pokemon.id : '0';
    }

    // ============================================
    // FAVORITES
    // ============================================
    toggleFavorite(id) {
        const index = this.favorites.indexOf(id);
        if (index > -1) {
            this.favorites.splice(index, 1);
            this.showToast('⭐ Removido dos favoritos');
        } else {
            this.favorites.push(id);
            this.showToast('⭐ Adicionado aos favoritos');
        }
        
        this.saveFavorites();
        this.updateFavoritesCount();
        
        // Atualizar cards
        this.pokemonList.forEach(p => {
            if (p.id === id) {
                p.isFavorite = this.isFavorite(id);
            }
        });
        
        this.renderPokemon();
        
        // Se o modal estiver aberto, atualizar
        if (this.currentPokemon && this.currentPokemon.id === id) {
            this.currentPokemon.isFavorite = this.isFavorite(id);
            // Re-renderizar modal
            this.renderDetail(this.currentPokemon, null);
        }
    }

    isFavorite(id) {
        return this.favorites.includes(id);
    }

    loadFavorites() {
        try {
            const saved = localStorage.getItem('pokedexFavorites');
            this.favorites = saved ? JSON.parse(saved) : [];
        } catch (error) {
            this.favorites = [];
        }
    }

    saveFavorites() {
        try {
            localStorage.setItem('pokedexFavorites', JSON.stringify(this.favorites));
        } catch (error) {
            console.error('Erro ao salvar favoritos:', error);
        }
    }

    updateFavoritesCount() {
        this.favoritesCount.textContent = this.favorites.length;
    }

    // ============================================
    // FAVORITES MODAL
    // ============================================
    openFavorites() {
        const favoritesList = this.pokemonList.filter(p => this.isFavorite(p.id));
        
        if (favoritesList.length === 0) {
            this.favoritesGrid.innerHTML = `
                <div class="favorite-empty">
                    <i class="fas fa-star"></i>
                    <p>Você ainda não tem Pokémon favoritos</p>
                    <p style="font-size: 14px; margin-top: 8px;">Explore a Pokédex e adicione seus favoritos! ⭐</p>
                </div>
            `;
        } else {
            this.favoritesGrid.innerHTML = favoritesList.map(pokemon => `
                <div class="pokemon-card" onclick="pokedex.closeFavorites(); pokedex.openDetail(${pokemon.id})">
                    <span class="card-number">#${String(pokemon.id).padStart(3, '0')}</span>
                    <button class="card-favorite active" 
                            onclick="event.stopPropagation(); pokedex.toggleFavorite(${pokemon.id}); pokedex.openFavorites();">
                        <i class="fas fa-star"></i>
                    </button>
                    <div class="card-image">
                        <img src="${pokemon.sprite}" alt="${pokemon.name}" loading="lazy">
                    </div>
                    <div class="card-name">${this.capitalize(pokemon.name)}</div>
                    <div class="card-types">
                        ${pokemon.types.map(type => `
                            <span class="type-badge type-${type}">${type}</span>
                        `).join('')}
                    </div>
                </div>
            `).join('');
        }
        
        this.favoritesModal.classList.add('active');
    }

    closeFavorites() {
        this.favoritesModal.classList.remove('active');
    }

    // ============================================
    // SEARCH & FILTERS
    // ============================================
    searchPokemon(name) {
        this.searchInput.value = name;
        this.applyFilters();
    }

    applyFilters() {
        const query = this.searchInput.value.toLowerCase().trim();
        const type = this.typeFilter.value;
        const sort = this.sortFilter.value;

        let filtered = [...this.pokemonList];

        // Search by name or id
        if (query) {
            filtered = filtered.filter(p => 
                p.name.includes(query) || 
                p.id.toString() === query
            );
        }

        // Filter by type
        if (type) {
            filtered = filtered.filter(p => 
                p.types.includes(type)
            );
        }

        // Sort
        if (sort === 'id') {
            filtered.sort((a, b) => a.id - b.id);
        } else if (sort === 'name') {
            filtered.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sort === 'weight') {
            filtered.sort((a, b) => a.weight - b.weight);
        } else if (sort === 'height') {
            filtered.sort((a, b) => a.height - b.height);
        }

        this.filteredList = filtered;
        this.renderPokemon();
    }

    // ============================================
    // UTILITÁRIOS
    // ============================================
    capitalize(text) {
        return text.charAt(0).toUpperCase() + text.slice(1);
    }

    getStatName(stat) {
        const names = {
            hp: 'HP',
            attack: 'Ataque',
            defense: 'Defesa',
            'special-attack': 'Ataque Especial',
            'special-defense': 'Defesa Especial',
            speed: 'Velocidade'
        };
        return names[stat] || stat;
    }

    getStatColor(value, max) {
        const percentage = value / max;
        if (percentage < 0.3) return '#ff4444';
        if (percentage < 0.6) return '#ffbb00';
        return '#00ff88';
    }

    showToast(message) {
        const old = document.querySelector('.toast');
        if (old) old.remove();

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(-20px)';
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }

    // ============================================
    // EVENT LISTENERS
    // ============================================
    setupEventListeners() {
        // Search
        this.searchBtn.addEventListener('click', () => this.applyFilters());
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.applyFilters();
        });

        // Filters
        this.typeFilter.addEventListener('change', () => this.applyFilters());
        this.sortFilter.addEventListener('change', () => this.applyFilters());

        // Load more
        this.loadMoreBtn.addEventListener('click', () => {
            this.loadPokemon(true);
        });

        // Modal close
        document.getElementById('modalClose').addEventListener('click', () => {
            this.modal.classList.remove('active');
        });

        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.modal.classList.remove('active');
            }
        });

        // Favorites modal
        this.favoritesToggle.addEventListener('click', () => {
            this.openFavorites();
        });

        this.favoritesClose.addEventListener('click', () => {
            this.closeFavorites();
        });

        this.favoritesModal.addEventListener('click', (e) => {
            if (e.target === this.favoritesModal) {
                this.closeFavorites();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.modal.classList.remove('active');
                this.closeFavorites();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                this.searchInput.focus();
            }
        });
    }
}

// ============================================
// EXPORT
// ============================================
window.Pokedex = Pokedex;