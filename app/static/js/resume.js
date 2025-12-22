document.addEventListener('DOMContentLoaded', () => {
    const skillTags = document.querySelectorAll('.skill-tag');
    const jobItems = document.querySelectorAll('.job-item');

    let activeSkill = null;

    skillTags.forEach(tag => {
        tag.addEventListener('click', () => {
            const skill = tag.getAttribute('data-skill');

            // Toggle active state
            if (activeSkill === skill) {
                // Deactivate
                activeSkill = null;
                resetHighlights();
                skillTags.forEach(t => t.classList.remove('active'));
            } else {
                // Activate new skill
                activeSkill = skill;
                highlightSkill(skill);

                // Update tag styles
                skillTags.forEach(t => {
                    if (t.getAttribute('data-skill') === skill) {
                        t.classList.add('active');
                    } else {
                        t.classList.remove('active');
                    }
                });
            }
        });
    });

    function highlightSkill(skill) {
        jobItems.forEach(item => {
            const keywords = item.getAttribute('data-keywords').split(',');
            if (keywords.includes(skill)) {
                item.classList.remove('dimmed');
                item.classList.add('highlighted');
            } else {
                item.classList.add('dimmed');
                item.classList.remove('highlighted');
            }
        });
    }

    function resetHighlights() {
        jobItems.forEach(item => {
            item.classList.remove('dimmed');
            item.classList.remove('highlighted');
        });
    }
});
