const Toolkit = require('actions-toolkit')
const fm = require('front-matter')
const nunjucks = require('nunjucks')
const dateFilter = require('nunjucks-date-filter')

class IssueCreator {
  constructor (template) {
    this.template = template || '.github/ISSUE_TEMPLATE.md'
    this.tools = new Toolkit()
    this.templateVariables = {
      ...this.tools.context,
      date: Date.now()
    }

    this.env = nunjucks.configure({ autoescape: false })
    this.env.addFilter('date', dateFilter)
  }

  async go () {
    // Get the file
    console.log('Reading from file', this.template)
    const file = this.tools.getFile(this.template)

    // Grab the front matter as JSON
    const { attributes, body } = fm(file)
    console.log(`Front matter for ${this.template} is`, attributes)

    const templated = {
      body: this.env.renderString(body, this.templateVariables),
      title: this.env.renderString(attributes.title, this.templateVariables)
    }

    console.log('Templates compiled', templated)

    console.log('Creating new issue')
    // Get an authenticated Octokit client
    const octokit = this.tools.createOctokit()

    // Create the new issue
    return octokit.issues.create(this.tools.context.repo({
      ...templated,
      assignees: attributes.assignees || [],
      labels: attributes.labels || [],
      milestone: attributes.milestone
    }))
  }
}

module.exports = IssueCreator
