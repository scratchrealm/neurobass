import { VercelRequest, VercelResponse } from '@vercel/node'

module.exports = (req: VercelRequest, res: VercelResponse) => {
    (async () => {
        if (req.method === 'GET') {
            try {
                const code = req.query.code
                if (!code) throw Error('No code')
                const GITHUB_CLIENT_ID = process.env['VITE_GITHUB_CLIENT_ID']
                const GITHUB_CLIENT_SECRET = process.env['GITHUB_CLIENT_SECRET']
                if (!GITHUB_CLIENT_ID) throw Error('Env var not set: VITE_GITHUB_CLIENT_ID')
                if (!GITHUB_CLIENT_SECRET) throw Error('Env var not set: GITHUB_CLIENT_SECRET')
                const resp = await fetch(
                    `https://github.com/login/oauth/access_token?client_id=${GITHUB_CLIENT_ID}&client_secret=${GITHUB_CLIENT_SECRET}&code=${code}`,
                    {
                        headers: {accept: 'application/json'}
                    }
                )
                const r = await resp.json()
                // const resp = await axios.get(
                //     `https://github.com/login/oauth/access_token?client_id=${GITHUB_CLIENT_ID}&client_secret=${GITHUB_CLIENT_SECRET}&code=${code}`,
                //     {
                //         headers: {accept: 'application/json'}
                //     }
                // )
                // const r = resp.data
                if (!r.access_token) throw Error(`No access_token in response: ${r.error} (${r.error_description})`)
                res.json({
                    access_token: r.access_token
                })
            }
            catch(err: any) {
                res.json({
                    error: err.message
                })
            }
        }
        else {
            throw Error(`Invalid request method: ${req.method}`)
        }
    })()
}
