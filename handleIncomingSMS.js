/*Copyright 2018 IBM Corp. All Rights Reserved.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

// executed as webaction

// when SMS messages are received, we need to
// add phone number as a subscriber for x seconds. if key already exists,
// identify sender message language
// forward message to translateText
var bluebird = require('bluebird')
var openwhisk = require('openwhisk')
var redis = require('redis')
bluebird.promisifyAll(redis.RedisClient.prototype)

function main(params) {
  // get twilioSid and twilioAuthToken from
  // https://www.twilio.com/console
  var ow = openwhisk()
  var redisConfig = {
      user: params.redisUsername,
      password: params.redisPassword,
      host: params.redisHost,
      port: params.redisPort
  }
  var cursor = '0'

  var LanguageTranslatorV2 = require('watson-developer-cloud/language-translator/v2');
  if (params.__bx_creds && params.__bx_creds.language_translator) {
    config = {
      username: params.__bx_creds.language_translator.username,
      password: params.__bx_creds.language_translator.password,
      url: params.__bx_creds.language_translator.url,
      version: "v2",
      type: "bound_creds"
    }
  } else {
    config = {
      username: params.language_translator_username,
      password: params.language_translator_password,
      url: 'https://gateway.watsonplatform.net/language-translator/api/',
      version: "v2",
      type: "user_provided"
    }
  }
  var language_translator =  new LanguageTranslatorV2(config)
  var redisClient = redis.createClient(redisConfig)
  // check kv for number.
  // if number isn't registered, identify language and add as key
  return redisClient.scanAsync(cursor, 'MATCH', "*" + params.From).then(
    function (res) {
      var keys = res[1]
      // if key exists in store
      return new Promise((resolve, reject) => {
        if (keys.length > 0) {
          // reset TTL
          var key = keys[0]
          redisClient.expire(key, 300)
          resolve(
            {
            payload: params.Body,
            client: "smsclient" + '_' + key.split(':')[1],
            senderNumber: params.From,
            sourceLanguage: key.split(':')[0]
            }
          )}
        else {
          language_translator.identify(
            {
              text: params.Body,
              headers: {
                'X-Watson-Technology-Preview': '2017-07-01'
              }
            },
            function(err, languages) {
              if (err)  {
                console.log('error:', err);
              } else  {
                var key = languages['languages'][0].language + ':' + params.From
                redisClient.set(key, params.From)
                redisClient.expire(key, 300)
                resolve({
                  payload: params.Body,
                  client: "smsclient" + '_' + key.split(':')[1],
                  senderNumber: params.From,
                  sourceLanguage: key.split(':')[0]
                })
              }
            })
          }
      }).then(result => {
        return ow.triggers.invoke({
          name: 'msgReceived',
          params: result
        })
      })
  })

}
