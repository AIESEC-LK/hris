import {CallableContext} from "firebase-functions/lib/common/providers/https";

const functions = require('firebase-functions');

const logFunctionInvocation = function(context:CallableContext, data:any) {
  functions.logger.log({
    type: "FUNCTION_INVOCATION",
    function_name: process.env.FUNCTION_TARGET,
    timestamp: getSLTimestamp(),
    caller: context.auth?.token.email,
    data: data
  })
}

function getSLTimestamp(): string {
  const d = new Date();
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  const date = new Date(utc + (3600000*5.5));

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-based
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0');

  return year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second + "." + milliseconds;
}

module.exports = {
  logFunctionInvocation: logFunctionInvocation
}
