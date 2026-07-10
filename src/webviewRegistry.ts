import * as vscode from "vscode";

class WebviewRegistry {
  private openPanels = new Map<string, vscode.WebviewPanel>();
  private _onDidChange = new vscode.EventEmitter<void>();
  readonly onDidChange = this._onDidChange.event;

  register(key: string, panel: vscode.WebviewPanel) {
    this.openPanels.set(key, panel);
    this._onDidChange.fire();

    panel.onDidDispose(() => {
      // guard: don't delete a newer panel that replaced this one under the same key
      if (this.openPanels.get(key) === panel) {
        this.openPanels.delete(key);
        this._onDidChange.fire();
      }
    });
  }

  get(key: string): vscode.WebviewPanel | undefined {
    return this.openPanels.get(key);
  }

  has(key: string): boolean {
    return this.openPanels.has(key);
  }
}

export const webviewRegistry = new WebviewRegistry();
