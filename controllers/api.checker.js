const express = require('express');
const router = express.Router();
const request = require('request-promise');

let responseCodes = require('./../config/response-codes.config');
let parseString = require('xml2js').parseString;


let cheerio = require('cheerio');

const movieUrl = 'https://www.imdb.com/title/tt0102926/?ref_=nv_sr_1';
const fb = 'http://www.facebook.com/akhil.arjun.05';

router.get('/abc', (req, res) => {
  var options = {
    uri: fb,
    // maxRedirects: 0
    followRedirect: false
  };

  request(options)
    .then((response) => {
      let $ = cheerio.load(response);
      console.log($.html());
      return res.write($.html())

    })
    .catch((err) => {
      console.log('err', err.stack)
    });

})



router.post('/check', (req, res) => {

  let {
    name
  } = req.body;

  console.log(req.ip);

  let domainOpts = {
    uri: 'https://api.namecheap.com/xml.response',
    qs: {
      ApiUser: process.env.APIUSER,
      ApiKey: process.env.APIKEY,
      UserName: process.env.USERNAME,
      Command: process.env.COMMAND,
      ClientIp: process.env.CLIENTIP || req.ip,
      DomainList: name
    },
    json: true
  };

  // request(domainOpts).then((result) => {
  //     parseString(result, (error, data) => {
  //       let response = data.ApiResponse.CommandResponse[0].DomainCheckResult;
  //       if (error) {
  //         return res.status(500).json({
  //           status: 'failed',
  //           message: responseCodes["something-went-wrong"],
  //           response: error.stack
  //         })
  //       } else {
  //         return res.status(200).json({
  //           status: 'success',
  //           message: responseCodes.successfull,
  //           response: response
  //         })
  //       }
  //     });
  //   })
  //   .catch((error) => {
  //     return res.status(500).json({
  //       status: 'failed',
  //       message: responseCodes["something-went-wrong"],
  //       response: error.stack
  //     })
  //   });

  //  TWITTER

  let twtOpts = {
    uri: 'https://twitter.com/users/username_available',
    qs: {
      username: name
    },
    json: true
  }

  request(twtOpts).then((result) => {
    console.log(result)
  }).catch((error) => {
    return res.status(500).json({
      status: 'failed',
      message: responseCodes["something-went-wrong"],
      response: error.stack
    })
  })

})




module.exports = router;
