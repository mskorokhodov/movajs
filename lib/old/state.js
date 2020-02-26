export class State {
  constructor(data = {}) {
    this.data = data;
  }

  update(payload) {
    this.data = { ...this.data, ...payload };
  }
}