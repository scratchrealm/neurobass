const removeIdField = (doc: any[] | any | null): any[] | any => {
    if (!doc) return doc
    if (Array.isArray(doc)) return doc.map(removeIdField)
    const x: {[key: string]: any} = {}
    for (const key in doc) {
        if (key === '_id') continue // skip _id
        x[key] = doc[key]
    }
    return x
}

export default removeIdField