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
wsk action update getTTSToken --param TTS_PASSWD <passwd> --param TTS_USERNAME
```

translateText.js and sendSMS.js will need to be packaged together as a sequence like so
```
wsk action create translateMsg translateText,sendSMS
```
