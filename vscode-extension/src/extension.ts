import * as vscode from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions } from 'vscode-languageclient/node';
import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';

let client: LanguageClient;

function isInlayHintsEnabled(): boolean {
  return vscode.workspace.getConfiguration('vls').get<boolean>('inlayHints.enabled', true);
}

function isExecutable(filePath: string): boolean {
  try {
    fs.accessSync(filePath, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function findInPath(bin: string): string | undefined {
  const envPath = process.env.PATH || '';
  const sep = process.platform === 'win32' ? ';' : ':';
  for (const dir of envPath.split(sep)) {
    const full = path.join(dir, bin);
    if (fs.existsSync(full) && isExecutable(full)) {
      return full;
    }
  }
  return undefined;
}

export async function activate(context: vscode.ExtensionContext) {
  // Get the configuration for our server.
  const config = vscode.workspace.getConfiguration('vls');
  let vlsPath = config.get<string>('command');
  const vlsArgs = config.get<string[]>('args', []);

  // If not set, try to find 'vls' in PATH
  if (!vlsPath) {
    const found = findInPath('vls');
    if (!found) {
      vscode.window.showErrorMessage(
        'VLS binary not found. Set "vls.command" in your settings or ensure "vls" is in your PATH.'
      );
      return;
    }
    vlsPath = found;
  }

  // Check if the path to the VLS executable exists and is executable.
  if (!fs.existsSync(vlsPath)) {
    vscode.window.showErrorMessage(
      `VLS binary not found at path: ${vlsPath}. Set "vls.command" in your settings.`
    );
    return;
  }
  if (!isExecutable(vlsPath)) {
    vscode.window.showErrorMessage(
      `VLS binary at path: ${vlsPath} is not executable. Fix permissions or set "vls.command".`
    );
    return;
  }

  // ServerOptions tells the client how to launch our server.
  // We are launching it as a normal process and communicating via stdio.
  const serverOptions: ServerOptions = {
    run: { command: vlsPath, args: vlsArgs },
    debug: { command: vlsPath, args: vlsArgs }, // You can specify different flags for debugging
  };

  // ClientOptions controls the client-side of the connection.
  const clientOptions: LanguageClientOptions = {
    // Register the server for `v` documents.
    documentSelector: [{ scheme: 'file', language: 'v' }],
    // Synchronize the 'files' section of settings between client and server.
    synchronize: {
      configurationSection: 'vls',
      fileEvents: vscode.workspace.createFileSystemWatcher('**/*.v'),
    },
    middleware: {
      provideInlayHints: async (document, range, token, next) => {
        if (!isInlayHintsEnabled()) {
          return [];
        }
        return next(document, range, token);
      },
    },
  };

  // Create the language client.
  client = new LanguageClient(
    'vls',
    'V Language Server',
    serverOptions,
    clientOptions
  );

  // A standalone provider whose sole purpose is to fire onDidChangeInlayHints so
  // that VS Code immediately re-requests hints from all providers (including the
  // LSP one above) whenever the toggle setting changes.
  const inlayHintsEmitter = new vscode.EventEmitter<void>();
  context.subscriptions.push(inlayHintsEmitter);
  context.subscriptions.push(
    vscode.languages.registerInlayHintsProvider(
      { scheme: 'file', language: 'v' },
      {
        onDidChangeInlayHints: inlayHintsEmitter.event,
        provideInlayHints: () => [],
      }
    )
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('vls.inlayHints.enabled')) {
        inlayHintsEmitter.fire();
      }
    })
  );

  // Start the client. This will also launch the server.
  vscode.window.showInformationMessage('V Language Server is starting.');
  await client.start();
  vscode.window.showInformationMessage('V Language Server is now active.');
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  // Stop the client. This will also terminate the server process.
  return client.stop();
}
