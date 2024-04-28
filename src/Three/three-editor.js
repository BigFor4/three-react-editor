import * as THREE from "./build/three.module.js";

import { Editor } from "./js/Editor.js";
import { Viewport } from "./js/Viewport.js";
import { Toolbar } from "./js/Toolbar.js";
import { Script } from "./js/Script.js";
import { Player } from "./js/Player.js";
import { Sidebar } from "./js/Sidebar.js";
import { Menubar } from "./js/Menubar.js";
import { Resizer } from "./js/Resizer.js";

window.URL = window.URL || window.webkitURL;
window.BlobBuilder =
    window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;

Number.prototype.format = function () {
    return this.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
};

const editor = new Editor();

const viewport = new Viewport(editor);

const toolbar = new Toolbar(editor);

const script = new Script(editor);
const player = new Player(editor);

const sidebar = new Sidebar(editor);

const menubar = new Menubar(editor);
const resizer = new Resizer(editor);
export {
    editor, toolbar, sidebar, menubar, resizer, viewport, script, player, THREE
}