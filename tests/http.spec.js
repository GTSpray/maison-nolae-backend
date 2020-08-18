const axios = require("axios").default;
const contracts = require("../contract");


const request = async (url, options) => {
  let response;
  try {
    response = await axios.request(url, options);
  } catch (error) {
    if(error.response){
      response = error.response;
    } else {
      throw error;
    }
  }
  return response;
}

describe("HTTP Server", () => {
  const url = `http://localhost:${process.env.PORT}`;

  it("get / should return hello world", async () => {
    const response = await axios.get(url);
    expect(response.status).toBe(200);
    expect(response.data).toStrictEqual({
      message: "Hello Wrold!"
    });
  });

  it("get /contracts should return list of contracts", async () => {
    const response = await axios.get(`${url}/contracts`);
    expect(response.status).toBe(200);
    expect(response.data).toStrictEqual(contracts);
  });

  it("get /player should return list of players", async () => {
    const response = await axios.get(`${url}/players`);
    expect(response.status).toBe(200);
    expect(response.data).toStrictEqual([]);
  });

  [
    ["/",'GET'], 
    ["/contracts", 'GET'],
    ["/players", "GET"],
    ["/auth", "POST"]
  
  ].forEach(([path, method]) => {

    const corsHeaders = {
      "access-control-allow-origin": process.env.fronturl,
      "access-control-allow-methods": "*",
      "access-control-allow-headers": "*",
      "access-control-max-age": "1728000"
    };

    it(`${method} ${path} should add headers to prevent CORS failure`, async () => {
      const response = await request(`${url}${path}`, {method});
      expect(response.headers).toEqual(expect.objectContaining(corsHeaders));
    });

    it(`get ${path} should add headers to prevent CORS failure`, async () => {
      const response = await axios.options(`${url}${path}`);
      expect(response.status).toBe(200);
      expect(response.headers).toEqual(expect.objectContaining(corsHeaders));
    });

  });


});
