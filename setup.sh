#!/bin/bash

# Install Bluemix Cloud CLI beforehand
# bx
# bx wsk
# bx plugin install Cloud-Functions -r Bluemix

# Ensure required CloudFoundry services are provisioned
# bx login
if [ -z "$(command -v bx)" ] ; then
  echo "Bluemix CLI needs to be installed"
  exit 1
  # curl -fsSL https://clis.ng.bluemix.net/install/linux | sh
fi
. cfcreds.env
bx target --cf -s dev
REQUIRED_SERVICES=("language_translator" "speech_to_text" "text_to_speech" "iotf-service" "cloudantNoSQLDB")
EXISTING_SERVICES=$(bx cf services) # | grep $(echo ${REQUIRED_SERVICES[@]/#// -e }  | sed -e 's/\///g') )
for SERVICE in ${REQUIRED_SERVICES[@]} ; do
  # Get name of each existing service
  unset SERVICE_INSTANCE_NAME
  SERVICE_INSTANCE_NAME=$(echo "${EXISTING_SERVICES}" | grep -m 1 ${SERVICE} | awk -F ${SERVICE} '{print $1}')
  echo "Checking for ${SERVICE} service instance"
  if [[ -z "${SERVICE_INSTANCE_NAME}" ]] ; then
    # cf create-service $SERVICE
    echo "Missing services, please create an \"${SERVICE}\" instance in the Bluemix UI"
    # bx cf create-service SERVICE PLAN SERVICE_INSTANCE
    exit 1
  else
    echo "${SERVICE} service exists"
  fi
done

# bx wsk package refresh
# CLOUD_FUNC_PACKAGES=$(bx wsk package list)
# function parsePackageName() {
#   result=$(echo "${CLOUD_FUNC_PACKAGES}" | grep -i "$@" | grep -i -m 1 'Credentials' | awk -F ' '  '{gsub($NF,"");print}')
#   echo $result
# }
#
# # Get names of OpenWhisk actions
# TTS_ACTION=$(parsePackageName 'text to speech')
# STT_ACTION=$(parsePackageName 'speech to text')
# TRANSLATION_ACTION=$(parsePackageName 'language translator')

echo "Deploy Cloud Functions"
bx wsk action create translateText translateText.js
bx wsk action create sendSMS sendSMS.js
bx wsk action create iotPub iotPub.py
bx wsk action create handleIncomingSMS handleIncomingSMS.py

echo "Import service credentials to corresponding Cloud Functions"
bx wsk service bind lanaguage_translator translateText
bx wsk action update iotPub -p iot_org ${IOT_ORG} -p iot_device_id ${IOT_DEVICE_ID} -p iot_device_type ${IOT_DEVICE_TYPE} -p iot_auth_token ${IOT_AUTH_TOKEN}
# bx wsk action update sendSMS -p accountSid ${TWILIO_SID} -p authToken ${TWILIO_AUTH_TOKEN} -p etcdUrl ${ETCD_URL} -p twilioNumber ${TWILIO_NUMBER}
# bx wsk action update handleIncomingSMS -p
# TODO, fix SMS related options when we find a replacement for etcd

echo "Create Triggers"
bx wsk trigger create audioMsgReceived
bx wsk trigger create txtMsgReceived
bx wsk trigger create SMSMsgReceived
bx wsk trigger create msgTranslated

echo "Create Rules"
# bx wsk rule create RULE_NAME TRIGGER_NAME ACTION_NAME
bx wsk rule create handleTxtMessage txtMsgReceived translateText
# bx wsk rule create handleSMSMessage SMSMsgReceived translateText
bx wsk rule create publishtoIOT msgTranslated iotPub
# bx wsk rule create publishtoSMS msgTranslated sendSMS

# Speech to Text

# Text to Speech

# Twilio

# Watson IoT platform

# MQTT Feed


# bx wsk package refresh
#
# # Set default credentials for corresponding actions
# wsk action update getTTSToken --param TTS_PASSWD ${TTS_PASSWD} --param TTS_USERNAME ${TTS_USERNAME}
# wsk action update getSTTToken --param STT_PASSWD ${STT_PASSWD} --param STT_USERNAME ${STT_USERNAME}
# wsk action update translateText --param TRANSLATION_USER ${TRANSLATION_USER} --param TRANSLATION_PASSWD ${TRANSLATION_PASSWD}
#
#
# # Get action names for translation, stt, tts services
#
# translation_action=$(wsk package list | grep Language.Translator | rev | cut -d " " -f2- | rev)
# stt_action=$(wsk package list | grep Speech.To.Text | rev | cut -d " " -f2- | rev)
# tts_action=$(wsk package list | grep Text.To.Speech | rev | cut -d " " -f2- | rev)
#
# bx wsk action create translate ${translation_action},iot_pub --sequence
# bx wsk action invoke '/kkbankol@us.ibm.com_dev/Bluemix_Language Translator-wp_Credentials-1/translator' --blocking --result --param payload "hello" --param translateFrom "en" --param translateTo "fr"
