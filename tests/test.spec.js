const axios = require('axios').default;
const contracts = require('../contract');

describe('Test TI', () => {

    const url = `http://localhost:${process.env.PORT}`

    it('get / should return hello world', async ()=> {
        const response = await axios.get(url);
        expect(response.status).toBe(200);
        expect(response.data).toStrictEqual({
            message: "Hello Wrold!"
        });
    })

    it('get /contracts should return list of contracts', async ()=> {
        const response = await axios.get(`${url}/contracts`);
        expect(response.status).toBe(200);
        expect(response.data).toStrictEqual(contracts);
    });

    it('get /player should return list of players', async ()=> {
        const response = await axios.get(`${url}/players`);
        expect(response.status).toBe(200);
        expect(response.data).toStrictEqual([]);
    })

    
});