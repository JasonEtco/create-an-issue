import { Toolkit } from 'actions-toolkit'
import { IssuesCreateResponseData } from '@octokit/types'

export interface FrontMatterAttributes {
  title: string
  assignees?: string[] | string
  labels?: string[] | string
  milestone?: string | number
}

export function setOutputs (tools: Toolkit, issue: { data: IssuesCreateResponseData }) {
  tools.outputs.number = String(issue.data.number)
  tools.outputs.url = issue.data.html_url
}

export function listToArray (list?: string[] | string) {
  if (!list) return []
  return Array.isArray(list) ? list : list.split(', ')
}