module.exports = {
  serialize: (data) => ({ json: data, meta: {} }),
  deserialize: (data) => data.json || data,
};
