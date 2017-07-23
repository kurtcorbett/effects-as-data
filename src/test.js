const assert = require('assert')
const curry = require('lodash/curry')

const testRunner = (fn, expected, index = 0, previousOutput = null) => {
  checkForExpectedTypeMismatches(expected)

  assert(fn, 'The function you are trying to test is undefined.')

  const step = expected[index]

  if (step === undefined) {
    throw new Error(
      'Your spec does not have as many steps as your function.  Are you missing a return line?'
    )
  }

  const [input, expectedOutput] = step
  let g
  if (fn.next) {
    g = fn
  } else {
    g = fn(input)
  }

  let output
  if (isError(input)) {
    try {
      output = g.throw(input)
    } catch (e) {
      output = { value: e, done: true }
    }
  } else {
    output = g.next(input)
  }

  try {
    deepEqual(output.value, expectedOutput)
  } catch (e) {
    e.name = `Error on Step ${index + 1}`
    throw e
  }

  if (!output.done || index + 1 < expected.length) {
    testRunner(g, expected, index + 1, output.value)
  }
}

function isError(e) {
  if (!e) return false
  return e instanceof Error
}

const checkForExpectedTypeMismatches = expected => {
  if (!Array.isArray(expected)) {
    throw new Error(
      `Your spec must return an array of tuples.  It is currently returning a value of type "${typeof expected}".`
    )
  }
  for (let i = 0; i < expected.length; i++) {
    if (i + 1 >= expected.length) return
    let output = expected[i][1]
    let nextInput = expected[i + 1][0]

    if (Array.isArray(output)) {
      assert(
        Array.isArray(nextInput),
        'If an array of actions is yielded, it should return an array of results.'
      )
    }
  }
}

const testFn = (fn, spec) => {
  return function() {
    let expectedLog = spec()
    testRunner(fn, expectedLog)
  }
}

function deepEqual(actual, expected) {
  //  a little bit of jest support
  if (typeof expect !== 'undefined' && expect.extend && expect.anything) {
    expect(actual).toEqual(expected)
  } else {
    assert.deepEqual(actual, expected)
  }
}

module.exports = {
  testRunner,
  testFn: curry(testFn, 2)
}
