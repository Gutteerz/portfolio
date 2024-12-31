    document.addEventListener('DOMContentLoaded', () => {
        const timelineEvents = document.querySelectorAll('.timeline-event');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, {
            threshold: 0.5 // Adjust visibility threshold
        });

        timelineEvents.forEach(event => observer.observe(event));
    });