import ng from 'conventional-changelog-angular';

function getCfg() {
  const env = process.env.CHANGELOG_ALOREL_CFG;

  const cfg = {
    enable: {
      feat: true,
      fix: true,
      perf: true,
      docs: true,
      revert: true,
      refactor: true,
      test: true,
      build: false,
      ci: false,
      chore: true
    },
    texts: {
      feat: 'Features',
      fix: 'Bug Fixes',
      perf: 'Performance Improvements',
      docs: 'Documentation',
      revert: 'Reverts',
      refactor: 'Refactoring',
      test: 'Tests',
      build: 'Build System',
      ci: 'Build System',
      chore: 'Maintenance',
      tweak: 'Tweaks'
    },
    ignoreReleaseScope: true
  };

  if (env) {
    const fs = require('fs');
    const JSON5 = require('json5');
    const merge = require('lodash/merge');
    const contents = JSON5.parse(fs.readFileSync(env, 'utf8'));
    merge(cfg, contents);
  }

  return cfg;
}

function processCommitType(commit) {
  const cfg = getCfg();

  if (cfg.ignoreReleaseScope && commit.scope === 'release') {
    return false;
  }

  let typeMatched = false;

  for (const type of Object.keys(cfg.texts)) {
    if (type === 'chore') {
      if (commit.type === 'chore') {
        if (cfg.enable.chore) {
          commit.type = cfg.texts.chore;
        }

        break;
      }
    } else if (commit.type === type) {
      if (cfg.enable[type]) {
        commit.type = cfg.texts[type];
        typeMatched = true;
      }

      break;
    }
  }

  return typeMatched;
}

function processSubject(commit, ctx) {
  const issues = [];

  if (typeof commit.subject === 'string') {
    let url = ctx.repository ? `${ctx.host}/${ctx.owner}/${ctx.repository}` : ctx.repoUrl;
    if (url) {
      url = `${url}/issues/`;
      // Issue URLs.
      commit.subject = commit.subject.replace(/#([0-9]+)/g, (_, issue) => {
        issues.push(issue);
        return `[#${issue}](${url}${issue})`
      })
    }
    if (ctx.host) {
      // User URLs.
      commit.subject = commit.subject.replace(/\B@([a-z0-9](?:-?[a-z0-9]){0,38})/g, `[@$1](${ctx.host}/$1)`)
    }
  }

  return issues;
}

function processReferences(commit, ctx) {
  const issues = processSubject(commit, ctx);

  // remove references that already appear in the subject
  commit.references = commit.references
    .filter(reference => !issues.includes(reference.issue));
}

export default async function createChangelogPreset() {
  const cfg = await ng();

  cfg.writerOpts.transform = function transform(commit, context) {
    const discard = !(commit.notes || []).length;

    for (const note of commit.notes) {
      // noinspection JSPrimitiveTypeWrapperUsage
      note.title = 'BREAKING CHANGES';
    }

    if (!processCommitType(commit) && discard) {
      return;
    }

    if (commit.scope === '*') {
      commit.scope = '';
    }

    if (typeof commit.hash === 'string') {
      commit.shortHash = commit.hash.substring(0, 7);
    }

    processReferences(commit, context);

    return commit
  };

  return cfg;
}
