[![Build Status](https://travis-ci.org/IBM/serverless-language-translation.svg?branch=master)](https://travis-ci.org/IBM/serverless-language-translation)

# Deploy a Serverless Multilingual Conference Room

In this code pattern, we will create the workings for a multilingual chat room using OpenWhisk, Watson Text to Speech and Watson Language Translator.  The MQTT messaging protocol is also leveraged, which allows each client to publish and subscribe to one or more channels.  This repository contains a series of serverless functions which are called in sequence determined by the channel to which a message is submitted.  

When the reader has completed this code pattern, they will understand how to:

* Deploy Cloud Function actions and triggers
* Interact with the Watson IoT platform
* Set up a CloudFoundry application

![Architecture](/doc/source/images/architecture.png)

## Flow

1. Message received from a client, which can be a web browser, CLI, OpenWhisk action, SMS text, etc.
2. If message payload contains an audio file, it is transcribed to text.
3. Transcribed text is translated to other supported languages.
4. If message is sent via SMS, sender phone number is added to an etcd key-value store. etcd is used here to maintain a list of subscribers’ phone numbers, as well as their respective languages. An adjustable TTL value is used here to remove numbers from the store if the subscriber does not participate in the conversation for 300 seconds.
5. Translated messages/audio streams are published to various channels on the MQTT broker, which then distributes the messages among subscribing clients.

## Included components

* [OpenWhisk](https://console.ng.bluemix.net/openwhisk): Execute code on demand in a highly scalable, serverless environment.
* [Watson Text to Speech](https://www.ibm.com/watson/developercloud/text-to-speech.html): Converts written text into natural sounding audio in a variety of languages and voices.
* [Watson Language Translator](https://www.ibm.com/watson/services/language-translator/): Translate text from one language to another. Take text from across the globe and present it in the language of your choice.

## Featured technologies

* [Messaging](https://developer.ibm.com/messaging/message-hub/): Messaging is a key technology for modern applications using loosely decoupled architecture patterns such as microservices.
* [Node.js](https://nodejs.org/): An open-source JavaScript run-time environment for executing server-side JavaScript code.
* [OpenWhisk](https://www.ibm.com/cloud-computing/bluemix/openwhisk): An open source event-driven platform that allows you to execute code in response to an event. This is the underlying technology for the IBM Cloud Functions offering

# Watch the Video
[![](http://img.youtube.com/vi/eXY0uh_SeKs/0.jpg)](https://www.youtube.com/watch?v=eXY0uh_SeKs)

<!-- [Animation](https://i.imgur.com/Q4DGOPM.gifv) -->
<!-- TODO, Animation too large, cut out 6 MB -->

# Steps

## Prerequisites:
Install the MQTT package/feed found in the openwhisk-package-mqtt-watson submodule [here](openwhisk-package-mqtt-watson). This "feed" enables Openwhisk to subscribe to one or more MQTT topics and invoke actions in response to incoming messages. To see more on how feeds work with IBM Cloud Functions, please visit these [documents](https://github.com/apache/incubator-openwhisk/blob/master/docs/feeds.md)
[Deploy MQTT Feed]()
1. [Create Services](#1-create-services)
2. [Upload Actions](#2-upload-actions)
3. [Create Triggers](#3-create-triggers)
4. [Create Rules](#4-create-rules)
5. [Deploy UI](#5-deploy-ui)

### 1. Create Services

Create the required IBM Cloud services.
- [Speech To Text](https://console.bluemix.net/catalog/services/speech-to-text)
- [Text To Speech](https://console.bluemix.net/catalog/services/text-to-speech)
- [Watson IoT Platform](https://console.bluemix.net/catalog/services/internet-of-things-platform)

For SMS integration, create the following third party services.
- [Twilio](https://www.twilio.com/)
<!-- - [ETCD](https://console.bluemix.net/catalog/services/compose-for-etcd/) TODO, the free etcd plan has been removed, perhaps we can shift to redis instead -->

### 2. Upload Actions
Upload each "Action" to the Cloud Functions codebase with the following commands.
```
bx wsk action create translateText translateText.js
bx wsk action create sendSMS sendSMS.js
bx wsk action create iotPub iotPub.py
bx wsk action create handleIncomingSMS handleIncomingSMS.py
```

After each action is created, set or bind default credentials for the corresponding services.
```
<!-- # bx wsk action update getTTSToken --param TTS_PASSWD <passwd> --param TTS_USERNAME <username> -->
# Most IBM Cloud native service credentials can be easily imported to a Cloud function using the "service bind" command
# bx wsk service bind <service> <action_name>
bx wsk service bind language_translator translateText

# Credentials for third party services can be set using the "update command"
# bx wsk action update <action_name> -p <param_name> <param_value>
bx wsk action update iotPub -p iot_org_id ${iot_org_id} -p device_id ${device_id} -p device_type ${device_type} -p api_token ${api_token}
bx wsk action update sendSMS -p twilio_number ${twilio_number} -p etcd_url ${etcd_url}
```

### 3. Create Triggers
Create `Triggers` to represent events.
```
bx wsk trigger create audioMsgReceived
bx wsk trigger create txtMsgReceived
bx wsk trigger create SMSMsgReceived
bx wsk trigger create msgTranslated
```
### 4. Create Rules
Create `Rules`, which execute actions when certain triggers are activated.
```
# bx wsk rule create RULE_NAME TRIGGER_NAME ACTION_NAME
bx wsk rule create handleTxtMessage txtMsgReceived translateText
bx wsk rule create handleSMSMessage SMSMsgReceived translateText
bx wsk rule create publishtoIOT msgTranslated iotPub
bx wsk rule create publishtoSMS msgTranslated sendSMS
```

### 5. Deploy UI

If all you need is the server side logic, you can stop here.  But optionally, you can deploy the UI provided by https://github.com/IBM/language-translation-ui
```
git clone https://github.com/IBM/language-translation-ui
cd language-translation-ui && npm start
# assuming the npm start command succeeds, you should be able to access the UI at http://127.0.0.1:8080
```

## Developer Notes

Flow:

- MQTT message received as JSON object to topic `iot-2/type/${deviceType}/id/${orgId}/evt/${eventName}/fmt/json`
```
{
  client: "client_1234",
  payload: "hello",
  sourceLanguage: "en"
}
```

- Trigger associated with topic forwards message payload/language to translator action.
- Translator action passes message payload through a loop, where each item is a language that the original message will be translated to. After translation is complete, another trigger will be fired, which kicks off two other "publish" actions simultaneously.
  - One action publishes results to all MQTT clients
  - The other action looks up SMS subscriber numbers/language in ETCD and sends them the result via Twilio.

<!-- Restrictions:

Watson IOT provides an MQTT broker, but has restrictions on how MQTT topics can be structured. So, only one section of the topic is customizable, the "event name". This limitation prevents us from using self describing topics like `fromClient/text/en`, which would allow clients to subscribe only to the language of their choice. Therefore they'll need to receive all messages and discard the unneeded ones.

MQTT package/feed requires a CF app, which technically means this implementation is not serverless. -->

# Links
<!-- * [Watson Node.js SDK](https://github.com/watson-developer-cloud/node-sdk) -->

# License
[Apache 2.0](LICENSE)
