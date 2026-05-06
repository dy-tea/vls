# VLS VSCode Extension

This extension integrates the V Language Server (VLS) with Visual Studio Code,
providing diagnostics, code completion, inlay hints, and more for V files.

## Installation

1. Build the VLS binary:
   ```sh
   v .
   ```

2. Build the VSCode extension:
   ```sh
   cd vscode-extension
   npm install
   npm run build
   ```
   Or download the `.vsix` from the [releases page](https://github.com/vlang/vls/releases).

3. In VS Code, run `Extensions: Install from VSIX...` and select the `.vsix` file.

## Configuration

Open VSCode settings and search for `vls`:

- **`vls.command`**: Path to the VLS binary.  Will be auto-detected if in PATH, but you can set it
  explicitly.
- **`vls.args`**: Extra arguments to pass to the VLS process (array).
- **`vls.inlayHints.enabled`**: Enable or disable inlay hints for V files (default: true).
- **`vls.diagnostics.enabled`**: Enable or disable live diagnostics from VLS (default: true).

You can set these in your `settings.json`:
```json
{
  "vls.command": "/path/to/vls",
  "vls.args": [],
  "vls.inlayHints.enabled": true,
  "vls.diagnostics.enabled": true
}
```

## Usage

- Open a `.v` file to activate the extension.
- The server runs via stdio and provides diagnostics, completion, go-to-definition,
  inlay hints, and more.
- If you see an error about the VLS binary path, set `vls.command` in your settings.

## Troubleshooting

- Ensure the VLS binary is built and executable.
- Check the `vls.command` path in your settings.
- View extension logs in VSCode's Output panel (select "V Language Server").

## Updating

- After updating the VLS binary, restart VSCode or reload the window.
- To update the extension, rebuild and reinstall the `.vsix` file.

## License

See [LICENSE](../LICENSE).
