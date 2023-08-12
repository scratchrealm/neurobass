import { Search } from "@mui/icons-material"
import { FunctionComponent, useCallback, useEffect, useState } from "react"
import SmallIconButton from "../../../../components/SmallIconButton"
import SearchResults from "./SearchResults"
import { AssetResponse, AssetsResponseItem, DandisetSearchResultItem, DandisetsResponse } from "./types"

type Props = {
    width: number
    height: number
    onNwbFileSelected: (nwbUrl: string, dandisetId: string, dandisetVersion: string, assetId: string, assetPath: string) => void
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
            onNwbFileSelected(nwbUrl, dandisetId, dandisetVersion, assetItem.asset_id, assetItem.path)
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

export default DandiNwbSelector