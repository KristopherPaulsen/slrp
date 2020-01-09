# Before you open your PR check that

* branch name is formatted with **snake_case**
* branch name includes Jira ticket
* branch name includes filter words for try builds you expect to run: `server`, `reuse`, `app-picker`, `feature-base`, etc.
  (See [Running Try-Builds](https://github.com/QuickBase/huey#running-try-builds) for more info)
* at least one of your commit messages has your Jira Ticket (For example: QB-1234 commit message)

First PR? (See [Creating Your First PR](https://github.com/QuickBase/huey/blob/master/CREATING_YOUR_FIRST_PR.md) for more info)

## Did you make changes to shared code?

Please run `yarn runAllFunctionalTests` to provide additional evidence there were no breaking changes. See [Running all functional tests locally](https://github.com/QuickBase/huey/blob/master/libs/testUtils/scripts/runFunctionalTestsLocally/README_runningTestsLocally.md) for more information on this command.

See more information about how to contribute to reuse and other shared libs in the [Shared Resources Contribution Guide](https://github.com/QuickBase/huey/blob/master/SHARED_RESOURCES_CONTRIBUTION_GUIDE.md)
