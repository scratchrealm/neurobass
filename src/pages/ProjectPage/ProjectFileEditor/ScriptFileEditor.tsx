import { FunctionComponent } from "react";
import Splitter from "../../../components/Splitter";
import { useProject } from "../ProjectPageContext";
import ScriptJobsWindow from "../ScriptJobsWindow/ScriptJobsWindow";
import NbaFileEditor from "./NbaFileEditor";
import TextEditor from "./TextEditor";

type Props = {
    fileName: string
    fileContent: string
    onSaveContent: (text: string) => void
    editedFileContent: string
    setEditedFileContent: (text: string) => void
    readOnly: boolean
    width: number
    height: number
}

const ScriptFileEditor: FunctionComponent<Props> = ({fileName, fileContent, onSaveContent, editedFileContent, setEditedFileContent, readOnly, width, height}) => {
    const fileType = fileName.split('.').pop()
    const {projectFiles} = useProject()
    const outputFileName = fileType === 'spa' ? projectFiles?.find(f => (f.fileName === `${fileName}.out`))?.fileName : undefined
    return (
        <Splitter
            width={width}
            height={height}
            initialPosition={width / 2}
            direction="horizontal"
        >
            {
                fileType === 'py' ? (
                    <TextEditor
                        width={0}
                        height={0}
                        language={
                            fileType === 'py' ? 'python' :
                            fileType === 'spa' ? 'yaml' :
                            'text'
                        }
                        label={fileName}
                        text={fileContent}
                        onSaveText={onSaveContent}
                        editedText={editedFileContent}
                        onSetEditedText={setEditedFileContent}
                        readOnly={readOnly}
                    />
                ) : (
                    <NbaFileEditor
                        width={0}
                        height={0}
                        text={fileContent}
                        onSetText={txt => {onSaveContent(txt); setEditedFileContent(txt)}}
                        readOnly={readOnly}
                        outputFileName={outputFileName}
                    />
                )
            }
            <ScriptJobsWindow
                width={0}
                height={0}
                fileName={fileName}
            />
        </Splitter>
    )
}

export default ScriptFileEditor