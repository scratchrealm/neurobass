# NVIDIA-ready Image
FROM nvidia/cuda:11.6.2-base-ubuntu20.04

# Installing Python with miniconda
RUN apt-get update && \
    apt-get install -y build-essential  && \
    apt-get install -y wget && \
    apt-get install -y git && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

ENV MINICONDA_VERSION 4.8.2
ENV CONDA_DIR /home/miniconda3
ENV LATEST_CONDA_SCRIPT "Miniconda3-py38_$MINICONDA_VERSION-Linux-x86_64.sh"

RUN wget --quiet https://repo.anaconda.com/miniconda/$LATEST_CONDA_SCRIPT -O ~/miniconda.sh && \
    bash ~/miniconda.sh -b -p $CONDA_DIR && \
    rm ~/miniconda.sh
ENV PATH=$CONDA_DIR/bin:$PATH

RUN apt-get update && apt-get -y install curl && \
    curl -sL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs

# Get Python stdout logs
ENV PYTHONUNBUFFERED=1

RUN pip install mountainsort5

# See https://stackoverflow.com/questions/63383400/error-cannot-uninstall-ruamel-yaml-while-creating-docker-image-for-azure-ml-a
RUN rm -rf $(python -c "from distutils.sysconfig import get_python_lib; print(get_python_lib())")/ruamel* && \
    pip install pynwb boto3

# Remove in the future
RUN pip install remfile

RUN mkdir /src

RUN git clone https://github.com/scratchrealm/neurobass.git /src/neurobass && \
    cd /src/neurobass && \
    git checkout main && echo "2" && \
    cd python && \
    pip install -e .

RUN mkdir /neurobass-compute-resource

WORKDIR /neurobass-compute-resource

CMD ["neurobass", "start-compute-resource-node"]