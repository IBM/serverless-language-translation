#!/bin/bash
source cfcreds.env

echo "Deploy Cloud Functions"
bx wsk action create translateText translateText.js
bx wsk action create sendSMS sendSMS.js
bx wsk action create iotPub iotPub.py
bx wsk action create handleIncomingSMS handleIncomingSMS.js

echo "Import service credentials to corresponding Cloud Functions"
bx wsk service bind language_translator translateText
bx wsk service bind language_translator handleIncomingSMS
bx wsk action update iotPub -p iot_org_id "${IOT_ORG_ID}" -p iot_device_id "${IOT_DEVICE_ID}" -p iot_device_type "${IOT_DEVICE_TYPE}" -p iot_auth_token "${IOT_AUTH_TOKEN}"
bx wsk action update sendSMS -p twilioNumber "${TWILIO_NUMBER}" -p twilioSid "${TWILIO_SID}" -p twilioAuthToken "${TWILIO_AUTH_TOKEN}" -p redisUsername "${REDIS_USER}" -p redisPassword "${REDIS_PASSWORD}" -p redisHost "${REDIS_HOST}" -p redisPort "${REDIS_PORT}"
bx wsk action update handleIncomingSMS -p twilioNumber "${TWILIO_NUMBER}" -p twilioSid "${TWILIO_SID}" -p twilioAuthToken "${TWILIO_AUTH_TOKEN}" -p redisUsername "${REDIS_USER}" -p redisPassword "${REDIS_PASSWORD}" -p redisHost "${REDIS_HOST}" -p redisPort "${REDIS_PORT}"


echo "Create Triggers"
bx wsk trigger create audioMsgReceived
bx wsk trigger create txtMsgReceived
bx wsk trigger create SMSMsgReceived
bx wsk trigger create msgTranslated

echo "Create Rules"
# bx wsk rule create RULE_NAME TRIGGER_NAME ACTION_NAME
bx wsk rule create handleTxtMessage txtMsgReceived translateText
bx wsk rule create handleMQTTMessage mqttMsgReceived translateText
bx wsk rule create publishtoIOT msgTranslated iotPub
bx wsk rule create publishtoSMS msgTranslated sendSMS
