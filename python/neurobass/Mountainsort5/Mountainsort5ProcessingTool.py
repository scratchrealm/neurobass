import json
from ..NeurobassPluginTypes import NeurobassProcessingToolContext, NeurobassProcessingTool, InputFile, OutputFile
from pydantic import BaseModel, Field

class Data(BaseModel):
    input: InputFile = Field(..., description="Input NWB file")
    output: OutputFile = Field(..., description="Output NWB file")


class Mountainsort5ProcessingTool(NeurobassProcessingTool):
    @classmethod
    def get_name(cls) -> str:
        return "mountainsort5"
    @classmethod
    def get_schema(cls) -> dict:
        return json.loads(Data.schema_json())
    @classmethod
    def run(cls, context: NeurobassProcessingToolContext):
        data = Data(context.get_data())