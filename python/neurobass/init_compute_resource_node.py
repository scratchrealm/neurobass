import os
import socket
import time
import yaml
from typing import Optional
from .crypto_keys import sign_message, generate_keypair


default_config = {
    'job_slots': [
        {
            'count': 2,
            'num_cpus': 1,
            'ram_gb': 1,
            'timeout_sec': 10
        },
        {
            'count': 2,
            'num_cpus': 2,
            'ram_gb': 4,
            'timeout_sec': 180
        }
    ]
}

def init_compute_resource_node(*, dir: str, compute_resource_id: Optional[str]=None, compute_resource_private_key: Optional[str]=None):
    """Initialize a Neurobass compute resource node.

    Args:
        dir: The directory associated with the compute resource node.
    """
    config_fname = os.path.join(dir, '.neurobass-compute-resource-node.yaml')

    if not os.path.exists(config_fname):
        if not compute_resource_id:
            if compute_resource_private_key:
                raise ValueError('Cannot specify compute_resource_private_key without specifying compute_resource_id.')
            public_key_hex, private_key_hex = generate_keypair()
            compute_resource_id = public_key_hex
            compute_resource_private_key = private_key_hex
        else:
            if not compute_resource_private_key:
                raise ValueError('Cannot specify compute_resource_id without specifying compute_resource_private_key.')
        x = {
            'compute_resource_id': compute_resource_id,
            'compute_resource_private_key': compute_resource_private_key
        }
        x['node_id'] = _random_string(10)
        # prompt for user input of the node name with a default of the host name
        host_name = socket.gethostname()
        x['node_name'] = input(f'Enter a name for this compute resource node (default: {host_name}): ') or host_name

        for k in default_config:
            x[k] = default_config[k]
        with open(config_fname, 'w') as f:
            yaml.dump(x, f)
    elif compute_resource_id is not None or compute_resource_private_key is not None:
        raise ValueError('Cannot specify compute_resource_id or compute_resource_private_key if compute resource node is already initialized.')
    
    with open(config_fname, 'r') as f:
        config = yaml.safe_load(f)
    something_changed = False
    for k in default_config:
        if k not in config:
            config[k] = default_config[k]
            something_changed = True
    if something_changed:
        with open(config_fname, 'w') as f:
            yaml.dump(config, f)
    compute_resource_id = config['compute_resource_id']
    compute_resource_private_key = config['compute_resource_private_key']

    timestamp = int(time.time())
    msg = {
        'timestamp': timestamp
    }
    signature = sign_message(msg, compute_resource_id, compute_resource_private_key)
    resource_code = f'{timestamp}-{signature}'

    url = f'https://neurobass.vercel.app/register-compute-resource/{compute_resource_id}/{resource_code}'
    print('')
    print('Please visit the following URL in your browser to register your compute resource node:')
    print('')
    print(url)
    print('')

def _random_string(length: int) -> str:
    import random
    import string
    return ''.join(random.choice(string.ascii_lowercase) for i in range(length))