<h3 align="center">Create an Issue Action</h3>
<p align="center">A GitHub Action that creates a new issue using a template file.<p>
<p align="center"><a href="https://action-badges.now.sh"><img src="https://action-badges.now.sh/JasonEtco/create-an-issue" alt="Build Status" /></a> <a href="https://codecov.io/gh/JasonEtco/create-an-issue/"><img src="https://badgen.now.sh/codecov/c/github/JasonEtco/create-an-issue" alt="Codecov"></a></p>

## Usage

This GitHub Action creates a new issue based on an issue template file. Here's an example workflow that creates a new issue any time you push a commit:

```workflow
workflow "Create an issue on push" {
  on = "push"
  resolves = ["Create issue"]
}

action "Create issue" {
  uses = "JasonEtco/create-an-issue@master"
  secrets = ["GITHUB_TOKEN"]
}
```

This reads from the `.github/ISSUE_TEMPLATE.md` file. This file should have front matter to help construct the new issue:

```markdown
---
title: Someone just pushed
assignees:
  - JasonEtco
labels:
  - bug
---
Someone just pushed, oh no! Here's who did it: {{ payload.sender.login }}
```

You'll notice that the above example has some `{{ mustache }}` variables. Your issue templates have access to everything about the event that triggered the action. [Here is a list of all of the available template variables](https://github.com/JasonEtco/actions-toolkit#toolscontext).

### Dates

Additionally, you can use the `date` filter and variable to show some information about when this issue was created:

```markdown
---
title: Weekly Radar {{ date | date('dddd, MMMM Do') }}
---
What's everyone up to this week?
```

This example will create a new issue with a title like **Weekly Radar Saturday, November 10th**. You can pass any valid [Moment.js formatting string](https://momentjs.com/docs/#/displaying/) to the filter.

### Custom templates

Don't want to use `.github/ISSUE_TEMPLATE.md`? You can pass an argument pointing the action to a different template:

```workflow
action "Create issue" {
  uses = "JasonEtco/create-an-issue@master"
  secrets = ["GITHUB_TOKEN"]
  args = ".github/some-other-template.md"
}
```

#### Supported Custom Templates Structure:
Template files should have the structure:
```yaml
---
# Issue Parameters
title: "A New Issue"
labels:
  - an-issue
---
# Issue Body
Making a new issue can be automated!
```

#### Supported Issue Parameters (front matter):
Field | Type | Description
----- | ---- | -----------
title | string | The title of the issue.
labels | string[] | Labels to associate with this issue.
milestone | integer | The `number` of the milestone to associate this issue with.
assignees | string[] | Logins for Users to assign to this issue.
name | string | Name of the template. _NOTE: Only used by the GitHub UI._
about | string | Information describing this template. _NOTE: Only used by the GitHub UI._
