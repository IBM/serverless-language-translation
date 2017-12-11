# serverless-language-translation

This repository contains a series of serverless functions that can serve as the backend for a multilingual chat room, as described in the blog post [here](https://medium.com/kkbankol-events/the-motivation-behind-this-particular-project-comes-from-playing-one-of-my-favorite-android-games-76c92b27c8e8)

Prerequisites:
Install the MQTT package/feed found in this [repository](https://github.com/krook/openwhisk-package-mqtt-watson). This will allow actions to be invoked in response to incoming MQTT messages.

Upload each action to the Cloud Functions codebase using
```
wsk action create <action_name> <path_to_file>
```

After each action is created, set default credentials for the corresponding services
```
wsk action update getTTSToken --param TTS_PASSWD <passwd> --param TTS_USERNAME <username>
```

Triggers / Rules will also need to be created beforehand
```
wsk trigger create msgTranslated
wsk rule create publishtoMQTT msgTranslated iot-pub
wsk rule create publishtoSMS msgTranslated sendSMS
```

Flow:
MQTT message received as JSON object to topic 'iot-2/type/<deviceType>/id/<orgId>/evt/<eventName>/fmt/json'
```
{
  client: "client_1234",
  message: "hello",
  language: "en"
}
```

Trigger associated with topic forwards object to action. Action passes message payload through a loop, where each item is a language that the original message will be translated to. After translation is complete, another trigger will be fired, which kicks off two actions simultaneously, one that publishes to MQTT clients, the other to SMS clients via Twilio (ETCD stores numbers and associated language for each)


Restrictions:
Watson IOT provides an MQTT broker, but has restrictions on how MQTT topics can be structured. So, only one section of the topic is customizable, the "event name". In a nutshell, this limitation keeps us from using self described topics like "fromClient/text/en"
