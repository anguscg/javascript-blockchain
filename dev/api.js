

const express = require('express')
const app = express()
const bodyParser = require('body-parser');
const Blockchain = require('./blockchain');
const uuidv1 = require('uuid');
const nodeAddress = uuidv1.v1().split('-').join('');

const bitcoin = new Blockchain();


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));




app.get('/blockchain', function (req, res) {
  res.send(bitcoin)
})
// to create a new transaction in the blockchain
app.post('/transaction', function(req, res) {
    const blockIndex = bitcoin.createNewTransaction(req.body.amount, req.body.sender, req.body.recipient);
    res.json({note: `Transaction added to block ${blockIndex}.`})
})

// mining
app.get('/mine', function(req, res) {
    const prevBlock = bitcoin.getLastBlock();
    const previousBlockHash = prevBlock['hash'];
    const currentBlockData = {
        transactions: bitcoin.pendingTransactions,
        index: prevBlock['index'] + 1
    };
    const nonce = bitcoin.proofOfWork(previousBlockHash, currentBlockData);
    const blockHash = bitcoin.hashBlock(previousBlockHash, currentBlockData, nonce);
    // reward for mining the block
    bitcoin.createNewTransaction(69, "ANGUS", nodeAddress)

    const newBlock = bitcoin.createNewBlock(nonce, previousBlockHash, blockHash);
    res.json({
        note: "Block creation success",
        block: newBlock
    });
});

app.listen(3000, function() {
    console.log('Listening on port 3000...');
    
})