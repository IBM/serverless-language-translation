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

// bound to MQTT channel
// 'iot-2/type/MQTTDevice/id/965d11de/evt/fromClient/fmt/json'

// TODO,
// delete this and use whisk package instead
// wsk action invoke myWatsonTranslator/languageId --blocking --result --param payload "Ciel bleu a venir"

var msgJSON = (JSON.parse(params.message))
console.log(msgJSON)
var originLang = msgJSON.d.language
var msgPayload = msgJSON.d.message
var clientName = msgJSON.d.client

var language_translator =  watson.language_translator({
        username: params.language_translation_username,
        password: params.language_translation_password,
        version: 'v2'
    }
)

function main(params) {
  return new Promise(function(resolve, reject) {
      language_translator.identify({ text: msgPayload},
        function(err, identifiedLanguages) {
          if (err)
            console.log(err)
          else
            resolve({
              language: identifiedLanguages[0]
            });
      })
  })
}
