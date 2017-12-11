// UI sends an empty message to this topic, action generates a text to speech token as a response
// bound to MQTT channel
// 'iot-2/type/MQTTDevice/id/965d11de/evt/tokenreq/fmt/json'
var mqtt = require('mqtt')
var watson = require('watson-developer-cloud')
var ttsAuthorization = new watson.authorization({
  password: params.TTS_PASSWD,
  username: params.TTS_USERNAME,
  url: 'https://stream.watsonplatform.net/authorization/api/v1/token', //watson.TextToSpeechV1.URL
  version: 'v1'
});
var mqttClient = mqtt.connect(mqtt_broker, mqtt_options);

function main(params) {
  ttsAuthorization.getToken({url: "https://stream.watsonplatform.net/text-to-speech/api"}, function (err, token) {
    if (!token) {
      console.log('error:', err);
    } else {
      console.log("sending token " + token.toString())
      mqttClient.publish('iot-2/type/MQTTDevice/id/965d11de/evt/token/fmt/json', token)
    }
  })
  return {payload:  "STT token generated"}
}
