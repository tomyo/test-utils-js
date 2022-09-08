import { mockOnce } from "./mock.js";
/**
 * Capture arguments, returned result and/or throwed error
 * of given function.
 * 
 * @param {Function} fun - Function to capture input/output
 * @param {Object} config
 * @param {Object} config.scope - Scope where `fun.name` exists,
 *  defaults to `window`.
 * @returns Array of 3 functions that returns captured arguments, 
 *   result and error, respectively.
 */
export function useSpyOnce(fun, { scope = window } = {}) {
  let args, result, error;
  mockOnce(fun, {
    scope,
    beforeCallback: (...a) => args = a,
    afterCallback: (r, e) => [result, error] = [r, e],
  })

  return [() => args, () => result, () => error];
}
