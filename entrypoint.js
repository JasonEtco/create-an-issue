const IssueCreator = require('.')
const Toolkit = require('actions-toolkit')

const tools = new Toolkit()
const issueCreator = new IssueCreator(tools)
issueCreator.go()
  .then(issue => {
    tools.log(`Created issue ${issue.data.title}#${issue.data.number}: ${issue.data.html_url}`)
  })
