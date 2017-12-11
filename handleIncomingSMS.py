import sys
import requests

# Handles incoming text messages
# This whisk action will need to be exposed as a webaction, and the link to the generated url will be provided as Twilio's Messaging webhook
# required params:
# etcd_endpoint, translation_password, translation_username, watson_iot_username, watson_iot_password, watson_iot_org, watson_iot_device
def main(dict):
  sender = dict['From'] # dict['sender']
  message = dict['Body'] # dict['message']

  # Get etcd keys
  etcd_endpoint_keys = 'http://' + params.etcd_endpoint+ ':2379/v2/keys'

  watson_language_translation = {
    "url": "https://gateway.watsonplatform.net/language-translation/api",
    "password": params.translation_password,
    "username": params.translation_username
  }

  watson_iot_creds = {
    "username": params.watson_iot_username,
    "password": params.watson_iot_password,
    "org": params.watson_iot_org,
    "device": params.watson_iot_device
  }

  # See if number exists in keystore
  numberKey = requests.get(etcd_endpoint_keys + '/numbers/' + sender).json()

  if 'errorCode' in numberKey.keys():
  # If it does not, detect sender language
    language = requests.get( watson_language_translation['url'] + "/v2/identify?text=" + message, auth=(watson_language_translation['username'], watson_language_translation['password']) )
    requests.put(etcd_endpoint_keys + '/numbers/' + sender, {"value": language.text , "ttl": 300})
    requests.put(etcd_endpoint_keys + '/languages/' + language.text + '/' + sender, {"value": "foo" , "ttl": 300})
    print "added " + sender + " to the etcd keystore"
    requests.post('http://' + watson_iot_creds.device + '.messaging.internetofthings.ibmcloud.com:1883/api/v0002/device/types/MQTTDevice/devices/' + watson_iot_creds.device + '/events/msgout', headers={'Content-Type': 'application/json'}, json={'d': { "language": language.text, "message": message, "client": sender, "sender": sender }}, auth=(watson_iot_creds.username, watson_iot_creds.password))
    return {"result" : "added " + language.text + " client: " + sender + ", sent message " + message}

  else:
  # Reset key with same value, simply to restart TTL timer
    language = numberKey['node']['value']
    requests.put(etcd_endpoint_keys + '/numbers/' + sender, {"value":language,"ttl":300})
    requests.put(etcd_endpoint_keys + '/languages/' + language + '/' + sender, {"value": "foo" , "ttl": 300})
    print "reset TTL for " + sender
    requests.post('http://' + watson_iot_creds.device + '.messaging.internetofthings.ibmcloud.com:1883/api/v0002/device/types/MQTTDevice/devices/' + watson_iot_creds.device + '/events/msgout', headers={'Content-Type': 'application/json'}, json={'d': { "language": language, "message": message, "client": sender, "sender": sender  }}, auth=(watson_iot_creds.username, watson_iot_creds.password))
    return {"result" : "reset TTL for " + language + " client: " + sender + ", sent message " + message}
# main({"sender": "+" + sender,"message":"hello"})
