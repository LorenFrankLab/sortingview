import React, { useCallback, useMemo, useState } from 'react'
import { FunctionComponent } from "react"
import ReactMarkdown from 'react-markdown'
import Markdown from '../../common/Markdown'
import BackendProviderView from '../../reusable/ApplicationBar/BackendProviderView'
import ModalWindow from '../../reusable/ApplicationBar/ModalWindow'
import Hyperlink from '../../reusable/common/Hyperlink'
import useRoute, {RoutePath} from '../../route/useRoute'
import {useModalDialog} from '../../reusable/ApplicationBar/ApplicationBar'
import introMd from './intro.md.gen'
import GoogleSignin, { useSignedIn } from '../../reusable/googleSignIn/GoogleSignin'
import useGoogleSignInClient from '../../reusable/googleSignIn/useGoogleSignInClient'

type Props = {
    
}

const Home: FunctionComponent<Props> = () => {
    const {setRoute, backendUri, workspaceUri} = useRoute()
    const linkTargetResolver = useCallback((uri: string, text: string, title?: string) => {
        return '_blank'
    }, [])
    
    const routeRenderers: ReactMarkdown.Renderers = useMemo(() => ({
        link: (props) => {
            const value: string = props.children[0].props.value
            const target: string = props.target
            const href = props.href as any as RoutePath
            if (href.startsWith('http')) {
                return <a href={href} target={target}>{value}</a>
            }
            else {
                return <Hyperlink onClick={() => {setRoute({routePath: href})}}>{value}</Hyperlink>
            }
        }
    }), [setRoute])
    const [googleSignInVisible, setGoogleSignInVisible] = useState(false)
    const toggleGoogleSignInVisible = useCallback(() => {setGoogleSignInVisible(v => (!v))}, [])

    const {visible: backendProviderVisible, handleOpen: openBackendProvider, handleClose: closeBackendProvider} = useModalDialog()
    const handleSelectBackend = useCallback(() => {
        openBackendProvider()
    }, [openBackendProvider])

    const handleSelectWorkspace = useCallback(() => {
        setRoute({routePath: '/selectWorkspace'})
    }, [setRoute])

    const handleViewWorkspace = useCallback(() => {
        setRoute({routePath: '/workspace'})
    }, [setRoute])

    const googleSignInClient = useGoogleSignInClient()
    const signedIn = useSignedIn()

    return (
        <span>
            <Markdown
                source={introMd}
                linkTarget={linkTargetResolver}
                renderers={{...routeRenderers}}
            />
            {
                googleSignInClient && (
                    <span>
                        {
                            signedIn ? (
                                <p>You are signed in as {googleSignInClient.profile?.getEmail()}</p>
                            ) : (
                                <p>Some actions on backend providers require authorization. You can optionally <Hyperlink onClick={toggleGoogleSignInVisible}>sign in using a Google account</Hyperlink>.</p>
                            )
                        }                        
                        {
                            (googleSignInVisible || signedIn) && <GoogleSignin client={googleSignInClient} />
                        }
                    </span>
                )
            }
            {
                backendUri ? (
                    <span>
                        <p>The selected backend provider is: {backendUri}</p>
                        <p><Hyperlink onClick={handleSelectBackend}>Select a different backend provider</Hyperlink></p>
                        <p><Hyperlink href="https://github.com/magland/sortingview/blob/main/README.md" target="_blank">Instructions for setting up your own backend provider</Hyperlink></p>
                        {
                            workspaceUri ? (
                                <span>
                                    <p>The selected workspace is: {workspaceUri}</p>
                                    <p><Hyperlink onClick={handleSelectWorkspace}>Select a different workspace</Hyperlink></p>
                                    <Hyperlink onClick={handleViewWorkspace}>View this workspace</Hyperlink>
                                </span>
                            ) : (
                                <span>
                                    <p>The next step is to <Hyperlink onClick={handleSelectWorkspace}>select a workspace</Hyperlink>.</p>
                                </span>
                            )
                        }
                    </span>
                ) : (
                    <p>Start by <Hyperlink onClick={handleSelectBackend}>selecting a backend provider</Hyperlink></p>
                )
            }
            <ModalWindow
                open={backendProviderVisible}
                onClose={closeBackendProvider}
            >
                <BackendProviderView
                    onClose={closeBackendProvider}
                />
            </ModalWindow>
        </span>
    )
}

export default Home