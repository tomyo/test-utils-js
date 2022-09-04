export function assertTrue(expr = null) {
  if (!!expr !== true) {
    throw new Error(`Assertion error: given expression is falsy.`);
  }
}

export function assertEqual(exprA, exprB) {
  if (typeof (exprA) === 'object' || typeof (exprB) === 'object') {
    console.error("assertEqual: Can't compare objects:", exprA, exprB);
  }
  if (exprA !== exprB) {
    throw new Error(`assertEqual:\n${exprA}\n\n!==\n\n${exprB}`);
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
 * @typedef {Object} runTestsOptions
 * @param {function} beforeEach - function to run before each test
 * @param {function} afterEach - function oi run after each test
 * @param {string} channelName - Named of BroadcastChannel used
 * @param {boolean} abortOnFailedTest - Don't test further when a test
 * @param {number} timeout - miliseconds until test is considered to fail
 */

/**
 * @constant
 * @type {runTestsOptions}
 * @default
 */
const runTestsDefaultOptions = {
  channelName: 'tests',
  abortOnFailedTest: false,
  timeout: 3000,
}

export const testReportTypes = {
  TEST_REPORT: 'test-report',
  BATCH_REPORT: 'batch-report',
}

/**
 * Given an object  of testNames and functions, run them while creating a summary.
 * A `test` broadcast channel is used to send the summary.
 * That is useful when testing in isolation, for example: inside iframes.
 * @param {Object} tests - {testName: testFunction(), ...}
 * @param {runTestsOptions} options - Extra options, including beforeEach and afterEach functions
 */
export async function runTests(tests = {}, options = {}) {
  const {
    beforeEach, afterEach, channelName, abortOnFailedTest
  } = { ...runTestsDefaultOptions, ...options }
  const summary = [];
  const testsBroadcast = new BroadcastChannel(channelName);
  const location = JSON.parse(JSON.stringify(document.location));

  for (const [name, test] of Object.entries(tests)) {
    const testReport = { name, location }
    try {
      if (beforeEach) beforeEach();
      await test();

      console.info(`✔ ${name}`);
      testReport.status = 'passed';
    }
    catch (error) {
      console.error(`✘ ${name}`, error);
      testReport.status = 'failed';
      testReport.error = error;
      if (abortOnFailedTest) throw error;
    }
    finally {
      summary.push(testReport)
      testsBroadcast.postMessage({
        type: testReportTypes.TEST_REPORT,
        data: testReport
      });
      if (afterEach) afterEach();
    }
  }
  testsBroadcast.postMessage({
    type: testReportTypes.BATCH_REPORT,
    data: { location, summary }
  });
}
