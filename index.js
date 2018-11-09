console.log('INDEX FILE LOADED')

const Toolkit = require('actions-toolkit')
const fm = require('front-matter')
const tools = new Toolkit()

// Get the file
const file = tools.getFile(process.argv[2] || '.github/ISSUE_TEMPLATE.md')

console.log('FILE FOUND', file)

// Get an authenticated Octokit client
const octokit = tools.createOctokit()

(async () => {
  // Grab the front matter as JSON
  const { attributes, body } = fm(file)
  console.log(attributes)

  // Create the new issue
  return octokit.issues.create(tools.context.repo({
    title: attributes.title,
    body,
    assignees: attributes.assignees || [],
    labels: attributes.labels || []
  }))
})()
