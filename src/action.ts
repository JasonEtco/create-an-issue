import * as core from '@actions/core'
import { Toolkit } from 'actions-toolkit'
import fm from 'front-matter'
import nunjucks from 'nunjucks'
// @ts-ignore
import dateFilter from 'nunjucks-date-filter'
import { FrontMatterAttributes, listToArray, setOutputs } from './helpers'

function logError(tools: Toolkit, template: string, action: 'creating' | 'updating', err: any) {
  // Log the error message
  const errorMessage = `An error occurred while ${action} the issue. This might be caused by a malformed issue title, or a typo in the labels or assignees. Check ${template}!`
  tools.log.error(errorMessage)
  tools.log.error(err)

  // The error might have more details
  if (err.errors) tools.log.error(err.errors)

  // Exit with a failing status
  core.setFailed(errorMessage + '\n\n' + err.message)
  return tools.exit.failure()
}

export async function createAnIssue (tools: Toolkit) {
  const template = tools.inputs.filename || '.github/ISSUE_TEMPLATE.md'
  const assignees = tools.inputs.assignees

  let updateExisting: Boolean | null = null
  if (tools.inputs.update_existing) {
    if (tools.inputs.update_existing === 'true') {
      updateExisting = true
    } else if (tools.inputs.update_existing === 'false') {
      updateExisting = false
    } else {
      tools.exit.failure(`Invalid value update_existing=${tools.inputs.update_existing}, must be one of true or false`)
    }
  }

  const env = nunjucks.configure({ autoescape: false })
  env.addFilter('date', dateFilter)

  const templateVariables = {
    ...tools.context,
    repo: tools.context.repo,
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

  if (updateExisting !== null) {
    tools.log.info(`Fetching issues with title "${templated.title}"`)

    let query = `is:issue repo:${process.env.GITHUB_REPOSITORY} in:title '${templated.title}'`

    const searchExistingType = tools.inputs.search_existing || 'open'
    const allowedStates = ['open', 'closed']
    if (allowedStates.includes(searchExistingType)) {
      query += ` is:${searchExistingType}`
    }

    const existingIssues = await tools.github.search.issuesAndPullRequests({ q: query })
    const existingIssue = existingIssues.data.items.find(issue => issue.title === templated.title)
    if (existingIssue) {
      if (updateExisting === false) {
        tools.exit.success(`Existing issue ${existingIssue.title}#${existingIssue.number}: ${existingIssue.html_url} found but not updated`)
      } else {
        try {
          tools.log.info(`Updating existing issue ${existingIssue.title}#${existingIssue.number}: ${existingIssue.html_url}`)
          const issue = await tools.github.issues.update({
            ...tools.context.repo,
            issue_number: existingIssue.number,
            body: templated.body
          })
          setOutputs(tools, issue)
          tools.exit.success(`Updated issue ${existingIssue.title}#${existingIssue.number}: ${existingIssue.html_url}`)
        } catch (err: any) {
          return logError(tools, template, 'updating', err)
        }
      }
    } else {
      tools.log.info('No existing issue found to update')
    }
  }

  // Create the new issue
  tools.log.info(`Creating new issue ${templated.title}`)
  try {
    const issue = await tools.github.issues.create({
      ...tools.context.repo,
      ...templated,
      assignees: assignees ? listToArray(assignees) : listToArray(attributes.assignees),
      labels: listToArray(attributes.labels),
      milestone: Number(tools.inputs.milestone || attributes.milestone) || undefined
    })

    setOutputs(tools, issue)
    tools.log.success(`Created issue ${issue.data.title}#${issue.data.number}: ${issue.data.html_url}`)
  } catch (err: any) {
    return logError(tools, template, 'creating', err)
  }
}
