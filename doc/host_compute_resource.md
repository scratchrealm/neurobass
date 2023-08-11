# Hosting a compute resource

Each Neurobass workspace comes equipped with a dedicated compute resource for executing analysis jobs. The default setting uses a cloud resource provided by the author with specific limitations on CPU, memory, and concurrent jobs, shared among all users. This public resource should not be used for intensive processing. Users can link their own compute resources to their workspaces.

Prerequisites

* Python >= 3.9
* NodeJS >= v18
* Docker or (Singularity >= 3.11)

Clone this repo, then

```bash
# install
cd neurobass/python
pip install -e .
```

```bash
# Initialize (one time)
export COMPUTE_RESOURCE_DIR=/some/path
export NEUROBASS_CONTAINER_METHOD=singularity # or docker
cd $COMPUTE_RESOURCE_DIR
neurobass init-compute-resource-node
# Open the provided link in a browser and log in using GitHub
```

```bash
# If using docker, initialize the docker container
neurobass init-docker-container

# --- or ---

# If using singularity, initialize the singularity container
neurobass init-singularity-container
```

```bash
# Start the compute resource
cd $COMPUTE_RESOURCE_DIR
neurobass start-compute-resource-node
# Leave this open in a terminal
```

In the web interface, go to settings for your workspace, and select your compute resource. New analyses within your workspace will now use your compute resource for analysis jobs.