class Redis {
  constructor() {
    this.data = new Map();
  }

  async get(key) {
    return this.data.get(key) || null;
  }

  async set(key, value) {
    this.data.set(key, value);
    return 'OK';
  }

  async incr(key) {
    const current = parseInt(this.data.get(key) || '0');
    const newValue = current + 1;
    this.data.set(key, newValue.toString());
    return newValue;
  }

  async expire(_key, _seconds) {
    // Mock expiration
    return 1;
  }

  async ttl(key) {
    // Mock TTL
    return this.data.has(key) ? 60 : -2;
  }

  async del(key) {
    return this.data.delete(key) ? 1 : 0;
  }
}

module.exports = { Redis };
