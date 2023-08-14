import os
import socket
import time
import yaml
from typing import Optional
from .crypto_keys import sign_message, generate_keypair


env_var_keys = [
    'COMPUTE_RESOURCE_ID',
    'COMPUTE_RESOURCE_PRIVATE_KEY',
    'NODE_ID',
    'NODE_NAME',
    'CONTAINER_METHOD',
    'SINGLETON_JOB_ID',
    'OUTPUT_ENDPOINT_URL',
    'OUTPUT_AWS_ACCESS_KEY_ID',
    'OUTPUT_AWS_SECRET_ACCESS_KEY',
    'OUTPUT_BUCKET',
    'OUTPUT_BUCKET_BASE_URL'
]

def init_compute_resource_node(*, dir: str, compute_resource_id: Optional[str]=None, compute_resource_private_key: Optional[str]=None):
    """Initialize a Neurobass compute resource node.

    Args:
        dir: The directory associated with the compute resource node.
    """
    env_fname = os.path.join(dir, '.neurobass-compute-resource-node.yaml')

    the_env = {}
    for k in env_var_keys:
        the_env[k] = ''
    if not os.path.exists(env_fname):
        if not compute_resource_id:
            if compute_resource_private_key:
                raise ValueError('Cannot specify compute_resource_private_key without specifying compute_resource_id.')
            public_key_hex, private_key_hex = generate_keypair()
            compute_resource_id = public_key_hex
            compute_resource_private_key = private_key_hex
        else:
            if not compute_resource_private_key:
                raise ValueError('Cannot specify compute_resource_id without specifying compute_resource_private_key.')
        the_env['COMPUTE_RESOURCE_ID'] = compute_resource_id
        the_env['COMPUTE_RESOURCE_PRIVATE_KEY'] = compute_resource_private_key
        the_env['NODE_ID'] = _random_string(10)
        # prompt for user input of the node name with a default of the host name
        host_name = socket.gethostname()
        the_env['NODE_NAME'] = input(f'Enter a name for this compute resource node (default: {host_name}): ') or host_name

        with open(env_fname, 'w') as f:
            yaml.dump(the_env, f)
    elif compute_resource_id is not None or compute_resource_private_key is not None:
        raise ValueError('Cannot specify compute_resource_id or compute_resource_private_key if compute resource node is already initialized.')
    
    with open(env_fname, 'r') as f:
        the_env = yaml.safe_load(f)
    
    COMPUTE_RESOURCE_ID = the_env['COMPUTE_RESOURCE_ID']
    COMPUTE_RESOURCE_PRIVATE_KEY = the_env['COMPUTE_RESOURCE_PRIVATE_KEY']

    timestamp = int(time.time())
    msg = {
        'timestamp': timestamp
    }
    signature = sign_message(msg, COMPUTE_RESOURCE_ID, COMPUTE_RESOURCE_PRIVATE_KEY)
    resource_code = f'{timestamp}-{signature}'

    url = f'https://neurobass.vercel.app/register-compute-resource/{COMPUTE_RESOURCE_ID}/{resource_code}'
    print('')
    print('Please visit the following URL in your browser to register your compute resource node:')
    print('')
    print(url)
    print('')

def _random_string(length: int) -> str:
    import random
    import string
    return ''.join(random.choice(string.ascii_lowercase) for i in range(length))