import { FunctionComponent, useEffect, useState } from "react"
import Hyperlink from "../../../components/Hyperlink"

type Props = {
    onNwbFileSelected: (nwbUrl: string, dandisetId: string, dandisetVersion: string, assetId: string) => void
}

type AssetsResponse = {
    count: number
    next: string | null
    previous: string | null
    results: {
        asset_id: string
        blob: string
        created: string
        modified: string
        path: string
        size: number
        zarr: any
    }[]
}

export type AssetResponse = {
    access: {
        status: string
        schemaKey: string
    }[]
    approach: {
        name: string
        schemaKey: string
    }[]
    keywords: string[]
    schemaKey: string
    dateModified: string
    schemaVersion: string
    encodingFormat: string
    wasGeneratedBy: {
        name: string
        schemaKey: string
        startDate: string
        identifier: string
        description: string
    }[]
    wasAttributedTo: any // Co-pilot AI didn't help me with this one because there was a nested "sex" field
    blobDateModified: string
    variableMeasured: {
        value: string
        schemaKey: string
    }[]
    measurementTechnique: {
        name: string
        schemaKey: string
    }[]
    id: string
    path: string
    identifier: string
    contentUrl: string[]
    contentSize: number
    digest: {
        [key: string]: string
    }
    "@context": string
}

const DandiNwbSelector: FunctionComponent<Props> = ({onNwbFileSelected}) => {
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