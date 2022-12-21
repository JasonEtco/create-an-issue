import { Toolkit } from "actions-toolkit";
import { createAnIssue } from "./action";

Toolkit.run(createAnIssue, {
  secrets: ["GITHUB_TOKEN"],
});
