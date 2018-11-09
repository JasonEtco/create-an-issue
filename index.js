const Toolkit = require('actions-toolkit')
const yaml = require('js-yaml')
const tools = new Toolkit()

const FRONT_MATTER_REG = /^-{3}\n([\s\S]+)\n-{3}\n([\s\S]+)/

// Get the file
const file = tools.getFile(process.argv[2] || '.github/ISSUE_TEMPLATE.md')
// Get an authenticated Octokit client
const octokit = tools.createOctokit()

(async () => {
  // Parse out the front matter
  const match = FRONT_MATTER_REG.exec(file)
  if (!match) return

  // Grab the front matter as JSON
  const json = yaml.safeLoad(match[1])
  // Create the new issue
  return octokit.issues.create(tools.context.repo({
    title: json.title,
    body: match[2]
  }))
})()
