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

// translate incoming message to all supported languages
//
// bound to MQTT channel
// 'iot-2/type/MQTTDevice/id/965d11de/evt/txtFromClient/fmt/json'

// expects params for payload, language, and translation creds
var LanguageTranslatorV2 = require('watson-developer-cloud/language-translator/v2');
var openwhisk = require('openwhisk')

function main(params) {
  var ow = openwhisk();
  var language_translator =  new LanguageTranslatorV2({
          username: params.language_translation_username,
          password: params.language_translation_password,
          version: "v2",
          url: 'https://gateway.watsonplatform.net/language-translator/api/'
      }
  )
  // var languages = ['ar', 'es', 'fr', 'en', 'it', 'de', 'pt']
  var languages = ['es', 'fr']
  var translations = languages.map(function (targetLanguage) {
    return new Promise((resolve, reject) => {
      language_translator.translate(
        {
          text: params.payload,
          source: params.sourceLanguage,
          target: targetLanguage,
          headers: {
            'X-Watson-Technology-Preview': '2017-07-01'
          }
        },
        function(err, translation) {
          if (err)  {
            console.log('error:', err);
          } else  {
            console.log("translation complete");
            resolve(translation['translations'][0])
          }
        }
      )
    }).then(result =>
      ow.triggers.invoke({
        "name": 'msgTranslated',
        "params": {
          payload: result.translation,
          client: params.client,
          language: targetLanguage
        }
      })
    )
  })

  return Promise.all(translations).then(function (results) {
        console.log(results);
        return resolve({payload: "Translations complete"});
  });
}
