import os
import time
import requests
import subprocess
import threading
import queue
import yaml
import json
from .crypto_keys import _sign_message


def handle_job(*, job_id: str):
    config_fname = '.neurobass-compute-resource-node.yaml'
    if not os.path.exists(config_fname):
        raise ValueError(f'File not found: {config_fname}')
    with open(config_fname, 'r') as f:
        config = yaml.safe_load(f)
    for k, v in config.items():
        if v: os.environ[k] = v

    job = _get_job(job_id=job_id)
    if job['status'] != 'pending':
        raise ValueError(f'Unexpected job status: {job["status"]}')
    workspace_id = job['workspaceId']
    project_id = job['projectId']
    _set_job_status(workspace_id=workspace_id, project_id=project_id, job_id=job_id, status='running')

    try:
        job_dir = f'jobs/{job_id}'
        if os.path.exists(job_dir):
            raise ValueError(f'Job directory already exists: {job_dir}')
        os.makedirs(job_dir)

        job_fname = f'{job_dir}/job.json'
        input_files = []
        for a in job['inputFiles']:
            req = {
                'type': 'getFile',
                'timestamp': time.time(),
                'projectId': job['projectId'],
                'fileName': a['fileName']
            }
            resp = _post_neurobass_request(req)
            if resp['type'] != 'getFile':
                raise ValueError(f'Unexpected response type: {resp["type"]}')
            content_string = resp['file']['content']
            input_files.append({
                'name': a['name'],
                'path': a['fileName'],
                'content_string': content_string
            })
        output_files = []
        for a in job['outputFiles']:
            output_files.append({
                'name': a['name'],
                'path': a['fileName']
            })
        parameters = []
        for a in job['inputParameters']:
            if 'value' in a:
                parameters.append({
                    'name': a['name'],
                    'value': a['value']
                })
        job_json = {
            'tool_name': job['toolName'],
            'input_files': input_files,
            'output_files': output_files,
            'parameters': parameters
        }
        with open(job_fname, 'w') as f:
            json.dump(job_json, f, indent=4)

        # run "neurobass run-job" in the job directory
        proc = subprocess.Popen(
            ['neurobass', 'run-job'],
            cwd=job_dir,
            env=os.environ,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT
        )

        def output_reader(proc, outq: queue.Queue):
            while True:
                x = proc.stdout.read(1)
                if len(x) == 0:
                    break
                outq.put(x)

        outq = queue.Queue()
        output_reader_thread = threading.Thread(target=output_reader, args=(proc, outq))
        output_reader_thread.start()

        all_output = b''
        last_newline_index_in_output = -1
        last_report_console_output_time = time.time()
        console_output_changed = False
        last_check_job_exists_time = time.time()

        try:
            while True:
                try:
                    retcode = proc.wait(1)
                    if retcode != 0:
                        raise ValueError(f'Error running job: {retcode}')
                    break
                except subprocess.TimeoutExpired:
                    pass
                while True:
                    try:
                        x = outq.get(block=False)
                        print(x.decode('utf-8'), end='')

                        if x == b'\n':
                            last_newline_index_in_output = len(all_output)
                        if x == b'\r':
                            # handle carriage return (e.g. in progress bar)
                            all_output = all_output[:last_newline_index_in_output + 1]
                        all_output += x
                        console_output_changed = True
                    except queue.Empty:
                        break
                
                if console_output_changed:
                    elapsed = time.time() - last_report_console_output_time
                    if elapsed > 10:
                        last_report_console_output_time = time.time()
                        console_output_changed = False
                        _set_job_console_output(workspace_id=workspace_id, project_id=project_id, job_id=job_id, console_output=all_output.decode('utf-8'))
                        print(all_output.decode('utf-8'))

                elapsed = time.time() - last_check_job_exists_time
                if elapsed > 60:
                    last_check_job_exists_time = time.time()
                    # this should throw an exception if the job does not exist
                    job = _get_job(job_id=job_id)
                    if job['status'] != 'running':
                        raise ValueError(f'Unexpected job status: {job["status"]}')
        finally:
            output_reader_thread.join()
            proc.stdout.close()
            proc.terminate()

        # read the output files and set them in the job
        for a in job['outputFiles']:
            output_fname = f'{job_dir}/outputs/{a["name"]}.json'
            if not os.path.exists(output_fname):
                raise ValueError(f'Output file not found: {output_fname}')
            with open(output_fname, 'r') as f:
                output = json.load(f)
            req = {
                'type': 'setFile',
                'timestamp': time.time(),
                'projectId': job['projectId'],
                'workspaceId': job['workspaceId'],
                'fileName': a['fileName'],
                'content': f'url:{output["url"]}',
                'size': output['size'],
                'jobId': job['jobId'],
                'metadata': {}
            }
            resp = _post_neurobass_request(req)
            if resp['type'] != 'setFile':
                raise ValueError(f'Unexpected response type: {resp["type"]}')
        
        # set the job status to completed
        _set_job_status(workspace_id=workspace_id, project_id=project_id, job_id=job_id, status='completed')
    except Exception as err:
        error_message = str(err)
        print(f'Job error: {error_message}')
        _set_job_error(workspace_id=workspace_id, project_id=project_id, job_id=job_id, error_message=error_message)
        _set_job_status(workspace_id=workspace_id, project_id=project_id, job_id=job_id, status='failed')

def _get_job(*, job_id: str):
    req = {
        'type': 'getJob',
        'timestamp': time.time(),
        'jobId': job_id
    }
    resp = _post_neurobass_request(req)
    if resp['type'] != 'getJob':
        raise ValueError(f'Unexpected response type: {resp["type"]}')
    job = resp['job']
    return job

def _set_job_status(*, workspace_id: str, project_id: str, job_id: str, status: str):
    req = {
        'type': 'setJobProperty',
        'timestamp': time.time(),
        'workspaceId': workspace_id,
        'projectId': project_id,
        'jobId': job_id,
        'property': 'status',
        'value': status
    }
    resp = _post_neurobass_request(req)
    if resp['type'] != 'setJobProperty':
        raise ValueError(f'Unexpected response type: {resp["type"]}')
    if resp['success'] != True:
        raise ValueError(f'Error setting job status: {resp["error"]}')

def _set_job_error(*, workspace_id: str, project_id: str, job_id: str, error_message: str):
    req = {
        'type': 'setJobProperty',
        'timestamp': time.time(),
        'workspaceId': workspace_id,
        'projectId': project_id,
        'jobId': job_id,
        'property': 'error',
        'value': error_message
    }
    resp = _post_neurobass_request(req)
    if resp['type'] != 'setJobProperty':
        raise ValueError(f'Unexpected response type: {resp["type"]}')
    if resp['success'] != True:
        raise ValueError(f'Error setting job error: {resp["error"]}')

def _set_job_console_output(*, workspace_id: str, project_id: str, job_id: str, console_output: str):
    req = {
        'type': 'setJobProperty',
        'timestamp': time.time(),
        'workspaceId': workspace_id,
        'projectId': project_id,
        'jobId': job_id,
        'property': 'consoleOutput',
        'value': console_output
    }
    resp = _post_neurobass_request(req)
    if resp['type'] != 'setJobProperty':
        raise ValueError(f'Unexpected response type: {resp["type"]}')
    if resp['success'] != True:
        raise ValueError(f'Error setting job console output: {resp["error"]}')

# export type SetJobPropertyRequest = {
#     type: 'setJobProperty'
#     timestamp: number
#     workspaceId: string
#     projectId: string
#     jobId: string
#     property: string
#     value: any
#     computeResourceNodeId?: string
#     computeResourceNodeName?: string
# }

def _post_neurobass_request(req):
    compute_resource_id = os.environ['COMPUTE_RESOURCE_ID']
    compute_resource_private_key = os.environ['COMPUTE_RESOURCE_PRIVATE_KEY']
    signature = _sign_message(req, compute_resource_id, compute_resource_private_key)
    rr = {
        'payload': req,
        'fromClientId': compute_resource_id,
        'signature': signature
    }
    neurobass_url = os.environ.get('NEUROBASS_URL', 'https://neurobass.vercel.app')
    resp = requests.post(f'{neurobass_url}/api/neurobass', json=rr)
    if resp.status_code != 200:
        msg = resp.text
        raise ValueError(f'Error posting neurobass request: {msg}')
    return resp.json()