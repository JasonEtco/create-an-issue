const IssueCreator = require('.')

const issueCreator = new IssueCreator(process.argv[2])
issueCreator.go().then(issue => {
  console.log(`Created issue ${issue.data.title}#${issue.data.number}: ${issue.data.html_url}`)
})
