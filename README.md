# bun-range-macro

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run src/index.ts
```

This project was created using `bun init` in bun v1.2.18. [Bun](https://bun.sh)
is a fast all-in-one JavaScript runtime.

## Usage

If you wish to use this, you can install this via `bun add bun-range-macro`. After you do that, you can set it up like a normal Bun plugin.

## Automated Setup

You can set up the plugin automatically using the provided install scripts.
These scripts will configure everything for you remotely—no need to manually
download any files.

### Unix/macOS (Bash)

```bash
curl -fsSL "https://raw.githubusercontent.com/howmanysmall/bun-range-macro/main/installer/install.sh?$(date +%s)" | bash
```

### Windows (PowerShell)

```powershell
irm ("https://raw.githubusercontent.com/howmanysmall/bun-range-macro/main/installer/install.ps1?{0}" -f [int][double]::Parse((Get-Date -UFormat %s))) | pwsh
```

Both scripts will:

- Ensure the plugin file is created and configured.
- Update your `bunfig.toml` with the necessary settings.
- Install the `bun-range-macro` dependency if needed.

For more details, see the [repository](https://github.com/howmanysmall/bun-range-macro/tree/main).
