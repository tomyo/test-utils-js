export function assertTrue(expr = null) {
  if (!!expr !== true) {
    throw new Error(`Assertion error: given expression (${expr}) is falsy`);
  }
}

export function assertEqual(exprA, exprB) {
  if (exprA !== exprB) {
    throw new Error(`Assertion error:\n${exprA}\n\n!==\n\n${exprB}`);
  }
}

export function isDomElement(entity) {
  return typeof entity === 'object' && entity.nodeType !== undefined;
}

/**
* Waits until `fun` resolves into a truthy value, 
* every `checkIntervalTime` ms, `retries` times.
* @param {function} fun - a function to execute every
* @param {number} checkIntervalTime - re-check every miliseconds
* @param {number} retries - How many times to retry before failing with a timeout error
*/
export async function waitFor(fun, checkIntervalTime = 200, retries = 10) {


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


/**
 * Given an object of testNames and functions, run them while creating a summary.
 * A `test` broadcast channel is used to send the summary.
 * That is useful when testing in isolation, for example: inside iframes. 
 * @param {object} tests - {testName: testFunction(), ...} 
 */
export async function runTests(tests = {}) {
  const finishedBroadcast = new BroadcastChannel('tests');

  const summary = [];
  for (const [name, test] of Object.entries(tests)) {

    try {
      await test();
      console.info(`✔ ${name}`);
      summary.push(`✔ ${name}`);
    } catch (error) {
      console.warn(`✘ ${name}`, error);
      summary.push(`✘ ${name}`);
      throw error;
      // Throwing the error gives a nice traceback in console. 
      // But then we get stop-at-first-error behaviour.
    }
  }
  finishedBroadcast.postMessage(summary);
}
