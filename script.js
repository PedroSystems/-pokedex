/**
 * POKÉDEX - Script Principal
 * Inicialização e configuração
 */

let pokedex;

document.addEventListener('DOMContentLoaded', () => {
    pokedex = new Pokedex();
    setupTheme();
    setupConsoleHelpers();
    console.log('✅ Pokédex pronta para uso!');
});

// ============================================
// TEMA
// ============================================
function setupTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('pokedexTheme') || 'dark';
    
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    themeToggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const newTheme = current === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('pokedexTheme', newTheme);
        updateThemeIcon(newTheme);
        
        pokedex.showToast(`🌓 Tema ${newTheme === 'light' ? 'claro' : 'escuro'}`);
    });
}

function updateThemeIcon(theme) {
    const icon = document.querySelector('#themeToggle i');
    if (theme === 'light') {
        icon.className = 'fas fa-sun';
    } else {
        icon.className = 'fas fa-moon';
    }
}

// ============================================
// CONSOLE HELPERS
// ============================================
function setupConsoleHelpers() {
    window.help = function() {
        console.log('=== Pokédex Help ===');
        console.log('pokedex - Acessa a instância da Pokédex');
        console.log('pokedex.searchPokemon("pikachu") - Buscar Pokémon');
        console.log('pokedex.openDetail(25) - Abrir detalhes');
        console.log('pokedex.toggleFavorite(25) - Favoritar/Desfavoritar');
        console.log('pokedex.favorites - Lista de IDs favoritos');
        console.log('pokedex.pokemonList - Lista de Pokémon carregados');
        console.log('===================');
    };
    
    console.log('💡 Digite "help()" para ver os comandos disponíveis');
}