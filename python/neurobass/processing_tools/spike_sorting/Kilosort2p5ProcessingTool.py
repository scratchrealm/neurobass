import os
import json
from typing import List
from pydantic import BaseModel, Field
from ...NeurobassPluginTypes import NeurobassProcessingTool, NeurobassProcessingToolContext, InputFile, OutputFile
import pynwb
import h5py
import remfile
import spikeinterface as si
import spikeinterface.preprocessing as spre
from .NwbRecording import NwbRecording
from .create_sorting_out_nwb_file import create_sorting_out_nwb_file


class Kilosort2p5SortingParams(BaseModel):
    detect_threshold: float = Field(6, description="Threshold for spike detection")
    projection_threshold: List[float] = Field([10, 4], description="Threshold on projections")
    preclust_threshold: float = Field(8, description="Threshold crossings for pre-clustering (in PCA projection space)")
    car: bool = Field(True, description="Enable or disable common reference")
    minFR: float = Field(0.1, description="Minimum spike rate (Hz), if a cluster falls below this for too long it gets removed")
    minfr_goodchannels: float = Field(0.1, description="Minimum firing rate on a 'good' channel")
    nblocks: int = Field(5, description="blocks for registration. 0 turns it off, 1 does rigid registration. Replaces 'datashift' option.")
    sig: int = Field(20, description="spatial smoothness constant for registration")
    freq_min: int = Field(150, description="High-pass filter cutoff frequency")
    sigmaMask: int = Field(30, description="Spatial constant in um for computing residual variance of spike")
    nPCs: int = Field(3, description="Number of PCA dimensions")
    ntbuff: int = Field(64, description="Samples of symmetrical buffer for whitening and spike detection")
    nfilt_factor: int = Field(4, description="Max number of clusters per good channel (even temporary ones) 4")
    do_correction: bool = Field(True, description="If True drift registration is applied")
    NT: int = Field(None, description="Batch size (if None it is automatically computed)")
    AUCsplit: float = Field(0.9, description="Threshold on the area under the curve (AUC) criterion for performing a split in the final step")
    keep_good_only: bool = Field(False, description="If True only 'good' units are returned")
    wave_length: int = Field(61, description="size of the waveform extracted around each detected peak, (Default 61, maximum 81)")
    skip_kilosort_preprocessing: bool = Field(False, description="Can optionaly skip the internal kilosort preprocessing")
    scaleproc: int = Field(None, description="int16 scaling of whitened data, if None set to 200.")

    

class Kilosort2p5Model(BaseModel):
    """Kilosort2.5 is a spike sorting software package developed by Marius Pachitariu at Janelia Research Campus.
It uses a GPU-accelerated algorithm to detect, align, and cluster spikes across many channels.
Kilosort2.5 improves on Kilosort2 primarily in the type of drift correction used.
This tool has become an essential part of the workflow many electrophysiology labs.
For more information see https://github.com/MouseLand/Kilosort
    """
    input: InputFile = Field(..., description="Input NWB file")
    output: OutputFile = Field(..., description="Output NWB file")
    electrical_series_path: str = Field(..., description="Path to the electrical series in the NWB file, e.g., /acquisition/ElectricalSeries")
    sorting_params: Kilosort2p5SortingParams = Field(..., description="Sorting parameters")

class Kilosort2p5ProcessingTool(NeurobassProcessingTool):
    @classmethod
    def get_name(cls) -> str:
        return "kilosort2.5"
    @classmethod
    def get_attributes(cls) -> dict:
        return {
            'wip': True,
            'label': 'Kilosort 2.5'
        }
    @classmethod
    def get_tags(cls) -> List[str]:
        return ['spike_sorting', 'spike_sorter']
    @classmethod
    def get_schema(cls) -> dict:
        return json.loads(Kilosort2p5Model.schema_json())
    @classmethod
    def run(cls, context: NeurobassProcessingToolContext):
        _run(context)

def _run(context: NeurobassProcessingToolContext):
    working_dir = 'working'
    os.mkdir(working_dir)

    data = Kilosort2p5Model(context.get_data())

    nwb_url = context.get_input_file_url(data.input)

    recording_electrical_series_path = data.electrical_series_path

    # open the remote file
    disk_cache = remfile.DiskCache('/tmp/remfile_cache')
    remf = remfile.File(nwb_url, disk_cache=disk_cache)
    f = h5py.File(remf, 'r')

    recording = NwbRecording(
        file=f,
        electrical_series_path=recording_electrical_series_path
    )

    if working_dir == 'working':
        raise Exception('Not yet implemented')
    
    # placeholder
    sorting = si.NpzSortingExtractor()

    with pynwb.NWBHDF5IO(file=h5py.File(remf, 'r'), mode='r') as io:
        nwbfile_rec = io.read()
        
        if not os.path.exists('output'):
            os.mkdir('output')
        sorting_out_fname = 'output/sorting.nwb'

        create_sorting_out_nwb_file(nwbfile_rec=nwbfile_rec, sorting=sorting, sorting_out_fname=sorting_out_fname)
        
        sorting_url = context.upload_output_file(sorting_out_fname, 'sorting.nwb')
        context.set_output_file_url(data.output, sorting_url)