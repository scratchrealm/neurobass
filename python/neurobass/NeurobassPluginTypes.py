from enum import Enum
from typing import Any, List
from abc import ABC, abstractmethod
from pydantic import BaseModel
import inspect

try:
    # this works in pydantic v2
    from pydantic_core import PydanticUndefined
except:
    # for pydantic v1
    PydanticUndefined = None

class InputFile(BaseModel):
    name: str
    path: str
    content_string: str

class OutputFile(BaseModel):
    name: str
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
    def get_input_file_url(self, input_file: InputFile) -> str:
        """Return the URL of the input file

        Args:
            input_file (InputFile): the input file
        
        Returns:
            str: the URL of the input file
        """
        pass
    @abstractmethod
    def upload_output_file(self, output_file: OutputFile, path: str):
        """Upload a file to the output cloud bucket

        Args:
            path (str): path of the local file to upload
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
        for field_name, field_type in model.__annotations__.items():
            ff = model.__fields__[field_name]
            if hasattr(ff, 'field_info'):
                # this is for pydantic v1
                field_info = ff.field_info
            else:
                # this is for pydantic v2
                field_info = ff
            field_default = field_info.default
            if field_default == Ellipsis or field_default == PydanticUndefined:
                field_default = None
        
            kwargs = {}
            extra = getattr(field_info, 'extra', {})
            valid_extra_keys = ['group']
            for k in valid_extra_keys:
                if k in extra:
                    kwargs[k] = extra[k]
            if inspect.isclass(field_type) and issubclass(field_type, InputFile):
                field_type_str = 'InputFile'
            elif inspect.isclass(field_type) and issubclass(field_type, OutputFile):
                field_type_str = 'OutputFile'
            elif inspect.isclass(field_type) and issubclass(field_type, Enum):
                field_type_str = 'Enum'
                kwargs['choices'] = [x.value for x in field_type]
            else:
                if field_type == float:
                    field_type_str = 'float'
                elif field_type == int:
                    field_type_str = 'int'
                elif field_type == bool:
                    field_type_str = 'bool'
                elif field_type == str:
                    field_type_str = 'str'
                elif field_type == List[int]:
                    # handle this case specially
                    field_type_str = 'List[int]'
                elif field_type == List[str]:
                    field_type_str = 'List[str]'
                elif field_type == List[float]:
                    # handle this case specially
                    field_type_str = 'List[float]'
                else:
                    raise Exception(f'Unexpected field type: {field_type}')
            if type(field_info.description) != str:
                raise Exception(f'Unexpected description type: {type(field_info.description)}')
            
            pp = {
                'name': field_name,
                'type': field_type_str,
                'description': field_info.description,
                **kwargs
            }
            if field_default is not None:
                pp['default'] = field_default

            ret['properties'].append(pp)
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