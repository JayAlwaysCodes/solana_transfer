import {
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    sendAndConfirmTransaction,
    SystemProgram,
    Transaction,
    TransactionInstruction,
} from '@solana/web3.js';
import {readFileSync} from "fs";
import path from 'path';

const lo = require("buffer-layout");
// const BN = require("bn.js");



/**
 * Vars
 */

const SOLANA_NETWORK = "devnet";

let connection: Connection;
let programKeypair: Keypair;
let programId: PublicKey;

let johnsonKeypair: Keypair;
let davidKeypair: Keypair;
let joyKeypair: Keypair;
let lightKeypair: Keypair;



/**
 * Helper functions.
 */

function createKeypairFromFile(path: string): Keypair {
    return Keypair.fromSecretKey(
        Buffer.from(JSON.parse(readFileSync(path, "utf-8")))
    )
}


/**
 * Here we are sending lamports using the Rust program we wrote.
 * So this looks familiar. We're just hitting our program with the proper instructions.
 */
async function sendLamports(from: Keypair, to: PublicKey, amount: number) {
    
    let data = Buffer.alloc(8) // 8 bytes
    // lo.ns64("value").encode(new BN(amount), data);
    lo.ns64("value").encode(amount, data);

    let ins = new TransactionInstruction({
        keys: [
            {pubkey: from.publicKey, isSigner: true, isWritable: true},
            {pubkey: to, isSigner: false, isWritable: true},
            {pubkey: SystemProgram.programId, isSigner: false, isWritable: false},
        ],
        programId: programId,
        data: data,
    })

    await sendAndConfirmTransaction(
        connection, 
        new Transaction().add(ins), 
        [from]
    );
}



/**
 * Main
 */

async function main() {
    
    connection = new Connection(
        `https://api.${SOLANA_NETWORK}.solana.com`, 'confirmed'
    );

    programKeypair = createKeypairFromFile(
        path.join(
            path.resolve(__dirname, '../_dist/program'), 
            'program-keypair.json'
        )
    );
    programId = programKeypair.publicKey;

    // Our sample members are Ringo, George, Paul & John.
    johnsonKeypair = createKeypairFromFile(__dirname + "/../accounts/johnson.json");
    davidKeypair = createKeypairFromFile(__dirname + "/../accounts/david.json");
    joyKeypair = createKeypairFromFile(__dirname + "/../accounts/joy.json");
    lightKeypair = createKeypairFromFile(__dirname + "/../accounts/light.json");
    
    // We'll start by airdropping some lamports to Paul & John.
    // await connection.confirmTransaction(
    //     await connection.requestAirdrop(
    //         paulKeypair.publicKey,
    //         LAMPORTS_PER_SOL,
    //     )
    // );
    // await connection.confirmTransaction(
    //     await connection.requestAirdrop(
    //         johnKeypair.publicKey,
    //         LAMPORTS_PER_SOL,
    //     )
    // );

    // John sends some SOL to Ringo.
    console.log("Johnson sends some SOL to Ringo...");
    console.log(`   Johnson's public key: ${johnsonKeypair.publicKey}`);
    console.log(`   light's public key: ${lightKeypair.publicKey}`);
    await sendLamports(johnsonKeypair, lightKeypair.publicKey, 5000000);

    // David sends some SOL to Joy.
    console.log("David sends some SOL to Joy...");
    console.log(`   david's public key: ${davidKeypair.publicKey}`);
    console.log(`   joy's public key: ${joyKeypair.publicKey}`);
    await sendLamports(davidKeypair, joyKeypair.publicKey, 4000000);

    // Joy sends some SOL over to Johnson.
    console.log("Joy sends some SOL over to Johnson...");
    console.log(`   Joy's public key: ${joyKeypair.publicKey}`);
    console.log(`   John's public key: ${johnsonKeypair.publicKey}`);
    await sendLamports(joyKeypair, johnsonKeypair.publicKey, 2000000);
}


main().then(
    () => process.exit(),
    err => {
        console.error(err);
        process.exit(-1);
    },
  );