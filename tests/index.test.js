const nock = require('nock')
const core = require('@actions/core')
const { Toolkit } = require('actions-toolkit')

describe('create-an-issue', () => {
  let actionFn, tools, params

  beforeEach(() => {
    Toolkit.run = jest.fn(fn => { actionFn = fn })
    require('..')

    nock('https://api.github.com')
      .post(/\/repos\/.*\/.*\/issues/).reply(200, (_, body) => {
        params = body
        return {
          title: body.title,
          number: 1,
          html_url: 'www'
        }
      })

    tools = new Toolkit({
      logger: {
        info: jest.fn(),
        success: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        error: jest.fn()
      }
    })

    // Turn core.setOutput into a mocked noop
    jest.spyOn(core, 'setOutput')
      .mockImplementation(() => {})

    // Turn core.setFailed into a mocked noop
    jest.spyOn(core, 'setFailed')
      .mockImplementation(() => {})

    tools.exit.success = jest.fn()
    tools.exit.failure = jest.fn()

    // Ensure that the filename input isn't set at the start of a test
    delete process.env.INPUT_FILENAME

    // Simulate an environment variable added for the action
    process.env.EXAMPLE = 'foo'
  })

  it('creates a new issue', async () => {
    tools.log.success = jest.fn()
    await actionFn(tools)
    expect(params).toMatchSnapshot()
    expect(tools.log.success).toHaveBeenCalled()
    expect(tools.log.success.mock.calls).toMatchSnapshot()

    // Verify that the outputs were set
    expect(core.setOutput).toHaveBeenCalledTimes(2)
    expect(core.setOutput).toHaveBeenCalledWith('url', 'www')
    expect(core.setOutput).toHaveBeenCalledWith('number', '1')
  })

  it('creates a new issue from a different template', async () => {
    process.env.INPUT_FILENAME = '.github/different-template.md'
    tools.context.payload = { repository: { owner: { login: 'JasonEtco' }, name: 'waddup' } }
    await actionFn(tools)
    expect(params).toMatchSnapshot()
    expect(tools.log.success).toHaveBeenCalled()
    expect(tools.log.success.mock.calls).toMatchSnapshot()
  })

  it('creates a new issue with some template variables', async () => {
    process.env.INPUT_FILENAME = '.github/variables.md'
    await actionFn(tools)
    expect(params).toMatchSnapshot()
    expect(tools.log.success).toHaveBeenCalled()
    expect(tools.log.success.mock.calls).toMatchSnapshot()
  })

  it('creates a new issue with assignees, labels and a milestone', async () => {
    process.env.INPUT_FILENAME = '.github/kitchen-sink.md'
    await actionFn(tools)
    expect(params).toMatchSnapshot()
    expect(tools.log.success).toHaveBeenCalled()
    expect(tools.log.success.mock.calls).toMatchSnapshot()
  })

  it('creates a new issue with assignees and labels as comma-delimited strings', async () => {
    process.env.INPUT_FILENAME = '.github/split-strings.md'
    await actionFn(tools)
    expect(params).toMatchSnapshot()
    expect(tools.log.success).toHaveBeenCalled()
    expect(tools.log.success.mock.calls).toMatchSnapshot()
  })

  it('creates a new issue with an assignee passed by input', async () => {
    process.env.INPUT_ASSIGNEES = 'octocat'
    await actionFn(tools)
    expect(params).toMatchSnapshot()
    expect(tools.log.success).toHaveBeenCalled()
    expect(tools.log.success.mock.calls).toMatchSnapshot()
  })

  it('creates a new issue with multiple assignees passed by input', async () => {
    process.env.INPUT_ASSIGNEES = 'octocat, JasonEtco'
    await actionFn(tools)
    expect(params).toMatchSnapshot()
    expect(tools.log.success).toHaveBeenCalled()
    expect(tools.log.success.mock.calls).toMatchSnapshot()
  })

  it('creates a new issue with a milestone passed by input', async () => {
    process.env.INPUT_MILESTONE = '1'
    await actionFn(tools)
    expect(params).toMatchSnapshot()
    expect(params.milestone).toBe('1')
    expect(tools.log.success).toHaveBeenCalled()
  })

  it('logs a helpful error if creating an issue throws an error', async () => {
    nock.cleanAll()
    nock('https://api.github.com')
      .post(/\/repos\/.*\/.*\/issues/).reply(500, {
        message: 'Validation error'
      })

    await actionFn(tools)
    expect(tools.log.error).toHaveBeenCalled()
    expect(tools.log.error.mock.calls).toMatchSnapshot()
    expect(tools.exit.failure).toHaveBeenCalled()
  })

  it('logs a helpful error if creating an issue throws an error with more errors', async () => {
    nock.cleanAll()
    nock('https://api.github.com')
      .post(/\/repos\/.*\/.*\/issues/).reply(500, {
        message: 'Validation error',
        errors: [{ foo: true }]
      })

    await actionFn(tools)
    expect(tools.log.error).toHaveBeenCalled()
    expect(tools.log.error.mock.calls).toMatchSnapshot()
    expect(tools.exit.failure).toHaveBeenCalled()
  })
})
