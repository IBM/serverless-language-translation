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

// should be paired as a sequence with "translateText" action and called after each language translation.

function main(params) {
  var twilioClient = require('twilio')(params.accountSid, params.authToken);
  var request = require('request')

  function sendSMS() {
    twilioClient.messages.create({
        to: i.key.split('+')[1],
        from: params.twilioNumber,
        body: message.toString(),
    }, function(err, message) {
        if (err) {
          console.log('error:', err);
        }
        else {
          console.log(message.sid);
        }
    })
  }

  // check etcd for phone numbers subscribing to language of translated result
  function queryEtcd(language, message, etcdUrl, twilioClient) {
    request('http://' + etcdUrl + ':2379/v2/keys/languages/' + targetLanguage,
      function (error, response, body) {
        console.log("checking for " + targetLanguage + "numbers registered in etcd")
        console.log("SENDER: " + client)
        if (body && JSON.parse(body).node && JSON.parse(body).node.nodes) {
          for (i of JSON.parse(body).node.nodes) {
            console.log( "TARGET: " + i.key.split('+')[1] )
            if ( twilioClient.split('+')[1] != i.key.split('+')[1] ) {
            // console.log(i.key.split('+')[1])
              sendSMS(message)
            }
          }
        }
        else {
            console.log("no numbers found")
          }
        }
    )
  }

  queryEtcd(params.language, params.payload, params.etcdUrl, twilioClient)
}
