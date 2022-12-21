import nock from "nock";
import * as core from "@actions/core";
import { Toolkit } from "actions-toolkit";
import { Signale } from "signale";
import { createAnIssue } from "../src/action";

function generateToolkit() {
  const tools = new Toolkit({
    logger: new Signale({ disabled: true }),
  });

  jest.spyOn(tools.log, "info");
  jest.spyOn(tools.log, "error");
  jest.spyOn(tools.log, "success");

  // Turn core.setOutput into a mocked noop
  jest.spyOn(core, "setOutput").mockImplementation(() => {});

  // Turn core.setFailed into a mocked noop
  jest.spyOn(core, "setFailed").mockImplementation(() => {});

  tools.exit.success = jest.fn() as any;
  tools.exit.failure = jest.fn() as any;

  return tools;
}

describe("create-an-issue", () => {
  let tools: Toolkit;
  let params: any;

  beforeEach(() => {
    nock("https://api.github.com")
      .post(/\/repos\/.*\/.*\/issues/)
      .reply(200, (_, body: any) => {
        params = body;
        return {
          title: body.title,
          number: 1,
          html_url: "www",
        };
      });

    tools = generateToolkit();

    // Ensure that the filename input isn't set at the start of a test
    delete process.env.INPUT_FILENAME;

    // Simulate an environment variable added for the action
    process.env.EXAMPLE = "foo";
  });

  it("creates a new issue", async () => {
    await createAnIssue(tools);
    expect(params).toMatchSnapshot();
    expect(tools.log.success).toHaveBeenCalled();
    expect((tools.log.success as any).mock.calls).toMatchSnapshot();

    // Verify that the outputs were set
    expect(core.setOutput).toHaveBeenCalledTimes(2);
    expect(core.setOutput).toHaveBeenCalledWith("url", "www");
    expect(core.setOutput).toHaveBeenCalledWith("number", "1");
  });

  it("creates a new issue from a different template", async () => {
    process.env.INPUT_FILENAME = ".github/different-template.md";
    tools.context.payload = {
      repository: { owner: { login: "JasonEtco" }, name: "waddup" },
    };
    await createAnIssue(tools);
    expect(params).toMatchSnapshot();
    expect(tools.log.success).toHaveBeenCalled();
    expect((tools.log.success as any).mock.calls).toMatchSnapshot();
  });

  it("creates a new issue with some template variables", async () => {
    process.env.INPUT_FILENAME = ".github/variables.md";
    await createAnIssue(tools);
    expect(params).toMatchSnapshot();
    expect(tools.log.success).toHaveBeenCalled();
    expect((tools.log.success as any).mock.calls).toMatchSnapshot();
  });

  it("creates a new issue with the context.repo template variables", async () => {
    process.env.INPUT_FILENAME = ".github/context-repo-template.md";
    await createAnIssue(tools);
    expect(params).toMatchSnapshot();
    expect(tools.log.success).toHaveBeenCalled();
    expect((tools.log.success as any).mock.calls).toMatchSnapshot();
  });

  it("creates a new issue with assignees, labels and a milestone", async () => {
    process.env.INPUT_FILENAME = ".github/kitchen-sink.md";
    await createAnIssue(tools);
    expect(params).toMatchSnapshot();
    expect(tools.log.success).toHaveBeenCalled();
    expect((tools.log.success as any).mock.calls).toMatchSnapshot();
  });

  it("creates a new issue with assignees and labels as comma-delimited strings", async () => {
    process.env.INPUT_FILENAME = ".github/split-strings.md";
    await createAnIssue(tools);
    expect(params).toMatchSnapshot();
    expect(tools.log.success).toHaveBeenCalled();
    expect((tools.log.success as any).mock.calls).toMatchSnapshot();
  });

  it("creates a new issue with an assignee passed by input", async () => {
    process.env.INPUT_ASSIGNEES = "octocat";
    await createAnIssue(tools);
    expect(params).toMatchSnapshot();
    expect(tools.log.success).toHaveBeenCalled();
    expect((tools.log.success as any).mock.calls).toMatchSnapshot();
  });

  it("creates a new issue with multiple assignees passed by input", async () => {
    process.env.INPUT_ASSIGNEES = "octocat, JasonEtco";
    await createAnIssue(tools);
    expect(params).toMatchSnapshot();
    expect(tools.log.success).toHaveBeenCalled();
    expect((tools.log.success as any).mock.calls).toMatchSnapshot();
  });

  it("creates a new issue with a milestone passed by input", async () => {
    process.env.INPUT_MILESTONE = "1";
    await createAnIssue(tools);
    expect(params).toMatchSnapshot();
    expect(params.milestone).toBe(1);
    expect(tools.log.success).toHaveBeenCalled();
  });

  it("creates a new issue when updating existing issues is enabled but no issues with the same title exist", async () => {
    nock.cleanAll();
    nock("https://api.github.com")
      .get(/\/search\/issues.*/)
      .reply(200, {
        items: [],
      })
      .post(/\/repos\/.*\/.*\/issues/)
      .reply(200, (_, body: any) => {
        params = body;
        return {
          title: body.title,
          number: 1,
          html_url: "www",
        };
      });

    process.env.INPUT_UPDATE_EXISTING = "true";

    await createAnIssue(tools);
    expect(params).toMatchSnapshot();
    expect(tools.log.info).toHaveBeenCalledWith(
      "No existing issue found to update"
    );
    expect(tools.log.success).toHaveBeenCalled();
  });

  it("updates an existing open issue with the same title", async () => {
    nock.cleanAll();
    nock("https://api.github.com")
      .get(/\/search\/issues.*/)
      .query((parsedQuery) => {
        const q = parsedQuery["q"];
        if (typeof q === "string") {
          const args = q.split(" ");
          return (
            (args.includes("is:open") || args.includes("is:closed")) &&
            args.includes("is:issue")
          );
        } else {
          return false;
        }
      })
      .reply(200, {
        items: [{ number: 1, title: "Hello!" }],
      })
      .patch(/\/repos\/.*\/.*\/issues\/.*/)
      .reply(200, {});

    process.env.INPUT_UPDATE_EXISTING = "true";

    await createAnIssue(tools);
    expect(params).toMatchSnapshot();
    expect(tools.exit.success).toHaveBeenCalled();
  });

  it("escapes quotes in the search query", async () => {
    process.env.INPUT_FILENAME = ".github/quotes-in-title.md";

    nock.cleanAll();
    nock("https://api.github.com")
      .get(/\/search\/issues.*/)
      .query((parsedQuery) => {
        const q = parsedQuery["q"] as string;
        return q.includes('"This title \\"has quotes\\""');
      })
      .reply(200, {
        items: [{ number: 1, title: "Hello!" }],
      })
      .post(/\/repos\/.*\/.*\/issues/)
      .reply(200, {});

    await createAnIssue(tools);
    expect(tools.log.success).toHaveBeenCalled();
  });

  it("checks the value of update_existing", async () => {
    process.env.INPUT_UPDATE_EXISTING = "invalid";

    await createAnIssue(tools);
    expect(params).toMatchSnapshot();
    expect(tools.exit.failure).toHaveBeenCalledWith(
      "Invalid value update_existing=invalid, must be one of true or false"
    );
  });

  it("updates an existing closed issue with the same title", async () => {
    nock.cleanAll();
    nock("https://api.github.com")
      .get(/\/search\/issues.*/)
      .query((parsedQuery) => {
        const q = parsedQuery["q"];
        if (typeof q === "string") {
          const args = q.split(" ");
          return !args.includes("is:all") && args.includes("is:issue");
        } else {
          return false;
        }
      })
      .reply(200, {
        items: [{ number: 1, title: "Hello!", html_url: "/issues/1" }],
      })
      .patch(/\/repos\/.*\/.*\/issues\/.*/)
      .reply(200, {});

    process.env.INPUT_UPDATE_EXISTING = "true";
    process.env.INPUT_SEARCH_EXISTING = "all";

    await createAnIssue(tools);
    expect(tools.exit.success).toHaveBeenCalledWith(
      "Updated issue Hello!#1: /issues/1"
    );
  });

  it("finds, but does not update an existing issue with the same title", async () => {
    nock.cleanAll();
    nock("https://api.github.com")
      .get(/\/search\/issues.*/)
      .reply(200, {
        items: [{ number: 1, title: "Hello!", html_url: "/issues/1" }],
      });
    process.env.INPUT_UPDATE_EXISTING = "false";

    await createAnIssue(tools);
    expect(params).toMatchSnapshot();
    expect(tools.exit.success).toHaveBeenCalledWith(
      "Existing issue Hello!#1: /issues/1 found but not updated"
    );
  });

  it("exits when updating an issue fails", async () => {
    nock.cleanAll();
    nock("https://api.github.com")
      .get(/\/search\/issues.*/)
      .reply(200, {
        items: [{ number: 1, title: "Hello!", html_url: "/issues/1" }],
      })
      .patch(/\/repos\/.*\/.*\/issues\/.*/)
      .reply(500, {
        message: "Updating issue failed",
      });

    await createAnIssue(tools);
    expect(tools.exit.failure).toHaveBeenCalled();
  });

  it("logs a helpful error if creating an issue throws an error", async () => {
    nock.cleanAll();
    nock("https://api.github.com")
      .get(/\/search\/issues.*/)
      .reply(200, { items: [] })
      .post(/\/repos\/.*\/.*\/issues/)
      .reply(500, {
        message: "Validation error",
      });

    await createAnIssue(tools);
    expect(tools.log.error).toHaveBeenCalled();
    expect((tools.log.error as any).mock.calls).toMatchSnapshot();
    expect(tools.exit.failure).toHaveBeenCalled();
  });

  it("logs a helpful error if creating an issue throws an error with more errors", async () => {
    nock.cleanAll();
    nock("https://api.github.com")
      .get(/\/search\/issues.*/)
      .reply(200, { items: [] })
      .post(/\/repos\/.*\/.*\/issues/)
      .reply(500, {
        message: "Validation error",
        errors: [{ foo: true }],
      });

    await createAnIssue(tools);
    expect(tools.log.error).toHaveBeenCalled();
    expect((tools.log.error as any).mock.calls).toMatchSnapshot();
    expect(tools.exit.failure).toHaveBeenCalled();
  });

  it("logs a helpful error if updating an issue throws an error with more errors", async () => {
    nock.cleanAll();
    nock("https://api.github.com")
      .get(/\/search\/issues.*/)
      .reply(200, { items: [{ number: 1, title: "Hello!" }] })
      .patch(/\/repos\/.*\/.*\/issues\/.*/)
      .reply(500, {
        message: "Validation error",
        errors: [{ foo: true }],
      });

    process.env.INPUT_UPDATE_EXISTING = "true";

    await createAnIssue(tools);
    expect(tools.log.error).toHaveBeenCalled();
    expect((tools.log.error as any).mock.calls).toMatchSnapshot();
    expect(tools.exit.failure).toHaveBeenCalled();
  });

  it("logs a helpful error if the frontmatter is invalid", async () => {
    process.env.INPUT_FILENAME = ".github/invalid-frontmatter.md";

    await createAnIssue(tools);
    expect(tools.log.error).toHaveBeenCalled();
    expect((tools.log.error as any).mock.calls).toMatchSnapshot();
    expect(tools.exit.failure).toHaveBeenCalled();
  });
});
