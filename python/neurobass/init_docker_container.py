import subprocess


def init_docker_container():
    """Initialize the docker container"""
    cmd = 'docker run --rm magland/neurobass-default bash -c "python3 -c \\"import numpy; print(numpy.__version__)\\""'
    version = subprocess.check_output(cmd, shell=True).decode('utf-8').strip()
    print(f'numpy version: {version}')