import { Blockchain, SandboxContract, TreasuryContract } from '@ton-community/sandbox';
import { Cell, toNano } from 'ton-core';
import { Main } from '../wrappers/Main';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';
import { KeyPair, mnemonicNew, mnemonicToPrivateKey, sign } from 'ton-crypto';
import { Opcodes } from '../scripts/utils/opcodes';

async function getKp() {
    let mnemonic = await mnemonicNew();
    return mnemonicToPrivateKey(mnemonic);
}

describe('Main', () => {
    let code: Cell;
    let blockchain: Blockchain;
    let main: SandboxContract<Main>;
    let kp: KeyPair;
    let owner: SandboxContract<TreasuryContract>;
    let transactionFee: bigint = toNano('0.05');

    beforeAll(async () => {
        code = await compile('Main');
    });

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        kp = await getKp();
        owner = await blockchain.treasury('owner');

        main = blockchain.openContract(Main.createFromConfig({
            seqno: 0,
            public_key: kp.publicKey,
            owner_address: owner.address
        }, code));

        const deployer = await blockchain.treasury('deployer');

        const deployResult = await main.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: main.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and main are ready to use
    });

    it('should accept deposit', async () => {
        const sender = await blockchain.treasury('sender');
        const depositResult = await main.sendDeposit(sender.getSender(), toNano('2'));
        expect(depositResult.transactions).toHaveTransaction({
            from: sender.address,
            to: main.address,
            success: true,
        });
        const balance = await main.getBalance();
        expect(balance).toBeGreaterThanOrEqual(toNano('1.99'));
    })

    it('should not allow to withdraw funds if sender is not an owner', async () => {
        const sender = await blockchain.treasury('sender');
        await main.sendDeposit(sender.getSender(), toNano('2'));
        const withdrawResult = await main.sendWithdraw(sender.getSender(), {amount: toNano('1'), value: transactionFee});
        expect(withdrawResult.transactions).toHaveTransaction({
            from: sender.address,
            to: main.address,
            success: false,
            exitCode: 404,
        })
    })

    it('should allow to withdraw funds if sender is an owner', async () => {
        const sender = await blockchain.treasury('sender');
        await main.sendDeposit(sender.getSender(), toNano('2'));
        const withdrawResult = await main.sendWithdraw(owner.getSender(), {amount: toNano('1'), value: transactionFee});
        expect(withdrawResult.transactions).toHaveTransaction({
            from: owner.address,
            to: main.address,
            success: true,
        })
        const balance = await main.getBalance();
        expect(balance).toBeLessThanOrEqual(toNano('1.1'));
    })

    it('should be reverted because of only owner can change SC owner field', async () => {
        const sender = await blockchain.treasury('sender');
        const changeOwnerResult = await main.sendChangeOwner(sender.getSender(), transactionFee, sender.address);
        expect(changeOwnerResult.transactions).toHaveTransaction({
            from: sender.address,
            to: main.address,
            success: false,
            exitCode: 404,
        })
        const ownerAddr = await main.getOwner();
        expect(ownerAddr.toString()).toBe(owner.address.toString());
    })

    it('should allow owner to change owner', async () => {
        const newOwner = await blockchain.treasury('newOwner');
        const changeOwnerResult = await main.sendChangeOwner(owner.getSender(), transactionFee, newOwner.address);
        expect(changeOwnerResult.transactions).toHaveTransaction({
            from: owner.address,
            to: main.address,
            success: true,
        })
        const ownerAddr = await main.getOwner();
        expect(ownerAddr.toString()).toBe(newOwner.address.toString());
    })

    it('should fail on wrong signature', async () => {
        const wrongKp = await getKp();
        await expect(
            main.sendExternal({
                op: Opcodes.selfdestruct,
                seqno: 0,
                signFunc: (buf) => sign(buf, wrongKp.secretKey)
            })
        ).rejects.toThrow();
    })

    it('should allow to send externals with right signature', async () => {
        expect(
            main.sendExternal({
                op: Opcodes.selfdestruct,
                seqno: 0,
                signFunc: (buf) => sign(buf, kp.secretKey)
            })
        );
    })
});
