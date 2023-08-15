import { useCallback, useMemo } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { ProjectPageViewType } from "./pages/ProjectPage/ProjectPage"

export type Route = {
    page: 'home'
} | {
    page: 'about'
} | {
    page: 'project'
    projectId: string
    tab?: ProjectPageViewType
} | {
    page: 'workspace'
    workspaceId: string
} | {
    page: 'github-auth'
} | {
    page: 'compute-resources'
} | {
    page: 'compute-resource'
    computeResourceId: string
} | {
    page: 'register-compute-resource'
    computeResourceId: string
    resourceCode: string
}

const useRoute = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const p = location.pathname
    const search = location.search
    const searchParams = useMemo(() => new URLSearchParams(search), [search])
    const route: Route = useMemo(() => {
        if (p === '/about') {
            return {
                page: 'about'
            }
        }
        else if (p.startsWith('/project/')) {
            const a = p.split('/')
            const projectId = a[2]
            const tab = (searchParams.get('tab') || undefined) as ProjectPageViewType | undefined
            return {
                page: 'project',
                projectId,
                tab
            }
        }
        else if (p.startsWith('/workspace/')) {
            const a = p.split('/')
            const workspaceId = a[2]
            return {
                page: 'workspace',
                workspaceId
            }
        }
        else if (p === '/github/auth') {
            return {
                page: 'github-auth'
            }
        }
        else if (p === '/compute-resources') {
            return {
                page: 'compute-resources'
            }
        }
        else if (p.startsWith('/compute-resource/')) {
            const a = p.split('/')
            const computeResourceId = a[2]
            return {
                page: 'compute-resource',
                computeResourceId
            }
        }
        else if (p.startsWith('/register-compute-resource/')) {
            const a = p.split('/')
            const computeResourceId = a[2]
            const resourceCode = a[3]
            return {
                page: 'register-compute-resource',
                computeResourceId,
                resourceCode
            }
        }
        else {
            return {
                page: 'home'
            }
        }
    }, [p, searchParams])

    const setRoute = useCallback((r: Route) => {
        if (r.page === 'home') {
            navigate('/')
        }
        else if (r.page === 'about') {
            navigate('/about')
        }
        else if (r.page === 'project') {
            let u = `/project/${r.projectId}`
            if (r.tab) {
                u += `?tab=${r.tab}`
            }
            navigate(u)
        }
        else if (r.page === 'workspace') {
            navigate(`/workspace/${r.workspaceId}`)
        }
        else if (r.page === 'github-auth') {
            navigate('/github/auth')
        }
        else if (r.page === 'compute-resources') {
            navigate('/compute-resources')
        }
        else if (r.page === 'compute-resource') {
            navigate(`/compute-resource/${r.computeResourceId}`)
        }
        else if (r.page === 'register-compute-resource') {
            navigate(`/register-compute-resource/${r.computeResourceId}/${r.resourceCode}`)
        }
    }, [navigate])

    return {
        route,
        setRoute
    }    
}

export default useRoute