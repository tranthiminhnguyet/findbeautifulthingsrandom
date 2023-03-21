const ethers = require('ethers');
const EthereumJS = require('ethereumjs-util');
const axios = require(`axios`)

const provider = new ethers.JsonRpcProvider("https://rpc.ankr.com/eth");

const config = {
  webhook: "https://chat.googleapis.com/v1/spaces/AAAANzIFHu0/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=YBBsr3lTjAYH5oOz9fx3_3rHa7fsN5q5euTBrTxK7Gk%3D",
  isFindBalance: false,
  isFindBeautiful: true,  
  count: 1,
  sleep: 2000,
  countLoop: 100,
  checkNearNumber: false,
  countCharSameOK: 20,
  checkSameNumber: false,  
  countNumberOK: 25,
  checkRegexRepeat: true,
  countRegexRepeat: 20,
  usingAxios: true,
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

function checkRepeatedChar(str, repeatCount) {
  const regex = new RegExp(`(.)\\1{${repeatCount - 1},}`);
  let _rs = regex.test(str)
  if(_rs){
    const matches = str.match(regex);
    let maxRepeatCount = 0;
    if (matches) {
      matches.forEach((match) => {
        maxRepeatCount = Math.max(maxRepeatCount, match.length);
      });
      return maxRepeatCount;
    }
  }
  return false;
}

async function findBeautifulString(pri,addr=""){   
  inputString = addr.replace("0x","")
  let _char = null
  let _countOK = config.countCharSameOK
  let _isOK = false
  let _msgOK = "beauti"
  if(config.checkRegexRepeat){
    let _rs = checkRepeatedChar(inputString,config.countRegexRepeat)
    if(_rs!=false){
      _isOK = true;
      _msgOK = `repeat:${_rs}`
    }
  }
  if(_isOK===false && (config.checkNearNumber || config.checkSameNumber)){
    let tempArr =[];
    for (let i = 0; i < inputString.length; ++i){
      let _currentChar = inputString.charCodeAt(i);
      if(_char==null){
        _char = _currentChar;
        tempArr.push(_currentChar)
        continue;
      }
      else if(config.checkSameNumber && _char<=57 && _currentChar<=57){
        _char = _currentChar;
        _countOK = config.countNumberOK
        tempArr.push(_currentChar)
      }
      else if(config.checkNearNumber && _currentChar-_char<=1 && _currentChar-_char>=-1){
        _char = _currentChar;
        _countOK = config.countCharSameOK
        tempArr.push(_currentChar)
      }
      else{
        break
      }
    }
    if(tempArr.length>_countOK){
      _isOK = true
      _msgOK = `beauti:${tempArr.length}`
    }
  }  
  
  if(_isOK){
    console.log(`${_msgOK}|${pri}|${addr}`)
    sendGoogleChatWebhook(`${_msgOK}|${pri}|${addr}`)
    return true
  }
  return false
}

async function findBeautifulAddr({loop}={}){  
  console.log("Count:",config.count)
  for(let i=0;i<config.countLoop;i++){
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
  sleep(config.sleep).then(() => {
    // console.clear()
    config.count++;
    findBeautifulAddr()
  });
}

function sendGoogleChatWebhook(message) {
  const webhookUrl = config.webhook;  
  if(config.usingAxios){
    axios.post(webhookUrl, {
      text: message,
    })
    .then((res) => {
      // console.log(res)
    })
    .catch((err) => {
      // console.error(err.toJSON())
    })
  }
  else{
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
}

exports.find = ({isFindBalance,isFindBeautiful,webhook,...more}={})=>{
  config.count = 1;
  if(isFindBalance!=null){
    config.isFindBalance = isFindBalance
  }
  if(isFindBeautiful!=null){
    config.isFindBeautiful = isFindBeautiful
  }
  if(webhook!=null){
    config.webhook = webhook
  }
  if(more && Object.keys(more).length>0){
    for(let k of Object.keys(more)){
      config[k] = more[k]
    }
  }
  findBeautifulAddr()
}

sendGoogleChatWebhook("123")