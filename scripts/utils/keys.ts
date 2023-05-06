import { mnemonicToPrivateKey } from "ton-crypto";
import { mnemonic } from "./config";


export async function createKeys() {
    let words = Array(mnemonic);
    return mnemonicToPrivateKey(words);
}
