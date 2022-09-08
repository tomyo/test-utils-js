/**
 * Mock given function once.
 * If `beforeCallback` or `afterCallback` return a truthy value,
 * an early return with that value happens.
 *
 * @param {Function} fun - Function to mock
 * @param {Object} config
 * @param {Object} config.scope - By default is `window`
 * @param {Function} config.beforeCallback
 * @param {Function} config.afterCallback
 */
export function mockOnce(fun, { scope = window, beforeCallback = () => { }, afterCallback = () => { } }) {

  function restoreScope() {
    scope[fun.name] = fun;
  }

  async function mocked(...args) {
    let earlyReturnValue, result, error;
    if (earlyReturnValue = await beforeCallback(...args)) {
      restoreScope();
      return earlyReturnValue;
    }

    try {
      result = await fun(...args);
    }
    catch (error) {
      error = error;
    }
    finally {
      restoreScope();
      if (earlyReturnValue = await afterCallback(result, error)) {
        return earlyReturnValue;
      }

      if (error) throw error;
      return result;
    }
  }

  scope[fun.name] = (...args) => mocked(...args);
}
