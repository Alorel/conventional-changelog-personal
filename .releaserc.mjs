import {createRequire} from 'node:module';

export default {
  branch: 'master',
  tagFormat: '${version}',
  prepare: [
    '@semantic-release/changelog',
    '@semantic-release/npm',
    {
      path: '@semantic-release/git',
      message: 'chore(release): ${nextRelease.version}',
      assets: [
        'CHANGELOG.md',
        'README.md',
        'package.json',
        'yarn.lock'
      ]
    }
  ],
  generateNotes: {
    config: createRequire(import.meta.url).resolve('./index.mjs'),
  }
};
