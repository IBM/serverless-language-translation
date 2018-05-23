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

HOST = 'messaging.internetofthings.ibmcloud.com'
PORT = 1883
PATH = '.' + HOST + ':' + PORT + '/api/v0002/application/types/'


def main(dict):
    iot_org_id = dict['iot_org_id']
    iot_device_id = dict['iot_device_id']
    iot_device_type = dict['iot_device_type']
    iot_auth_token = dict['iot_auth_token']
    iot_api_key = dict['iot_api_key']
    requests.post('http://' + iot_org_id + PATH + iot_device_type +
                  '/devices/' + iot_device_id + '/events/toClients',
                  headers={'Content-Type': 'application/json'},
                  json={
                    'payload': dict['payload'],
                    'client': dict['client'],
                    'language': dict['language'] or dict['sourceLanguage']},
                  auth=(iot_api_key, iot_auth_token))
    return {'msg': dict['payload']}
