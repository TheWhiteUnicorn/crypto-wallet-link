import React, {useEffect, useMemo, useState} from 'react';
import './App.css';
import {useWallet} from "./lib";
import {Network} from "@ethersproject/networks";
import {getUndefinedVarErrMessage} from "./utils/checkUndefined";
import nacl from 'tweetnacl';
import bs58 from 'bs58';

enum VkWalletAPIActions {
    ADD_WALLET = 'addWallet'
}

interface ConnectVkSignedMessage {
    signedMessage: {
        wallet_id: string,
        network_version: number,
        action: VkWalletAPIActions,
        message: string,
    },
    sign: string,
}

function App() {
    const wallet = useWallet()
    const [network, setNetwork] = useState<Network>();

    const [dappKeyPair] = useState(nacl.box.keyPair());

    const [requestBodyForVK, setRequestBodyForVK] = useState<ConnectVkSignedMessage>();

    useEffect(() => {
        const getNetwork = async () => {
            const net = await wallet.provider?.getNetwork();
            setNetwork(net);
        }
        getNetwork();
    }, [wallet.provider])

    const linkToVK = async () => {
        const {accounts, signer, provider} = wallet;
        if (accounts === undefined || signer === undefined || provider === undefined) {
            console.error(getUndefinedVarErrMessage({accounts, signer, provider}))
            return
        }

        const net = await provider.getNetwork();
        const walletId = accounts[0]
        const signedMessage = {
            wallet_id: walletId,
            network_version: net.chainId,
            action: VkWalletAPIActions.ADD_WALLET,
            message: 'hello world',
        }
        const sign = await signer.signMessage(JSON.stringify(signedMessage));
        setRequestBodyForVK({
            signedMessage, sign
        })
    }

    const phantomTestHref = useMemo(() => {
        const params = new URLSearchParams({
            dapp_encryption_public_key: bs58.encode(dappKeyPair.publicKey),
            cluster: "mainnet-beta",
            app_url: "https://phantom.app",
            redirect_link: 'https://google.com',
        });
        const base = `https://phantom.app/ul/v1/connect?${params.toString()}`
        return base
    }, [])

    return (
    <div className="App">
        <h3>{wallet.status}</h3>
        <h3>Accounts: {wallet.accounts?.join(', ')}</h3>
        <p>Network: {JSON.stringify(network)}</p>
        <button onClick={linkToVK}>Link to vk_user_id</button>
        <p>requestBodyForVK: {JSON.stringify(requestBodyForVK)}</p>
        <a href={phantomTestHref}>TESTING</a>
    </div>
    );
}

export default App;
