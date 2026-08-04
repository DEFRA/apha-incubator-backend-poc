import type { Request, ResponseToolkit } from '@hapi/hapi'
import { failAction } from '#/common/helpers/fail-action.js'

describe('#fail-action', () => {
  test('Should throw expected error', () => {
    const mockRequest = {} as Request
    const mockToolkit = {} as ResponseToolkit
    const mockError = Error('Something terrible has happened!')

    expect(() => failAction(mockRequest, mockToolkit, mockError)).toThrow(
      'Something terrible has happened!'
    )
  })
})
