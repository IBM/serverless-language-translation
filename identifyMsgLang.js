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
