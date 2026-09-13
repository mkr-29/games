// Helper Functions for the Prison Manager Game

// Clamp a value between min and max
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// Format currency
function formatCurrency(amount) {
  return `$${amount.toLocaleString()}`;
}

// Format time from minutes since midnight
function formatTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHours}:${mins.toString().padStart(2, '0')} ${ampm}`;
}

// Format percentage
function formatPercent(value) {
  return Math.round(value * 100);
}

// Check if two rectangles overlap (for collision detection)
function rectanglesOverlap(rect1, rect2) {
  return !(rect1.x + rect1.width < rect2.x ||
           rect2.x + rect2.width < rect1.x ||
           rect1.y + rect1.height < rect2.y ||
           rect2.y + rect2.height < rect1.y);
}

// Generate a unique ID
function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Simple distance calculation
function distance(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// Export helpers for use in other files
export const Helpers = {
  clamp,
  formatCurrency,
  formatTime,
  formatPercent,
  rectanglesOverlap,
  generateId,
  distance
};
if (typeof window !== 'undefined') {
  window.Helpers = Helpers;
}