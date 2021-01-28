const LCUConnector = require('lcu-connector');
//definindo o lcuconnector para conectar o lcu
const axios = require('axios');
//definindo o axios para fazer requests
const https = require('https')
//perguntar ao usuario o usuario a ser travado
const askUser = require('ask-user');
const { notStrictEqual } = require('assert');

let api = undefined;
let user = undefined;

const connector = new LCUConnector();
const agent = new https.Agent({
    rejectUnauthorized: false,
});

//defindo meio q um sleep
function delay(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }

//conectando ao cliente
connector.on('connect', async(credentials) => {
    api = axios.create({
        baseURL: `https://127.0.0.1:${credentials.port}`,
        headers: {
            'content-type': 'application/json',
            'Authorization': `Basic ${Buffer.from(`${credentials.username}:${credentials.password}`)
            .toString("base64")}`,
        },
        httpsAgent: agent
    });
})

//iniciando 
connector.start();

async function main() {
  try {
    console.log('feito por such.');
    askUser('user: ', async (nickxd) => {
      if (!nickxd.length > 16)
        return console.log('16 char max.');

      const nick = nickxd.replace(' ', '_');
      //pegar o id do usuario a ser travado
      const getID = await api({
        method: 'GET',
        url: `/lol-summoner/v1/summoners?name=${nick}`,
        validateStatus: () => true,
      });

      if (getID.status >= 400) {
        throw new Error('user not found.');
      }

      const summonerID = getID.data.summonerId;

      // info pra enviar no post pra invitar pra sala
      const data = [{ toSummonerId: summonerID }];
      let flag = false;
      do {
          // convidando pra sala
        const invite = await api({
          method: 'POST',
          url: '/lol-lobby/v2/lobby/invitations',
          data: data,
          validateStatus: () => true,
        });

        console.log(`INVITE\n` + invite.status);
        
        //kickando para cancelar o convite
        const deny = await api({
          method: 'POST',
          url: `/lol-lobby/v2/lobby/members/${summonerID}/kick`,
          validateStatus: () => true,
        });

        console.log(`REMOVE\n`, + deny.status);
        //espere 500ms e repeat
        await delay(500);
      } while (flag === false);
    });
  } catch (err) {
    console.error('ERROR\n' + err);
  }
}

main();
