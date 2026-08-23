/**
 * Developers Page Logic
 */
document.addEventListener('DOMContentLoaded', () => {
  const cards = document.querySelectorAll('.dev-card');
  Animations.staggerIn(Array.from(cards));
});
