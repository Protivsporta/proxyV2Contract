import { Address, toNano } from 'ton-core';
import { Main, MainConfig } from '../wrappers/Main';
import { compile, NetworkProvider } from '@ton-community/blueprint';
import { createKeys } from './utils/keys';

export async function run(provider: NetworkProvider) {
    const main = provider.open(Main.createFromConfig({
        seqno: 0,
        public_key: (await createKeys()).publicKey,
        owner_address: Address.parse("kQA5C0jYi-gQOBNi0XmakI3wXzUAOTrQ9F6_kQJEbRwjV5u-")
    }, await compile('Main')));

    await main.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(main.address);
}
