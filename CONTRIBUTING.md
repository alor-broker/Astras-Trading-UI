# Contributing to Astras

Looking to contribute something to Astras? **Here's how you can help.**

Please take a moment to review this document in order to make the contribution
process easy and effective for everyone involved.

Following these guidelines helps to communicate that you respect the time of
the developers managing and developing this open source project. In return,
they should reciprocate that respect in addressing your issue or assessing
patches and features.

Please note, that we're accepting contributions in Russian, in English or in Typescript =).


## Using the issue tracker

The [issue tracker](https://github.com/alor-broker/Astras-Trading-UI/issues) is
the preferred channel for [bug reports](#bug-reports), [features requests](#feature-requests)
and [submitting pull requests](#pull-requests), but please respect the following
restrictions:

* Please **do not** derail or troll issues. Keep the discussion on topic and
  respect the opinions of others.

* Please **do** choose the issue's template and follow it.


## Issues and labels

Our bug tracker utilizes several labels to help organize and identify issues. Here's what they represent and how we use them:

- `bug` - Issues describing some problem. If something doesn't work as expected, it's probably a bug.
- `duplicate` - Issues that have been reported earlier
- `documentation` - Issues for improving or updating our documentation.
- `enhancement` - Issues that proposes new features.
- `good first issue` - Issues that are good, if you want to start contributing
- `invalid` - Issues that are invalid for some reason. They would be deleted shortly after.
- `recently reported` - Issues that were recetly reported. Please add this label to all your issues, we'll remove it when we'll see the issue.
- `wontfix` - Issues that would not be fixed.

## Bug reports

A bug is a _demonstrable problem_ that is caused by the code in the repository.
Good bug reports are extremely helpful, so thanks!

Guidelines for bug reports:

0. **Ensure you know how to reproduce** to ensure your
   problem isn't caused by some external factors with your machine, network or just miss clicks.

1. **Use the GitHub issue search** &mdash; check if the issue has already been
   reported.

2. **Open Bug Report issue** &mdash; please, follow our bug report template and create an issue.


## Feature requests

Feature requests are welcome. But take a moment to find out whether your idea
fits with the scope and aims of the project. It's up to *you* to make a strong
case to convince the project's developers of the merits of this feature. Please
provide as much detail and context as possible.


## Pull requests

Good pull requests—patches, improvements, new features—are a fantastic
help. They should remain focused in scope and avoid containing unrelated
commits.

**Please ask first** before embarking on any **significant** pull request (e.g.
implementing features, refactoring code, porting to a different language),
otherwise you risk spending a lot of time working on something that the
project's developers might not want to merge into the project.

Please adhere to the [coding guidelines](#code-guidelines) used throughout the
project (indentation, accurate comments, etc.) and any other requirements
(such as test coverage).


Adhering to the following process is the best way to get your work
included in the project:

1. [Fork](https://help.github.com/articles/fork-a-repo/) the project, clone your fork,
   and configure the remotes:

   ```bash
   # Clone your fork of the repo into the current directory
   git clone https://github.com/<your-username>/Astras-Trading-UI.git
   # Navigate to the newly cloned directory
   cd Astras-Trading-UI
   # Assign the original repo to a remote called "upstream"
   git remote add upstream https://github.com/alor-broker/Astras-Trading-UI.git
   ```

2. If you cloned a while ago, get the latest changes from upstream:

   ```bash
   git checkout master
   git pull upstream master
   ```

3. Create a new topic branch (off the master branch) to
   contain your feature, change, or fix:

   ```bash
   git checkout -b <topic-branch-name>
   ```

4. Commit your changes in logical chunks. Please adhere to these [git commit
   message guidelines](https://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html)
   or your code is unlikely be merged into the main project. Use Git's
   [interactive rebase](https://help.github.com/articles/about-git-rebase/)
   feature to tidy up your commits before making them public.

5. Locally merge (or rebase) the upstream development branch into your topic branch:

   ```bash
   git pull [--rebase] upstream master
   ```

6. Push your topic branch up to your fork:

   ```bash
   git push origin <topic-branch-name>
   ```

7. [Open a Pull Request](https://help.github.com/articles/about-pull-requests/)
    with a clear title and description against the `master` branch.

**IMPORTANT**: By submitting a patch, you agree to allow the project owners to
license your work under the terms of the [Apache 2.0 License](../LICENSE)
