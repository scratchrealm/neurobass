import { FunctionComponent, useEffect, useMemo, useReducer, useState } from "react"
import Hyperlink from "../../../../components/Hyperlink"
import formatByteCount from "../../ProjectFileBrowser/formatByteCount"
import { formatTime } from "./SearchResults"
import { AssetsResponse, AssetsResponseItem, DandisetSearchResultItem, DandisetVersionInfo } from "./types"

type DandisetViewProps = {
    dandisetId: string
    width: number
    height: number
    onClickAsset: (assetItem: AssetsResponseItem) => void
}

const DandisetView: FunctionComponent<DandisetViewProps> = ({dandisetId, width, height, onClickAsset}) => {
    const [dandisetResponse, setDandisetResponse] = useState<DandisetSearchResultItem | null>(null)
    const [dandisetVersionInfo, setDandisetVersionInfo] = useState<DandisetVersionInfo | null>(null)
    const [assetsResponses, setAssetsResponses] = useState<AssetsResponse[]>([])

    useEffect(() => {
        let canceled = false
        setDandisetResponse(null)
        ; (async () => {
            const response = await fetch(`https://api.dandiarchive.org/api/dandisets/${dandisetId}`)
            if (canceled) return
            if (response.status === 200) {
                const json = await response.json()
                const dandisetResponse = json as DandisetSearchResultItem
                setDandisetResponse(dandisetResponse)
            }
        })()
        return () => {canceled = true}
    }, [dandisetId])

    const {identifier, created, modified, contact_person, most_recent_published_version, draft_version} = dandisetResponse || {}
    const V = most_recent_published_version || draft_version

    useEffect(() => {
        let canceled = false
        setDandisetVersionInfo(null)
        if (!dandisetResponse) return
        if (!V) return
        ; (async () => {
            const response = await fetch(`https://api.dandiarchive.org/api/dandisets/${dandisetId}/versions/${V.version}/info/`)
            if (canceled) return
            if (response.status === 200) {
                const json = await response.json()
                const dandisetVersionInfo = json as DandisetVersionInfo
                setDandisetVersionInfo(dandisetVersionInfo)
            }
        })()
        return () => {canceled = true}
    }, [dandisetId, dandisetResponse, V])

    useEffect(() => {
        let canceled = false
        setAssetsResponses([])
        if (!dandisetId) return
        if (!dandisetResponse) return
        if (!V) return
        ; (async () => {
            const rr: AssetsResponse[] = []
            let uu = `https://api.dandiarchive.org/api/dandisets/${dandisetId}/versions/${V.version}/assets/`
            while (uu) {
                const response = await fetch(uu)
                if (canceled) return
                if (response.status === 200) {
                    const json = await response.json()
                    rr.push(json)
                    uu = json.next
                }
            }
            setAssetsResponses(rr)
        })()
        return () => {canceled = true}
    }, [dandisetId, dandisetResponse, V])

    const allAssets = useMemo(() => {
        const rr: AssetsResponseItem[] = []
        assetsResponses.forEach(assetsResponse => {
            rr.push(...assetsResponse.results)
        })
        return rr
    }, [assetsResponses])

    if (!dandisetResponse) return <div>Loading dandiset...</div>
    if (!dandisetVersionInfo) return <div>Loading dandiset info...</div>
    
    const X = dandisetVersionInfo

    const externalLink = `https://dandiarchive.org/dandiset/${dandisetId}/${X.version}`

    return (
        <div style={{position: 'absolute', width, height, overflowY: 'auto'}}>
            <div style={{fontSize: 20, fontWeight: 'bold', padding: 5}}>
                <a href={externalLink} target="_blank" rel="noreferrer" style={{color: 'black'}}>{X.dandiset.identifier} ({X.version}): {X.name}</a>
            </div>
            <div style={{fontSize: 14, padding: 5}}>
                {
                    X.metadata.contributor.map(c => (
                        <span key={c.name}>{c.name}; </span>
                    ))
                }
            </div>
            <div style={{fontSize: 14, padding: 5}}>
                {X.metadata.description}
            </div>
            <AssetsBrowser assetItems={allAssets} onClick={onClickAsset} />
        </div>
    )
}

type ExpandedFoldersState = {
    [folder: string]: boolean
}

type ExpandedFoldersAction = {
    type: 'toggle'
    folder: string
}

const expandedFoldersReducer = (state: ExpandedFoldersState, action: ExpandedFoldersAction) => {
    switch (action.type) {
        case 'toggle': {
            const folder = action.folder
            const newState = {...state}
            newState[folder] = !newState[folder]
            return newState
        }
        default: {
            throw Error('Unexpected action type')
        }
    }
}

type AssetsBrowserProps = {
    assetItems: AssetsResponseItem[]
    onClick: (assetItem: AssetsResponseItem) => void
}

const AssetsBrowser: FunctionComponent<AssetsBrowserProps> = ({assetItems, onClick}) => {
    const folders: string[] = useMemo(() => {
        const folders = assetItems.map(assetItem => assetItem.path.split('/')[0])
        const uniqueFolders = [...new Set(folders)].sort()
        return uniqueFolders
    }, [assetItems])

    const [expandedFolders, expandedFoldersDispatch] = useReducer(expandedFoldersReducer, {})

    if (!assetItems) return <span />
    return (
        <div>
            {folders.map(folder => (
                <div key={folder}>
                    <div
                        style={{fontSize: 18, fontWeight: 'bold', padding: 5, cursor: 'pointer'}}
                        onClick={() => expandedFoldersDispatch({type: 'toggle', folder})}
                    >
                        {expandedFolders[folder] ? '▼' : '▶'}
                        &nbsp;&nbsp;
                        {folder}
                    </div>
                    <div style={{padding: 5}}>
                        {
                            expandedFolders[folder] && (
                                assetItems.filter(assetItem => assetItem.path.startsWith(folder + '/')).map(assetItem => (
                                    <AssetItemView key={assetItem.asset_id} assetItem={assetItem} onClick={() => onClick(assetItem)} />
                                ))
                            )
                        }
                    </div>
                </div>
            ))}  
        </div>
    )
}

type AssetItemViewProps = {
    assetItem: AssetsResponseItem
    onClick: () => void
}

const AssetItemView: FunctionComponent<AssetItemViewProps> = ({assetItem, onClick}) => {
    const {created, modified, path, size} = assetItem

    return (
        <div style={{padding: 5}}>
            <div style={{fontSize: 14, fontWeight: 'bold'}}>
                <Hyperlink onClick={onClick} disabled={!path.endsWith('.nwb')}>
                    {path.split('/').slice(1).join('/')}
                </Hyperlink>
                &nbsp;
                {formatTime2(modified)}
                &nbsp;
                {formatByteCount(size)}
            </div>
        </div>
    )
}

const formatTime2 = (time: string) => {
    const date = new Date(time)
    // include date only
    return date.toLocaleDateString()
}

export default DandisetView