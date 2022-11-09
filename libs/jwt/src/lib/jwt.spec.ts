import { jwt } from './JWT'

describe('jwt', () => {
  it('should work', () => {
    expect(jwt()).toEqual('jwt')
  })
})
