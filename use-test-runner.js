import { testReportTypes, waitFor } from "./test-utils.js";

const defaultOptions = {
  channelName: 'tests',
  testTimeOut: 4000,
}

export function useIFrameAsTestRunner(iframe, batchPaths, options = {}) {
  const { channelName, testTimeOut } = { ...defaultOptions, ...options };
  const testsBroadcast = new BroadcastChannel(channelName);
  let batchIndex = 0, timeoutID;
  let testDoneCallback = () => null;
  let batchDoneCallback = () => null;

  function runNextTestBatch() {
    const title = `Testing ${batchPaths[batchIndex]} ...`;
    iframe.title = title;
    iframe.contentWindow.location.replace(batchPaths[batchIndex]); // keep history clean
    iframe.contentWindow.console = window.console; // Run iframe console.*() calls into main window
    timeoutID = setupTimeOutError();
  }

  function setupTimeOutError() {
    iframe.style.backgroundColor = "inherited";
    return setTimeout(() => {
      iframe.style.backgroundColor = 'lightcoral';
      throw new Error(`Timeout running tests: ${batchPaths[batchIndex]}`);
    }, testTimeOut);
  }


  testsBroadcast.onmessage = (event) => {
    // Tests finished running for `batchPaths[batchIndex]`
    clearTimeout(timeoutID);
    const { type, data } = event.data;

    if (type == testReportTypes.BATCH_REPORT) {
      batchDoneCallback(data);
      batchIndex += 1;
      if (batchIndex < batchPaths.length) {
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

  return runTestBatches
}