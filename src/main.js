import './style.css';
import { Game } from './game.js';

const game = new Game(document.getElementById('game'));
if (import.meta.env.DEV) window.__game = game;
