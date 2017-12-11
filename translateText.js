// translate incoming message to all supported languages
//
// bound to MQTT channel
// 'iot-2/type/MQTTDevice/id/965d11de/evt/txtFromClient/fmt/json'
var openwhisk = require('openwhisk');

function main(params) {
  var languages = ['ar', 'es', 'fr', 'en', 'it', 'de', 'pt'] // todo, this array should be adjusted based on subscribers in room.
  for (targetLanguage in languages) {
      if ( targetLanguage != params.language ) {
        // translation action needs to be created beforehand with
        // wsk package bind /whisk.system/watson-translator myWatsonTranslator -p username MYUSERNAME -p password MYPASSWORD
        ow.actions.invoke('myWatsonTranslator', {
            translateTo: targetLanguage,
            translateFrom: params.language,
            client: params.client,
            payload: params.payload
        }
      }
  ).then(result =>
      // trigger bound to two "publish" actions, one for mqtt, the other for SMS. etcd keeps track of SMS subscribers to each language
      ow.trigger.invoke('msgTranslated',
        {
          payload: result.payload,
          client: params.client,
          language: result.translateTo
        }
      )
    )
};
}
