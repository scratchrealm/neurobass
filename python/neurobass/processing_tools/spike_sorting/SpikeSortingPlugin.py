from neurobass import NeurobassPluginContext, NeurobassPlugin
from ...NeurobassPluginTypes import NeurobassPluginContext
from .Kilosort2p5ProcessingTool import Kilosort2p5ProcessingTool
from .Kilosort3ProcessingTool import Kilosort3ProcessingTool
from .Mountainsort5ProcessingTool import Mountainsort5ProcessingTool

class SpikeSortingPlugin(NeurobassPlugin):
    @classmethod
    def initialize(cls, context: NeurobassPluginContext):
        context.register_processing_tool(Kilosort2p5ProcessingTool)
        context.register_processing_tool(Kilosort3ProcessingTool)
        context.register_processing_tool(Mountainsort5ProcessingTool)