import { FunctionComponent } from "react";
import Splitter from "../../../components/Splitter";
import JobsWindow from "../JobsWindow/JobsWindow";
import { useProject } from "../ProjectPageContext";
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
    const {files} = useProject()
    const outputFileName = fileType === 'nba' ? files?.find(f => (f.fileName === `${fileName}.out`))?.fileName : undefined
    return (
        <Splitter
            width={width}
            height={height}
            initialPosition={height * 2 / 3}
            direction="vertical"
        >
            {
                fileType === 'py' ? (
                    <TextEditor
                        width={0}
                        height={0}
                        language={
                            fileType === 'py' ? 'python' :
                            fileType === 'nba' ? 'yaml' :
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
            <JobsWindow
                width={0}
                height={0}
                fileName={fileName}
            />
        </Splitter>
    )
}

export default ScriptFileEditor