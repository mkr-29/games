// Main entry point for the Prison Manager game
import './config.js';
import './helpers.js';
import './styles.css';
import { initGame } from './game.js';

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initGame();
});