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
  if (params.body && JSON.parse(params.body).d) {
    msgVals = JSON.parse(params.body).d
  } else {
    msgVals = params
  }

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
      url: 'https://api.us-south.language-translator.watson.cloud.ibm.com',
      version: "v2",
      type: "user_provided"
    }
  }
  var language_translator =  new LanguageTranslatorV2(config)
  // var languages = ['ar', 'es', 'fr', 'en', 'it', 'de', 'pt']
  var supportedLanguages = ['es', 'fr', 'en']
  var languages = supportedLanguages.filter(
    function(lang) {
      return lang != msgVals.sourceLanguage
  });
  var translations = languages.map(function (targetLanguage) {
    return new Promise((resolve, reject) => {
      language_translator.translate(
        {
          text: msgVals.payload,
          source: msgVals.sourceLanguage,
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
        name: 'msgTranslated',
        params: {
          payload: result.translation,
          client: msgVals.client,
          language: targetLanguage
        }
      })
    )
  })

  translations.push(
    ow.actions.invoke({
      name: 'iotPub',
      params: {
        payload: msgVals.payload,
        client: msgVals.client,
        language: msgVals.sourceLanguage
      }
    })
  )
  return Promise.all(translations).then(function (results) {
        console.log(results);
        return resolve({payload: "Translations complete"});
  });
}
