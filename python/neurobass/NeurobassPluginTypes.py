from enum import Enum
from typing import Any, List
from abc import ABC, abstractmethod
from pydantic import BaseModel

class InputFile(BaseModel):
    path: str
    content_string: str

class OutputFile(BaseModel):
    path: str

class NeurobassProcessingToolContext(ABC):
    @abstractmethod
    def get_data(self) -> Any:
        """Get the input/output data for the job

        Returns:
            Any: the data that should match the schema
        """
        pass
    @abstractmethod
    def get_input_file_url(self, input_file: InputFile):
        """Return the URL of the input file

        Args:
            input_file (InputFile): the input file
        
        Returns:
            str: the URL of the input file
        """
        pass
    @abstractmethod
    def upload_output_file(self, path: str, name: str) -> str:
        """Upload a file to the output cloud bucket

        Args:
            path (str): path of the local file to upload
            name (str): base name of the file in the cloud bucket

        Returns:
            str: the URL of the uploaded file
        """
        pass
    @abstractmethod
    def set_output_file_url(self, name: str, url: str):
        """Set the output file URL

        Args:
            name (str): the name of the output file
            url (str): the URL of the output file
        """
        pass


class NeurobassProcessingTool(ABC):
    @classmethod
    @abstractmethod
    def get_name(cls) -> str:
        """Get the name of the processing tool

        Returns:
            str: the name of the processing tool
        """
        return ''
    
    @classmethod
    @abstractmethod
    def get_attributes(cls) -> dict:
        """Get the attributes of the processing tool

        Returns:
            dict: the attributes of the processing tool
        """
        return {}
    
    @classmethod
    @abstractmethod
    def get_tags(cls) -> list:
        """Get the tags of the processing tool

        Returns:
            list: the tags of the processing tool
        """
        return []

    @classmethod
    @abstractmethod
    def get_model(cls) -> BaseModel:
        """Get the pydantic model for the processing tool, including inputs and outputs

        Returns:
            BaseModel: the pydantic model for the processing tool
        """
        return {}

    @classmethod
    @abstractmethod
    def run(cls, context: NeurobassProcessingToolContext):
        pass

    @classmethod
    def get_schema(cls) -> dict:
        ret = {
            'properties': []
        }
        if cls.__doc__ is not None:
            ret['description'] = cls.__doc__
        model = cls.get_model()
        for name, field in model.__annotations__.items():
            ff = model.__fields__[name]
            field_default = ff.default
            field_schema = ff.field_info
            field_type = ff.type_
        
            kwargs = {}
            extra = getattr(field_schema, 'extra', {})
            valid_extra_keys = ['group']
            for k in valid_extra_keys:
                if k in extra:
                    kwargs[k] = extra[k]
            if issubclass(field_type, InputFile):
                field_type_str = 'InputFile'
            elif issubclass(field_type, OutputFile):
                field_type_str = 'OutputFile'
            elif issubclass(field_type, Enum):
                field_type_str = 'Enum'
                kwargs['choices'] = [x.value for x in field]
            else:
                if ff.outer_type_ == List[float]:
                    field_type_str = 'List[float]'
                else:
                    field_type_str = field_type.__name__
            ret['properties'].append({
                'name': name,
                'type': field_type_str,
                'description': field_schema.description,
                'default': field_default,
                **kwargs
            })
        return ret

class NeurobassPluginContext(ABC):
    """The plugin context to be passed into the initialize method of the plugin
    """
    @abstractmethod
    def register_processing_tool(self, tool: NeurobassProcessingTool):
        """Register a processing tool for the plugin

        Args:
            tool (NeurobassProcessingTool): the processing tool to register
        """
        pass

class NeurobassPlugin:
    @classmethod
    @abstractmethod
    def initialize(cls, context: NeurobassPluginContext):
        pass