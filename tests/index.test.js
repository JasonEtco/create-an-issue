const path = require('path')
const IssueCreator = require('..')
const Toolkit = require('actions-toolkit')

describe('create-an-issue', () => {
  let issueCreator, tools, github

  beforeEach(() => {
    tools = new Toolkit()
    issueCreator = new IssueCreator(tools)
    github = { issues: { create: jest.fn() } }

    issueCreator.tools.workspace = path.join(__dirname, 'fixtures')
    issueCreator.tools.context.payload = { repository: { owner: { login: 'JasonEtco' }, name: 'waddup' } }
    issueCreator.tools.github = github
  })

  it('creates a new issue', async () => {
    await issueCreator.go()
    expect(github.issues.create).toHaveBeenCalled()
    expect(github.issues.create.mock.calls).toMatchSnapshot()
  })

  it('creates a new issue from a different template', async () => {
    tools.arguments._ = ['.github/different-template.md']
    issueCreator = new IssueCreator(tools)
    issueCreator.tools.workspace = path.join(__dirname, 'fixtures')
    issueCreator.tools.context.payload = { repository: { owner: { login: 'JasonEtco' }, name: 'waddup' } }
    issueCreator.tools.github = github

    await issueCreator.go()
    expect(github.issues.create).toHaveBeenCalled()
    expect(github.issues.create.mock.calls[0][0].title).toBe('Different file')
  })

  it('creates a new issue with some template variables', async () => {
    issueCreator.template = '.github/variables.md'
    await issueCreator.go()
    expect(github.issues.create).toHaveBeenCalled()
    expect(github.issues.create.mock.calls).toMatchSnapshot()
  })

  it('creates a new issue with assignees, labels and a milestone', async () => {
    issueCreator.template = '.github/kitchen-sink.md'
    await issueCreator.go()
    expect(github.issues.create).toHaveBeenCalled()
    expect(github.issues.create.mock.calls).toMatchSnapshot()
  })
})
