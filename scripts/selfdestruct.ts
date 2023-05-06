import { Address, fromNano, toNano } from 'ton-core';
import { Main } from '../wrappers/Main';
import { NetworkProvider, sleep } from '@ton-community/blueprint';
import { createKeys } from './utils/keys';
import { Opcodes } from './utils/opcodes';
import { sign } from 'ton-crypto';

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();
    const kp = await createKeys();

    const address = Address.parse(await ui.input('Main address'));

    if (!(await provider.isContractDeployed(address))) {
        ui.write(`Error: Contract at address ${address} is not deployed!`);
        return;
    }

    const main = provider.open(Main.createFromAddress(address));

    const balanceBefore = await main.getBalance();
    let seqno = await main.getSeqno();

    await main.sendExternal({
        op: Opcodes.selfdestruct,
        seqno: seqno,
        signFunc: (buf) => sign(buf, kp.secretKey)
    })

    ui.write('Waiting for contract to selfdestruct...');

    let balanceAfter = await main.getBalance();
    let attempt = 1;
    while (balanceAfter === balanceBefore) {
        ui.setActionPrompt(`Attempt ${attempt}`);
        await sleep(2000);
        balanceAfter = await main.getBalance();
        attempt++;
    }

    ui.clearActionPrompt();
    ui.write(`Contract was destructed!\nCurrent balance is ${fromNano(balanceAfter)} TON`);
}