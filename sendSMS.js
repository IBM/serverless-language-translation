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

// called after "msgTranslated trigger is fired
function main(params) {
  // get twilioSid and twilioAuthToken from
  // https://www.twilio.com/console
  const twilioClient = require('twilio')(params.twilioSid, params.twilioAuthToken)
  var redis = require('redis')
  const bluebird = require('bluebird')
  var cursor = '0'

  bluebird.promisifyAll(redis.RedisClient.prototype);

  var redisConfig = {
      user: params.redisUsername,
      password: params.redisPassword,
      host: params.redisHost,
      port: params.redisPort
  }
  const redisClient = redis.createClient(redisConfig)

  function sendSMS(recipient) {
    twilioClient.messages.create({
        to: recipient,
        from: params.twilioNumber,
        body: params.payload,
    }, function(err, message) {
        if (err) {
          console.log('error:', err);
        }
        else {
          console.log(message);
        }
    })
  }

  // loop through all SMS clients subscribed to given language, text translation result
  redisClient.scanAsync(cursor, 'MATCH', params.language + ":*").then(
    function (res) {
      var keys = res[1]
      for (key in keys) {
         redisClient.getAsync(keys[key]).then(
           function(number) {
             if ((params.senderNumber) && (params.senderNumber == number)) {
                 console.log("skipping")
             } else{
                 console.log("sending text to " + number)
                 sendSMS(number)
             }
         })
      }
  })
}
