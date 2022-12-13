import { Toolkit } from 'actions-toolkit'

export interface FrontMatterAttributes {
  title: string
  assignees?: string[] | string
  labels?: string[] | string
  milestone?: string | number
}

export function setOutputs (tools: Toolkit, issue: { number: number, html_url: string }) {
  tools.outputs.number = String(issue.number)
  tools.outputs.url = issue.html_url
}

export function listToArray (list?: string[] | string) {
  if (!list) return []
  return Array.isArray(list) ? list : list.split(', ')
}