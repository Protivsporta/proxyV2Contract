import { mnemonicToPrivateKey } from "ton-crypto";
import * as dotenv from 'dotenv';
dotenv.config({path: '../../.env'});

export async function createKeys() {
    let words = Array(process.env.MNEMONIC!);
    return await mnemonicToPrivateKey(words);
}
