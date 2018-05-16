# Install Bluemix Cloud CLI beforehand
bx
bx wsk
# bx plugin install Cloud-Functions -r Bluemix

# Ensure required CloudFoundry services are provisioned
bx login
bx target --cf
REQUIRED_SERVICES=("language_translation" "speech_to_text" "text_to_speech" "iotf-service" "cloudantNoSQLDB" )
EXISTING_SERVICES=$(bx cf services) # | grep $(echo ${REQUIRED_SERVICES[@]/#// -e }  | sed -e 's/\///g') )
for SERVICE in ${REQUIRED_SERVICES[@]} ; do
  # Get name of each existing service
  unset SERVICE_INSTANCE_NAME
  SERVICE_INSTANCE_NAME=$(echo "${EXISTING_SERVICES}" | grep -m 1 ${SERVICE} | awk -F ${SERVICE} '{print $1}')
  if [[ -z "${SERVICE_INSTANCE_NAME}" ]] ; then
    # cf create-service $SERVICE
    echo "Missing services, please create an ${SERVICE} instance in the Bluemix UI"
    exit 1
  fi
done
exit

# Set
bx wsk package refresh
CLOUD_FUNC_PACKAGES=$(bx wsk package list)
function parsePackageName() {
  result=$(echo "${CLOUD_FUNC_PACKAGES}" | grep -i "$@" | grep -i -m 1 'Credentials' | awk -F ' '  '{gsub($NF,"");print}')
  echo $result
}

# Get names of OpenWhisk actions
TTS_ACTION=$(parsePackageName 'text to speech')
STT_ACTION=$(parsePackageName 'speech to text')
TRANSLATION_ACTION=$(parsePackageName 'language translator')



# Create Serverless Actions
wsk action create translateText translateText.js
wsk action create sendSMS sendSMS.js
wsk action create iotPub iotPub.py
wsk action create handleIncomingSMS handleIncomingSMS.py


bx wsk service bind language_translator translateText


# Speech to Text

# Text to Speech

# Twilio

# Watson IoT platform

# MQTT Feed


bx wsk package refresh

# Set default credentials for corresponding actions
wsk action update getTTSToken --param TTS_PASSWD ${TTS_PASSWD} --param TTS_USERNAME ${TTS_USERNAME}
wsk action update getSTTToken --param STT_PASSWD ${STT_PASSWD} --param STT_USERNAME ${STT_USERNAME}
wsk action update translateText --param TRANSLATION_USER ${TRANSLATION_USER} --param TRANSLATION_PASSWD ${TRANSLATION_PASSWD}


# Get action names for translation, stt, tts services

translation_action=$(wsk package list | grep Language.Translator | rev | cut -d " " -f2- | rev)
stt_action=$(wsk package list | grep Speech.To.Text | rev | cut -d " " -f2- | rev)
tts_action=$(wsk package list | grep Text.To.Speech | rev | cut -d " " -f2- | rev)

bx wsk action create translate ${translation_action},iot_pub --sequence
bx wsk action invoke '/kkbankol@us.ibm.com_dev/Bluemix_Language Translator-wp_Credentials-1/translator' --blocking --result --param payload "hello" --param translateFrom "en" --param translateTo "fr"
