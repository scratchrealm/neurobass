import { FunctionComponent, useEffect, useState } from "react"
import Hyperlink from "../../../components/Hyperlink"
import Splitter from "../../../components/Splitter"
import formatByteCount from "../FileBrowser/formatByteCount"
import DandisetView from "./DandisetView"
import { AssetsResponseItem, DandisetSearchResultItem } from "./types"

type SearchResultsProps = {
    width: number
    height: number
    searchResults: DandisetSearchResultItem[]
    onClickAsset: (dandisetId: string, dandisetVersion: string, assetItem: AssetsResponseItem) => void
    useStaging?: boolean
}

const SearchResults: FunctionComponent<SearchResultsProps> = ({width, height, searchResults, onClickAsset, useStaging}) => {
    const [selectedItem, setSelectedItem] = useState<DandisetSearchResultItem | null>(null)
    useEffect(() => {
        // reset the selected item when the useStaging changes
        setSelectedItem(null)
    }, [useStaging])
    return (
        <Splitter
            width={width}
            height={height}
            initialPosition={width / 2}
            direction='horizontal'
            hideSecondChild={!selectedItem}
        >
            <SearchResultsLeft
                width={0}
                height={0}
                searchResults={searchResults}
                setSelectedItem={setSelectedItem}
                onClickAsset={onClickAsset} // not actually needed
            />
            <DandisetView
                dandisetId={selectedItem?.identifier || ''}
                width={0}
                height={0}
                onClickAsset={(assetItem: AssetsResponseItem) => {onClickAsset(selectedItem?.identifier || '', selectedItem?.most_recent_published_version?.version || 'draft', assetItem)}}
                useStaging={useStaging}
            />
        </Splitter>
    )
}

const SearchResultsLeft: FunctionComponent<SearchResultsProps & {setSelectedItem: (item: DandisetSearchResultItem) => void}> = ({width, height, searchResults, setSelectedItem}) => {
    return (
        <div style={{position: 'absolute', width, height, overflowY: 'auto'}}>
            {
                searchResults.map((result, i) => (
                    <SearchResultItem
                        key={i}
                        result={result}
                        width={width}
                        onClick={() => setSelectedItem(result)}
                    />
                ))
            }
        </div>
    )
}

type SearchResultItemProps = {
    result: DandisetSearchResultItem
    width: number
    onClick: () => void
}

const SearchResultItem: FunctionComponent<SearchResultItemProps> = ({result, width, onClick}) => {
    const {identifier, created, modified, contact_person, most_recent_published_version, draft_version} = result
    const X = most_recent_published_version || draft_version
    if (!X) return <div>Unexpected error: no version</div>

    return (
        <div style={{padding: 10, borderBottom: 'solid 1px #ccc'}}>
            <div style={{fontSize: 18, fontWeight: 'bold'}}>
                <Hyperlink color="rgb(0,0,40)" onClick={onClick}>
                    {identifier} ({X.version}): {X.name}
                </Hyperlink>
            </div>
            <div style={{fontSize: 14, color: '#666'}}>Contact: {contact_person}</div>
            <div style={{fontSize: 14, color: '#666'}}>Created {formatTime(created)} | Modified {formatTime(modified)}</div>
            {
                X && (
                    <div style={{fontSize: 14, color: '#666'}}>
                        {X.asset_count} assets, {formatByteCount(X.size)}, status: {X.status}
                    </div>
                )
            }
        </div>
    )
}

export const formatTime = (time: string) => {
    const timestamp = Date.parse(time)
    return new Date(timestamp).toLocaleString()
}

export default SearchResults