import subprocess


def init_singularity_container():
    """Initialize the singularity container"""
    cmd = 'singularity exec docker://magland/neurobass-default python3 -c "import numpy; print(numpy.__version__)"'
    version = subprocess.check_output(cmd, shell=True).decode('utf-8').strip()
    print(f'numpy version: {version}')