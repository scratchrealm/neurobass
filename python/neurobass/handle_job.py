import os
import time
import requests
import yaml
from .crypto_keys import _sign_message


def handle_job(*, job_id: str):
    config_fname = '.neurobass-compute-resource-node.yaml'
    if not os.path.exists(config_fname):
        raise ValueError(f'File not found: {config_fname}')
    with open(config_fname, 'r') as f:
        config = yaml.safe_load(f)
    for k, v in config.items():
        if v: os.environ[k] = v

    req = {
        'type': 'getJob',
        'timestamp': time.time(),
        'jobId': job_id
    }
    resp = _post_neurobass_request(req)
    if resp['type'] != 'getJob':
        raise ValueError(f'Unexpected response type: {resp["type"]}')
    job = resp['job']
    print(job)

def _post_neurobass_request(req):
    compute_resource_id = os.environ['COMPUTE_RESOURCE_ID']
    compute_resource_private_key = os.environ['COMPUTE_RESOURCE_PRIVATE_KEY']
    signature = _sign_message(req, compute_resource_id, compute_resource_private_key)
    rr = {
        'payload': req,
        'fromClientId': compute_resource_id,
        'signature': signature
    }
    neurobass_url = os.environ.get('NEUROBASS_URL', 'https://neurobass.vercel.app')
    resp = requests.post(f'{neurobass_url}/api/neurobass', json=rr)
    if resp.status_code != 200:
        msg = resp.text
        raise ValueError(f'Error: {msg}')
    return resp.json()