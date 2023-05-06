import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode, toNano } from 'ton-core';
import { Opcodes } from '../scripts/utils/opcodes';

export type MainConfig = {
    seqno: number,
    public_key: Buffer,
    owner_address: Address
};

export function mainConfigToCell(config: MainConfig): Cell {
    return beginCell()
        .storeUint(config.seqno, 32)
        .storeBuffer(config.public_key)
        .storeAddress(config.owner_address)
    .endCell();
}

export class Main implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new Main(address);
    }

    static createFromConfig(config: MainConfig, code: Cell, workchain = 0) {
        const data = mainConfigToCell(config);
        const init = { code, data };
        return new Main(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendDeposit(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.deposit, 32)
                .storeUint(0, 64)
            .endCell(),
        });
    }

    async sendWithdraw(provider: ContractProvider, via: Sender,
        opts: {
            value: bigint,
            amount: bigint
        }) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.withdrawFunds, 32)
                .storeUint(0, 64)
                .storeCoins(opts.amount)
            .endCell(),
        });
    }

    async sendChangeOwner(provider: ContractProvider, via: Sender, value: bigint, newOwner: Address) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.changeOwner, 32)
                .storeUint(0, 64)
                .storeAddress(newOwner)
            .endCell(),
        });
    }

    async sendExternal(provider: ContractProvider, 
        opts: {
            op: number,
            seqno: number,
            signFunc: (buf: Buffer) => Buffer;
        }    
    ) {
        const msgToSign = beginCell()
                            .storeUint(opts.seqno, 32)
                            .storeUint(opts.op, 32)
                        .endCell();
        const sign = opts.signFunc(msgToSign.hash());
        await provider.external(beginCell().storeBuffer(sign).storeSlice(msgToSign.asSlice()).endCell());
    }

    async getBalance(provider: ContractProvider) : Promise<bigint> {
        let state = await provider.getState();
        return state.balance;
    }

    async getOwner(provider: ContractProvider) : Promise<Address> {
        let result = await provider.get('get_owner_addr', []);
        return result.stack.readAddress();
    }

}
