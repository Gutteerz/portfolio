document.addEventListener('DOMContentLoaded', () => {
    const categories = document.querySelectorAll('.category');
    const projectCards = document.querySelectorAll('.project-card');

    categories.forEach(category => {
        category.addEventListener('click', () => {
            categories.forEach(btn => btn.classList.remove('active'));
            category.classList.add('active');

            const filter = category.getAttribute('data-category');
            projectCards.forEach(card => {
                if (filter === 'all' || card.getAttribute('data-category') === filter) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
});
