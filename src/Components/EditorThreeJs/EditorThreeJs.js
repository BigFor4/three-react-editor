import React, { useEffect } from 'react';
import '../../Three/css/main.css'
import '../../Three/js/libs/codemirror/codemirror.css'
import '../../Three/js/libs/codemirror/theme/monokai.css'
import '../../Three/js/libs/codemirror/addon/dialog.css'
import '../../Three/js/libs/codemirror/addon/show-hint.css'
import '../../Three/js/libs/codemirror/addon/tern.css'
import {
    THREE,
    Editor,
    Viewport,
    Toolbar,
    Script,
    Player,
    Menubar,
    Sidebar,
    Resizer
} from '../../Three/three-editor';
export default function ThreeEditor() {
    useEffect(() => {
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

        document.body.appendChild(viewport.dom);
        document.body.appendChild(toolbar.dom);
        document.body.appendChild(script.dom);
        document.body.appendChild(player.dom);
        document.body.appendChild(sidebar.dom);
        document.body.appendChild(menubar.dom);
        document.body.appendChild(resizer.dom);

        editor.storage.init(() => {
            editor.storage.get((state) => {
                if (state !== undefined) {
                    editor.fromJSON(state);
                }
                const selected = editor.config.getKey('selected');
                if (selected !== undefined) {
                    editor.selectByUuid(selected);
                }
            });
        });

        function saveState() {

        }

        const signals = editor.signals;
        signals.geometryChanged.add(saveState);
        signals.objectAdded.add(saveState);
        signals.objectChanged.add(saveState);
        signals.objectRemoved.add(saveState);
        signals.materialChanged.add(saveState);
        signals.sceneBackgroundChanged.add(saveState);
        signals.sceneEnvironmentChanged.add(saveState);
        signals.sceneFogChanged.add(saveState);
        signals.sceneGraphChanged.add(saveState);
        signals.scriptChanged.add(saveState);
        signals.historyChanged.add(saveState);

        // Event listeners
        document.addEventListener('dragover', (event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'copy';
        });

        document.addEventListener('drop', (event) => {
            event.preventDefault();
            if (event.dataTransfer.types[0] === 'text/plain') return; // Outliner drop
            if (event.dataTransfer.items) {
                editor.loader.loadItemList(event.dataTransfer.items);
            } else {
                editor.loader.loadFiles(event.dataTransfer.files);
            }
        });

        window.addEventListener('resize', () => {
            editor.signals.windowResize.dispatch();
        });

        // Check and load state from hash
        const hash = window.location.hash;
        if (hash.slice(1, 6) === 'file=') {
            const file = hash.slice(6);
            if (window.window.confirm('Any unsaved data will be lost. Are you sure?')) {
                const loader = new THREE.FileLoader();
                loader.crossOrigin = '';
                loader.load(file, (text) => {
                    editor.clear();
                    editor.fromJSON(JSON.parse(text));
                });
            }
        }

        // Service Worker registration
        if ('serviceWorker' in navigator) {
            try {
                navigator.serviceWorker.register('sw.js');
            } catch (error) {
                console.error('ServiceWorker registration failed:', error);
            }
        }

    }, []);

    return <div id="three-editor-container" />;
}
