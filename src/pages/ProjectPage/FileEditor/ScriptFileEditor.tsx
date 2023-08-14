import { FunctionComponent } from "react";
import Splitter from "../../../components/Splitter";
import JobsWindow from "../JobsWindow/JobsWindow";
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
    return (
        <Splitter
            width={width}
            height={height}
            initialPosition={height * 2 / 3}
            direction="vertical"
        >
            {
                <TextEditor
                    width={0}
                    height={0}
                    language={
                        fileType === 'py' ? 'python' :
                        'text'
                    }
                    label={fileName}
                    text={fileContent}
                    onSaveText={onSaveContent}
                    editedText={editedFileContent}
                    onSetEditedText={setEditedFileContent}
                    readOnly={readOnly}
                />
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