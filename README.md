<h3 align="center">Create an Issue Action</h3>
<p align="center">A GitHub Action that creates a new issue using a template file.<p>

## Usage

This GitHub Action creates a new issue based on an issue template file. Here's an example workflow that creates a new issue any time you push a commit:

```
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

```md
---
title: Someone just pushed
assignees:
  - JasonEtco
labels:
  - bug
---
Someone just pushed, oh no! Here's who did it: {{ context.payload.sender.login }}
```

You'll notice that the above example has some `{{ mustache }}` variables. Your issue templates have access to everything about the event that triggered the action.

### Dates

Additionally, you can use the `date` filter to show some information about when this issue was created:

```md
---
title: Weekly Radar {{ date | date('dddd, MMMM Do') }}
---
What's everyone up to this week?
```

This example will create a new issue with a title like **Weekly download Saturday, November 10th**.

### Custom templates

You can pass an argument pointing the action to a different template:

```
action "Create issue" {
  uses = "JasonEtco/create-an-issue@master"
  secrets = ["GITHUB_TOKEN"]
  args = ".github/some-other-template.md"
}
```
