<div align="center">

# DSH 兰酱 Desktop Pet

**兰酱, a desktop pet that keeps you company while you work with DeepSeek Harness**

[中文](README.md) · [Download](https://github.com/xmlans/dsh-xmlans/releases/latest) · [Changelog](CHANGELOG.md) · [Issues](https://github.com/xmlans/dsh-xmlans/issues)

<img src="docs/images/lanjiang-preview.png" width="200" alt="兰酱 waving on the desktop">

</div>

兰酱 is started by the DSH plugin and exits together with DSH. Her transparent, frameless, always-on-top native window lets you see what the Agent is doing even while you work in your editor, browser, or any other app.

> **Current version: 0.1.0.** Install `dsh-xmlans@0.1.0`; for offline installation use **`dsh-xmlans-0.1.0.tgz`**. Windows, Linux, and macOS share this one package. 兰酱 is a white-haired maid with angel wings; her animation frames are rendered offline (portrait 256 × 352, 24 fps).

## What she does

- Shows the real task state: thinking, searching, editing, running, verifying, waiting for confirmation, done, and error.
- Shows the project, steps, multiple tasks, and the to-do progress DSH provides; when there is no real progress, she shows the current stage.
- Shows your DeepSeek balance in the status bubble and the settings page, distinguishing an API key from a signed-in account.
- Works with the shared client of both WebUI and the official Desktop app; each client keeps its own plugin configuration.
- Supports dragging, head pats, pokes, and touching her wings, plus size, bubble, sound, and reduced-motion settings.
- Can optionally show a lightweight character in the bottom-right corner of the DSH page (off by default).

Her state comes from DSH session events. 兰酱 never reads your screen; reasoning effort and progress only show what the Host actually provides.

## Choose your DSH client first

| How you use DSH | Install location | Settings entry (DSH 0.2) | Where the right-click menu opens |
| --- | --- | --- | --- |
| Browser WebUI | `web` profile | Sidebar Plugins → dsh-xmlans | WebUI, default `http://127.0.0.1:3080/` |
| Official Desktop app | `desktop` profile | Sidebar Plugins → dsh-xmlans | Brings up the Desktop app via `dsh://open` |

**A plugin installed in WebUI does not appear in the Desktop app automatically.** If both are enabled, each starts its own native character; you can turn 兰酱 off in one of the profiles. Third-party desktop wrappers may still use the `web` profile; check how they actually launch.

The client package's `platform: web` also applies to the official Desktop app, because the official Electron app uses the same Web client. The native character is started by the corresponding Host.

## Install

Before installing, upgrading, or removing from the command line, **fully quit the corresponding DSH Host**, and restart it afterwards. When using the Desktop app's in-app plugin manager, restart when the app asks you to.

### Browser WebUI

With DSH installed globally:

```powershell
dsh plugin --profile web add dsh-xmlans@0.1.0
dsh web
```

With `npx`, no global DSH install needed:

```powershell
npx -y @deepseek-ai/dsh plugin --profile web add dsh-xmlans@0.1.0
npx -y @deepseek-ai/dsh web
```

If you run DeepSeek Harness from source, run this in the Harness repository:

```powershell
pnpm dsh plugin --profile web add dsh-xmlans@0.1.0
pnpm dsh web
```

### Official Desktop app

Installing inside the app is recommended:

1. Open the official DeepSeek Harness Desktop app and click **Plugins** in the sidebar.
2. Click **Add plugin**, enter `dsh-xmlans@0.1.0`, and click **Install**.
3. When installation succeeds, click **Enable now**; 兰酱 appears on your desktop.
4. Open **dsh-xmlans** in the plugin list to adjust the character, bubble, and balance settings. Changes apply immediately.

This flow uses the Desktop app's own installation environment, so you don't need Node.js or npm commands. If the app asks you to refresh or restart, do so; if installation fails, expand **View installation details** and keep the log.

To install from the command line:

1. Launch the official Desktop app once so it initializes the `desktop` profile, then fully quit it.
2. Use the Desktop app's **bundled `dsh` command**. Versions that support command registration let you set it up from the app menu entry **Manage dsh command…**; you can also call `resources/runtime/cli/bin/dsh` (`dsh.cmd` on Windows) in the installation directory directly.
3. Run:

   ```powershell
   dsh plugin --profile desktop add dsh-xmlans@0.1.0
   ```

4. Reopen the Desktop app and adjust the character under sidebar Plugins → dsh-xmlans.

**The `dsh` here must come from the Desktop app.** A standalone npm / `npx @deepseek-ai/dsh` CLI cannot modify the official Desktop profile. See the [official DSH Desktop documentation](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/desktop/README.md#bundled-command-runtime).

### Offline package

Once you have **`dsh-xmlans-0.1.0.tgz`**, install it with the command for your client; **no need to unpack it**:

```powershell
# WebUI; replace the path with the actual one
npx -y @deepseek-ai/dsh plugin --profile web add "C:\Downloads\dsh-xmlans-0.1.0.tgz"

# Official Desktop app; must use the app's bundled dsh
dsh plugin --profile desktop add "C:\Downloads\dsh-xmlans-0.1.0.tgz"
```

In the Desktop app you can also enter the full path of the `.tgz` in the **Add plugin** field. The DSH plugin manager needs `pnpm` on your PATH. When packing it yourself, you must use flat dependencies (`npm install --ignore-scripts --no-package-lock --omit=dev && npm pack`); don't run `npm pack` directly in a pnpm-installed directory. See the [release notes](docs/RELEASING.md) for details.

## Balance display

By default the balance appears **at the bottom of 兰酱's status bubble and in the settings page**; both clients share the same query logic. The settings page shows the total, granted, and topped-up amounts, with a manual refresh.

| Source | Where the credentials come from | What is queried |
| --- | --- | --- |
| Auto (default) | The DeepSeek API key in DSH's model settings first; falls back to the signed-in account when none is configured | The balance of that source |
| API key | DSH's credentials service; on older Hosts without that service, the launch environment | DeepSeek `/user/balance` |
| Signed-in account | DSH's DeepSeek account service | Account top-up and bonus wallets |

- Configure credentials in **DSH's model / account settings**; 兰酱's settings page doesn't need an API key of its own.
- API balance and account balance are labeled with their source; CNY and USD are shown separately.
- Refreshes automatically every minute with a cache shared within one Host; manual refresh at most once every 5 seconds.
- When the service fails, the last successful result is kept and marked "last query"; not configured, authorization failure, and network failure each get their own message.
- Custom gateways must implement the same `/user/balance` endpoint; otherwise the query shows as failed.
- API keys, login credentials, and raw upstream errors never reach the balance page, character messages, or the event stream.
- Task status works fine without balance credentials; you can turn off "Show DeepSeek balance".

The account and API balance queries are based on [keshing/balance-display](https://github.com/keshing/balance-display) and DSH's public account service. The plugin never makes model calls.

## Common settings

| Setting | Effect |
| --- | --- |
| Enable 兰酱 | Turn the native character on or off for the current profile |
| Character size / bubble size | Adjusted independently; small bubbles keep a base font size |
| Quiet / normal / lively | After each idle action, rest for 45–90 / 25–45 / 12–22 seconds respectively |
| Reduced motion | Freezes the character pose and stops idle and click animations; status and notifications still update live |
| Sounds | Play a sound on completion / error |
| Bubble display | Always on, hidden, or only for selected states |
| Subagents | Let subagent states take part in the display |
| In-page character | Show a lightweight character in the bottom-right corner of the DSH page |
| Open target | Auto, WebUI, or the official Desktop app |
| Show balance / balance source | Toggle and choose where the balance is queried from |

Changes in the settings page apply immediately. The right-click menu lets you change size and reduced motion, open the corresponding DSH client, or hide / close the character for this run only.

Click reactions always play to the end before returning to the current task state; a new task can interrupt decorative actions immediately. While dragging, only the hanging pose plays; after you let go, she lands fully. See the [animation notes](docs/animation-behavior.md) for the exact triggers, frequencies, and transitions.

If your WebUI uses a custom address, set `DSH_XMLANS_WEBUI_URL` when starting the Host; it takes precedence over the automatically inferred default.

## Platforms and requirements

| Platform | Native character |
| --- | --- |
| Windows 10 / 11 x64 | Helper bundled; WSL2 can launch it through Windows interop |
| Linux x64 | Qt Helper bundled, needs a graphical desktop; glibc 2.35+, with acceptance records on Ubuntu 24.04 |
| macOS 12+ | Native Swift / AppKit Helper, Universal build; experimental |

The standard package already includes the Helper, so **you don't need to install Python or run the Helper yourself**. When using the source, you need to build it yourself. Small macOS font sizes and drag edges have been fixed and pass CI, but visual appearance and multi-monitor behavior still need verification on a real machine.

The native character appears on **the desktop where the Host runs**: if the Host is on a remote server, has no graphical environment, or isn't on the same machine as your browser, check where the Host is running first. The in-page character can be shown in the browser.

## Updating and troubleshooting

WebUI users, after fully quitting DSH, run:

```powershell
npx -y @deepseek-ai/dsh plugin --profile web update dsh-xmlans
```

The official Desktop app **0.2.0-rc.2 does not yet support in-app automatic updates**. Uninstall 兰酱 on the Plugins page, then add `dsh-xmlans@0.1.0` and enable it right away; or fully quit the app and use its bundled command:

```powershell
dsh plugin --profile desktop update dsh-xmlans
```

Then restart the corresponding client. For rolling back, removing, restoring the size after a DSH migration, and handling Windows `EPERM`, see [Updating and rollback](docs/UPDATING.md) (in Chinese).

- DSH 0.2 settings page changes: install the current version and open settings via sidebar Plugins → dsh-xmlans; older Hosts keep the original settings entry.
- Desktop installation only shows `[exit 1]`: that alone isn't enough to tell the cause; please attach the detailed plugin installation log (e.g. `hub.log`), your DSH version, OS, and installation method.
- Balance query fails: check the credentials in DSH and whether your gateway supports the balance endpoint.
- Character doesn't appear: check the profile, whether the plugin is enabled, and whether the Host has a usable graphical desktop.

## Developing from source

```powershell
pnpm install --frozen-lockfile
npm test
npm run test:python
npm run build:helper
npm run test:helper:packaged
```

Developing the Python Helper requires the dependencies in `requirements.txt`; the macOS Helper requires Xcode Command Line Tools. Run `swift test` for the pure Swift core tests. After changing native code, rebuild the Helper and then install the locally packed artifact.

CI also installs DSH 0.2.0-rc.2 in isolation and runs `scripts/test-dsh-settings.mjs` to verify the new settings API. This check never reads user profiles or credentials; file writes go through a test adapter.

Maintainer packaging and release steps are in the [release notes](docs/RELEASING.md).

## Regenerating the character frames

The character frames are rendered offline by `tools/render` and are not shipped in the npm package:

    cd tools/render
    npm install
    npx playwright install chromium
    node render.mjs            # all clips; rewrites assets/pet-manifest.json
    node render.mjs idle poke  # re-render only these clips; manifest untouched

The animation timelines live in `tools/render/clips.mjs`. Loop clips are 8 seconds long, with periodic motion quantized to whole periods so the first and last frames join seamlessly.
