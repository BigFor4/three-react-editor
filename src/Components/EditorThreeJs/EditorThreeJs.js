import React, { useEffect, useRef } from 'react';
import '../../Three/css/main.css';
import '../../Three/js/libs/codemirror/codemirror.css';
import '../../Three/js/libs/codemirror/theme/monokai.css';
import '../../Three/js/libs/codemirror/addon/dialog.css';
import '../../Three/js/libs/codemirror/addon/show-hint.css';
import '../../Three/js/libs/codemirror/addon/tern.css';
import {
    Editor,
    Viewport,
    Toolbar,
    Script,
    Player,
    Menubar,
    Sidebar,
    Resizer,
    THREE
} from '../../Three/three-editor';

export default function ThreeEditor() {
    const viewportRef = useRef(null);
    const toolbarRef = useRef(null);
    const scriptRef = useRef(null);
    const playerRef = useRef(null);
    const sidebarRef = useRef(null);
    const menubarRef = useRef(null);
    const resizerRef = useRef(null);

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

        viewportRef.current.appendChild(viewport.dom);
        toolbarRef.current.appendChild(toolbar.dom);
        scriptRef.current.appendChild(script.dom);
        playerRef.current.appendChild(player.dom);
        sidebarRef.current.appendChild(sidebar.dom);
        menubarRef.current.appendChild(menubar.dom);
        resizerRef.current.appendChild(resizer.dom);

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
            // Implement your save state logic here
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
        editor.signals.windowResize.dispatch();
    }, []);
    return (
        <div>
            <div ref={viewportRef}></div>
            <div ref={toolbarRef}></div>
            <div ref={scriptRef}></div>
            <div ref={playerRef}></div>
            <div ref={sidebarRef}></div>
            <div ref={menubarRef}></div>
            <div ref={resizerRef}></div>
        </div>
    );
}
