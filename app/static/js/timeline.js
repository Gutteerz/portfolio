document.addEventListener('DOMContentLoaded', function() {
  const timeline = document.querySelector('.timeline');
  const timelineLine = document.querySelector('.timeline-line');
  const blocks = document.querySelectorAll('.timeline-year-block');

  // 1. Fade/slide in each .timeline-year-block on scroll
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Add the .in-view class to trigger the CSS transition
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  blocks.forEach(block => observer.observe(block));

  // 2. Set the line's height to match the timeline's total height
  function updateLineHeight() {
    // The timeline's full scrollable height
    const timelineHeight = timeline.scrollHeight;
    timelineLine.style.height = timelineHeight + 'px';
  }

  // Update line height on load
  updateLineHeight();

  // Also update on window resize
  window.addEventListener('resize', updateLineHeight);
});
