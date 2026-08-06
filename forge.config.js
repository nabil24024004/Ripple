const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const path = require('path');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    electronDist: require('path').join(__dirname, 'node_modules/electron/dist'),
    asar: true,
    executableName: 'quick-pill',
    icon: 'src/assets/icons/icon',
    extraResource: [
      path.join(__dirname, 'src/assets/icons/icon.png'),
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
          if (!['.dmg', '.msi', '.deb', '.rpm', '.zip'].includes(ext)) {
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
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'quick_pill',
        authors: 'Abrar Nabil',
        description: 'A Dynamic Island for All',
        iconUrl: 'https://raw.githubusercontent.com/Abrar Nabil/Quick-Pill/main/src/assets/icons/icon.ico',
        setupIcon: path.join(__dirname, 'src/assets/icons/icon.ico')
      }
    },
    {
      name: '@electron-forge/maker-wix',
      config: {
        language: 1033,
        manufacturer: 'Abrar Nabil',
        description: 'A Dynamic Island for All',
        name: 'Quick Pill',
        icon: path.join(__dirname, 'src/assets/icons/icon.ico'),
        shortcutFolderName: 'Quick Pill',
        programFilesFolderName: 'Quick Pill',
        ui: {
          chooseDirectory: true,
        },
      },
    },

    {
      name: '@electron-forge/maker-dmg',
      config: {
        name: 'QuickPillInstaller',
        format: 'UDZO',
        overwrite: true
      }
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          icon: path.join(__dirname, 'src/assets/icons/icon.png'),
          executableName: 'quick-pill',
          name: 'quick-pill',
        }
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {
        options: {
          icon: path.join(__dirname, 'src/assets/icons/icon.png'),
          name: 'quick-pill',
        }
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'win32', 'linux'],
    },
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
