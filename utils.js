export function assertTrue(expr = null, debugInfo) {
  if (!!expr !== true) {
    if (debugInfo) console.debug('AssertTrue:', debugInfo);
    throw new Error(`AssertTrue: given expression is falsy.`);
  }
}

export function assertEqual(exprA, exprB, debugInfo) {
  if (typeof (exprA) === 'object' || typeof (exprB) === 'object') {
    console.error("assertEqual: Can't compare objects:", exprA, exprB);
  }
  if (exprA !== exprB) {
    if (debugInfo) console.debug('assertEqual:', debugInfo);
    throw new Error(`assertEqual:\n${exprA}\n\n!==\n\n${exprB}`);
  }
}

export function isDomElement(entity) {
  return typeof entity === 'object' && entity.nodeType !== undefined;
}



export async function waitFor(funOrMs, config) {
  return {
    'number': () => waitForMs(funOrMs, config),
    'function': () => waitForFun(funOrMs, config),
  }[typeof (funOrMs)]();
}

/**
* Waits until `fun` resolves into a truthy value,
* every `checkIntervalTime` ms, `retries` times.
* @param {Function} fun - a function to execute every
* @param {Object} config
* @param {Number} config.checkIntervalTime - re-check every miliseconds
* @param {Number} config.retries - How many times to retry before failing with a timeout error
*/
export async function waitForFun(fun, { checkIntervalTime = 200, retries = 10 }) {
  if (typeof fun !== 'function') {
    throw new Error('waitFor only accepts a function as argument')
  }

  return new Promise((resolve, _) => {
    if (!!fun()) {
      return resolve(fun());
    }

    function check() {
      if (!!fun()) {
        clearInterval(intervalId);
        clearTimeout(timeoutId);
        return resolve(fun());
      }
    }

    const intervalId = setInterval(check, checkIntervalTime);

    const timeoutId = setTimeout(() => {
      clearInterval(intervalId);
      throw new Error(`timeout on waitFor(${fun})`);
    }, checkIntervalTime * retries + Math.ceil(checkIntervalTime * 0.1));
  });
}


export async function waitForMs(miliseconds) {
  return new Promise((resolve, _) => {
    setTimeout(resolve(), miliseconds);
  })
}