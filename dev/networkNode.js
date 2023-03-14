

const express = require('express')
const app = express()
const bodyParser = require('body-parser');
const Blockchain = require('./blockchain');
const uuidv1 = require('uuid');
const rp = require('request-promise');
const nodeAddress = uuidv1.v1().split('-').join('');
const bitcoin = new Blockchain();
const port = process.argv[2];

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
// registering node and broadcast to network
app.post("/register-and-broadcast-node", function (req, res) {
    const newNodeUrl = req.body.newNodeUrl;
    if (bitcoin.networkNodes.indexOf(newNodeUrl == -1)) {
        bitcoin.networkNodes.push(newNodeUrl);

        const regNodesPromises = [];
        bitcoin.networkNodes.forEach(networkNodeUrl => {
            const requestOptions = {
                uri: networkNodeUrl + '/register-node',
                method: 'POST',
                body: { newNodeUrl: newNodeUrl },
                json: true
            };
            regNodesPromises.push(rp(requestOptions))
        })
        Promise.all(regNodesPromises).then(data => {
            const bulkRegisterOptions = {
                uri: newNodeUrl + '/register-nodes-bulk',
                method: 'POST',
                body: { allNetworkNodes: [...bitcoin.networkNodes, bitcoin.currentNodeUrl] },
                json: true
            }
            return rp(bulkRegisterOptions)
        }).then(data => {
            res.json({ ode: "New node registered with network" })
        })
    } else {
        res.json({
            note: "New node registration failed"
        })
    }
})
// this end point will register the new node with the node that recieves the request
app.post('/register-node', function (req, res) {
    const newNodeUrl = req.body.newNodeUrl;
    const nodeNotAlreadyPresent = bitcoin.networkNodes.indexOf(newNodeUrl == -1);
    const notCurrentNode = bitcoin.currentBlockData !== newNodeUrl;
    if (nodeNotAlreadyPresent && notCurrentNode) {
        bitcoin.networkNodes.push(newNodeUrl);
        res.json({
            note: "New node registered with another node on the network"
        })
    } else {
        res.json({
            note: "Node already registered"
        })
    }
});
// registering multiple nodes
app.post("./register-node-bulk", function(req, res) {
    
})

app.listen(port, function() {
    console.log(`Listening on port ${port}...`);
    
})