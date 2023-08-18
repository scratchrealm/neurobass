from neurobass import NeurobassPluginContext, NeurobassPlugin
from ...NeurobassPluginTypes import NeurobassPluginContext
from .CaimanProcessingTool import CaimanProcessingTool

class CalciumImagingPlugin(NeurobassPlugin):
    @classmethod
    def initialize(cls, context: NeurobassPluginContext):
        context.register_processing_tool(CaimanProcessingTool)