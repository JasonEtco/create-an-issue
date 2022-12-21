const path = require("path");

Object.assign(process.env, {
  GITHUB_REPOSITORY: "JasonEtco/waddup",
  GITHUB_ACTION: "create-an-issue",
  GITHUB_EVENT_PATH: path.join(__dirname, "fixtures", "event.json"),
  GITHUB_WORKSPACE: path.join(__dirname, "fixtures"),
});
