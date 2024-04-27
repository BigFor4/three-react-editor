/* eslint-disable */
import CodeMirror from 'codemirror';
import tern from 'tern';
CodeMirror.TernServer = function (options) {
    var self = this;
    this.options = options || {};
    var plugins = this.options.plugins || (this.options.plugins = {});
    if (!plugins.doc_comment) plugins.doc_comment = true;
    this.docs = Object.create(null);
    if (this.options.useWorker) {
      this.server = new WorkerServer(this);
    } else {
      this.server = new tern.Server({
        getFile: function (name, c) { return getFile(self, name, c); },
        async: true,
        defs: this.options.defs || [],
        plugins: plugins
      });
    }
    this.trackChange = function (doc, change) { trackChange(self, doc, change); };

    this.cachedArgHints = null;
    this.activeArgHints = null;
    this.jumpStack = [];

    this.getHint = function (cm, c) { return hint(self, cm, c); };
    this.getHint.async = true;
  };

  CodeMirror.TernServer.prototype = {
    addDoc: function (name, doc) {
      var data = { doc: doc, name: name, changed: null };
      this.server.addFile(name, docValue(this, data));
      CodeMirror.on(doc, "change", this.trackChange);
      return this.docs[name] = data;
    },

    delDoc: function (id) {
      var found = resolveDoc(this, id);
      if (!found) return;
      CodeMirror.off(found.doc, "change", this.trackChange);
      delete this.docs[found.name];
      this.server.delFile(found.name);
    },

    hideDoc: function (id) {
      closeArgHints(this);
      var found = resolveDoc(this, id);
      if (found && found.changed) sendDoc(this, found);
    },

    complete: function (cm) {
      cm.showHint({ hint: this.getHint });
    },

    showType: function (cm, pos, c) { showContextInfo(this, cm, pos, "type", c); },

    showDocs: function (cm, pos, c) { showContextInfo(this, cm, pos, "documentation", c); },

    updateArgHints: function (cm) { updateArgHints(this, cm); },

    jumpToDef: function (cm) { jumpToDef(this, cm); },

    jumpBack: function (cm) { jumpBack(this, cm); },

    rename: function (cm) { rename(this, cm); },

    selectName: function (cm) { selectName(this, cm); },

    request: function (cm, query, c, pos) {
      var self = this;
      var doc = findDoc(this, cm.getDoc());
      var request = buildRequest(this, doc, query, pos);
      var extraOptions = request.query && this.options.queryOptions && this.options.queryOptions[request.query.type]
      if (extraOptions) for (var prop in extraOptions) request.query[prop] = extraOptions[prop];

      this.server.request(request, function (error, data) {
        if (!error && self.options.responseFilter)
          data = self.options.responseFilter(doc, query, request, error, data);
        c(error, data);
      });
    },

    destroy: function () {
      closeArgHints(this)
      if (this.worker) {
        this.worker.terminate();
        this.worker = null;
      }
    }
  };
import { UIElement, UIPanel, UIText } from './libs/ui.js';

import { SetScriptValueCommand } from './commands/SetScriptValueCommand.js';
import { SetMaterialValueCommand } from './commands/SetMaterialValueCommand.js';

function Script( editor ) {

	const signals = editor.signals;

	const container = new UIPanel();
	container.setId( 'script' );
	container.setPosition( 'absolute' );
	container.setBackgroundColor( '#272822' );
	container.setDisplay( 'none' );

	const header = new UIPanel();
	header.setPadding( '10px' );
	container.add( header );

	const title = new UIText().setColor( '#fff' );
	header.add( title );

	const buttonSVG = ( function () {

		const svg = document.createElementNS( 'http://www.w3.org/2000/svg', 'svg' );
		svg.setAttribute( 'width', 32 );
		svg.setAttribute( 'height', 32 );
		const path = document.createElementNS( 'http://www.w3.org/2000/svg', 'path' );
		path.setAttribute( 'd', 'M 12,12 L 22,22 M 22,12 12,22' );
		path.setAttribute( 'stroke', '#fff' );
		svg.appendChild( path );
		return svg;

	} )();

	const close = new UIElement( buttonSVG );
	close.setPosition( 'absolute' );
	close.setTop( '3px' );
	close.setRight( '1px' );
	close.setCursor( 'pointer' );
	close.onClick( function () {

		container.setDisplay( 'none' );

	} );
	header.add( close );


	let renderer;

	signals.rendererCreated.add( function ( newRenderer ) {

		renderer = newRenderer;

	} );


	let delay;
	let currentMode;
	let currentScript;
	let currentObject;

	const codemirror = CodeMirror( container.dom, {
		value: '',
		lineNumbers: true,
		matchBrackets: true,
		indentWithTabs: true,
		tabSize: 4,
		indentUnit: 4,
		hintOptions: {
			completeSingle: false
		}
	} );
	codemirror.setOption( 'theme', 'monokai' );
	codemirror.on( 'change', function () {

		if ( codemirror.state.focused === false ) return;

		clearTimeout( delay );
		delay = setTimeout( function () {

			const value = codemirror.getValue();

			if ( ! validate( value ) ) return;

			if ( typeof ( currentScript ) === 'object' ) {

				if ( value !== currentScript.source ) {

					editor.execute( new SetScriptValueCommand( editor, currentObject, currentScript, 'source', value ) );

				}

				return;

			}

			if ( currentScript !== 'programInfo' ) return;

			const json = JSON.parse( value );

			if ( JSON.stringify( currentObject.material.defines ) !== JSON.stringify( json.defines ) ) {

				const cmd = new SetMaterialValueCommand( editor, currentObject, 'defines', json.defines );
				cmd.updatable = false;
				editor.execute( cmd );

			}

			if ( JSON.stringify( currentObject.material.uniforms ) !== JSON.stringify( json.uniforms ) ) {

				const cmd = new SetMaterialValueCommand( editor, currentObject, 'uniforms', json.uniforms );
				cmd.updatable = false;
				editor.execute( cmd );

			}

			if ( JSON.stringify( currentObject.material.attributes ) !== JSON.stringify( json.attributes ) ) {

				const cmd = new SetMaterialValueCommand( editor, currentObject, 'attributes', json.attributes );
				cmd.updatable = false;
				editor.execute( cmd );

			}

		}, 300 );

	} );

	// prevent backspace from deleting objects
	const wrapper = codemirror.getWrapperElement();
	wrapper.addEventListener( 'keydown', function ( event ) {

		event.stopPropagation();

	} );

	// validate

	const errorLines = [];
	const widgets = [];

	const validate = function ( string ) {

		let valid;
		let errors = [];

		return codemirror.operation( function () {

			while ( errorLines.length > 0 ) {

				codemirror.removeLineClass( errorLines.shift(), 'background', 'errorLine' );

			}

			while ( widgets.length > 0 ) {

				codemirror.removeLineWidget( widgets.shift() );

			}

			//

			switch ( currentMode ) {

				case 'javascript':

					try {

						const syntax = esprima.parse( string, { tolerant: true } );
						errors = syntax.errors;

					} catch ( error ) {

						errors.push( {

							lineNumber: error.lineNumber - 1,
							message: error.message

						} );

					}

					for ( let i = 0; i < errors.length; i ++ ) {

						const error = errors[ i ];
						error.message = error.message.replace( /Line [0-9]+: /, '' );

					}

					break;

				case 'json':

					errors = [];

					jsonlint.parseError = function ( message, info ) {

						message = message.split( '\n' )[ 3 ];

						errors.push( {

							lineNumber: info.loc.first_line - 1,
							message: message

						} );

					};

					try {

						jsonlint.parse( string );

					} catch ( error ) {

						// ignore failed error recovery

					}

					break;

				case 'glsl':

					currentObject.material[ currentScript ] = string;
					currentObject.material.needsUpdate = true;
					signals.materialChanged.dispatch( currentObject, 0 ); // TODO: Add multi-material support

					const programs = renderer.info.programs;

					valid = true;
					const parseMessage = /^(?:ERROR|WARNING): \d+:(\d+): (.*)/g;

					for ( let i = 0, n = programs.length; i !== n; ++ i ) {

						const diagnostics = programs[ i ].diagnostics;

						if ( diagnostics === undefined ||
								diagnostics.material !== currentObject.material ) continue;

						if ( ! diagnostics.runnable ) valid = false;

						const shaderInfo = diagnostics[ currentScript ];
						const lineOffset = shaderInfo.prefix.split( /\r\n|\r|\n/ ).length;

						while ( true ) {

							const parseResult = parseMessage.exec( shaderInfo.log );
							if ( parseResult === null ) break;

							errors.push( {

								lineNumber: parseResult[ 1 ] - lineOffset,
								message: parseResult[ 2 ]

							} );

						} // messages

						break;

					} // programs

			} // mode switch

			for ( let i = 0; i < errors.length; i ++ ) {

				const error = errors[ i ];

				const message = document.createElement( 'div' );
				message.className = 'esprima-error';
				message.textContent = error.message;

				const lineNumber = Math.max( error.lineNumber, 0 );
				errorLines.push( lineNumber );

				codemirror.addLineClass( lineNumber, 'background', 'errorLine' );

				const widget = codemirror.addLineWidget( lineNumber, message );

				widgets.push( widget );

			}

			return valid !== undefined ? valid : errors.length === 0;

		} );

	};

	// tern js autocomplete

	const server = new CodeMirror.TernServer( {
		caseInsensitive: true,
		plugins: { threejs: null }
	} );

	codemirror.setOption( 'extraKeys', {
		'Ctrl-Space': function ( cm ) {

			server.complete( cm );

		},
		'Ctrl-I': function ( cm ) {

			server.showType( cm );

		},
		'Ctrl-O': function ( cm ) {

			server.showDocs( cm );

		},
		'Alt-.': function ( cm ) {

			server.jumpToDef( cm );

		},
		'Alt-,': function ( cm ) {

			server.jumpBack( cm );

		},
		'Ctrl-Q': function ( cm ) {

			server.rename( cm );

		},
		'Ctrl-.': function ( cm ) {

			server.selectName( cm );

		}
	} );

	codemirror.on( 'cursorActivity', function ( cm ) {

		if ( currentMode !== 'javascript' ) return;
		server.updateArgHints( cm );

	} );

	codemirror.on( 'keypress', function ( cm, kb ) {

		if ( currentMode !== 'javascript' ) return;
		const typed = String.fromCharCode( kb.which || kb.keyCode );
		if ( /[\w\.]/.exec( typed ) ) {

			server.complete( cm );

		}

	} );


	//

	signals.editorCleared.add( function () {

		container.setDisplay( 'none' );

	} );

	signals.editScript.add( function ( object, script ) {

		let mode, name, source;

		if ( typeof ( script ) === 'object' ) {

			mode = 'javascript';
			name = script.name;
			source = script.source;
			title.setValue( object.name + ' / ' + name );

		} else {

			switch ( script ) {

				case 'vertexShader':

					mode = 'glsl';
					name = 'Vertex Shader';
					source = object.material.vertexShader || '';

					break;

				case 'fragmentShader':

					mode = 'glsl';
					name = 'Fragment Shader';
					source = object.material.fragmentShader || '';

					break;

				case 'programInfo':

					mode = 'json';
					name = 'Program Properties';
					const json = {
						defines: object.material.defines,
						uniforms: object.material.uniforms,
						attributes: object.material.attributes
					};
					source = JSON.stringify( json, null, '\t' );

			}

			title.setValue( object.material.name + ' / ' + name );

		}

		currentMode = mode;
		currentScript = script;
		currentObject = object;

		container.setDisplay( '' );
		codemirror.setValue( source );
		codemirror.clearHistory();
		if ( mode === 'json' ) mode = { name: 'javascript', json: true };
		codemirror.setOption( 'mode', mode );

	} );

	signals.scriptRemoved.add( function ( script ) {

		if ( currentScript === script ) {

			container.setDisplay( 'none' );

		}

	} );

	return container;

}

export { Script };
