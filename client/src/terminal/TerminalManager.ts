import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

export class TerminalManager {
  public term: Terminal;
  private fitAddon: FitAddon;

  constructor(container: HTMLElement, onInput: (data: string) => void, onResize: (cols: number, rows: number) => void) {
    this.term = new Terminal({
      cursorBlink: true,
      fontFamily: 'var(--font-mono)',
      fontSize: 14,
      theme: {
        background: '#000000',
        foreground: '#f0f2f5',
        cursor: '#3b82f6',
        selectionBackground: 'rgba(59, 130, 246, 0.3)',
      }
    });

    this.fitAddon = new FitAddon();
    this.term.loadAddon(this.fitAddon);

    this.term.open(container);
    this.fitAddon.fit();

    this.term.onData((data) => {
      onInput(data);
    });

    this.term.onResize(({ cols, rows }) => {
      onResize(cols, rows);
    });

    // Handle window resize
    window.addEventListener('resize', this.handleResize);
  }

  private handleResize = () => {
    this.fitAddon.fit();
  };

  public write(data: string) {
    this.term.write(data);
  }

  public dispose() {
    window.removeEventListener('resize', this.handleResize);
    this.term.dispose();
  }
}
