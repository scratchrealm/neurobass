import sys
import os
import yaml
from pathlib import Path
import subprocess
from threading import Thread
import signal
from .init_compute_resource_node import default_config


this_directory = Path(__file__).parent

class Daemon:
    def __init__(self, *, dir: str):
        self.dir = dir
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
        analysis_scripts_dir = Path(__file__).parent + '/analysis_scripts'
        self.process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            bufsize=1,
            universal_newlines=True,
            env=dict(os.environ, ANALYSIS_SCRIPTS_DIR=analysis_scripts_dir)
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
    config_fname = os.path.join(dir, '.neurobass-compute-resource-node.yaml')
    
    # set default config fields
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

    daemon = Daemon(dir=dir)
    daemon.start()

    # Don't exit until the output thread exits
    daemon.output_thread.join()