# serverless-language-translation

This repository contains a series of serverless functions that can serve as the backend for a multilingual chat room, as described in the blog post [here](https://medium.com/kkbankol-events/the-motivation-behind-this-particular-project-comes-from-playing-one-of-my-favorite-android-games-76c92b27c8e8)

![Architecture](/assets/architecture.png)
TODO, update architecture

Prerequisites:
Install the MQTT package/feed found in this [repository](https://github.com/krook/openwhisk-package-mqtt-watson). This will allow actions to be invoked in response to incoming MQTT messages.

Upload each "Action" to the Cloud Functions codebase using the following commands
```
wsk action create translateText translateText.js
wsk action create sendSMS sendSMS.js
wsk action create iotPub iotPub.py
wsk action create handleIncomingSMS handleIncomingSMS.py
```

After each action is created, set default credentials for the corresponding services
```
wsk action update getTTSToken --param TTS_PASSWD <passwd> --param TTS_USERNAME <username>
wsk action update translateText --param language_translation_username ${language_translation_username} --param language_translation_password ${language_translation_password}
...
```

Test action creds are valid with
```
```

Create "Triggers" to represent events
```
wsk trigger create audioMsgReceived
wsk trigger create txtMsgReceived
wsk trigger create SMSMsgReceived
wsk trigger create msgTranslated
```

Create "Rules" to bind triggers and actions
```
# wsk rule create RULE_NAME TRIGGER_NAME ACTION_NAME
wsk rule create handleTxtMessage txtMsgReceived translateText
wsk rule create handleSMSMessage SMSMsgReceived translateText
wsk rule create publishtoIOT msgTranslated iotPub
wsk rule create publishtoSMS msgTranslated sendSMS
```

Flow:
MQTT message received as JSON object to topic `iot-2/type/${deviceType}/id/${orgId}/evt/${eventName}/fmt/json`
```
{
  client: "client_1234",
  message: "hello",
  language: "en"
}
```

Trigger associated with topic forwards object containing message payload/language to translation action.
Translation action passes message payload through a loop, where each item is a language that the original message will be translated to. After translation is complete, another trigger will be fired, which kicks off two more "publish" actions simultaneously
  - one action publishes result to all MQTT clients
  - the other action looks up SMS subscriber numbers/language in ETCD and sends them result via Twilio


Restrictions:
Watson IOT provides an MQTT broker, but has restrictions on how MQTT topics can be structured. So, only one section of the topic is customizable, the "event name". This limitation prevents us from using self described topics like `fromClient/text/en`, which would allow clients to subscribe only to the language of their choice. Therefore they'll need to receive all messages and discard the unneeded ones,

MQTT package/feed requires a CF app, which technically means this implementation is not serverless

TODO:
Create script to create wsk actions, populate credentials using .env files

Port all issues from [Taiga kanban](https://tree.taiga.io/project/kalonb91-lang/) to this repository
