import { Address, fromNano, toNano } from 'ton-core';
import { Main } from '../wrappers/Main';
import { NetworkProvider, sleep } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const address = Address.parse(await ui.input('Main address'));

    const amount = toNano(await ui.input('Amount to deposit'));

    if (!(await provider.isContractDeployed(address))) {
        ui.write(`Error: Contract at address ${address} is not deployed!`);
        return;
    }

    const main = provider.open(Main.createFromAddress(address));

    const balanceBefore = await main.getBalance();

    await main.sendDeposit(provider.sender(), amount);

    ui.write('Waiting for balance to increase...');

    let balanceAfter = await main.getBalance();
    let attempt = 1;
    while (balanceAfter === balanceBefore) {
        ui.setActionPrompt(`Attempt ${attempt}`);
        await sleep(2000);
        balanceAfter = await main.getBalance();
        attempt++;
    }

    ui.clearActionPrompt();
    ui.write(`Balance increased successfully!\nCurrent balance is ${fromNano(balanceAfter)} TON`);
}