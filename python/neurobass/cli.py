import click
import neurobass
from .init_compute_resource_node import init_compute_resource_node as init_compute_resource_node_function
from .start_compute_resource_node import start_compute_resource_node as start_compute_resource_node_function
from .run_job import run_job as run_job_function
from .handle_job import handle_job as handle_job_function

@click.group(help="neurobass command line interface")
def main():
    pass

@click.command(help='Initialize a compute resource node in the current directory')
@click.option('--compute-resource-id', default='', help='Compute resource ID')
@click.option('--compute-resource-private-key', default='', help='Compute resource private key')
def init_compute_resource_node(compute_resource_id: str, compute_resource_private_key: str):
    init_compute_resource_node_function(dir='.', compute_resource_id=compute_resource_id, compute_resource_private_key=compute_resource_private_key)

@click.command(help="Start the compute resource node in the current directory")
def start_compute_resource_node():
    start_compute_resource_node_function(dir='.')

@click.command(help='Run the job in the current directory (used internally)')
def run_job():
    run_job_function()

@click.command(help='Handle a job by interacting with the neurobass REST API (used internally)')
@click.option('--job-id', help='Job ID')
def handle_job(job_id: str):
    handle_job_function(job_id=job_id)

@click.command(help='Initialize the singularity container')
def init_singularity_container():
    neurobass.init_singularity_container()

@click.command(help='Initialize the docker container')
def init_docker_container():
    neurobass.init_docker_container()

main.add_command(init_compute_resource_node)
main.add_command(start_compute_resource_node)
main.add_command(run_job)
main.add_command(handle_job)
main.add_command(init_singularity_container)
main.add_command(init_docker_container)