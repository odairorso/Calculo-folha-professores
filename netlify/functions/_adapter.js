function wrap(vercelHandler) {
  return async (event, context) => {
    let statusCode = 200;
    let headers = { 'Content-Type': 'application/json' };
    let response;
    const req = {
      method: event.httpMethod,
      headers: event.headers || {},
      body: event.body,
      query: event.queryStringParameters || {},
    };
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(obj) {
        response = { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj) };
        return response;
      },
      send(text) {
        response = { statusCode, headers: { 'Content-Type': 'text/plain' }, body: String(text) };
        return response;
      },
    };
    try {
      const ret = await vercelHandler(req, res);
      if (response) return response;
      if (ret && ret.statusCode) return ret;
      return { statusCode, headers, body: '' };
    } catch (e) {
      return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: e.message }) };
    }
  };
}

module.exports = { wrap };

