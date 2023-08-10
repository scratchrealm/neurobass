const createRandomId = (numChars: number) => {
    // lowercase letters only
    const chars = 'abcdefghijklmnopqrstuvwxyz'
    let id = ''
    for (let i = 0; i < numChars; i++) {
        id += chars[Math.floor(Math.random() * chars.length)]
    }
    return id
}

export default createRandomId