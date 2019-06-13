const Web3 = require('web3');
const ck_abi = require('./ck_abi.json');
require('dotenv').config();

const endpoint1 = process.env.INFURA1;
const contract_address = process.env.CK_CONTRACT;
const web3 = new Web3(endpoint1);
const jsonInterface = JSON.parse(ck_abi);
const contract = new web3.eth.Contract(jsonInterface, contract_address);
const birthInputs = jsonInterface[jsonInterface.length - 2].inputs;


const barbaric = async () => {
    
    //! NO API for that!
    const fromBlock = 4832686; //* first block of jan2018
    const lastBlock = 5174124; //* last block of feb2018

    let counter = 0;

    for (let i = fromBlock; i <= lastBlock; i+= 500) {

        const toBlock = updateToBlock(i, lastBlock);

        try {

            //* Find every birth during that period of time
            //! throws if logs.length > 1000 - ~340K blocks to process!
            const logs = await contract.getPastEvents('Birth', {fromBlock: i , toBlock });

            //* Decode each birth event to get the kitty's data
            for (const log of logs) {

                //* The owner here is the original owner
                const bornKitty = getBornKitty(log);

                //* Now we need to get the current owner from the Blockchain
                //! One Request per Cat = Super Resource consuming!
                const kitty = await fetchCurrentOwner(bornKitty);
                
                counter++;

                if (counter%100 === 0) {
                    console.log(`-------------------------------------- ${counter} KITTIES FOUND --------------------------------------`);
                }
                console.log(kitty);
            }

        } catch (e) {
            throw e;
        }   
    }
    
    return true;
    
 };

 const updateToBlock = (i, lastBlock) => {
     return i + 500 > lastBlock ? lastBlock : i + 500;
 }

 const getBornKitty = log => {
    const decoded = web3.eth.abi.decodeLog(birthInputs, log.raw.data, log.returnValues)
    const bornKitty = {
        kittyId: web3.utils.hexToNumber(decoded.kittyId),
        first_owner: decoded.owner
    };

    return bornKitty;
 }

 const fetchCurrentOwner = async bornKitty => {
    const current_owner = await contract.methods.ownerOf(bornKitty.kittyId).call();
    bornKitty.current_owner = current_owner;

    return bornKitty;
 }

barbaric().catch(e => console.error(e));
