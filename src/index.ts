import core from '@actions/core'
import { Toolkit } from 'actions-toolkit'
import fm from 'front-matter'
import nunjucks from 'nunjucks'
import dateFilter from 'nunjucks-date-filter'

interface FrontMatterAttributes {
  title: string
  assignees?: string[] | string
  labels?: string[] | string
  milestone?: string | number
}

function setOutputs (tools: Toolkit, issue) {
  tools.outputs.number = String(issue.data.number)
  tools.outputs.url = issue.data.html_url
}

function listToArray (list?: string[] | string) {
  if (!list) return []
  return Array.isArray(list) ? list : list.split(', ')
}

Toolkit.run(async tools => {
  const template = tools.inputs.filename || '.github/ISSUE_TEMPLATE.md'
  const assignees = tools.inputs.assignees
  const updateExisting = Boolean(tools.inputs.update_existing)
  const env = nunjucks.configure({ autoescape: false })
  env.addFilter('date', dateFilter)

  const templateVariables = {
    ...tools.context,
    env: process.env,
    date: Date.now()
  }

  // Get the file
  tools.log.debug('Reading from file', template)
  const file = await tools.readFile(template) as string

  // Grab the front matter as JSON
  const { attributes, body } = fm<FrontMatterAttributes>(file)
  tools.log(`Front matter for ${template} is`, attributes)

  const templated = {
    body: env.renderString(body, templateVariables),
    title: env.renderString(attributes.title, templateVariables)
  }
  tools.log.debug('Templates compiled', templated)

  if (updateExisting) {
    let existingIssue
    tools.log.info(`Fetching issues with title "${templated.title}"`)
    try {
      const existingIssues = await tools.github.search.issuesAndPullRequests({
        q: `is:open is:issue repo:${process.env.GITHUB_REPOSITORY} in:title ${templated.title}`
      })
      existingIssue = existingIssues.data.items.find(issue => issue.title === templated.title)
    } catch (err) {
      tools.exit.failure(err)
    }
    if (existingIssue) {
      try {
        const issue = await tools.github.issues.update({
          ...tools.context.repo,
          issue_number: existingIssue.number,
          body: templated.body
        })
        setOutputs(tools, issue)
        tools.exit.success(`Updated issue ${issue.data.title}#${issue.data.number}: ${issue.data.html_url}`)
      } catch (err) {
        tools.exit.failure(err)
      }
    }
    tools.log.info('No existing issue found to update')
  }

  // Create the new issue
  tools.log.info(`Creating new issue ${templated.title}`)
  try {
    const issue = await tools.github.issues.create({
      ...tools.context.repo,
      ...templated,
      assignees: assignees ? listToArray(assignees) : listToArray(attributes.assignees),
      labels: listToArray(attributes.labels),
      milestone: Number(tools.inputs.milestone || attributes.milestone)
    })

    setOutputs(tools, issue)
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
