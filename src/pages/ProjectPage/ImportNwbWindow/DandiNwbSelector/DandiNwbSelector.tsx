import { Search } from "@mui/icons-material"
import { FunctionComponent, useCallback, useEffect, useState } from "react"
import Hyperlink from "../../../../components/Hyperlink"
import SmallIconButton from "../../../../components/SmallIconButton"
import SearchResults from "./SearchResults"
import { AssetResponse, AssetsResponse, AssetsResponseItem, DandisetSearchResultItem, DandisetsResponse } from "./types"

type Props = {
    width: number
    height: number
    onNwbFileSelected: (nwbUrl: string, dandisetId: string, dandisetVersion: string, assetId: string) => void
}

const searchBarHeight = 50
const DandiNwbSelector: FunctionComponent<Props> = ({width, height, onNwbFileSelected}) => {
    const [searchText, setSearchText] = useState<string>('')
    const [searchResult, setSearchResults] = useState<DandisetSearchResultItem[]>([])
    useEffect(() => {
        let canceled = false
        setSearchResults([])
        ; (async () => {
            const response = await fetch(`https://api.dandiarchive.org/api/dandisets/?page=1&page_size=50&ordering=-modified&search=${searchText}&draft=true&empty=false&embargoed=false`)
            if (canceled) return
            if (response.status === 200) {
                const json = await response.json()
                const dandisetResponse = json as DandisetsResponse
                setSearchResults(dandisetResponse.results)
            }
        })()
        return () => {canceled = true}
    }, [searchText])

    const handleClickAsset = useCallback(async (dandisetId: string, dandisetVersion: string, assetItem: AssetsResponseItem) => {
        const response = await fetch(`https://api.dandiarchive.org/api/dandisets/${dandisetId}/versions/${dandisetVersion}/assets/${assetItem.asset_id}/`)
        if (response.status === 200) {
            const json = await response.json()
            const assetResponse: AssetResponse = json
            let nwbUrl = assetResponse.contentUrl.find(url => url.includes('amazonaws.com'))
            if (!nwbUrl) nwbUrl = assetResponse.contentUrl[0]
            if (!nwbUrl) return
            onNwbFileSelected(nwbUrl, dandisetId, dandisetVersion, assetItem.asset_id)
        }
    }, [])

    return (
        <div style={{position: 'absolute', width, height}}>
            <div style={{position: 'absolute', width, height: searchBarHeight, overflow: 'hidden', background: 'white'}}>
                <SearchBar
                    width={width}
                    height={searchBarHeight}
                    onSearch={setSearchText}
                />
            </div>
            <div style={{position: 'absolute', width, height: height - searchBarHeight, top: searchBarHeight, overflow: 'hidden'}}>
                <SearchResults
                    width={width}
                    height={height - searchBarHeight}
                    searchResults={searchResult}
                    onClickAsset={handleClickAsset}
                />
            </div>
        </div>
    )
}

type SearchBarProps = {
    width: number
    height: number
    onSearch: (searchText: string) => void
}

const SearchBar: FunctionComponent<SearchBarProps> = ({width, height, onSearch}) => {
    const [searchText, setSearchText] = useState<string>('')
    const searchButtonWidth = height
    
    return (
        <div style={{paddingLeft: 15}}>
            <div style={{position: 'absolute', left: 0, top: 0, width: searchButtonWidth, height}}>
                <SearchButton width={searchButtonWidth} height={height} onClick={() => onSearch(searchText)} />
            </div>

            <div style={{position: 'absolute', left: searchButtonWidth, top: 0, width: width - searchButtonWidth, height}}>
                <input
                    style={{width: width - 40 - searchButtonWidth, height: 30, fontSize: 20, padding: 5}}
                    type="text" placeholder="Search DANDI"
                    onChange={e => setSearchText(e.target.value)}
                    // when enter is pressed
                    onKeyDown={e => {
                        if (e.key === 'Enter') {
                            onSearch(searchText)
                        }
                    }}
                    // do not spell check
                    spellCheck={false}
                />
            </div>
        </div>
    )
}

type SearchButtonProps = {
    onClick: () => void
    width: number
    height: number
}

const SearchButton: FunctionComponent<SearchButtonProps> = ({onClick, width, height}) => {
    return (
        <SmallIconButton
            icon={<Search />}
            label=""
            fontSize={height - 5}
        />
    )
}

const DandiNwbSelectorOld: FunctionComponent<Props> = ({onNwbFileSelected}) => {
    const [dandisetId, setDandisetId] = useState<string>('')
    const [dandisetVersion, setDandisetVersion] = useState<string>('draft')
    const [assetsResponse, setAssetsResponse] = useState<AssetsResponse | null>(null)
    const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null)

    useEffect(() => {
        let canceled = false
        setAssetsResponse(null)
        setSelectedAssetId(null)
        if (!validDandisetId(dandisetId)) return
        if (!validDandisetVersion(dandisetVersion)) return
        if (!dandisetId) return
        ; (async () => {
            // wait a bit because we don't want to make a request for every keystroke
            await new Promise(resolve => setTimeout(resolve, 500))
            if (canceled) return
            const response = await fetch(`https://api.dandiarchive.org/api/dandisets/${dandisetId}/versions/${dandisetVersion}/assets/`)
            if (canceled) return
            if (response.status === 200) {
                const json = await response.json()
                setAssetsResponse(json)
            }
        })()
        return () => {canceled = true}
    }, [dandisetId, dandisetVersion])

    useEffect(() => {
        if (!assetsResponse) return
        if (!selectedAssetId) return
        const asset = assetsResponse.results.find(a => a.asset_id === selectedAssetId)
        if (!asset) return
        ; (async () => {
            const response = await fetch(`https://api.dandiarchive.org/api/dandisets/${dandisetId}/versions/${dandisetVersion}/assets/${selectedAssetId}/`)
            if (response.status === 200) {
                const json = await response.json()
                const assetResponse: AssetResponse = json
                let nwbUrl = assetResponse.contentUrl.find(url => url.includes('amazonaws.com'))
                if (!nwbUrl) nwbUrl = assetResponse.contentUrl[0]
                if (!nwbUrl) return
                onNwbFileSelected(nwbUrl, dandisetId, dandisetVersion, selectedAssetId)
            }
        })()
    }, [assetsResponse, selectedAssetId, dandisetId, dandisetVersion, onNwbFileSelected])

    return (
        <div>
            {/* Input field for DANDI ID */}
            Dandiset ID: <input type="text" value={dandisetId} onChange={e => setDandisetId(e.target.value)} />
            &nbsp;&nbsp;&nbsp;&nbsp;
            {/* Input field for DANDI version */}
            Dandiset version: <input type="text" value={dandisetVersion} onChange={e => setDandisetVersion(e.target.value)} />
            <div style={{position: 'relative', width: '100%', height: 500, overflowY: 'auto'}}>
                <AssetsTable assetsResponse={assetsResponse} onAssetSelected={setSelectedAssetId} />
            </div>
        </div>
    )
}

type AssetsTableProps = {
    assetsResponse: AssetsResponse | null
    onAssetSelected: (assetId: string) => void
}

const AssetsTable: FunctionComponent<AssetsTableProps> = ({assetsResponse, onAssetSelected: onNwbFileSelected}) => {
    if (!assetsResponse) return <span />
    return (
        <table className="scientific-table">
            <thead>
                <tr>
                    <th>Asset</th>
                    <th>Size</th>
                    <th>Created</th>
                    <th>Modified</th>
                </tr>
            </thead>
            <tbody>
                {
                    assetsResponse.results.map(asset => (
                        <tr key={asset.asset_id}>
                            <td>
                                <Hyperlink onClick={() => onNwbFileSelected(asset.asset_id)}>
                                    {asset.path}
                                </Hyperlink>
                            </td>
                            <td>{asset.size}</td>
                            <td>{asset.created}</td>
                            <td>{asset.modified}</td>
                        </tr>
                    ))
                }
            </tbody>
        </table>
    )
}

const validDandisetId = (dandisetId: string) => {
    if (dandisetId.length < 5) return false
    if (dandisetId.length > 8) return false
    return true
}

const validDandisetVersion = (dandisetVersion: string) => {
    if (dandisetVersion.length < 1) return false
    if (dandisetVersion.length > 1000) return false
    return true
}

export default DandiNwbSelector