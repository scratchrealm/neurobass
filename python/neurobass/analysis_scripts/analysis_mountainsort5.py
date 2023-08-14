from typing import Union, List
import os
import json
import numpy as np
import mountainsort5 as ms5
import h5py
import pynwb
from uuid import uuid4
import remfile
import spikeinterface as si
import spikeinterface.preprocessing as spre
import spikeinterface.sorters as ss
from helpers.run_kilosort3 import run_kilosort3

import boto3

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


def main():
    working_dir = 'working'
    os.mkdir(working_dir)

    nwb_url = os.environ['INPUT_NWB_URL']

    recording_electrical_series_path = '/acquisition/ElectricalSeries' # hard-coded for now

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
        
        random_output_id = str(uuid4())[0:8]

        s3.upload_file(sorting_fname, OUTPUT_BUCKET, f'neurobass-dev/{random_output_id}.nwb')
        # for now we hard-code neurosift.org
        url = f'{OUTPUT_BUCKET_BASE_URL}/neurobass-dev/{random_output_id}.nwb'
        out = {
            'output_file_url': url,
            'output_file_size': os.path.getsize(sorting_fname)
        }
        with open('output/out.json', 'w') as f:
            json.dump(out, f)

class NwbRecording(si.BaseRecording):
    def __init__(self,
        file: h5py.File,
        electrical_series_path: str
    ) -> None:
        electrical_series = file[electrical_series_path]
        electrical_series_data = electrical_series['data']
        dtype = electrical_series_data.dtype

        # Get sampling frequency
        if 'starting_time' in electrical_series.keys():
            t_start = electrical_series['starting_time'][()]
            sampling_frequency = electrical_series['starting_time'].attrs['rate']
        elif 'timestamps' in electrical_series.keys():
            t_start = electrical_series['timestamps'][0]
            sampling_frequency = 1 / np.median(np.diff(electrical_series['timestamps'][:1000]))
        
        # Get channel ids
        electrode_indices = electrical_series['electrodes'][:]
        electrodes_table = file['/general/extracellular_ephys/electrodes']
        channel_ids = [electrodes_table['id'][i] for i in electrode_indices]
        
        si.BaseRecording.__init__(self, channel_ids=channel_ids, sampling_frequency=sampling_frequency, dtype=dtype)
        
        # Set electrode locations
        if 'x' in electrodes_table:
            channel_loc_x = [electrodes_table['x'][i] for i in electrode_indices]
            channel_loc_y = [electrodes_table['y'][i] for i in electrode_indices]
            if 'z' in electrodes_table:
                channel_loc_z = [electrodes_table['z'][i] for i in electrode_indices]
            else:
                channel_loc_z = None
        elif 'rel_x' in electrodes_table:
            channel_loc_x = [electrodes_table['rel_x'][i] for i in electrode_indices]
            channel_loc_y = [electrodes_table['rel_y'][i] for i in electrode_indices]
            if 'rel_z' in electrodes_table:
                channel_loc_z = [electrodes_table['rel_z'][i] for i in electrode_indices]
            else:
                channel_loc_z = None
        else:
            channel_loc_x = None
            channel_loc_y = None
            channel_loc_z = None
        if channel_loc_x is not None:
            ndim = 2 if channel_loc_z is None else 3
            locations = np.zeros((len(electrode_indices), ndim), dtype=float)
            for i, electrode_index in enumerate(electrode_indices):
                locations[i, 0] = channel_loc_x[electrode_index]
                locations[i, 1] = channel_loc_y[electrode_index]
                if channel_loc_z is not None:
                    locations[i, 2] = channel_loc_z[electrode_index]
            self.set_dummy_probe_from_locations(locations)

        recording_segment = NwbRecordingSegment(
            electrical_series_data=electrical_series_data,
            sampling_frequency=sampling_frequency
        )
        self.add_recording_segment(recording_segment)

class NwbRecordingSegment(si.BaseRecordingSegment):
    def __init__(self, electrical_series_data: h5py.Dataset, sampling_frequency: float) -> None:
        self._electrical_series_data = electrical_series_data
        si.BaseRecordingSegment.__init__(self, sampling_frequency=sampling_frequency)

    def get_num_samples(self) -> int:
        return self._electrical_series_data.shape[0]

    def get_traces(self, start_frame: int, end_frame: int, channel_indices: Union[List[int], None]=None) -> np.ndarray:
        if channel_indices is None:
            return self._electrical_series_data[start_frame:end_frame, :]
        else:
            return self._electrical_series_data[start_frame:end_frame, channel_indices]

if __name__ == '__main__':
    main()