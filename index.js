const Toolkit = require('actions-toolkit')
const fm = require('front-matter')

const nunjucks = require('nunjucks')
const env = nunjucks.configure({ autoescape: false })
env.addFilter('date', require('nunjucks-date-filter'))

async function go () {
  const tools = new Toolkit()
  tools.workspace = tools.workspace || __dirname

  const templateVariables = {
    ...tools.context,
    date: Date.now()
  }

  // Get the file
  const template = process.argv[2] || '.github/ISSUE_TEMPLATE.md'
  console.log('Reading from file', template)
  const file = tools.getFile(template)

  // Grab the front matter as JSON
  const { attributes, body } = fm(file)
  console.log(`Front matter for ${template} is`, attributes)

  const templated = {
    body: env.renderString(body, templateVariables),
    title: env.renderString(attributes.title, templateVariables)
  }

  console.log('Templates compiled', templated)

  console.log('Creating new issue')
  // Get an authenticated Octokit client
  const octokit = tools.createOctokit()

  // Create the new issue
  const issue = await octokit.issues.create(tools.context.repo({
    ...templated,
    assignees: attributes.assignees || [],
    labels: attributes.labels || [],
    milestone: attributes.milestone
  }))

  console.log(`Created issue ${issue.data.title}#${issue.data.number}: ${issue.data.html_url}`)
}

go()