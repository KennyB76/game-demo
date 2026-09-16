const BLOCK = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight']);

export class Input {
  constructor() {
    this.down = new Set();
    this.pressed = new Set();
    this.mousePressed = false;
    this.mouse = { x: 0, y: 0 };

    window.addEventListener('keydown', (e) => {
      if (BLOCK.has(e.code)) e.preventDefault();
      if (!e.repeat) this.pressed.add(e.code);
      this.down.add(e.code);
    });
    window.addEventListener('keyup', (e) => this.down.delete(e.code));
    window.addEventListener('blur', () => this.down.clear());
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });
    window.addEventListener('mousedown', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      if (e.button === 0) this.mousePressed = true;
    });
    window.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  isDown(codes) {
    return codes.some((c) => this.down.has(c));
  }

  wasPressed(codes) {
    return codes.some((c) => this.pressed.has(c));
  }

  endFrame() {
    this.pressed.clear();
    this.mousePressed = false;
  }
}
