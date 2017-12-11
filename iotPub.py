import sys
import requests
def main(dict):
    iot_org_id = dict['iot_org_id']
    device_id = dict['device_id']
    device_type = dict['device_type']
    api_token = dict['api_token']
    r = requests.post('http://' + iot_org_id + '.messaging.internetofthings.ibmcloud.com:1883/api/v0002/device/types/' + device_type '/devices/' + device_id + '/events/query', headers={'Content-Type': 'application/json'}, json={'payload': dict['payload'], 'client': dict['client'], 'language': dict['language']}, auth=('use-token-auth', api_token))
    return {'msg': dict['msg']['text']}
