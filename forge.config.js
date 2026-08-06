const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const path = require('path');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');
const { MakerSquirrel } = require('@electron-forge/maker-squirrel');
const { MakerZIP } = require('@electron-forge/maker-zip');

module.exports = {
  packagerConfig: {
    asar: true,
    executableName: 'quick-pill',
    icon: path.join(__dirname, 'src/assets/icons/icon'),
    extraResource: [
      path.join(__dirname, 'src/assets/icons/icon.ico'),
      path.join(__dirname, 'src/assets/icons/icon.png'),
      path.join(__dirname, 'src/assets/icons/icon.icns'),
    ],
    ...(process.platform === 'darwin' ? {
      extendInfo: {
        NSAppleEventsUsageDescription: 'Quick Pill needs to control media players like Spotify and AppleMusic.',
      },
    } : {}),
  },
  hooks: {
    postPackage: async (forgeConfig, options) => {
      console.log('POST PACKAGE OUTPUT PATHS:', options.outputPaths);
      if (options.platform !== 'darwin') return;
      console.log('Signing application with entitlements...');
      const { execSync } = require('child_process');
      const fs = require('fs');
      const path = require('path');

      for (const outPath of options.outputPaths) {
        const files = fs.readdirSync(outPath);
        const appFile = files.find(f => f.endsWith('.app'));
        if (appFile) {
          const appPath = path.join(outPath, appFile);
          console.log(`Waiting for file lock release...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          console.log(`Signing ${appPath}...`);
          try {
            execSync(`codesign --deep --force --verbose -s - --entitlements "${path.resolve(__dirname, 'entitlements.plist')}" "${appPath}"`);
            console.log('Signed successfully.');
          } catch (e) {
            console.error('Sign failed, retrying without deep...');
            throw e;
          }
        }
      }
    },

    postMake: async (forgeConfig, makeResults) => {
      const fs = require('fs');
      const path = require('path');
      const { version } = require('./package.json');

      const platformLabel = {
        darwin: 'macOS',
        win32: 'Windows',
        linux: 'Linux',
      };

      for (const result of makeResults) {
        const os = platformLabel[result.platform] || result.platform;
        const renamedArtifacts = [];

        for (const artifactPath of result.artifacts) {
          const ext = path.extname(artifactPath);
          // Skip non-installer files (e.g. blockmap, yml)
          if (!['.dmg', '.msi', '.deb', '.rpm', '.zip', '.exe'].includes(ext)) {
            renamedArtifacts.push(artifactPath);
            continue;
          }

          const archSuffix = result.platform === 'darwin' ? `-${result.arch}` : '';
          const portableSuffix = ext === '.zip' ? '-Portable' : '';
          const newName = `QuickPill-${os}${archSuffix}-v${version}${portableSuffix}${ext}`;
          const newPath = path.join(path.dirname(artifactPath), newName);

          fs.renameSync(artifactPath, newPath);
          console.log(`Renamed: ${path.basename(artifactPath)} → ${newName}`);
          renamedArtifacts.push(newPath);
        }

        result.artifacts = renamedArtifacts;
      }

      return makeResults;
    },
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      name: 'quick_pill',
      authors: 'Abrar Nabil',
      description: 'A Dynamic Island for All',
      iconUrl: 'https://raw.githubusercontent.com/nabil24024004/Ripple/main/src/assets/icons/icon.ico',
      setupIcon: path.join(__dirname, 'src/assets/icons/icon.ico')
    }),
    new MakerZIP({}, ['darwin', 'win32', 'linux']),
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-vite',
      config: {
        build: [
          {
            entry: 'src/main.js',
            config: 'vite.main.config.mjs',
            target: 'main',
          },
          {
            entry: 'src/preload.js',
            config: 'vite.preload.config.mjs',
            target: 'preload',
          },
        ],
        renderer: [
          {
            name: 'main_window',
            config: 'vite.renderer.config.mjs',
          },
        ],
      },
    },
  ],
};
