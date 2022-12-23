import { Toolkit } from "actions-toolkit";
import { z } from "zod";

export const frontmatterSchema = z
  .object({
    title: z.string(),
    assignees: z.union([z.array(z.string()), z.string()]).optional(),
    labels: z.union([z.array(z.string()), z.string()]).optional(),
    milestone: z.union([z.string(), z.number()]).optional(),
    name: z.string().optional(),
    about: z.string().optional(),
  })
  .strict();

export type FrontMatterAttributes = z.infer<typeof frontmatterSchema>;

export function setOutputs(
  tools: Toolkit,
  issue: { number: number; html_url: string }
) {
  tools.outputs.number = String(issue.number);
  tools.outputs.url = issue.html_url;
}

export function listToArray(list?: string[] | string) {
  if (!list) return [];
  return Array.isArray(list) ? list : list.split(", ");
}
