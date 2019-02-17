const { Toolkit } = require('actions-toolkit')
const IssueCreator = require('.')

const tools = new Toolkit()
const issueCreator = new IssueCreator(tools)
issueCreator.go()
  .then(issue => {
    tools.log.success(`Created issue ${issue.data.title}#${issue.data.number}: ${issue.data.html_url}`)
  })
