from typing import Any
import os
import json
from uuid import uuid4
import importlib
import inspect
from .init_compute_resource_node import env_var_keys

import boto3


def run_job():
    from .NeurobassPluginTypes import NeurobassPlugin, NeurobassPluginContext, NeurobassProcessingTool, NeurobassProcessingToolContext, InputFile, OutputFile

    # https://{CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com
    OUTPUT_ENDPOINT_URL = os.environ.get('OUTPUT_ENDPOINT_URL', None)
    OUTPUT_AWS_ACCESS_KEY_ID = os.environ['OUTPUT_AWS_ACCESS_KEY_ID']
    OUTPUT_AWS_SECRET_ACCESS_KEY = os.environ['OUTPUT_AWS_SECRET_ACCESS_KEY']
    OUTPUT_BUCKET = os.environ['OUTPUT_BUCKET']
    OUTPUT_BUCKET_BASE_URL = os.environ['OUTPUT_BUCKET_BASE_URL']

    s3 = boto3.client('s3',
        endpoint_url = OUTPUT_ENDPOINT_URL,
        aws_access_key_id = OUTPUT_AWS_ACCESS_KEY_ID,
        aws_secret_access_key = OUTPUT_AWS_SECRET_ACCESS_KEY
    )

    # This code is duplicated from start_compute_resource_node.py
    processing_tools: list[NeurobassProcessingTool] = []
    class NeurobassPluginContextImpl(NeurobassPluginContext):
        def __init__(self):
            pass
        def register_processing_tool(self, tool: NeurobassPlugin):
            processing_tools.append(tool)
    plugin_context = NeurobassPluginContextImpl()
    plugin_package_names = ['neurobass']
    for plugin_package_name in plugin_package_names:
        module = importlib.import_module(plugin_package_name)
        for attr_name in dir(module):
            X = getattr(module, attr_name)
            if inspect.isclass(X) and issubclass(X, NeurobassPlugin):
                X.initialize(plugin_context)
    #################################################################
    
    # Read job.json
    with open('job.json', 'r') as f:
        job = json.load(f)
    
    if not os.path.exists('outputs'):
        os.mkdir('outputs')
    
    tool_name = job['tool_name']
    tool = None
    for pt in processing_tools:
        if pt.get_name() == tool_name:
            tool = pt
            break
    if tool is None:
        raise ValueError(f'Processing tool not found: {tool_name}')
    
    class NeurobassProcessingToolContextImpl(NeurobassProcessingToolContext):
        def get_data(self) -> Any:
            d = {}
            for x in job['input_files']:
                d[x['name']] = InputFile(name=x['name'], path=x['path'], content_string=x['content_string'])
            for x in job['output_files']:
                d[x['name']] = OutputFile(name=x['name'], path=x['path'])
            for x in job['parameters']:
                if 'value' in x:
                    d[x['name']] = x['value']
            return d
        def get_input_file_url(self, input_file: InputFile) -> str:
            x = input_file.content_string
            if not x.startswith('url:'):
                raise ValueError(f'Unexpected content string: {x}')
            return x[len('url:'):]
        def upload_output_file(self, output_file: OutputFile, path: str):
            random_output_id = str(uuid4())[0:8]
            basename = os.path.basename(path)
            s3.upload_file(path, OUTPUT_BUCKET, f'neurobass-dev/{random_output_id}/{basename}')
            # for now we hard-code neurosift.org
            url = f'{OUTPUT_BUCKET_BASE_URL}/neurobass-dev/{random_output_id}/{basename}'
            with open (f'outputs/{output_file.name}.json', 'w') as f:
                out = {
                    'url': url,
                    'size': os.path.getsize(path)
                }
                json.dump(out, f)
    
    print(f'Running job: {tool_name}')
    for x in job['input_files']:
        print(f'  Input file: {x["name"]}')
    for x in job['output_files']:
        print(f'  Output file: {x["name"]}')
    for x in job['parameters']:
        print(f'  Parameter: {x["name"]}: {x["value"]}')

    # Create the context and run the tool, which will produce the output files
    tool.run(NeurobassProcessingToolContextImpl())

    # check that the output files were created
    for x in job['output_files']:
        output_fname = f'outputs/{x["name"]}.json'
        if not os.path.exists(output_fname):
            raise ValueError(f'Output file not found: {output_fname}')
        with open(output_fname, 'r') as f:
            out = json.load(f)
            if 'url' not in out:
                raise ValueError(f'Unexpected output file format: {output_fname}')
            if 'size' not in out:
                raise ValueError(f'Unexpected output file format: {output_fname}')