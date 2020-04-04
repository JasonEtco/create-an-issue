<h3 align="center">Create an Issue Action</h3>
<p align="center">A GitHub Action that creates a new issue using a template file.<p>
<p align="center"><a href="https://github.com/JasonEtco/create-an-issue"><img alt="GitHub Actions status" src="https://github.com/JasonEtco/create-an-issue/workflows/Node%20CI/badge.svg"></a> <a href="https://codecov.io/gh/JasonEtco/create-an-issue/"><img src="https://badgen.now.sh/codecov/c/github/JasonEtco/create-an-issue" alt="Codecov"></a></p>

## Usage

This GitHub Action creates a new issue based on an issue template file. Here's an example workflow that creates a new issue any time you push a commit:

```yaml
# .github/workflows/issue-on-push.yml
on: [push]
name: Create an issue on push
jobs:
  stuff:
    steps:
      - uses: JasonEtco/create-an-issue@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

This reads from the `.github/ISSUE_TEMPLATE.md` file. This file should have front matter to help construct the new issue:

```markdown
---
title: Someone just pushed
assignees: JasonEtco, matchai
labels: bug, enhancement
---
Someone just pushed, oh no! Here's who did it: {{ payload.sender.login }}.
```

You'll notice that the above example has some `{{ mustache }}` variables. Your issue templates have access to everything about the event that triggered the action. [Here is a list of all of the available template variables](https://github.com/JasonEtco/actions-toolkit#toolscontext). You can also use environment variables:

```yaml
- uses: JasonEtco/create-an-issue@v2
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    ADJECTIVE: great
```

```markdown
Environment variables are pretty {{ env.ADJECTIVE }}, right?
```

Note that you can only assign people matching given [conditions](https://help.github.com/en/github/managing-your-work-on-github/assigning-issues-and-pull-requests-to-other-github-users).

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

Don't want to use `.github/ISSUE_TEMPLATE.md`? You can pass an input pointing the action to a different template:

```yaml
steps:
  - uses: actions/checkout@v2
  - uses: JasonEtco/create-an-issue@v2
    env:
      GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    with:
      filename: .github/some-other-template.md
```

### Inputs

Want to use Action logic to determine who to assign the issue to? You can pass an input containing the following options:

```yaml
steps:
  - uses: actions/checkout@v2
  - uses: JasonEtco/create-an-issue@v2
    env:
      GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    with:
      assignees: JasonEtco, octocat
      milestone: 1
```

### Outputs

If you need the number or URL of the issue that was created for another Action, you can use the `number` or `url` outputs, respectively. For example:

```yaml
steps:
  - uses: JasonEtco/create-an-issue@v2
    env:
      GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    id: create-issue
  - run: 'echo Created issue number ${{ steps.create-issue.outputs.number }}'
  - run: 'echo Created ${{ steps.create-issue.outputs.url }}'
```
