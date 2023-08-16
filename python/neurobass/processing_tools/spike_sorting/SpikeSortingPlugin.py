from neurobass import NeurobassPluginContext, NeurobassPlugin
from ...NeurobassPluginTypes import NeurobassPluginContext
from .Mountainsort5ProcessingTool import Mountainsort5ProcessingTool

class SpikeSortingPlugin(NeurobassPlugin):
    @classmethod
    def initialize(cls, context: NeurobassPluginContext):
        context.register_processing_tool(Mountainsort5ProcessingTool)