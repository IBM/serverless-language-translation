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
          target: targetLanguage
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
