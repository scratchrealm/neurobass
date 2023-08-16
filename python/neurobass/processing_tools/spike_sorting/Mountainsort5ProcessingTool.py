import os
import json
from uuid import uuid4
from pydantic import BaseModel, Field
from ...NeurobassPluginTypes import NeurobassProcessingTool, NeurobassProcessingToolContext, InputFile, OutputFile
import pynwb
import h5py
import remfile
import spikeinterface as si
import spikeinterface.preprocessing as spre
from .in_container.Mountainsort5SortingParams import Mountainsort5SortingParams
from .NwbRecording import NwbRecording

class Mountainsort5Model(BaseModel):
    """
    MountainSort5 uses isosplit6 clustering. It is an updated version of MountainSort4. See https://doi.org/10.1016/j.neuron.2017.08.030
    """
    input: InputFile = Field(..., description="Input NWB file")
    output: OutputFile = Field(..., description="Output NWB file")
    electrical_series_path: str = Field(..., description="Path to the electrical series in the NWB file, e.g., /acquisition/ElectricalSeries")
    sorting_params: Mountainsort5SortingParams = Field(..., description="Sorting parameters")

class Mountainsort5ProcessingTool(NeurobassProcessingTool):
    @classmethod
    def get_name(cls) -> str:
        return "mountainsort5"
    @classmethod
    def get_schema(cls) -> dict:
        return json.loads(Mountainsort5Model.schema_json())
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
    recording_filtered = spre.bandpass_filter(recording, freq_min=300, freq_max=6000)
    recording_preprocessed: si.BaseRecording = spre.whiten(recording_filtered, dtype='float32')

    sorting_params = ms5.Scheme2SortingParameters(
        phase1_detect_channel_radius=50,
        detect_channel_radius=50
    )
    sorting = ms5.sorting_scheme2(
        recording=recording_preprocessed,
        sorting_parameters=sorting_params
    )

    with pynwb.NWBHDF5IO(file=h5py.File(remf, 'r'), mode='r') as io:
        nwbfile_rec = io.read()

        nwbfile = pynwb.NWBFile(
            session_description=nwbfile_rec.session_description,
            identifier=str(uuid4()),
            session_start_time=nwbfile_rec.session_start_time,
            experimenter=nwbfile_rec.experimenter,
            experiment_description=nwbfile_rec.experiment_description,
            lab=nwbfile_rec.lab,
            institution=nwbfile_rec.institution,
            subject=pynwb.file.Subject(
                subject_id=nwbfile_rec.subject.subject_id,
                age=nwbfile_rec.subject.age,
                date_of_birth=nwbfile_rec.subject.date_of_birth,
                sex=nwbfile_rec.subject.sex,
                species=nwbfile_rec.subject.species,
                description=nwbfile_rec.subject.description
            ),
            session_id=nwbfile_rec.session_id,
            keywords=nwbfile_rec.keywords
        )

        for unit_id in sorting.get_unit_ids():
            st = sorting.get_unit_spike_train(unit_id) / sorting.get_sampling_frequency()
            nwbfile.add_unit(
                id=unit_id,
                spike_times=st
            )
        
        if not os.path.exists('output'):
            os.mkdir('output')
        sorting_fname = 'output/sorting.nwb'

        # Write the nwb file
        with pynwb.NWBHDF5IO(sorting_fname, 'w') as io:
            io.write(nwbfile, cache_spec=True)
        
        sorting_url = context.upload_output_file(sorting_fname, 'sorting.nwb')
        context.set_output_file_url(data.output, sorting_url)