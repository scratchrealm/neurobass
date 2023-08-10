# Overview of Neurobass

Neurobass is a browser-based application designed to simplify the creation, execution, and sharing of neuroscience analyses. It enables users to establish workspaces, create projects within those workspaces, and efficiently manage project files and tasks.

## Supported File Types

Neurobass accommodates multiple file types within projects:

* **.nwb**: Remote nwb files, which are stored on a remote server and accessed via a URL. These files are read-only.
* **.json**: Datasets for analyses
* **.py**: Python scripts for data generation and post-analysis processing
* **.nba**: Neurobass Analysis files. These YAML files can reference .nwb files and contains settings for performing the analysis.
* **.nba.out**: Generated once an analysis job concludes, these files contain the output of the executed analysis.
* **.md**: Markdown files for descriptions.

## Workspace and Project Administration

Neurobass allows the creation of workspaces, with each workspace owned by a GitHub OAuth-authenticated user. Within these workspaces, users can create projects, and manage the associated files and tasks. Workspace owners and admin users can control access permissions, such as public visibility and read/write permissions for different users. Additionally, workspace admins can assign compute resources to the workspace to run Python scripts and analyses.

## Execution of Neurobass Analyses

A Neurobass analysis can involve .nwb and other files and certain execution parameters, all specified using a .nba (Neurbass analysis) file. With the "Run" button, the system launches a job to perform the analysis using the workspace's allocated compute resources. Upon completion, results are stored in a corresponding .nba.out file.

## Compute Resources

Every workspace comes equipped with a dedicated compute resource for executing Python scripts and analysis jobs. The default setting uses a cloud resource with specific limitations on CPU, memory, and number of concurrent jobs, shared among all users. Alternatively, you can [host your own compute resource](https://github.com/scratchrealm/neurobass/blob/main/doc/host_compute_resource.md) on a local or remote machine and link this to your workspaces.