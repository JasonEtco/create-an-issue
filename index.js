const { Toolkit } = require('actions-toolkit')
const fm = require('front-matter')
const nunjucks = require('nunjucks')
const dateFilter = require('nunjucks-date-filter')

function listToArray (list) {
  if (!list) return []
  return Array.isArray(list) ? list : list.split(', ')
}

Toolkit.run(async tools => {
  const template = tools.arguments._[0] || '.github/ISSUE_TEMPLATE.md'
  const env = nunjucks.configure({ autoescape: false })
  env.addFilter('date', dateFilter)

  const templateVariables = {
    ...tools.context,
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
    title: env.renderString(attributes.title, templateVariables)
  }

  tools.log.debug('Templates compiled', templated)
  tools.log.info(`Creating new issue ${templated.title}`)

  // Create the new issue
  try {
    const issue = await tools.github.issues.create({
      ...tools.context.repo,
      ...templated,
      assignees: listToArray(attributes.assignees),
      labels: listToArray(attributes.labels),
      milestone: attributes.milestone
    })

    tools.log.success(`Created issue ${issue.data.title}#${issue.data.number}: ${issue.data.html_url}`)
  } catch (err) {
    tools.log.error(`An error occurred while creating the issue. This might be caused by a malformed issue title, or a typo in the labels or assignees. Check ${template}!`, err)
    tools.exit.failure()
  }
}, {
  secrets: ['GITHUB_TOKEN']
})
