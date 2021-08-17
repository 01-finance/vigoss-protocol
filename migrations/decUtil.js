/* eslint-disable */

var BN = require('bn.js');

const unitMap = {
  '0': '1', // eslint-disable-line
  '1': '10', // eslint-disable-line
  '2': '100', // eslint-disable-line
  '3': '1000', // eslint-disable-line
  '4': '10000', // eslint-disable-line
  '5': '100000', // eslint-disable-line
  '6': '1000000', // eslint-disable-line
  '7': '10000000', // eslint-disable-line
  '8': '100000000', // eslint-disable-line
  '9': '1000000000', // eslint-disable-line
  '10': '10000000000', // eslint-disable-line
  '11': '100000000000', // eslint-disable-line
  '12': '1000000000000', // eslint-disable-line
  '13': '10000000000000', // eslint-disable-line
  '14': '100000000000000', // eslint-disable-line
  '15': '1000000000000000', // eslint-disable-line
  '16': '10000000000000000', // eslint-disable-line
  '17': '100000000000000000', // eslint-disable-line
  '18': '1000000000000000000' // eslint-disable-line
};

function mulDiv(weiInput, mulInput, divInput) {
  var wei = new BN(weiInput); 
  var mul = new BN(mulInput); 
  var div = new BN(divInput); 

  var output = wei.mul(mul).div(div);

  return new BN(output.toString(10), 10).toString();
}

  // 转化为按可视单位位数显示
function fromDec(weiInput, decimal) {
    var wei = new BN(weiInput); // eslint-disable-line
    const base = new BN(unitMap[decimal], 10);
    const baseLength = unitMap[decimal].length - 1 || 1;

    var fraction = wei.mod(base).toString(10); // eslint-disable-line

    while (fraction.length < baseLength) {
      fraction = `0${fraction}`;
    }

    fraction = fraction.match(/^([0-9]*[1-9]|0)(0*)/)[1];

    var whole = wei.div(base).toString(10); // eslint-disable-line
    var value = `${whole}${fraction == '0' ? '' : `.${fraction}`}`; // eslint-disable-line
    return value;
  }

  // 转化为按decimal 位数显示
  function toDec(etherInput, decimal) {
    var ether = String(etherInput); // eslint-disable-line
    const base = new BN(unitMap[decimal], 10);
    const baseLength = unitMap[decimal].length - 1 || 1;

    // Split it into a whole and fractional part
    var comps = ether.split('.'); // eslint-disable-line
    if (comps.length > 2) { throw new Error(`[ethjs-unit] while converting number ${etherInput} to wei,  too many decimal points`); }

    var whole = comps[0], fraction = comps[1]; // eslint-disable-line

    if (!whole) { whole = '0'; }
    if (!fraction) { fraction = '0'; }
    if (fraction.length > baseLength) { throw new Error(`[ethjs-unit] while converting number ${etherInput} to wei, too many decimal places`); }

    while (fraction.length < baseLength) {
      fraction += '0';
    }

    whole = new BN(whole);
    fraction = new BN(fraction);
    var wei = (whole.mul(base)).add(fraction); // eslint-disable-line

    return new BN(wei.toString(10), 10).toString();
  }


/**
 * @description 格式化金额
 * @param number：要格式化的数字
 * @param digits：保留几位小数 默认0位
 * @param decPoint：小数点符号 默认.
 * @param thousandsSep：千分位符号 默认为,
 */
function formatNum(number, digits = 0, decPoint = '.', thousandsSep = ',') {
  number = (number + '').replace(/[^0-9+-Ee.]/g, '')
  let n = !isFinite(+number) ? 0 : +number
  let prec = !isFinite(+digits) ? 0 : Math.abs(digits)
  let sep = (typeof thousandsSep === 'undefined') ? ',' : thousandsSep
  let dec = (typeof decPoint === 'undefined') ? '.' : decPoint
  let s = ''
  let toFixedFix = function (n, prec) {
      let k = Math.pow(10, prec)
      return '' + Math.floor(n * k) / k
  }
  s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.')
  let re = /(-?\d+)(\d{3})/
  while (re.test(s[0])) {
      s[0] = s[0].replace(re, '$1' + sep + '$2')
  }
  if ((s[1] || '').length < prec) {
      s[1] = s[1] || ''
      s[1] += new Array(prec - s[1].length + 1).join('0')
  }
  return s.join(dec)
}

// 转为友好的可视数字，模式显示 5 位小数
function toSignificant(amount, decimals, digits = 5 ) {
    let num = fromDec(amount, decimals)
    if (parseInt(decimals) > digits) {
      return formatNum(num, digits);
    } else {
      return formatNum(num, parseInt(decimals));
    }
  }

 function formatSignificant(num, decimals, digits = 5 ) {
  if (parseInt(decimals) > digits) {
    return formatNum(num, digits);
  } else {
    return formatNum(num, parseInt(decimals));
  }
}


module.exports = {
    fromDec,
    toDec
}