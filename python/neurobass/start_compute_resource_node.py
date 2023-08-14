import sys
import os
import yaml
from pathlib import Path
import subprocess
from threading import Thread
import signal
from .init_compute_resource_node import env_var_keys


this_directory = Path(__file__).parent

class Daemon:
    def __init__(self, *, dir: str, the_env: dict):
        self.dir = dir
        self.the_env = the_env
        self.process = None
        self.output_thread = None

    def _forward_output(self):
        while True:
            line = self.process.stdout.readline()
            sys.stdout.write(line)
            sys.stdout.flush()
            return_code = self.process.poll()
            if return_code is not None:
                print(f'Process exited with return code {return_code}')
                break

    def _handle_exit(self, signum, frame):
        print('Exiting')
        self.stop()
        sys.exit(0)

    def start(self):
        cmd = ["node", f'{this_directory}/js/dist/index.js', "start", "--dir", self.dir]
        analysis_scripts_dir = f'{Path(__file__).parent}/analysis_scripts'
        env0 = dict(
            os.environ,
            ANALYSIS_SCRIPTS_DIR=analysis_scripts_dir,
            COMPUTE_RESOURCE_DIR=self.dir
        )
        for k, v in self.the_env.items():
            env0[k] = v
        self.process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            bufsize=1,
            universal_newlines=True,
            env=env0
        )

        self.output_thread = Thread(target=self._forward_output, daemon=True) # daemon=True means that the thread will not block the program from exiting
        self.output_thread.start()

        signal.signal(signal.SIGINT, self._handle_exit)
        signal.signal(signal.SIGTERM, self._handle_exit)

    def stop(self):
        if self.process:
            self.process.terminate()
            self.process.wait()


def start_compute_resource_node(dir: str):
    env_fname = os.path.join(dir, '.neurobass-compute-resource-node.yaml')
    
    if os.path.exists(env_fname):
        with open(env_fname, 'r') as f:
            the_env = yaml.safe_load(f)
    else:
        the_env = {}
    for k in env_var_keys:
        v = os.getenv(k, None)
        if v:
            the_env[k] = v

    compute_resource_id = the_env.get('COMPUTE_RESOURCE_ID', None)
    compute_resource_private_key = the_env.get('COMPUTE_RESOURCE_PRIVATE_KEY', None)
    if compute_resource_id is None:
        raise ValueError('Compute resource has not been initialized in this directory, and the environment variable COMPUTE_RESOURCE_ID is not set.')
    if compute_resource_private_key is None:
        raise ValueError('Compute resource has not been initialized in this directory, and the environment variable COMPUTE_RESOURCE_PRIVATE_KEY is not set.')

    daemon = Daemon(dir=dir, the_env=the_env)
    daemon.start()

    # Don't exit until the output thread exits
    daemon.output_thread.join()