import os
from pathlib import Path
import subprocess
import numpy as np
import spikeinterface as si
import spikeinterface.extractors as se

# from SpikeInterface (kilosort.py)
_default_params = {
    "detect_threshold": 6,
    "car": True,
    "useGPU": True,
    "freq_min": 300,
    "freq_max": 6000,
    "ntbuff": 64,
    "Nfilt": None,
    "NT": None,
    "wave_length": 61,
    "delete_tmp_files": True,
    "delete_recording_dat": False,
}

# from SpikeInterface (kilosort3.py)
_default_params.update({
    "detect_threshold": 6,
    "projection_threshold": [9, 9],
    "preclust_threshold": 8,
    "car": True,
    "minFR": 0.2,
    "minfr_goodchannels": 0.2,
    "nblocks": 5,
    "sig": 20,
    "freq_min": 300,
    "sigmaMask": 30,
    "nPCs": 3,
    "ntbuff": 64,
    "nfilt_factor": 4,
    "do_correction": True,
    "NT": None,
    "AUCsplit": 0.8,
    "wave_length": 61,
    "keep_good_only": False,
    "skip_kilosort_preprocessing": False,
    "scaleproc": None,
    "save_rez_to_mat": False,
    "delete_tmp_files": True,
    "delete_recording_dat": False,
})

# from SpikeInterface
_params_description = {
    "detect_threshold": "Threshold for spike detection",
    "projection_threshold": "Threshold on projections",
    "preclust_threshold": "Threshold crossings for pre-clustering (in PCA projection space)",
    "car": "Enable or disable common reference",
    "minFR": "Minimum spike rate (Hz), if a cluster falls below this for too long it gets removed",
    "minfr_goodchannels": "Minimum firing rate on a 'good' channel",
    "nblocks": "blocks for registration. 0 turns it off, 1 does rigid registration. Replaces 'datashift' option.",
    "sig": "spatial smoothness constant for registration",
    "freq_min": "High-pass filter cutoff frequency",
    "sigmaMask": "Spatial constant in um for computing residual variance of spike",
    "nPCs": "Number of PCA dimensions",
    "ntbuff": "Samples of symmetrical buffer for whitening and spike detection",
    "nfilt_factor": "Max number of clusters per good channel (even temporary ones) 4",
    "do_correction": "If True drift registration is applied",
    "NT": "Batch size (if None it is automatically computed)",
    "AUCsplit": "Threshold on the area under the curve (AUC) criterion for performing a split in the final step",
    "wave_length": "size of the waveform extracted around each detected peak, (Default 61, maximum 81)",
    "keep_good_only": "If True only 'good' units are returned",
    "skip_kilosort_preprocessing": "Can optionaly skip the internal kilosort preprocessing",
    "scaleproc": "int16 scaling of whitened data, if None set to 200.",
    "save_rez_to_mat": "Save the full rez internal struc to mat file",
    "delete_tmp_files": "Whether to delete all temporary files after a successful run",
    "delete_recording_dat": "Whether to delete the 'recording.dat' file after a successful run",
}

# from SpikeInterface
_sorter_description = """Kilosort3 is a GPU-accelerated and efficient template-matching spike sorter. On top of its
predecessor Kilosort, it implements a drift-correction strategy. Kilosort3 improves on Kilosort2 primarily in the
type of drift correction we use. Where Kilosort2 modified templates as a function of time/drift (a drift tracking
approach), Kilosort3 corrects the raw data directly via a sub-pixel registration process (a drift correction
approach). Kilosort3 has not been as broadly tested as Kilosort2, but is expected to work out of the box on
Neuropixels 1.0 and 2.0 probes, as well as other probes with vertical pitch <=40um. For other recording methods,
like tetrodes or single-channel recordings, you should test empirically if v3 or v2.0 works better for you (use
the "releases" on the github page to download older versions).
For more information see https://github.com/MouseLand/Kilosort"""

# from SpikeInterface
_compiled_name = "ks3_compiled"

_container_image = "spikeinterface/kilosort3-compiled-base"

def run_kilosort3(
    *,
    recording: si.BinaryRecordingExtractor,
    output_folder: str,
    sorting_params: dict={},
    use_singularity: bool = False,
    use_docker: bool = False,
) -> si.BaseSorting:
    # check recording
    if recording.get_num_segments() > 1:
        raise NotImplementedError("Multi-segment recordings are not supported yet")
    if recording.dtype != "int16":
        raise ValueError("Recording dtype must be int16")
    
    # check installation
    print('Checking installation...')
    if use_singularity:
        _check_singularity_installed()
    elif use_docker:
        _check_docker_installed()
    else:
        _check_kilosort3_installed()
    
    # set default params
    print('Setting params...')
    params = _default_params.copy()
    params.update(sorting_params)
    _check_params(recording, params)

    # check for invalid params
    for k, v in params.items():
        if k not in _default_params.keys():
            raise ValueError(f"Parameter `{k}` not recognized")
    
    binary_file_path = recording._kwargs["file_paths"][0]
    print(f'Using binary file path: {binary_file_path}')
    binary_file_path = Path(binary_file_path)

    sorter_output_folder = Path(output_folder)
    
    # Generate opts.mat file
    print('Generating opts.mat file...')
    # From SpikeInterface
    ops = {}

    nchan = float(recording.get_num_channels())
    ops["NchanTOT"] = nchan  # total number of channels (omit if already in chanMap file)
    ops["Nchan"] = nchan  # number of active channels (omit if already in chanMap file)

    ops["datatype"] = "dat"  # binary ('dat', 'bin') or 'openEphys'
    ops["fbinary"] = str(binary_file_path.absolute())  # will be created for 'openEphys'
    ops["fproc"] = str((sorter_output_folder / "temp_wh.dat").absolute())  # residual from RAM of preprocessed data
    ops["root"] = str(sorter_output_folder.absolute())  # 'openEphys' only: where raw files are
    ops["trange"] = [0, np.Inf]  #  time range to sort
    ops["chanMap"] = str((sorter_output_folder / "chanMap.mat").absolute())

    ops["fs"] = recording.get_sampling_frequency()  # sample rate
    ops["CAR"] = 1.0 if params["car"] else 0.0

    ops = _get_kilosort3_specific_options(ops, params)

    # Converting integer values into float
    # Kilosort interprets ops fields as double
    for k, v in ops.items():
        if isinstance(v, int):
            ops[k] = float(v)
        if v is None:
            raise Exception(f"Parameter `{k}` is None")
    
    ops = {"ops": ops}
    import scipy.io

    scipy.io.savemat(str(sorter_output_folder / "ops.mat"), ops)

    # Generate channel map file
    print('Generating channel map file...')
    _generate_channel_map_file(recording, sorter_output_folder)

    recording_parent_folder = binary_file_path.parent

    volumes = {
        str(recording_parent_folder.absolute()): {"bind": str(recording_parent_folder.absolute()), "mode": "ro"},
        str(sorter_output_folder.absolute()): {"bind": str(sorter_output_folder.absolute()), "mode": "rw"}
    }

    command_in_container = f'{_compiled_name} {str(sorter_output_folder.absolute())}'
    
    if use_docker:
        print('Using docker (THIS METHOD HAS NOT YET BEEN TESTED)...')
        import docker
        client = docker.from_env()

        docker_container = client.containers.create(
            _container_image,
            tty=True,
            volumes=volumes,
            device_requests=[docker.types.DeviceRequest(count=-1, capabilities=[["gpu"]])]
        )
        docker_container.start()
        try:
            docker_container.exec_run(command_in_container)
        finally:
            docker_container.stop()
            docker_container.remove()
    elif use_singularity:
        print('Using singularity...')
        from spython.main import Client

        # load local image file if it exists, otherwise search dockerhub
        sif_file = Client._get_filename(_container_image)
        singularity_image = None
        if Path(_container_image).exists():
            singularity_image = _container_image
        elif Path(sif_file).exists():
            singularity_image = sif_file
        else:
            print(f"Singularity: pulling image {_container_image}")
            singularity_image = Client.pull(f"docker://{_container_image}")

        if not Path(singularity_image).exists():
            raise FileNotFoundError(f"Unable to locate container image {_container_image}")

        # bin options
        singularity_bind = ",".join([f'{volume_src}:{volume["bind"]}' for volume_src, volume in volumes.items()])
        options = ["--bind", singularity_bind]
        options += ["--nv"]

        singularity_cmd = f'singularity exec {" ".join(options)} {singularity_image} {command_in_container}'

        print(f'Executing command in singularity container: {singularity_cmd}')
        subprocess.run(singularity_cmd, shell=True)

        # For some reason, the below was not working for me
        # client_instance = Client.instance(singularity_image, start=False, options=options)

        # print('Starting singularity instance...')
        # client_instance.start()
        # try:
        #     print(f'Executing command in singularity instance: {command_in_container}')
        #     options = ["--cleanenv", "--env"]
        #     res = Client.execute(client_instance, command_in_container, options=options)
        #     print(res)
        # finally:
        #     print('Stopping singularity instance...')
        #     client_instance.stop()
    else:
        raise Exception("Not implemented yet")
    
        
    # load output
    keep_good_only = sorting_params.get("keep_good_only", True)
    sorting = se.KiloSortSortingExtractor(folder_path=sorter_output_folder, keep_good_only=keep_good_only)

    return sorting
        

def _check_singularity_installed():
    try:
        subprocess.run(["singularity", "help"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except FileNotFoundError:
        raise FileNotFoundError(
            "Singularity is not installed."
        )

def _check_docker_installed():
    try:
        subprocess.run(["docker", "help"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except FileNotFoundError:
        raise FileNotFoundError(
            "Docker is not installed."
        )

def _check_kilosort3_installed():
    kilosort3_path = os.environ.get("KILOSORT3_PATH", None)
    if kilosort3_path is None:
        raise ValueError(
            "KILOSORT3_PATH environment variable is not set."
        )
    if not os.path.exists(kilosort3_path):
        raise ValueError(
            f"KILOSORT3_PATH environment variable is set to a non-existing path: {kilosort3_path}"
        )

# From SpikeInterface
def _get_kilosort3_specific_options(ops, params):
    """
    Adds specific options for Kilosort3 in the ops dict and returns the final dict

    Parameters
    ----------
    ops: dict
        options data
    params: dict
        Custom parameters dictionary for kilosort3

    Returns
    ----------
    ops: dict
        Final ops data
    """
    # frequency for high pass filtering (150)
    ops["fshigh"] = params["freq_min"]

    projection_threshold = [float(pt) for pt in params["projection_threshold"]]
    # threshold on projections (like in Kilosort1, can be different for last pass like [10 4])
    ops["Th"] = projection_threshold

    # how important is the amplitude penalty (like in Kilosort1, 0 means not used, 10 is average, 50 is a lot)
    ops["lam"] = 20.0

    # splitting a cluster at the end requires at least this much isolation for each sub-cluster (max = 1)
    ops["AUCsplit"] = params["AUCsplit"]

    # minimum firing rate on a "good" channel (0 to skip)
    ops["minfr_goodchannels"] = params["minfr_goodchannels"]

    # minimum spike rate (Hz), if a cluster falls below this for too long it gets removed
    ops["minFR"] = params["minFR"]

    # spatial constant in um for computing residual variance of spike
    ops["sigmaMask"] = params["sigmaMask"]

    # threshold crossings for pre-clustering (in PCA projection space)
    ops["ThPre"] = params["preclust_threshold"]

    # spatial scale for datashift kernel
    ops["sig"] = params["sig"]

    # type of data shifting (0 = none, 1 = rigid, 2 = nonrigid)
    ops["nblocks"] = params["nblocks"]

    ## danger, changing these settings can lead to fatal errors
    # options for determining PCs
    ops["spkTh"] = -params["detect_threshold"]  # spike threshold in standard deviations (-6)
    ops["reorder"] = 1.0  # whether to reorder batches for drift correction.
    ops["nskip"] = 25.0  # how many batches to skip for determining spike PCs

    ops["GPU"] = 1.0  # has to be 1, no CPU version yet, sorry
    # ops['Nfilt'] = 1024 # max number of clusters
    ops["nfilt_factor"] = params["nfilt_factor"]  # max number of clusters per good channel (even temporary ones)
    ops["ntbuff"] = params["ntbuff"]  # samples of symmetrical buffer for whitening and spike detection
    ops["NT"] = params[
        "NT"
    ]  # must be multiple of 32 + ntbuff. This is the batch size (try decreasing if out of memory).
    ops["whiteningRange"] = 32.0  # number of channels to use for whitening each channel
    ops["nSkipCov"] = 25.0  # compute whitening matrix from every N-th batch
    ops["scaleproc"] = 200.0  # int16 scaling of whitened data
    ops["nPCs"] = params["nPCs"]  # how many PCs to project the spikes into
    ops["useRAM"] = 0.0  # not yet available

    # drift correction
    ops["do_correction"] = params["do_correction"]

    ## option for wavelength
    ops["nt0"] = params[
        "wave_length"
    ]  # size of the waveform extracted around each detected peak. Be sure to make it odd to make alignment easier.

    ops["skip_kilosort_preprocessing"] = params["skip_kilosort_preprocessing"]
    if params["skip_kilosort_preprocessing"]:
        ops["fproc"] = ops["fbinary"]
        assert (
            params["scaleproc"] is not None
        ), "When skip_kilosort_preprocessing=True scaleproc must explicitly given"

    # int16 scaling of whitened data, when None then scaleproc is set to 200.
    scaleproc = params["scaleproc"]
    ops["scaleproc"] = scaleproc if scaleproc is not None else 200.0

    ops["save_rez_to_mat"] = params["save_rez_to_mat"]
    return ops

# From SpikeInterface
def _generate_channel_map_file(recording, sorter_output_folder):
    """
    This function generates channel map data for kilosort and saves as `chanMap.mat`

    Loading example in Matlab (shouldn't be assigned to a variable):
    >> load('/path/to/sorter_output_folder/chanMap.mat');

    Parameters
    ----------
    recording: BaseRecording
        The recording to generate the channel map file
    sorter_output_folder: pathlib.Path
        Path object to save `chanMap.mat` file
    """
    # prepare electrode positions for this group (only one group, the split is done in basesorter)
    groups = [1] * recording.get_num_channels()
    positions = np.array(recording.get_channel_locations())
    if positions.shape[1] != 2:
        raise RuntimeError("3D 'location' are not supported. Set 2D locations instead")

    nchan = recording.get_num_channels()
    xcoords = ([p[0] for p in positions],)
    ycoords = ([p[1] for p in positions],)
    kcoords = (groups,)

    channel_map = {}
    channel_map["Nchannels"] = nchan
    channel_map["connected"] = np.full((nchan, 1), True)
    channel_map["chanMap0ind"] = np.arange(nchan)
    channel_map["chanMap"] = channel_map["chanMap0ind"] + 1

    channel_map["xcoords"] = np.array(xcoords).astype(float)
    channel_map["ycoords"] = np.array(ycoords).astype(float)
    channel_map["kcoords"] = np.array(kcoords).astype(float)

    sample_rate = recording.get_sampling_frequency()
    channel_map["fs"] = float(sample_rate)
    import scipy.io

    scipy.io.savemat(str(sorter_output_folder / "chanMap.mat"), channel_map)

# From SpikeInterface
def _check_params(recording, params):
    p = params
    nchan = recording.get_num_channels()
    if p["Nfilt"] is None:
        p["Nfilt"] = (nchan // 32) * 32 * 8
    else:
        p["Nfilt"] = p["Nfilt"] // 32 * 32
    if p["Nfilt"] == 0:
        p["Nfilt"] = nchan * 8
    if p["NT"] is None:
        p["NT"] = 64 * 1024 + p["ntbuff"]
    else:
        p["NT"] = p["NT"] // 32 * 32  # make sure is multiple of 32
    if p["wave_length"] % 2 != 1:
        p["wave_length"] = p["wave_length"] + 1  # The wave_length must be odd
    if p["wave_length"] > 81:
        p["wave_length"] = 81  # The wave_length must be less than 81.
    return p