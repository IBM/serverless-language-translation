// translate incoming message to all supported languages
//
// bound to MQTT channel
// 'iot-2/type/MQTTDevice/id/965d11de/evt/fromClient/fmt/json'
var openwhisk = require('openwhisk');
var async = require('async');
var language_translator =  watson.language_translator({
        username: params.language_translation_username,
        password: params.language_translation_password,
        version: 'v2'
    }
);

function translateMessage(message, originLanguage, targetLanguage, sender) {
  // translate string, return json object with translated result to MQTT and twilio SMS action
  console.log("translating '" + message.toString() + "' from " + originLanguage + " to " + targetLanguage )
  language_translator.translate({
        text: message.toString(),
        source : originLanguage,
        target: targetLanguage
      },
      function (err, translation) {
        console.log("translation result")
        console.log(translation)
        if (err || ! (translation['translations'] || ! translation))
          console.log('error:', err);
        }
        else if (translation) {
          var result = {
              payload: translation['translations'][0]['translation'],
              language: targetLanguage,
              client: client
            }
          console.log("message translated from '" + message.toString() + "' to " + targetLanguage + " : " + result)
          console.log(targetLanguage + ": " + result)
          console.log("publishing " + result + " to iot-2/type/MQTTDevice/id/965d11de/evt/msgin/fmt/json")
          publishtoMQTT(result)
          // forward to twilio/etcd action in sequence
          return result
      }
    }
  )
}

function publishtoMQTT(result) {
  mqttClient.publish(
    'iot-2/type/MQTTDevice/id/965d11de/evt/msgin/fmt/json',
    JSON.stringify({
        "d": result
    })
  )
}

function main(params) {
  var languages = ['ar', 'es', 'fr', 'en', 'it', 'de', 'pt']
  var msgJSON = (JSON.parse(params.message))
  console.log(msgJSON)
  var originLang = msgJSON.d.language
  var msgPayload = msgJSON.d.message
  var clientName = msgJSON.d.client
  var sender = msgJSON.d.sender
  // translate to all supported messages
  return new Promise(function(resolve, reject) {
    async.series([
      function(callback) {
        translateMessage(msgPayload, originLang, 'ar', clientName)
        callback()
      },
      function(callback) {
        translateMessage(msgPayload, originLang, 'es', clientName);
        callback()
      },
      function(callback) {
        translateMessage(msgPayload, originLang, 'fr', clientName);
        callback()
      },
      function(callback) {
        translateMessage(msgPayload, originLang, 'en', clientName);
        callback()
      },
      // function(callback) {
      //   translate(msgPayload, originLang, 'jp', clientName);
      //   callback();
      // },
      function(callback) {
        translateMessage(msgPayload, originLang, 'it', clientName);
        callback()
      },
      function(callback) {
        translateMessage(msgPayload, originLang, 'de', clientName);
        callback()
      },
      function(callback) {
        translateMessage(msgPayload, originLang, 'pt', clientName);
        callback()
      }
    ])
  }
}
