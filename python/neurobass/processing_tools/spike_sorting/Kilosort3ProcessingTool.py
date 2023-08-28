import os
from typing import List
from pydantic import BaseModel, Field
from ...NeurobassPluginTypes import NeurobassProcessingTool, NeurobassProcessingToolContext, InputFile, OutputFile
import numpy as np
import pynwb
import h5py
import remfile
import spikeinterface as si
import spikeinterface.preprocessing as spre
from .NwbRecording import NwbRecording
from .create_sorting_out_nwb_file import create_sorting_out_nwb_file
from .helpers.run_kilosort3 import run_kilosort3


sorting_params_group = 'sorting_params'

class Kilosort3Model(BaseModel):
    """Kilosort3 is a spike sorting software package developed by Marius Pachitariu at Janelia Research Campus.
It uses a GPU-accelerated algorithm to detect, align, and cluster spikes across many channels.
Building on previous versions, Kilosort3 offers improved efficiency and accuracy in the extraction of neural spike waveforms from multichannel electrophysiological recordings.
By leveraging parallel processing capabilities of modern GPUs, it enables sorting with minimal manual intervention.
This tool has become an essential part of the workflow many electrophysiology labs.
For more information see https://github.com/MouseLand/Kilosort
    """
    input: InputFile = Field(..., description="Input NWB file")
    output: OutputFile = Field(..., description="Output NWB file")
    electrical_series_path: str = Field(..., description="Path to the electrical series in the NWB file, e.g., /acquisition/ElectricalSeries")
    
    detect_threshold: float = Field(6, description="Threshold for spike detection", group=sorting_params_group)
    projection_threshold: List[float] = Field([9, 9], description="Threshold on projections", group=sorting_params_group)
    preclust_threshold: float = Field(8, description="Threshold crossings for pre-clustering (in PCA projection space)", group=sorting_params_group)
    car: bool = Field(True, description="Enable or disable common reference", group=sorting_params_group)
    minFR: float = Field(0.2, description="Minimum spike rate (Hz), if a cluster falls below this for too long it gets removed", group=sorting_params_group)
    minfr_goodchannels: float = Field(0.2, description="Minimum firing rate on a 'good' channel", group=sorting_params_group)
    nblocks: int = Field(5, description="blocks for registration. 0 turns it off, 1 does rigid registration. Replaces 'datashift' option.", group=sorting_params_group)
    sig: int = Field(20, description="spatial smoothness constant for registration", group=sorting_params_group)
    freq_min: int = Field(300, description="High-pass filter cutoff frequency", group=sorting_params_group)
    sigmaMask: int = Field(30, description="Spatial constant in um for computing residual variance of spike", group=sorting_params_group)
    nPCs: int = Field(3, description="Number of PCA dimensions", group=sorting_params_group)
    ntbuff: int = Field(64, description="Samples of symmetrical buffer for whitening and spike detection", group=sorting_params_group)
    nfilt_factor: int = Field(4, description="Max number of clusters per good channel (even temporary ones) 4", group=sorting_params_group)
    do_correction: bool = Field(True, description="If True drift registration is applied", group=sorting_params_group)
    NT: int = Field(None, description="Batch size (if None it is automatically computed)", group=sorting_params_group)
    AUCsplit: float = Field(0.8, description="Threshold on the area under the curve (AUC) criterion for performing a split in the final step", group=sorting_params_group)
    wave_length: int = Field(61, description="size of the waveform extracted around each detected peak, (Default 61, maximum 81)", group=sorting_params_group)
    keep_good_only: bool = Field(False, description="If True only 'good' units are returned", group=sorting_params_group)
    skip_kilosort_preprocessing: bool = Field(False, description="Can optionaly skip the internal kilosort preprocessing", group=sorting_params_group)
    scaleproc: int = Field(None, description="int16 scaling of whitened data, if None set to 200.", group=sorting_params_group)

class Kilosort3ProcessingTool(NeurobassProcessingTool):
    @classmethod
    def get_name(cls) -> str:
        return "kilosort3"
    @classmethod
    def get_attributes(cls) -> dict:
        return {
            'wip': True,
            'label': 'Kilosort 3'
        }
    @classmethod
    def get_tags(cls) -> List[str]:
        return ['spike_sorting', 'spike_sorter']
    @classmethod
    def get_model(cls) -> BaseModel:
        return Kilosort3Model
    @classmethod
    def run(cls, context: NeurobassProcessingToolContext):
        _run(context)

def _run(context: NeurobassProcessingToolContext):
    working_dir = 'working'
    os.mkdir(working_dir)

    data = Kilosort3Model(**context.get_data())

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

    # important to make a binary recording so that it can be serialized in the format expected by kilosort
    # it's important that it's a single segment with int16 dtype
    # during this step, the entire recording will be downloaded to disk
    recording2 = _make_binary_recording(recording)

    # run kilosort3 in the container
    container_method = os.getenv('CONTAINER_METHOD', 'none')
    sorting_params = {
        'detect_threshold': data.detect_threshold,
        'projection_threshold': data.projection_threshold,
        'preclust_threshold': data.preclust_threshold,
        'car': data.car,
        'minFR': data.minFR,
        'minfr_goodchannels': data.minfr_goodchannels,
        'nblocks': data.nblocks,
        'sig': data.sig,
        'freq_min': data.freq_min,
        'sigmaMask': data.sigmaMask,
        'nPCs': data.nPCs,
        'ntbuff': data.ntbuff,
        'nfilt_factor': data.nfilt_factor,
        'do_correction': data.do_correction,
        'NT': data.NT,
        'AUCsplit': data.AUCsplit,
        'wave_length': data.wave_length,
        'keep_good_only': data.keep_good_only,
        'skip_kilosort_preprocessing': data.skip_kilosort_preprocessing,
        'scaleproc': data.scaleproc
    }
    sorting = run_kilosort3(
        recording=recording2,
        sorting_params=sorting_params,
        output_folder=working_dir,
        use_docker=container_method == 'docker',
        use_singularity=container_method == 'singularity'
    )

    with pynwb.NWBHDF5IO(file=h5py.File(remf, 'r'), mode='r') as io:
        nwbfile_rec = io.read()
        
        if not os.path.exists('output'):
            os.mkdir('output')
        sorting_out_fname = 'output/sorting.nwb'

        create_sorting_out_nwb_file(nwbfile_rec=nwbfile_rec, sorting=sorting, sorting_out_fname=sorting_out_fname)
        
    context.upload_output_file(data.output, sorting_out_fname)

def _make_binary_recording(recording: si.BaseRecording) -> si.BinaryRecordingExtractor:
    os.mkdir('binary_recording')
    fname = 'binary_recording/recording.dat'
    if recording.get_num_segments() != 1:
        raise NotImplementedError("Can only write recordings with a single segment")
    if recording.get_dtype() != np.int16:
        raise NotImplementedError("Can only write recordings with dtype int16") # important so it won't be rewritten for kilosort3
    si.BinaryRecordingExtractor.write_recording(
        recording=recording,
        file_paths=[fname],
        dtype='int16'
    )
    ret = si.BinaryRecordingExtractor(
        file_paths=[fname],
        sampling_frequency=recording.get_sampling_frequency(),
        channel_ids=recording.get_channel_ids(),
        num_chan=recording.get_num_channels(),
        dtype='int16'
    )
    ret.set_channel_locations(recording.get_channel_locations())
    return ret