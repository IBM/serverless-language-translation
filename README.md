[![Build Status](https://travis-ci.org/IBM/serverless-language-translation.svg?branch=master)](https://travis-ci.org/IBM/serverless-language-translation)

# Deploy a Serverless Multilingual Conference Room

In this code pattern, we will create the workings for a multilingual chat room using OpenWhisk and Watson text-to-speech.  The MQTT messaging protocol is also leveraged, which allows for each client to publish and subscribe to one or more channels.  This repository contains a series of serverless functions are called in sequence determinded by the channel to which a message is submitted.  

When the reader has completed this Code Pattern, they will understand how to:

* Deploy Cloud Function actions and triggers
* Interact with the Watson IoT platform
* Set up a CloudFoundry application

![Architecture](/assets/architecture.png)

## Flow

1. Message received from a client, which can be a web browser, CLI, Openwhisk action, SMS text, etc.
2. If message payload contains an audio file, it is transcribed to text.
3. Transcribed text is translated to other supported languages.
4. If message sent via SMS, sender phone number is added to an etcd key/value store. etcd is used here to maintain a list of subscriber’s phone numbers, as well as their respective languages. An adjustable TTL value is used here to remove numbers from the store if the subscriber does not participate in the conversation for 300 seconds.
5. Translated messages/audio streams are published to various channels on the MQTT broker, which then distributes the messages amongst subscribing clients.

## Included components

* [OpenWhisk](https://console.ng.bluemix.net/openwhisk): Execute code on demand in a highly scalable, serverless environment.
* [Watson Text to Speech](https://www.ibm.com/watson/developercloud/text-to-speech.html): Converts written text into natural sounding audio in a variety of languages and voices.

## Featured technologies

* [Messaging](https://developer.ibm.com/messaging/message-hub/): Messaging is a key technology for modern applications using loosely decoupled architecture patterns such as microservices.
* [Node.js](https://nodejs.org/): An open-source JavaScript run-time environment for executing server-side JavaScript code.
* [Serverless](https://www.ibm.com/cloud-computing/bluemix/openwhisk): An event-action platform that allows you to execute code in response to an event.

# Watch the Video
[![](http://img.youtube.com/vi/eXY0uh_SeKs/0.jpg)](https://www.youtube.com/watch?v=eXY0uh_SeKs)

# Steps

## Prerequisites:
Install the MQTT package/feed found in this [repository](https://github.com/krook/openwhisk-package-mqtt-watson). This will allow actions to be invoked in response to incoming MQTT messages.

1. [Upload Actions](#1-upload-actions)
2. [Create Triggers](#2-create-triggers)
3. [Create Rules](#3-create-rules)
4. [Deploy UI](#4-deploy-ui)

### 1. Upload Actions
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

### 2. Create Triggers
Create `Triggers` to represent events
```
wsk trigger create audioMsgReceived
wsk trigger create txtMsgReceived
wsk trigger create SMSMsgReceived
wsk trigger create msgTranslated
```
### 3. Create Rules
Create `Rules` to bind triggers and actions
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
Watson IOT provides an MQTT broker, but has restrictions on how MQTT topics can be structured. So, only one section of the topic is customizable, the "event name". This limitation prevents us from using self described topics like `fromClient/text/en`, which would allow clients to subscribe only to the language of their choice. Therefore they'll need to receive all messages and discard the unneeded ones.

MQTT package/feed requires a CF app, which technically means this implementation is not serverless

### 4. Deploy UI

If all you need is the server side logic, you can stop here.  But optionally, you can delpoy the UI provided by https://github.com/IBM/language-translation-ui

TODO:
Create script to create wsk actions, populate credentials using `.env` files

Port all issues from [Taiga kanban](https://tree.taiga.io/project/kalonb91-lang/) to this repository

# Links
* [Watson Node.js SDK](https://github.com/watson-developer-cloud/node-sdk)

# License
[Apache 2.0](LICENSE)
