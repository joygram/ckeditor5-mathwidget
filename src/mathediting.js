/**
 * @module math/mathediting
 */

import { Plugin } from 'ckeditor5/src/core';
import { toWidget } from 'ckeditor5/src/widget';

//import mermaid from 'mermaid/dist/mermaid';

import { debounce } from 'lodash-es';

import MathPreviewCommand from './commands/MathPreviewCommand';
import MathSourceViewCommand from './commands/MathSourceViewCommand';
import MathSplitViewCommand from './commands/MathSplitViewCommand';
import InsertMathCommand from './commands/insertMathCommand';

import { render } from './utils';

// Time in milliseconds.
const DEBOUNCE_TIME = 300;

/* global window */

export default class MathEditing extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'MathEditing';
	}

	/**
	 * @inheritDoc
	 */
	init() {
		this._registerCommands();
		this._defineConverters();

		this.editor.config.define('math', {
			engine: 'mathjax',
			outputType: 'script',
			forceOutputType: false,
			enablePreview: true,
			previewClassName: [],
			popupClassName: [],
			katexRenderOptions: {}
		});
	}

	/**
	 * @inheritDoc
	 */
	afterInit() {
		//define schema
		this.editor.model.schema.register('math', {
			allowAttributes: ['displayMode', 'source'],
			allowWhere: '$block',
			isObject: true
		});
	}

	/**
	 * @inheritDoc
	*/
	_registerCommands() {
		const editor = this.editor;

		editor.commands.add('mathPreviewCommand', new MathPreviewCommand(editor));
		editor.commands.add('mathSplitViewCommand', new MathSplitViewCommand(editor));
		editor.commands.add('mathSourceViewCommand', new MathSourceViewCommand(editor));
		editor.commands.add('insertMathCommand', new InsertMathCommand(editor));
	}

	/**
	 * Adds converters.
	 *
	 * @private
	 */
	_defineConverters() {
		const editor = this.editor;

		editor.data.downcastDispatcher.on('insert:math', this._mathDataDowncast.bind(this));
		editor.editing.downcastDispatcher.on('insert:math', this._mathDowncast.bind(this));
		editor.editing.downcastDispatcher.on('attribute:source:math', this._sourceAttributeDowncast.bind(this));

		editor.data.upcastDispatcher.on('element:code', this._mathUpcast.bind(this), { priority: 'high' });

		editor.conversion.for('editingDowncast').attributeToAttribute({
			model: {
				name: 'math',
				key: 'displayMode'
			},
			view: modelAttributeValue => ({
				key: 'class',
				value: 'ck-math__' + modelAttributeValue + '-mode'
			})
		});
	}

	/**
	 *
	 * @private
	 * @param {*} evt
	 * @param {*} data
	 * @param {*} conversionApi
	 */
	_mathDataDowncast(evt, data, conversionApi) {
		const model = this.editor.model;
		const { writer, mapper } = conversionApi;

		if (!conversionApi.consumable.consume(data.item, 'insert')) {
			return;
		}

		const targetViewPosition = mapper.toViewPosition(model.createPositionBefore(data.item));
		// For downcast we're using only language-math class. We don't set class to `math language-math` as
		// multiple markdown converters that we have seen are using only `language-math` class and not `math` alone.
		const code = writer.createContainerElement('code', {
			class: 'language-math'
		});
		const pre = writer.createContainerElement('pre', {
			spellcheck: 'false'
		});
		const sourceTextNode = writer.createText(data.item.getAttribute('source'));

		writer.insert(model.createPositionAt(code, 'end'), sourceTextNode);
		writer.insert(model.createPositionAt(pre, 'end'), code);
		writer.insert(targetViewPosition, pre);
		mapper.bindElements(data.item, code);
	}

	/**
	 *
	 * @private
	 * @param {*} evt
	 * @param {*} data
	 * @param {*} conversionApi
	 */
	_mathDowncast(evt, data, conversionApi) {
		const { writer, mapper, consumable } = conversionApi;
		const { editor } = this;
		const { model, t } = editor;
		const that = this;

		if (!consumable.consume(data.item, 'insert')) {
			return;
		}

		const targetViewPosition = mapper.toViewPosition(model.createPositionBefore(data.item));

		const wrapperAttributes = {
			class: ['ck-math__wrapper']
		};
		const textareaAttributes = {
			class: ['ck-math__editing-view'],
			placeholder: t('Insert math source code'),
			'data-cke-ignore-events': true
		};

		const wrapper = writer.createContainerElement('div', wrapperAttributes);
		const editingContainer = writer.createUIElement('textarea', textareaAttributes, createEditingTextarea);
		const previewContainer = writer.createUIElement('div', { class: ['ck-math__preview'] }, createMathPreview);

		writer.insert(writer.createPositionAt(wrapper, 'start'), previewContainer);
		writer.insert(writer.createPositionAt(wrapper, 'start'), editingContainer);

		writer.insert(targetViewPosition, wrapper);

		mapper.bindElements(data.item, wrapper);

		return toWidget(wrapper, writer, {
			widgetLabel: t('Math widget'),
			hasSelectionHandle: true
		});

		function createEditingTextarea(domDocument) {
			const domElement = this.toDomElement(domDocument);

			domElement.value = data.item.getAttribute('source');

			const debouncedListener = debounce(event => {
				editor.model.change(writer => {
					writer.setAttribute('source', event.target.value, data.item);
				});
			}, DEBOUNCE_TIME);

			domElement.addEventListener('input', debouncedListener);

			/* Workaround for internal #1544 */
			domElement.addEventListener('focus', () => {
				const model = editor.model;
				const selectedElement = model.document.selection.getSelectedElement();

				// Move the selection onto the math widget if it's currently not selected.
				if (selectedElement !== data.item) {
					model.change(writer => writer.setSelection(data.item, 'on'));
				}
			}, true);

			return domElement;
		}

		function createMathPreview(domDocument) {
			// Taking the text from the wrapper container element for now
			const mathSource = data.item.getAttribute('source');
			const domElement = this.toDomElement(domDocument);
			const mathConfig = editor.config.get('math');

			domElement.innerHTML = mathSource;

			window.setTimeout(() => {
				// @todo: by the looks of it the domElement needs to be hooked to tree in order to allow for rendering.
				that._renderMath(mathSource, mathConfig, domElement);
			}, 100);

			return domElement;
		}
	}

	/**
	 *
	 * @param {*} evt
	 * @param {*} data
	 * @param {*} conversionApi
	 * @returns
	 */
	_sourceAttributeDowncast(evt, data, conversionApi) {
		// @todo: test whether the attribute was consumed.
		const newSource = data.attributeNewValue;
		const domConverter = this.editor.editing.view.domConverter;

		if (newSource) {
			const mathView = conversionApi.mapper.toViewElement(data.item);
			const mathConfig = this.editor.config.get('math');


			for (const child of mathView.getChildren()) {
				if (child.name === 'textarea' && child.hasClass('ck-math__editing-view')) {
					const domEditingTextarea = domConverter.viewToDom(child, window.document);

					if (domEditingTextarea.value != newSource) {
						domEditingTextarea.value = newSource;
					}
				} else if (child.name === 'div' && child.hasClass('ck-math__preview')) {
					// @todo: we could optimize this and not refresh math if widget is in source mode.
					const domPreviewWrapper = domConverter.viewToDom(child, window.document);

					if (domPreviewWrapper) {
						domPreviewWrapper.innerHTML = newSource;
						// 세팅하는 부분이 있는지 체크
						domPreviewWrapper.removeAttribute('data-processed');

						this._renderMath(newSource, mathConfig, domPreviewWrapper);
					}
				}
			}
		}
	}

	/**
	 *
	 * @private
	 * @param {*} evt
	 * @param {*} data
	 * @param {*} conversionApi
	 */
	_mathUpcast(evt, data, conversionApi) {
		const viewCodeElement = data.viewItem;
		const hasPreElementParent = !viewCodeElement.parent || !viewCodeElement.parent.is('element', 'pre');
		const hasCodeAncestors = data.modelCursor.findAncestor('code');
		const { consumable, writer } = conversionApi;

		//언어 단위로 찾을 수 있어야 한다 language-{r} language-{python} ...
		if (!viewCodeElement.hasClass('language-math') || hasPreElementParent || hasCodeAncestors) {
			return;
		}

		if (!consumable.test(viewCodeElement, { name: true })) {
			return;
		}
		const mathSource = Array.from(viewCodeElement.getChildren())
			.filter(item => item.is('$text'))
			.map(item => item.data)
			.join('');

		const mathElement = writer.createElement('math', {
			source: mathSource,
			displayMode: 'split'
		});

		// Let's try to insert math element.
		if (!conversionApi.safeInsert(mathElement, data.modelCursor)) {
			return;
		}

		consumable.consume(viewCodeElement, { name: true });

		conversionApi.updateConversionResult(mathElement, data);
	}

	/**
	 * Renders Math in a given `domElement`. Expect this domElement to have math
	 * source set as text content.
	 *
	 * @param {HTMLElement} domElement
	 */
	_renderMath(source, mathConfig, domElement) {
		//display : div or span
		render(source, mathConfig, domElement);
	}
}
