from neurobass.NeurobassPluginTypes import NeurobassProcessingToolContext, NeurobassProcessingTool

class Mountainsort5ProcessingTool(NeurobassProcessingTool):
    def run(self, context: NeurobassProcessingToolContext):
        context.get_data