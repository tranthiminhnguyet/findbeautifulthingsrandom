const ethers = require('ethers');
const EthereumJS = require('ethereumjs-util');
const provider = new ethers.JsonRpcProvider("https://rpc.ankr.com/eth");

const config = {
  webhook: "https://chat.googleapis.com/v1/spaces/AAAANzIFHu0/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=YBBsr3lTjAYH5oOz9fx3_3rHa7fsN5q5euTBrTxK7Gk%3D",
  isFindBalance: false,
  isFindBeautiful: true,
  count: 1,
}
function getAddressFromPrivateKey(privateKey) {
  var public = EthereumJS.privateToPublic(Buffer.from(privateKey, 'hex'));
  var addr = EthereumJS.bufferToHex(EthereumJS.publicToAddress(public));
  return addr;
}

function genRandomPrivateKey() {
  const { randomBytes } = require('crypto');
  const privateKey = randomBytes(32);
  return privateKey.toString('hex');
}

function sleep (time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

async function findBeautifulString(pri,addr=""){ 
  let tempArr =[];
  inputString = addr.replace("0x","")
  let _char = null
  for (let i = 0; i < inputString.length; ++i){
    let _currentChar = inputString.charCodeAt(i);
    if(_char==null){
      _char = _currentChar;
      tempArr.push(_currentChar)
      continue;
    }
    else if(_currentChar-_char<=1 && _currentChar-_char>=-1){
      _char = _currentChar;
      tempArr.push(_currentChar)
    }
    else if(_char<=57 && _currentChar<=57){
      _char = _currentChar;
      tempArr.push(_currentChar)
    }
    else{
      break
    }
  }
  if(tempArr.length>20){
    console.log(`beauti:${tempArr.length}|${pri}|${addr}`)
    sendGoogleChatWebhook(`beauti:${tempArr.length}|${pri}|${addr}`)
    return true
  }
  return false
}
var count = 1
async function findBeautifulAddr({loop}={}){  
  console.log("Count:",count)
  for(let i=0;i<100;i++){
    let _pri = genRandomPrivateKey();
    let _addr = getAddressFromPrivateKey(_pri)
    if(config.isFindBalance){
      const wei = await provider.getBalance(_addr);
      const eth = ethers.formatEther(wei);
      // console.log("Balance:", eth, typeof eth, _addr);
      if(Number(eth)>0){
        console.log(`${eth}|${_pri}|${_addr}`);
        sendGoogleChatWebhook(`${eth}|${_pri}|${_addr}`)
        return {
          pri: _pri,
          addr: _addr
        }
      }
    }
    if(config.isFindBeautiful){
      findBeautifulString(_pri,_addr)
    }
  }
  sleep(2000).then(() => {
    // console.clear()
    count++;
    findBeautifulAddr()
  });
}

function sendGoogleChatWebhook(message) {
  const webhookUrl = config.webhook;
  const data = {
    'text': message
  };
  const headers = {
    'Content-Type': 'application/json; charset=UTF-8'
  };
  fetch(webhookUrl, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(data)
  })
  .then(response => {
  })
  .catch(error => {
  });
}

exports.find = ()=>{
  config.count = 1;
  findBeautifulAddr()
}