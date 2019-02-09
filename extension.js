const vscode = require('vscode');
const fs = require("fs")
const DiscordRPC = require('discord-rpc');
const clientId = "503496133398495248"
DiscordRPC.register(clientId);
var rpc = new DiscordRPC.Client({ transport: 'ipc' });
let state
let details
let language
let activity
let filesplit
function activate(context) {
    const StatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left)
    StatusBarItem.show()
    StatusBarItem.text = '$(pulse) Connecting to Discord...';
    vscode.commands.registerCommand('discord.reconnect', async () => {
        vscode.window.showInformationMessage('Reconnecting to Discord RPC...');
        StatusBarItem.text = '$(pulse) Reconnecting to Discord...';
        StatusBarItem.command = undefined;

        rpc.connect(clientId).catch((data) => {
            console.log("Discord RPC Error: " + data)
            StatusBarItem.text = '$(sync) Reconnect to Discord';
            StatusBarItem.command = 'discord.reconnect';
        });

    });
    rpc.on('ready', () => {
        StatusBarItem.command = undefined
        StatusBarItem.hide()
        console.log('Authed for user', rpc.user.username);
        if (vscode.window.activeTextEditor) {
            if (vscode.window.activeTextEditor.document.languageId === "c") { var l = "clang" } else { var l = vscode.window.activeTextEditor.document.languageId }
            filesplit = vscode.window.activeTextEditor.document.fileName.split("\\")
            activity = {
                details: "editing " + filesplit[filesplit.length - 1],
                state: "workspace: " + vscode.workspace.name,
                largeImageKey: l,
                largeImageText: l,
                smallImageKey: "vscode",
                instance: false,
            }
            rpc.setActivity(activity).catch(console.error)
        } else {
            rpc.setActivity({
                largeImageKey: "vscode",
                instance: false
            })
        }
        vscode.window.onDidChangeActiveTextEditor(function () {

            let filesplit = vscode.window.activeTextEditor.document.fileName.split("\\")
            if (vscode.window.activeTextEditor.document.languageId === "c") { var l = "clang" } else { var l = vscode.window.activeTextEditor.document.languageId }
            activity = {
                details: "editing " + filesplit[filesplit.length - 1],
                state: "workspace: " + vscode.workspace.name,
                largeImageKey: l,
                largeImageText: l,
                smallImageKey: "vscode",
                instance: false,
            }
            if (state) { activity.state = state }
            if (details) { activity.details = details }
            rpc.setActivity(activity)
        })
        let disposable = vscode.commands.registerCommand('extension.setrpc', function () {
            let picks = ["1st line", "2nd line", "set language"]
            vscode.window.showQuickPick(picks).then(function (data) {
                vscode.window.showQuickPick(["set", "reset"]).then(function (data1) {
                    let pickindex = picks.indexOf(data)
                    if (pickindex === 2) {
                        if (data1 === "set") {
                            let picks1 = new Array("c", "c++", "css", "go", "html", "java", "javascript", "json", "php", "plaintext", "python", "ruby", "shellscript", "swift", "typescript")
                            vscode.window.showQuickPick(picks1).then(function (data2) {
                                if (data2 === "c++") { data2 = "cpp" }
                                language = data2
                                activity = {
                                    details: "editing " + filesplit[filesplit.length - 1],
                                    state: "workspace: " + vscode.workspace.name,
                                    largeImageKey: language,
                                    largeImageText: language,
                                    smallImageKey: "vscode",
                                    instance: false,
                                }
                                rpc.setActivity(activity)
                            })
                        } else {
                            activity.largeImageKey = vscode.window.activeTextEditor.document.languageId;
                            activity.largeImageText = vscode.window.activeTextEditor.document.languageId

                            rpc.setActivity(activity)
                            let language = undefined
                        }
                    } else {
                        if (data1 === "set") {
                            vscode.window.showInputBox({ prompt: picks[pickindex] + "?" }).then(function (data2) {
                                console.log(activity)
                                switch (pickindex) {
                                    case 0:
                                        details = data2
                                        activity.details = data2
                                        break;
                                    case 1:
                                        state = data2
                                        activity.state = data2
                                        break;
                                }

                                rpc.setActivity(activity)
                            });
                        } else {
                            switch (pickindex) {
                                case 0:
                                    details = undefined
                                    activity.details = "editing " + filesplit[filesplit.length - 1]
                                    break;
                                case 1:
                                    state = undefined
                                    activity.state = "workspace: " + vscode.workspace.name
                                    break;
                            }
                            rpc.setActivity(activity)
                        }
                    }
                })
            })
            context.subscriptions.push(disposable);
        })
    })
    rpc.login({ clientId: clientId }).catch((data) => {
        if (data.message.includes('ENOENT')) {
            vscode.window.showErrorMessage('No Discord Client detected!');
        } else if (data.toString() == "Error: Could not connect") {
            vscode.window.showErrorMessage('No Discord Client detected!');
        } else {
            vscode.window.showErrorMessage(`Couldn't connect to Discord via RPC: ${data.toString()}`);
        }
        StatusBarItem.text = '$(sync) Reconnect to Discord';
        StatusBarItem.command = 'discord.reconnect';

    });
}

exports.activate = activate;
function deactivate() {
    rpc.destroy()
}
exports.deactivate = deactivate;