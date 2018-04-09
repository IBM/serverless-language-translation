# Copyright 2018 IBM Corp. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.

import requests

# Handles incoming text messages
# This whisk action will need to be exposed as a webaction, and the link to
# the generated url will be provided as Twilio's Messaging webhook
# required params:
# etcd_endpoint, translation_password, translation_username,
# watson_iot_username, watson_iot_password, watson_iot_org, watson_iot_device

# TODO(someone): use python watson sdk or convert to node


def main(dict):

    # dict['sender']
    sender = dict['From']
    # dict['message']
    message = dict['Body']

    # Get etcd keys
    etcd_keys = 'http://' + params.etcd_endpoint + ':2379/v2/keys'

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

    MQTT_PATH = '.messaging.internetofthings.ibmcloud.com:1883/api/v0002/device/types/MQTTDevice/devices/'  # noqa

    # See if number exists in keystore
    numberKey = requests.get(etcd_keys + '/numbers/' + sender).json()

    if 'errorCode' in numberKey.keys():
        # If it does not, detect sender language
        language = requests.get(
          watson_language_translation['url'] + "/v2/identify?text=" + message,
          auth=(watson_language_translation['username'],
                watson_language_translation['password']))
        requests.put(etcd_keys + '/numbers/' + sender,
                     {"value": language.text, "ttl": 300})
        requests.put(etcd_keys + '/languages/' + language.text + '/' + sender,
                     {"value": "foo", "ttl": 300})
        print("added " + sender + " to the etcd keystore")
        requests.post('http://' + watson_iot_creds['device'] + MQTT_PATH + watson_iot_creds['device'] + '/events/msgout',  # noqa
                      headers={'Content-Type': 'application/json'},
                      json={'d': {"language": language.text,
                                  "message": message,
                                  "client": sender,
                                  "sender": sender}},
                      auth=(watson_iot_creds['username'],
                            watson_iot_creds['password']))
        print_msg = ("added " + language.text +
                     " client: " + sender + ", sent message ")
        return {"result": print_msg + message}
    else:
        # Reset key with same value, simply to restart TTL timer
        language = numberKey['node']['value']
        requests.put(etcd_keys + '/numbers/' + sender,
                     {"value": language, "ttl": 300})
        requests.put(etcd_keys + '/languages/' + language + '/' + sender,
                     {"value": "foo", "ttl": 300})
        print("reset TTL for " + sender)
        requests.post('http://' + watson_iot_creds['device'] + MQTT_PATH + watson_iot_creds['device'] + '/events/msgout',  # noqa
                      headers={'Content-Type': 'application/json'},
                      json={'d': {"language": language,
                                  "message": message,
                                  "client": sender,
                                  "sender": sender}},
                      auth=(watson_iot_creds['username'],
                            watson_iot_creds['password']))
        print_msg = ("reset TTL for " + language +
                     " client: " + sender + ", sent message ")
        return {"result": print_msg + message}
