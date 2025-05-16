export class Debounced {
  private timeout: NodeJS.Timeout | undefined;
  private readonly delay: number;

  constructor(private refreshCallback: () => void, delay: number = 1000) {
    this.delay = delay;
  }

  refresh() {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.timeout = setTimeout(() => {
      this.refreshCallback();
      this.timeout = undefined;
    }, this.delay);
  }

  dispose() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = undefined;
    }
  }
}
