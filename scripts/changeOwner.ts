import { Address, toNano } from 'ton-core';
import { Main } from '../wrappers/Main';
import { NetworkProvider, sleep } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const address = Address.parse(await ui.input('Main address'));

    const newOwnerAddr = Address.parse(await ui.input('New owner address'));

    if (!(await provider.isContractDeployed(address))) {
        ui.write(`Error: Contract at address ${address} is not deployed!`);
        return;
    }

    const main = provider.open(Main.createFromAddress(address));

    const ownerBefore = await main.getOwner();

    await main.sendChangeOwner(provider.sender(), toNano('0.01'), newOwnerAddr);

    ui.write('Waiting for owner to change...');

    let ownerAfter = await main.getOwner();
    let attempt = 1;
    while (ownerAfter === ownerBefore) {
        ui.setActionPrompt(`Attempt ${attempt}`);
        await sleep(2000);
        ownerAfter = await main.getOwner();
        attempt++;
    }

    ui.clearActionPrompt();
    ui.write(`Owner changed successfully!\nCurrent SC owner is ${ownerAfter.toString()}`);
}