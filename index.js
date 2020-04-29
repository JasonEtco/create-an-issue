const core = require('@actions/core')
const { Toolkit } = require('actions-toolkit')
const fm = require('front-matter')
const nunjucks = require('nunjucks')
const dateFilter = require('nunjucks-date-filter')

function listToArray (list) {
  if (!list) return []
  return Array.isArray(list) ? list : list.split(', ')
}

Toolkit.run(async tools => {
  const template = tools.inputs.filename || '.github/ISSUE_TEMPLATE.md'
  const assignees = tools.inputs.assignees
  const env = nunjucks.configure({ autoescape: false })
  env.addFilter('date', dateFilter)

  const templateVariables = {
    ...tools.context,
    env: process.env,
    date: Date.now()
  }

  // Get the file
  tools.log.debug('Reading from file', template)
  const file = tools.getFile(template)

  // Grab the front matter as JSON
  const { attributes, body } = fm(file)
  tools.log(`Front matter for ${template} is`, attributes)

  const templated = {
    body: env.renderString(body, templateVariables),
    title: env.renderString(attributes.title, templateVariables),
    assignees: env.renderString(attributes.assignees, templateVariables)
  }

  tools.log.debug('Templates compiled', templated)
  tools.log.info(`Creating new issue ${templated.title}`)

  // Create the new issue
  try {
    const issue = await tools.github.issues.create({
      ...tools.context.repo,
      ...templated,
      assignees: assignees ? listToArray(assignees) : listToArray(templated.assignees),
      labels: listToArray(attributes.labels),
      milestone: tools.inputs.milestone || attributes.milestone
    })

    core.setOutput('number', String(issue.data.number))
    core.setOutput('url', issue.data.html_url)
    tools.log.success(`Created issue ${issue.data.title}#${issue.data.number}: ${issue.data.html_url}`)
  } catch (err) {
    // Log the error message
    const errorMessage = `An error occurred while creating the issue. This might be caused by a malformed issue title, or a typo in the labels or assignees. Check ${template}!`
    tools.log.error(errorMessage)
    tools.log.error(err)

    // The error might have more details
    if (err.errors) tools.log.error(err.errors)

    // Exit with a failing status
    core.setFailed(errorMessage + '\n\n' + err.message)
    tools.exit.failure()
  }
}, {
  secrets: ['GITHUB_TOKEN']
})
