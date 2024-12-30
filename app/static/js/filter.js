document.addEventListener('DOMContentLoaded', () => {
    const categories = document.querySelectorAll('.category');
    const projectCards = document.querySelectorAll('.project-card');

    categories.forEach(category => {
        category.addEventListener('click', () => {
            // Remove active class from all buttons
            categories.forEach(btn => btn.classList.remove('active'));
            category.classList.add('active');

            const filter = category.getAttribute('data-category');
            projectCards.forEach(card => {
                if (filter === 'all' || card.getAttribute('data-category') === filter) {
                    card.classList.remove('hidden');
                } else {
                    card.classList.add('hidden');
                }
            });

            // Reorder cards by appending visible ones to the start of the grid
            const grid = document.querySelector('.project-grid');
            const visibleCards = Array.from(projectCards).filter(card => !card.classList.contains('hidden'));
            const hiddenCards = Array.from(projectCards).filter(card => card.classList.contains('hidden'));

            [...visibleCards, ...hiddenCards].forEach(card => grid.appendChild(card));
        });
    });
});
