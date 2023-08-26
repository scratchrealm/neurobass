from enum import Enum
from typing import List
import os
import json
from pydantic import BaseModel, Field
from ...NeurobassPluginTypes import NeurobassProcessingTool, NeurobassProcessingToolContext, InputFile, OutputFile
import pynwb
import h5py
import remfile
import spikeinterface as si
import spikeinterface.preprocessing as spre
from .NwbRecording import NwbRecording
from .create_sorting_out_nwb_file import create_sorting_out_nwb_file

class SchemeEnum(str, Enum):
    scheme1 = '1'
    scheme2 = '2'
    scheme3 = '3'

sorting_params_group = 'sorting_params'

class Mountainsort5Model(BaseModel):
    """
    MountainSort is a CPU-based spike sorting software package developed by Jeremy Magland and others at Flatiron Institute in collaboration with researchers at Loren Frank's lab.
    By employing Isosplit, a non-parametric density-based clustering approach, the software minimizes the need for manual intervention, thereby reducing errors and inconsistencies.
    See https://github.com/flatironinstitute/mountainsort5 and https://doi.org/10.1016/j.neuron.2017.08.030
    """
    input: InputFile = Field(..., description="Input NWB file")
    output: OutputFile = Field(..., description="Output NWB file")
    electrical_series_path: str = Field(..., description="Path to the electrical series in the NWB file, e.g., /acquisition/ElectricalSeries")
    
    scheme: SchemeEnum = Field("2", description="Which sorting scheme to use: '1, '2', or '3'", group=sorting_params_group)
    detect_threshold: float = Field(5.5, le=100, description="Detection threshold - recommend to use the default", group=sorting_params_group)
    detect_sign: int = Field(-1, description="Use -1 for detecting negative peaks, 1 for positive, 0 for both", group=sorting_params_group)
    detect_time_radius_msec: float = Field(0.5, description="Determines the minimum allowable time interval between detected spikes in the same spatial region", group=sorting_params_group)
    snippet_T1: int = Field(20, description="Number of samples before the peak to include in the snippet", group=sorting_params_group)
    snippet_T2: int = Field(20, description="Number of samples after the peak to include in the snippet", group=sorting_params_group)
    npca_per_channel: int = Field(3, description="Number of PCA features per channel in the initial dimension reduction step", group=sorting_params_group)
    npca_per_subdivision: int = Field(10, description="Number of PCA features to compute at each stage of clustering in the isosplit6 subdivision method", group=sorting_params_group)
    snippet_mask_radius: int = Field(250, description="Radius of the mask to apply to the extracted snippets", group=sorting_params_group)
    scheme1_detect_channel_radius: int = Field(150, description="Channel radius for excluding events that are too close in time in scheme 1", group=sorting_params_group)
    scheme2_phase1_detect_channel_radius: int = Field(200, description="Channel radius for excluding events that are too close in time during phase 1 of scheme 2", group=sorting_params_group)
    scheme2_detect_channel_radius: int = Field(50, description="Channel radius for excluding events that are too close in time during phase 2 of scheme 2", group=sorting_params_group)
    scheme2_max_num_snippets_per_training_batch: int = Field(200, description="Maximum number of snippets to use in each batch for training during phase 2 of scheme 2", group=sorting_params_group)
    scheme2_training_duration_sec: int = Field(60 * 5, description="Duration of training data to use in scheme 2", group=sorting_params_group)
    scheme2_training_recording_sampling_mode: str = Field("uniform", description="initial or uniform", group=sorting_params_group)
    scheme3_block_duration_sec: int = Field(60 * 30, description="Duration of each block in scheme 3", group=sorting_params_group)
    freq_min: int = Field(300, description="High-pass filter cutoff frequency", group=sorting_params_group)
    freq_max: int = Field(6000, description="Low-pass filter cutoff frequency", group=sorting_params_group)
    filter: bool = Field(True, description="Enable or disable filter", group=sorting_params_group)
    whiten: bool = Field(True, description="Enable or disable whitening - Important to do whitening", group=sorting_params_group)

class Mountainsort5ProcessingTool(NeurobassProcessingTool):
    @classmethod
    def get_name(cls) -> str:
        return "mountainsort5"
    @classmethod
    def get_attributes(cls) -> dict:
        return {
            'wip': False,
            'logo_url': 'https://avatars.githubusercontent.com/u/32853892?s=200&v=4',
            'label': 'MountainSort 5'
        }
    @classmethod
    def get_tags(cls) -> List[str]:
        return ['spike_sorting', 'spike_sorter']
    @classmethod
    def get_model(cls) -> BaseModel:
        return Mountainsort5Model
    @classmethod
    def run(cls, context: NeurobassProcessingToolContext):
        _run(context)

def _run(context: NeurobassProcessingToolContext):
    import mountainsort5 as ms5

    working_dir = 'working'
    os.mkdir(working_dir)

    data = Mountainsort5Model(context.get_data())

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

    # Make sure the recording is preprocessed appropriately
    # lazy preprocessing
    if data.sorting_params.filter:
        freq_min = data.sorting_params.freq_min
        freq_max = data.sorting_params.freq_max
        recording_filtered = spre.bandpass_filter(recording, freq_min=freq_min, freq_max=freq_max)
    else:
        recording_filtered = recording
    if data.sorting_params.whiten:
        recording_preprocessed: si.BaseRecording = spre.whiten(recording_filtered, dtype='float32')
    else:
        recording_preprocessed = recording_filtered

    sp = data
    scheme1_sorting_parameters = ms5.Scheme1SortingParameters(
        detect_threshold=sp.detect_threshold,
        detect_channel_radius=sp.scheme1_detect_channel_radius,
        detect_time_radius_msec=sp.detect_time_radius_msec,
        detect_sign=sp.detect_sign,
        snippet_T1=sp.snippet_T1,
        snippet_T2=sp.snippet_T2,
        snippet_mask_radius=sp.snippet_mask_radius,
        npca_per_channel=sp.npca_per_channel,
        npca_per_subdivision=sp.npca_per_subdivision
    )

    scheme2_sorting_parameters = ms5.Scheme2SortingParameters(
        phase1_detect_channel_radius=sp.scheme2_phase1_detect_channel_radius,
        detect_channel_radius=sp.scheme2_detect_channel_radius,
        phase1_detect_threshold=sp.detect_threshold,
        phase1_detect_time_radius_msec=sp.detect_time_radius_msec,
        detect_time_radius_msec=sp.detect_time_radius_msec,
        phase1_npca_per_channel=sp.npca_per_channel,
        phase1_npca_per_subdivision=sp.npca_per_subdivision,
        detect_sign=sp.detect_sign,
        detect_threshold=sp.detect_threshold,
        snippet_T1=sp.snippet_T1,
        snippet_T2=sp.snippet_T2,
        snippet_mask_radius=sp.snippet_mask_radius,
        max_num_snippets_per_training_batch=sp.scheme2_max_num_snippets_per_training_batch,
        classifier_npca=None,
        training_duration_sec=sp.scheme2_training_duration_sec,
        training_recording_sampling_mode=sp.scheme2_training_recording_sampling_mode
    )

    scheme3_sorting_parameters = ms5.Scheme3SortingParameters(
        block_sorting_parameters=scheme2_sorting_parameters, block_duration_sec=sp.scheme3_block_duration_sec
    )

    scheme = sp.scheme
    if scheme == "1":
        sorting = ms5.sorting_scheme1(recording=recording_preprocessed, sorting_parameters=scheme1_sorting_parameters)
    elif p["scheme"] == "2":
        sorting = ms5.sorting_scheme2(recording=recording_preprocessed, sorting_parameters=scheme2_sorting_parameters)
    elif p["scheme"] == "3":
        sorting = ms5.sorting_scheme3(recording=recording_preprocessed, sorting_parameters=scheme3_sorting_parameters)

    with pynwb.NWBHDF5IO(file=h5py.File(remf, 'r'), mode='r') as io:
        nwbfile_rec = io.read()

        if not os.path.exists('output'):
            os.mkdir('output')
        sorting_out_fname = 'output/sorting.nwb'

        create_sorting_out_nwb_file(nwbfile_rec=nwbfile_rec, sorting=sorting, sorting_out_fname=sorting_out_fname)
        
        sorting_url = context.upload_output_file(sorting_out_fname, 'sorting.nwb')
        context.set_output_file_url(data.output, sorting_url)