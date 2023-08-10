# Setting up Compute Resource on Digital Ocean

Create the DO droplet

Basic
4 GB / 2 CPUs
80 GB SSD Disk
4 TB transfer
$24/month

Set a root password

Install doctl

Generate a DO personal access token

doctl auth init
Enter the access token

ssh into the droplet
doctl compute ssh neurobass-default-compute-resource
Enter the password

check the version of python
python --version

install pip
pip install python3-pip

Install nodejs recent version
curl -sL https://deb.nodesource.com/setup_16.x -o /tmp/nodesource_setup.sh
sudo bash /tmp/nodesource_setup.sh
sudo apt-get install -y nodejs
See: https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-ubuntu-20-04

Install singularity

Download the .deb package for the appropriate version of ubuntu
https://github.com/sylabs/singularity/releases

For example:
wget https://github.com/sylabs/singularity/releases/download/v3.11.3/singularity-ce_3.11.3-jammy_amd64.deb
prerequisite: sudo apt install uidmap
sudo dpkg -i singularity-ce_3.11.3-jammy_amd64.deb

Install neurobass
mkdir src
cd src
git clone https://github.com/scratchrealm/neurobass
cd neurobass
cd python
pip install -e .
This should comple the nodejs code as well

Create the compute-resource directory and initialize it
cd
mkdir compute-resource
cd compute-resource
neurobass register-compute-resource

Edit the config file and set containerMethod to singularity

neurobass init-singularity-container

tmux new -s compute-resource
neurobass start-compute-resource --dir .
Ctrl-b d

Later to attach:
tmux a -t compute-resource
