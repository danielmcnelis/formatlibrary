import { compareDecks } from './deck.js'

// describe() defines a suite of tests
//
describe('compareDecks', () => {
  // it() defines a test in the suite
  //
  it('should compare 2 identical arrays and output a score of 1.0', () => {
    // expect() defines an expectation
    //
    // toBe() is one of many matchers provided by expect
    expect(compareDecks(['1', '2'], ['1', '2'])).toBe(1.0)
  })

  it('should compare 2 scrambled arrays with the same numbers and output a score of 1.0', () => {
    expect(compareDecks(['2', '3', '1'], ['3', '1', '2'])).toBe(1.0)
  })

  it('should compare 2 arrays with no numbers in common and output a score of 0.0', () => {
    expect(compareDecks(['1', '2', '3'], ['4', '5', '6'])).toBe(0.0)
  })

//   it('should sum three numbers', () => {
//     expect(sum(1, 2, 3)).toBe(6)
//   })

//   it('should sum numbers and strings', () => {
//     // cast to pass none number, this should fail
//     expect(sum(1, '2' as unknown as number, 3)).toBe(6)
//   })

//   // skip() marks test to be skipped
//   it.skip('should skip this test (for now)', () => {
//     expect(sum(1, 2, 3, 5)).toBe(11)
//   })

//   it('should sum positive/negative numbers', () => {
//     expect(sum(1, 2, -4, 3)).toBe(2)
//   })
})

/* output from runner:

 FAIL   testing  src/sum.test.ts
  sum
    ✓ should sum two numbers (1 ms)
    ✓ should sum three numbers (1 ms)
    ✕ should sum numbers and strings
    ✓ should sum positive/negative numbers
    ○ skipped should skip this test (for now)

  ● sum › should sum numbers and strings

    expect(received).toBe(expected) // Object.is equality

    Expected: 6
    Received: "321"

      19 |   it('should sum numbers and strings', () => {
      20 |     // cast to pass none number, this should fail
    > 21 |     expect(sum(1, '2' as unknown as number, 3)).toBe(6);
         |                                                 ^
      22 |   });
      23 |
      24 |   // skip() marks test to be skipped

      at Object.<anonymous> (src/sum.test.ts:21:49)

Test Suites: 1 failed, 1 total
Tests:       1 failed, 1 skipped, 3 passed, 5 total
Snapshots:   0 total
Time:        0.3 s, estimated 1 s
Ran all test suites.

*/
