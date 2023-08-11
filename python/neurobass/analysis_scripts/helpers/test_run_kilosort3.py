import os
import shutil
import spikeinterface as si
import spikeinterface.extractors as se
from run_kilosort3 import run_kilosort3


def main():
    print('Preparing test data...')
    if os.path.exists('test_kilosort3_data'):
        shutil.rmtree('test_kilosort3_data')
    os.mkdir('test_kilosort3_data')
    os.mkdir('test_kilosort3_data/sorting_output')
    recording, sorting = se.toy_example(num_channels=32, duration=10, seed=0, num_segments=1)
    si.BinaryRecordingExtractor.write_recording(
        recording,
        'test_kilosort3_data/test.dat',
        'int16'
    )
    recording2 = si.BinaryRecordingExtractor(
        'test_kilosort3_data/test.dat',
        sampling_frequency=recording.get_sampling_frequency(),
        num_channels=recording.get_num_channels(),
        channel_ids=recording.get_channel_ids(),
        dtype='int16'
    )
    recording2.set_channel_locations(recording.get_channel_locations())

    print('Executing run_kilosort3...')
    sorting = run_kilosort3(
        recording=recording2,
        output_folder='test_kilosort3_data/sorting_output',
        use_docker=False,
        use_singularity=True
    )

    print(sorting)

if __name__ == '__main__':
    main()