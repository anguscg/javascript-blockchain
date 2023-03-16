

const express = require('express')
const app = express()
const bodyParser = require('body-parser');
const Blockchain = require('./blockchain');
const uuidv1 = require('uuid');
const axios = require('axios')
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
});

app.post('/transaction/broadcast', function(req, res) {
    const newTransaction = bitcoin.createNewTransaction(req.body.amount, req.body.sender, req.body.recipient);
    bitcoin.addTransactionToPendingTransactions(newTransaction);
    const requestPromises = [];
    bitcoin.networkNodes.forEach(networkNodeUrl =>{
      const requestOptions = {
        uri: networkNodeUrl + '/transaction',
        method: 'POST',
        body: newTransaction,
        json: true
      }
      requestPromises.push(axios(requestOptions));
    })
    Promise.all(requestPromises)
    .then(data => {
        res.json({
          note: "transaction created and broadcasted"
        })
    })
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
app.post('/register-and-broadcast-node', function (req, res) {
  const newNodeUrl = req.body.newNodeUrl
  if (bitcoin.networkNodes.indexOf(newNodeUrl) == -1)
    bitcoin.networkNodes.push(newNodeUrl)

  const regNodesPromises = []
  bitcoin.networkNodes.forEach(networkNodeUrl => {
    const requestOptions = {
      url: networkNodeUrl + '/register-node',
      method: 'POST',
      data: { newNodeUrl: newNodeUrl },
    }

    regNodesPromises.push(axios(requestOptions))
  })

  Promise.all(regNodesPromises)
    .then(data => {
      const bulkRegisterOptions = {
        url: newNodeUrl + '/register-nodes-bulk',
        method: 'POST',
        data: {
          allNetworkNodes: [...bitcoin.networkNodes, bitcoin.currentNodeUrl],
        },
      }

      return axios(bulkRegisterOptions)
    })
    .then(data => {
      return res.json({
        note: 'New node registered with network successfully.',
      })
    })
})
  
// this end point will register the new node with the node that recieves the request
app.post('/register-node', function (req, res) {
  const newNodeUrl = req.body.newNodeUrl;
  const nodeNotAlreadyPresent = bitcoin.networkNodes.indexOf(newNodeUrl) == -1
  const notCurrentNode = bitcoin.currentNodeUrl !== newNodeUrl;
  if (nodeNotAlreadyPresent && notCurrentNode)
    bitcoin.networkNodes.push(newNodeUrl)
  return res.json({ note: 'New node registered successfully.' })
})
// registering multiple nodes
app.post('/register-nodes-bulk', function (req, res) {
  const allNetworkNodes = req.body.allNetworkNodes
  allNetworkNodes.forEach(networkNodeUrl => {
    const nodeNotAlreadyPresent =
      bitcoin.networkNodes.indexOf(networkNodeUrl) == -1
    const notCurrentNode = bitcoin.currentNodeUrl !== networkNodeUrl
    if (nodeNotAlreadyPresent && notCurrentNode)
      bitcoin.networkNodes.push(networkNodeUrl)
  })

  return res.json({ note: 'Bulk registration successful.' })
})

app.listen(port, function() {
    console.log(`Listening on port ${port}...`);
    
})