const nock = require('nock')
const { Toolkit } = require('actions-toolkit')

describe('create-an-issue', () => {
  let actionFn, tools, params

  beforeEach(() => {
    Toolkit.run = jest.fn(fn => { actionFn = fn })
    require('..')

    nock('https://api.github.com')
      .post(/\/repos\/.*\/.*\/issues/).reply(200, (_, body) => {
        params = JSON.parse(body)
        return {
          title: params.title,
          number: 1,
          html_url: 'www'
        }
      })

    tools = new Toolkit({
      logger: {
        info: jest.fn(),
        success: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
      }
    })

    tools.exit.success = jest.fn()
    tools.exit.failure = jest.fn()
  })

  it('creates a new issue', async () => {
    tools.log.success = jest.fn()
    await actionFn(tools)
    expect(params).toMatchSnapshot()
    expect(tools.log.success).toHaveBeenCalled()
    expect(tools.log.success.mock.calls).toMatchSnapshot()
  })

  it('creates a new issue from a different template', async () => {
    tools.arguments._ = ['.github/different-template.md']
    tools.context.payload = { repository: { owner: { login: 'JasonEtco' }, name: 'waddup' } }
    await actionFn(tools)
    expect(params).toMatchSnapshot()
    expect(tools.log.success).toHaveBeenCalled()
    expect(tools.log.success.mock.calls).toMatchSnapshot()
  })

  it('creates a new issue with some template variables', async () => {
    tools.arguments._[0] = '.github/variables.md'
    await actionFn(tools)
    expect(tools.log.success).toHaveBeenCalled()
    expect(tools.log.success.mock.calls).toMatchSnapshot()
  })

  it('creates a new issue with assignees, labels and a milestone', async () => {
    tools.arguments._[0] = '.github/kitchen-sink.md'
    await actionFn(tools)
    expect(params).toMatchSnapshot()
    expect(tools.log.success).toHaveBeenCalled()
    expect(tools.log.success.mock.calls).toMatchSnapshot()
  })

  it('creates a new issue with assignees and labels as comma-delimited strings', async () => {
    tools.arguments._[0] = '.github/split-strings.md'
    await actionFn(tools)
    expect(params).toMatchSnapshot()
    expect(tools.log.success).toHaveBeenCalled()
    expect(tools.log.success.mock.calls).toMatchSnapshot()
  })
})
