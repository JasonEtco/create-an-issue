import { Toolkit } from "actions-toolkit";
import { createAnIssue } from "./action";

console.log(secrets: ["GITHUB_TOKEN"])

Toolkit.run(createAnIssue, {
  secrets: ["GITHUB_TOKEN"],
});
