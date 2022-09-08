const testReportTypes = {
  TEST_REPORT: 'test-report',
  BATCH_REPORT: 'batch-report',
}

/**
 * Given an object of test names as keys and and functions as values, 
 * run them while creating a summary.
 * A broadcastChannel is used to send reports about each test
 *  * A test finishes: {type: TEST_REPORT, data: testReport}
 *  * All tests finished: {type: BATCH_REPORT, data: summaryWithAllTestReports}
 * 
 * @param {Object} tests - {testName: testFunction(), ...}
 * @param {Config} config - See `Config`
 * 
 * @typedef {Object} Config
 * @param {Function} beforeEach - Function to run before each test
 * @param {Function} afterEach - Function to run after each test
 * @param {String} channelName - Name used for BroadcastChannel
 * @param {Boolean} abortOnFailedTest - If true, stops on first failing test
 * @param {Number} timeout - miliseconds until a timeout error is reported for a test
 */
export async function runTests(tests = {}, {
  beforeEach = () => { }, afterEach = () => { },
  channelName = "tests", abortOnFailedTest = false, timeout = 3000,
} = {}) {
  const summary = [];
  const testsBroadcast = new BroadcastChannel(channelName);
  const location = JSON.parse(JSON.stringify(document.location));

  for (const [name, test] of Object.entries(tests)) {
    const testReport = { name, location };
    try {
      beforeEach();
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
        data: testReport,
      });
      afterEach();
    }
  }
  testsBroadcast.postMessage({
    type: testReportTypes.BATCH_REPORT,
    data: { location, summary },
  });
  testsBroadcast.close();
}


export function useIFrameAsTestRunner(iframe, testFiles,
  { channelName = 'tests', testTimeOut = 4000 } = {}) {
  const testsBroadcast = new BroadcastChannel(channelName);
  let fileIndex = 0, timeoutID;
  let testDoneCallback = () => null;
  let batchDoneCallback = () => null;

  function runNextTestBatch() {
    const title = `Testing ${testFiles[fileIndex]} ...`;
    iframe.title = title;
    iframe.contentWindow.location.replace(testFiles[fileIndex]); // keep history clean
    iframe.contentWindow.console = window.console; // Run iframe console.*() calls into main window
    timeoutID = setupTimeOutError();
  }

  function setupTimeOutError() {
    iframe.style.backgroundColor = "inherited";
    return setTimeout(() => {
      iframe.style.backgroundColor = 'lightcoral';
      throw new Error(`Timeout running tests: ${testFiles[fileIndex]}`);
    }, testTimeOut);
  }


  testsBroadcast.onmessage = (event) => {
    // Tests finished running for `testFiles[fileIndex]`
    clearTimeout(timeoutID);
    const { type, data } = event.data;

    if (type == testReportTypes.BATCH_REPORT) {
      batchDoneCallback(data);
      fileIndex += 1;
      if (fileIndex < testFiles.length) {
        runNextTestBatch();
        return;
      } else {
        console.info('[Done] All tests finished succesfully!');
        return;
      }
    }
    if (type == testReportTypes.TEST_REPORT) {
      testDoneCallback(data);
      return;
    }

    throw Error('Invalid event.data.type (not in testReportTypes):', type);
  }

  function runTestBatches(testCallback, batchCallback) {
    if (testCallback) testDoneCallback = testCallback;
    if (batchCallback) batchDoneCallback = batchCallback;

    console.info("Starting tests ...");
    runNextTestBatch();
  }

  return runTestBatches;
}