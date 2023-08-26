import os
import json
from typing import List
from pydantic import BaseModel, Field
from ...NeurobassPluginTypes import NeurobassProcessingTool, NeurobassProcessingToolContext, InputFile, OutputFile

class CaimanModel(BaseModel):
    """CaImAn implements a set of essential methods required in the analysis pipeline of large scale calcium imaging data.
Fast and scalable algorithms are implemented for motion correction, source extraction, spike deconvolution, and component registration across multiple days.
It is suitable for both two-photon and one-photon fluorescence microscopy data, and can be run in both batch and online modes.
CaImAn also contains some routines for the analysis of behavior from video cameras.
A list of features as well as relevant references can be found at https://caiman.readthedocs.io/en/latest/CaImAn_features_and_references.html.
    """
    input: InputFile = Field(..., description="Input NWB file")
    output: OutputFile = Field(..., description="Output NWB file")

class CaimanProcessingTool(NeurobassProcessingTool):
    @classmethod
    def get_name(cls) -> str:
        return "caiman"
    @classmethod
    def get_attributes(cls) -> dict:
        return {
            'wip': True,
            'logo_url': 'https://github.com/flatironinstitute/CaImAn/raw/main/docs/LOGOS/Caiman_logo_FI.png',
            'label': 'CaImAn'
        }
    @classmethod
    def get_tags(cls) -> List[str]:
        return ['calcium_imaging']
    @classmethod
    def get_model(cls) -> BaseModel:
        return CaimanModel
    @classmethod
    def run(cls, context: NeurobassProcessingToolContext):
        _run(context)

def _run(context: NeurobassProcessingToolContext):
    working_dir = 'working'
    os.mkdir(working_dir)

    data = CaimanModel(context.get_data())

    nwb_url = context.get_input_file_url(data.input)

    if working_dir == 'working':
        raise Exception('Not yet implemented')