
const sha256 = require('sha256');
const currentNodeUrl = process.argv[3]
const uuidv1 = require('uuid');




function Blockchain() {
    this.chain = [];
   
    this.pendingTransactions = [];
    this.currentNodeUrl = currentNodeUrl;
    this.networkNodes = [];
    // for creating a genisis block
    this.createNewBlock(100, '0', '0');
};

Blockchain.prototype.createNewBlock = function(nonce, previousBlockHash, hash) {
    const newBlock = {
        index: this.chain.length + 1,
        timestamp: Date.now(),
        transactions: this.pendingTransactions,
        nonce: nonce,
        hash: hash,
        previousBlockHash: previousBlockHash

    };
    this.pendingTransactions = [];
    this.chain.push(newBlock);

    return newBlock;
};

// return last block
Blockchain.prototype.getLastBlock = function() {
	return this.chain[this.chain.length - 1];
};


Blockchain.prototype.createNewTransaction = function(amount, sender, recipient) {
    
	const newTransaction = {
		amount: amount,
		sender: sender,
		recipient: recipient,
		transactionId: uuidv1.v1().split('-').join('')
	};
    
	return newTransaction;
};


Blockchain.prototype.addTransactionToPendingTransactions = function(transactionObj) {
	this.pendingTransactions.push(transactionObj);
    return this.getLastBlock()['index'] + 1;
    
};


// creating hashblock using sha256 from previous block, current block and nonce
Blockchain.prototype.hashBlock = function(previousBlockHash, currentBlockData, nonce) {
    const dataAsString = previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData);
    const hash = sha256(dataAsString);
    return hash;
};

Blockchain.prototype.proofOfWork = function(previousBlockHash, currentBlockData) {
    let nonce = 0;
    let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    while (hash.substring(0, 4) !== '0000') {
        nonce ++;
        hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
        
        
    }
    return nonce;
}


module.exports = Blockchain;