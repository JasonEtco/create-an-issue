console.log('INDEX FILE LOADED')

const Toolkit = require('actions-toolkit')
const fm = require('front-matter')

(async () => {
  const tools = new Toolkit()

  // Get an authenticated Octokit client
  const octokit = tools.createOctokit()

  // Get the file
  const file = tools.getFile(process.argv[2] || '.github/ISSUE_TEMPLATE.md')
  console.log('FILE FOUND', file)


  // Grab the front matter as JSON
  const { attributes, body } = fm(file)
  console.log(attributes)

  // Create the new issue
  return octokit.issues.create(tools.context.repo({
    body,
    title: attributes.title,
    assignees: attributes.assignees || [],
    labels: attributes.labels || [],
    milestone: attributes.milestone
  }))
})()
